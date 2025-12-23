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
        if (!decoded) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();

        // Fetch all movements (receive and transfer), sorted by date descending
        const movements = await StockMovement.find()
            .populate('stockId', 'itemName')
            .populate('performedBy', 'username name')
            .sort({ performedAt: -1 })
            .lean();

        return NextResponse.json({
            success: true,
            movements,
            count: movements.length
        });
    } catch (error) {
        errorTracker.logError(error, { endpoint: '/api/stock/admin/movements', method: 'GET' });
        return NextResponse.json(
            createErrorResponse(error, 'ไม่สามารถโหลดประวัติได้'),
            { status: 500 }
        );
    }
}
