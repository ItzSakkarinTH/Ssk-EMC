import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { withStaffAuth } from '@/lib/auth/rbac';
import Stock from '@/lib/db/models/Stock';
import StockMovement from '@/lib/db/models/StockMovement';
import { errorTracker } from '@/lib/error-tracker';

export async function GET(req: NextRequest) {
    return withStaffAuth(req, async (_req, user) => {
        try {
            await connectDB();

            const shelterId = user.assignedShelterId as string;

            if (!shelterId) {
                return NextResponse.json(
                    { error: 'ไม่พบข้อมูลศูนย์พักพิง' },
                    { status: 400 }
                );
            }

            // Get all stocks with shelter data
            const allStocks = await Stock.find({ shelterRef: null });

            let totalItems = 0;
            let totalQuantity = 0;
            let criticalItems = 0;
            let lowStockItems = 0;
            let sufficientItems = 0;
            const categoryMap = new Map<string, { count: number; totalQuantity: number; category: string }>();

            allStocks.forEach(stock => {
                const shelterStock = stock.shelterStock.find(
                    (s: { shelterId: { toString: () => string } }) =>
                        s.shelterId.toString() === shelterId.toString()
                );

                if (shelterStock && shelterStock.quantity > 0) {
                    totalItems++;
                    totalQuantity += shelterStock.quantity;

                    // Check status
                    if (shelterStock.quantity <= stock.criticalLevel) {
                        criticalItems++;
                    } else if (shelterStock.quantity <= stock.minStockLevel) {
                        lowStockItems++;
                    } else {
                        sufficientItems++;
                    }

                    // Item stats with category info for icon
                    categoryMap.set(stock.itemName, {
                        count: 1,
                        totalQuantity: shelterStock.quantity,
                        category: stock.category // เก็บ category สำหรับ icon
                    });
                }
            });

            // Get recent movements (last 7 days)
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const movements = await StockMovement.find({
                createdAt: { $gte: sevenDaysAgo },
                $or: [
                    { 'to.type': 'shelter' },
                    { 'from.type': 'shelter' }
                ]
            }).sort({ createdAt: 1 });

            // Group by date
            const movementsByDate = new Map<string, { receives: number; dispenses: number }>();

            // Initialize last 7 days
            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                movementsByDate.set(dateStr, { receives: 0, dispenses: 0 });
            }

            movements.forEach(movement => {
                const dateStr = movement.createdAt.toISOString().split('T')[0];
                const existing = movementsByDate.get(dateStr) || { receives: 0, dispenses: 0 };

                // Check if this movement affects this shelter
                const isReceivingToShelter = movement.to.type === 'shelter' &&
                    movement.to.id?.toString() === shelterId.toString();
                const isDispenseFromShelter = movement.from.type === 'shelter' &&
                    movement.from.id?.toString() === shelterId.toString();

                // Count as 'receives' if:
                // 1. movementType is 'receive' and coming to this shelter
                // 2. movementType is 'transfer' and coming to this shelter (from provincial/other)
                if (isReceivingToShelter && (movement.movementType === 'receive' || movement.movementType === 'transfer')) {
                    existing.receives++;
                }

                // Count as 'dispenses' if:
                // 1. movementType is 'dispense' and going out from this shelter
                // 2. movementType is 'transfer' and going out from this shelter
                if (isDispenseFromShelter && (movement.movementType === 'dispense' || movement.movementType === 'transfer')) {
                    existing.dispenses++;
                }

                movementsByDate.set(dateStr, existing);
            });

            // Convert to array
            const recentMovements = Array.from(movementsByDate.entries()).map(([date, data]) => ({
                date,
                receives: data.receives,
                dispenses: data.dispenses
            }));

            const byCategory = Array.from(categoryMap.entries()).map(([itemName, data]) => ({
                itemName, // ชื่อสินค้า เช่น ข้าวสาร, น้ำดื่ม
                category: data.category, // category สำหรับกำหนด icon
                count: data.count,
                totalQuantity: data.totalQuantity
            })).sort((a, b) => b.totalQuantity - a.totalQuantity).slice(0, 10); // แสดงแค่ top 10

            return NextResponse.json({
                totalItems,
                totalQuantity,
                criticalItems,
                lowStockItems,
                sufficientItems,
                byCategory,
                recentMovements
            });

        } catch (error: unknown) {
            errorTracker.logError(error, { endpoint: '/api/stock/staff/stats' });
            return NextResponse.json(
                { error: 'ไม่สามารถโหลดสถิติได้' },
                { status: 500 }
            );
        }
    });
}
