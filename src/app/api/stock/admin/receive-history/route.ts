import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { connectDB } from '@/lib/db/mongodb';
import StockMovement from '@/lib/db/models/StockMovement';
import { errorTracker, createErrorResponse } from '@/lib/error-tracker';

export async function GET(request: NextRequest) {
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

        // ดึงประวัติการรับสินค้าเข้า (movementType: 'receive')
        // และ from.type: 'external' (มาจากภายนอก/บริจาค)
        const movements = await StockMovement.find({
            movementType: 'receive'
        })
            .populate('performedBy', 'username')
            .populate('stockId', 'itemName') // ← เพิ่ม populate stockId
            .sort({ performedAt: -1 }) // เรียงจากใหม่ไปเก่า
            .limit(500) // จำกัด 500 รายการล่าสุด
            .lean();

        errorTracker.logInfo('Receive history fetched', {
            count: movements.length,
            userId: decoded.userId
        });

        return NextResponse.json({
            success: true,
            movements: movements.map(m => ({
                _id: m._id,
                itemName: (m.stockId as { itemName: string })?.itemName || 'Unknown',
                quantity: m.quantity,
                unit: m.unit,
                from: m.from,
                to: m.to,
                performedBy: m.performedBy,
                performedAt: m.performedAt,
                referenceId: m.referenceId,
                notes: m.notes
            }))
        }, { status: 200 });

    } catch (error) {
        errorTracker.logError(error, { endpoint: '/api/stock/admin/receive-history', method: 'GET' });
        return NextResponse.json(
            createErrorResponse(error, 'ไม่สามารถดึงประวัติการรับสินค้าได้'),
            { status: 500 }
        );
    }
}
