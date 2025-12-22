import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { withStaffAuth } from '@/lib/auth/rbac';
import StockMovement, { IStockMovement } from '@/lib/db/models/StockMovement';
import { errorTracker } from '@/lib/error-tracker';

export async function GET(req: NextRequest) {
    return withStaffAuth(req, async (_req, user) => {
        try {
            await connectDB();

            const shelterId = user.assignedShelterId;
            if (!shelterId) {
                return NextResponse.json({ movements: [] });
            }

            // Get 'since' from query params
            const { searchParams } = new URL(req.url);
            const since = searchParams.get('since');

            const query: {
                'to.type': string;
                'to.id': string;
                movementType: string;
                'from.type': string;
                createdAt?: { $gt: Date };
            } = {
                'to.type': 'shelter',
                'to.id': shelterId.toString(),
                movementType: 'transfer',
                'from.type': 'provincial'
            };

            if (since) {
                query.createdAt = { $gt: new Date(since) };
            } else {
                // Default to last 5 minutes if no since param
                query.createdAt = { $gt: new Date(Date.now() - 5 * 60 * 1000) };
            }

            const movements = await StockMovement.find(query)
                .sort({ createdAt: -1 })
                .lean<IStockMovement[]>();

            // We also fetch names if needed, but lean() + movement has itemName
            // Make sure StockMovement has itemName (checked previous stats route and it does have it in the create call)

            return NextResponse.json({
                movements: movements.map((m) => ({
                    id: String(m._id),
                    itemName: String(m.itemName || 'สินค้า'),
                    quantity: Number(m.quantity),
                    unit: String(m.unit),
                    from: String(m.from.name),
                    createdAt: m.createdAt
                }))
            });

        } catch (error: unknown) {
            errorTracker.logError(error, { endpoint: '/api/stock/staff/notifications' });
            return NextResponse.json(
                { error: 'ไม่สามารถโหลดข้อมูลแจ้งเตือนได้' },
                { status: 500 }
            );
        }
    });
}
