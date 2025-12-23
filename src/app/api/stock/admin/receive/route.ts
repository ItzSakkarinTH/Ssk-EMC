import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { connectDB } from '@/lib/db/mongodb';
import Stock from '@/lib/db/models/Stock';
import StockMovement from '@/lib/db/models/StockMovement';
import { errorTracker, createErrorResponse } from '@/lib/error-tracker';
import { generateReferenceId } from '@/lib/utils/ref-id';
import { z } from 'zod';

const receiveSchema = z.object({
    stockId: z.string().min(1, 'กรุณาระบุรหัสสินค้า'),
    quantity: z.number().positive('จำนวนต้องมากกว่า 0'),
    supplier: z.string().min(1, 'กรุณาระบุผู้ส่ง'),
    notes: z.string().optional(),
    receivedDate: z.string().optional()
});

export async function POST(request: NextRequest) {
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
        const validatedData = receiveSchema.parse(body);

        await connectDB();

        // Find stock item
        const stock = await Stock.findById(validatedData.stockId);
        if (!stock) {
            return NextResponse.json({ error: 'ไม่พบสินค้าในระบบ' }, { status: 404 });
        }

        // Save previous stock for snapshot
        const previousStock = stock.provincialStock;

        // Update provincial stock
        stock.provincialStock += validatedData.quantity;
        stock.totalReceived += validatedData.quantity;
        stock.metadata.updatedAt = new Date();

        // Calculate total
        if (stock.calculateTotal) {
            stock.calculateTotal();
        }

        await stock.save();

        // Create movement record
        const receivedAt = validatedData.receivedDate
            ? new Date(validatedData.receivedDate)
            : new Date();

        await StockMovement.create({
            stockId: stock._id,
            itemName: stock.itemName,
            movementType: 'receive',
            quantity: validatedData.quantity,
            unit: stock.unit,
            from: {
                type: 'external',
                id: null,
                name: validatedData.supplier
            },
            to: {
                type: 'provincial',
                id: null,
                name: 'กองกลาง'
            },
            performedBy: decoded.userId,
            performedAt: receivedAt,
            notes: validatedData.notes || '',
            referenceId: generateReferenceId('RCV'),
            snapshot: {
                before: previousStock,
                after: stock.provincialStock
            }
        });

        errorTracker.logInfo('Stock received successfully', {
            stockId: stock._id,
            itemName: stock.itemName,
            quantity: validatedData.quantity,
            supplier: validatedData.supplier,
            userId: decoded.userId
        });

        return NextResponse.json({
            success: true,
            message: 'รับสินค้าเข้ากองกลางสำเร็จ',
            stock: {
                _id: stock._id,
                itemName: stock.itemName,
                provincialStock: stock.provincialStock,
                totalQuantity: stock.totalQuantity
            }
        }, { status: 200 });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'ข้อมูลไม่ถูกต้อง', details: error.issues },
                { status: 400 }
            );
        }

        errorTracker.logError(error, { endpoint: '/api/stock/admin/receive', method: 'POST' });
        return NextResponse.json(
            createErrorResponse(error, 'ไม่สามารถรับสินค้าเข้ากองกลางได้'),
            { status: 500 }
        );
    }
}
