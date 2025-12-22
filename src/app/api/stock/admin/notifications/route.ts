import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { withAdminAuth } from '@/lib/auth/rbac';
import StockMovement, { IStockMovement } from '@/lib/db/models/StockMovement';
import StockRequest, { IStockRequest } from '@/lib/db/models/StockRequest';
import { errorTracker } from '@/lib/error-tracker';

export async function GET(req: NextRequest) {
    return withAdminAuth(req, async () => {
        try {
            await connectDB();

            // Get 'since' from query params
            const { searchParams } = new URL(req.url);
            const since = searchParams.get('since');
            const sinceDate = since ? new Date(since) : new Date(Date.now() - 5 * 60 * 1000);

            // 1. Fetch new requests
            const newRequests = await StockRequest.find({
                status: 'pending',
                createdAt: { $gt: sinceDate }
            })
                .sort({ createdAt: -1 })
                .populate('shelterId', 'name')
                .lean<IStockRequest[]>();

            // 2. Fetch stock entering provincial warehouse
            const newMovements = await StockMovement.find({
                'to.type': 'provincial',
                createdAt: { $gt: sinceDate }
            })
                .sort({ createdAt: -1 })
                .lean<IStockMovement[]>();

            const notifications = [
                ...newRequests.map(r => {
                    const shelter = r.shelterId as unknown as { name: string };
                    return {
                        id: String(r._id),
                        type: 'request',
                        title: '📄 คำร้องใหม่',
                        message: `ศูนย์: ${shelter?.name || 'N/A'} ยื่นคำร้องขอสินค้าใหม่`,
                        createdAt: r.createdAt
                    };
                }),
                ...newMovements.map(m => ({
                    id: String(m._id),
                    type: 'movement',
                    title: '📥 สินค้าเข้าคลังกลาง',
                    message: `${m.itemName} จำนวน ${m.quantity} ${m.unit} เข้าสู่คลังกลาง`,
                    createdAt: m.createdAt
                }))
            ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            return NextResponse.json({ notifications });

        } catch (error: unknown) {
            errorTracker.logError(error, { endpoint: '/api/stock/admin/notifications' });
            return NextResponse.json(
                { error: 'ไม่สามารถโหลดข้อมูลแจ้งเตือนได้' },
                { status: 500 }
            );
        }
    });
}
