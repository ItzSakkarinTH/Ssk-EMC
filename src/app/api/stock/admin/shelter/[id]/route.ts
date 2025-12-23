import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { connectDB } from '@/lib/db/mongodb';
import Stock from '@/lib/db/models/Stock';
import Shelter from '@/lib/db/models/Shelter';
import StockMovement from '@/lib/db/models/StockMovement';
import { errorTracker, createErrorResponse } from '@/lib/error-tracker';
import mongoose from 'mongoose';

interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteParams) {
    const { id } = await context.params;
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decoded = await verifyToken(token);
        if (!decoded || decoded.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
        }

        await connectDB();

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ error: 'Invalid shelter ID' }, { status: 400 });
        }

        // Get shelter info
        const shelter = await Shelter.findById(id).lean() as {
            _id: mongoose.Types.ObjectId;
            name: string;
            code: string;
            location?: { district?: string; subdistrict?: string; address?: string };
            capacity?: number;
            currentOccupancy?: number;
            contactPerson?: { name: string; phone: string };
            status?: string;
        } | null;

        if (!shelter) {
            return NextResponse.json({ error: 'ไม่พบศูนย์พักพิง' }, { status: 404 });
        }

        // Get all stock items with shelter stock
        const allStocks = await Stock.find({
            'shelterStock.shelterId': new mongoose.Types.ObjectId(id)
        }).lean() as Array<{
            _id: mongoose.Types.ObjectId;
            itemName: string;
            category: string;
            unit: string;
            minStockLevel: number;
            shelterStock: Array<{
                shelterId: mongoose.Types.ObjectId;
                quantity: number;
                lastUpdated: Date;
            }>;
        }>;

        // Transform stock data for this shelter
        const shelterStockItems = allStocks.map(stock => {
            const shelterData = stock.shelterStock?.find(
                ss => ss.shelterId.toString() === id
            );

            const quantity = shelterData?.quantity || 0;
            const minLevel = stock.minStockLevel || 10;
            const status = quantity === 0 ? 'outOfStock' :
                quantity <= minLevel * 0.3 ? 'critical' :
                    quantity <= minLevel ? 'low' : 'sufficient';

            return {
                stockId: stock._id.toString(),
                itemName: stock.itemName,
                category: stock.category,
                quantity,
                unit: stock.unit,
                minStockLevel: stock.minStockLevel,
                status,
                lastUpdated: shelterData?.lastUpdated
            };
        });

        // Calculate summary by category
        const categoryBreakdown: Record<string, { count: number; quantity: number; lowCount: number; criticalCount: number }> = {};

        shelterStockItems.forEach(item => {
            if (!categoryBreakdown[item.category]) {
                categoryBreakdown[item.category] = { count: 0, quantity: 0, lowCount: 0, criticalCount: 0 };
            }
            categoryBreakdown[item.category].count++;
            categoryBreakdown[item.category].quantity += item.quantity;
            if (item.status === 'low') categoryBreakdown[item.category].lowCount++;
            if (item.status === 'critical' || item.status === 'outOfStock') categoryBreakdown[item.category].criticalCount++;
        });

        // Get recent movements for this shelter
        const recentMovements = await StockMovement.find({
            $or: [
                { 'to.id': new mongoose.Types.ObjectId(id) },
                { 'from.id': new mongoose.Types.ObjectId(id) }
            ]
        })
            .populate('stockId', 'itemName')
            .populate('performedBy', 'name username')
            .sort({ performedAt: -1 })
            .limit(20)
            .lean() as Array<{
                _id: mongoose.Types.ObjectId;
                stockId: { itemName: string } | null;
                movementType: string;
                quantity: number;
                unit: string;
                from: { type: string; name: string };
                to: { type: string; name: string };
                performedBy: { name?: string; username?: string } | null;
                performedAt: Date;
                notes?: string;
            }>;

        // Summary stats
        const totalItems = shelterStockItems.length;
        const totalQuantity = shelterStockItems.reduce((sum, item) => sum + item.quantity, 0);
        const lowStockCount = shelterStockItems.filter(item => item.status === 'low').length;
        const criticalCount = shelterStockItems.filter(item => item.status === 'critical' || item.status === 'outOfStock').length;

        return NextResponse.json({
            shelter: {
                _id: shelter._id.toString(),
                name: shelter.name,
                code: shelter.code,
                location: shelter.location,
                capacity: shelter.capacity,
                currentOccupancy: shelter.currentOccupancy,
                contactPerson: shelter.contactPerson,
                status: shelter.status
            },
            stock: shelterStockItems,
            summary: {
                totalItems,
                totalQuantity,
                lowStockCount,
                criticalCount,
                categoryBreakdown
            },
            recentMovements: recentMovements.map(m => ({
                _id: m._id?.toString(),
                itemName: m.stockId?.itemName || 'Unknown',
                movementType: m.movementType,
                quantity: m.quantity,
                unit: m.unit,
                from: m.from?.name,
                to: m.to?.name,
                performedBy: m.performedBy?.name || m.performedBy?.username || 'Unknown',
                performedAt: m.performedAt,
                notes: m.notes
            }))
        });

    } catch (error) {
        errorTracker.logError(error, { endpoint: `/api/stock/admin/shelter/${id}`, method: 'GET' });
        return NextResponse.json(
            createErrorResponse(error, 'ไม่สามารถโหลดข้อมูลศูนย์พักพิงได้'),
            { status: 500 }
        );
    }
}

// Update stock quantity in shelter
export async function PATCH(request: NextRequest, context: RouteParams) {
    const { id } = await context.params;
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decoded = await verifyToken(token);
        if (!decoded || decoded.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
        }

        const body = await request.json();
        const { stockId, newQuantity, notes } = body;

        if (!stockId || newQuantity === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        await connectDB();

        // Validate shelter exists
        const shelter = await Shelter.findById(id);
        if (!shelter) {
            return NextResponse.json({ error: 'ไม่พบศูนย์พักพิง' }, { status: 404 });
        }

        // Find stock
        const stock = await Stock.findById(stockId);
        if (!stock) {
            return NextResponse.json({ error: 'ไม่พบรายการสินค้า' }, { status: 404 });
        }

        // Find existing shelter stock entry
        const shelterStockIndex = stock.shelterStock.findIndex(
            (ss: { shelterId: mongoose.Types.ObjectId }) => ss.shelterId.toString() === id
        );

        const oldQuantity = shelterStockIndex >= 0 ? stock.shelterStock[shelterStockIndex].quantity : 0;
        const quantityDiff = newQuantity - oldQuantity;

        // Update or add shelter stock
        if (shelterStockIndex >= 0) {
            stock.shelterStock[shelterStockIndex].quantity = newQuantity;
            stock.shelterStock[shelterStockIndex].lastUpdated = new Date();
        } else {
            stock.shelterStock.push({
                shelterId: new mongoose.Types.ObjectId(id),
                quantity: newQuantity,
                lastUpdated: new Date()
            });
        }

        stock.calculateTotal();
        await stock.save();

        // Log movement if quantity changed
        if (quantityDiff !== 0) {
            await StockMovement.create({
                stockId: stock._id,
                itemName: stock.itemName,
                movementType: 'adjust', // Now supported by improved schema
                quantity: Math.abs(quantityDiff),
                unit: stock.unit,
                from: {
                    type: (quantityDiff > 0 ? 'adjustment' : 'shelter') as 'adjustment' | 'shelter',
                    name: quantityDiff > 0 ? 'ปรับเพิ่ม' : shelter.name
                },
                to: {
                    type: (quantityDiff > 0 ? 'shelter' : 'adjustment') as 'shelter' | 'adjustment',
                    id: quantityDiff > 0 ? new mongoose.Types.ObjectId(id) : null,
                    name: quantityDiff > 0 ? shelter.name : 'ปรับลด'
                },
                snapshot: {
                    before: oldQuantity,
                    after: newQuantity
                },
                performedBy: new mongoose.Types.ObjectId(decoded.userId),
                performedAt: new Date(),
                notes: notes || `ปรับสต๊อก ${quantityDiff > 0 ? 'เพิ่ม' : 'ลด'} ${Math.abs(quantityDiff)} ${stock.unit}`
            });
        }

        return NextResponse.json({
            success: true,
            message: 'อัพเดทสต๊อกสำเร็จ',
            stock: {
                itemName: stock.itemName,
                oldQuantity,
                newQuantity,
                quantityDiff
            }
        });

    } catch (error) {
        errorTracker.logError(error, { endpoint: `/api/stock/admin/shelter/${id}`, method: 'PATCH' });
        return NextResponse.json(
            createErrorResponse(error, 'ไม่สามารถอัพเดทสต๊อกได้'),
            { status: 500 }
        );
    }
}
