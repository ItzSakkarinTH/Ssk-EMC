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

            // Get shelter information
            const Shelter = (await import('@/lib/db/models/Shelter')).default;
            const shelter = await Shelter.findById(shelterId).select('name');

            if (!shelter) {
                return NextResponse.json(
                    { error: 'ไม่พบข้อมูลศูนย์พักพิง' },
                    { status: 404 }
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

            // Get recent movements (last 7 days) - เฉพาะที่เกี่ยวข้องกับศูนย์นี้
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            // Get staff user IDs for this shelter  
            const User = (await import('@/lib/db/models/User')).default;
            const staffUsers = await User.find({ assignedShelterId: shelterId }).select('_id');
            const staffUserIds = staffUsers.map(u => u._id);

            const movements = await StockMovement.find({
                createdAt: { $gte: sevenDaysAgo },
                $or: [
                    // กรณีมี ID (ข้อมูลใหม่)
                    { 'to.type': 'shelter', 'to.id': shelterId },
                    { 'from.type': 'shelter', 'from.id': shelterId },
                    // กรณีไม่มี ID แต่ทำโดยพนักงานของศูนย์นี้ (ข้อมูลเก่า)
                    {
                        performedBy: { $in: staffUserIds },
                        $or: [
                            { 'to.type': 'shelter' },
                            { 'from.type': 'shelter' }
                        ]
                    }
                ]
            }).sort({ createdAt: 1 });

            console.log(`\n=== STATS API DEBUG ===`);
            console.log(`User's Shelter ID: ${shelterId}`);
            console.log(`Found ${movements.length} movements for shelter ${shelterId} in last 7 days`);

            // Group by date
            const movementsByDate = new Map<string, {
                receives: number;
                receivesQty: number;
                transfersFromProvincial: number;
                transfersFromProvincialQty: number;
                dispenses: number;
                dispensesQty: number;
            }>();

            // Initialize last 7 days
            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                movementsByDate.set(dateStr, {
                    receives: 0,
                    receivesQty: 0,
                    transfersFromProvincial: 0,
                    transfersFromProvincialQty: 0,
                    dispenses: 0,
                    dispensesQty: 0
                });
            }

            movements.forEach(movement => {
                const dateStr = movement.createdAt.toISOString().split('T')[0];
                const existing = movementsByDate.get(dateStr) || {
                    receives: 0,
                    receivesQty: 0,
                    transfersFromProvincial: 0,
                    transfersFromProvincialQty: 0,
                    dispenses: 0,
                    dispensesQty: 0
                };

                console.log(`\n--- Movement on ${dateStr} ---`);
                console.log(`Type: ${movement.movementType}`);
                console.log(`From: ${movement.from.type} (ID: ${movement.from.id})`);
                console.log(`To: ${movement.to.type} (ID: ${movement.to.id})`);
                console.log(`Qty: ${movement.quantity}`);
                console.log(`PerformedBy: ${movement.performedBy}`);

                // Check if movement is coming TO this shelter (รับเข้า)
                // กรณีมี to.id ให้เช็คตรงๆ, ถ้าไม่มีให้เช็คว่าทำโดยพนักงานของศูนย์นี้และ to.type เป็น shelter
                const isReceivingToShelter = movement.to.type === 'shelter' && (
                    movement.to.id?.toString() === shelterId.toString() ||
                    (!movement.to.id && staffUserIds.some(id => id.toString() === movement.performedBy?.toString()))
                );

                // Check if movement is going FROM this shelter (จ่ายออก)
                // กรณีมี from.id ให้เช็คตรงๆ, ถ้าไม่มีให้เช็คว่าทำโดยพนักงานของศูนย์นี้และ from.type เป็น shelter
                const isDispenseFromShelter = movement.from.type === 'shelter' && (
                    movement.from.id?.toString() === shelterId.toString() ||
                    (!movement.from.id && staffUserIds.some(id => id.toString() === movement.performedBy?.toString()))
                );

                // Check if transfer is from provincial
                const isFromProvincial = movement.from.type === 'provincial';

                console.log(`isReceivingToShelter: ${isReceivingToShelter}`);
                console.log(`isDispenseFromShelter: ${isDispenseFromShelter}`);
                console.log(`isFromProvincial: ${isFromProvincial}`);

                // Count as 'receives' (รับเข้า) if movementType is 'receive' and coming to this shelter
                if (isReceivingToShelter && movement.movementType === 'receive') {
                    existing.receives++;
                    existing.receivesQty += movement.quantity;
                    console.log(`Direct Receive on ${dateStr}, qty: ${movement.quantity}`);
                }

                // Count as 'transfersFromProvincial' (รับโอนจากกองกลาง) if transfer from provincial to this shelter
                if (isReceivingToShelter && movement.movementType === 'transfer' && isFromProvincial) {
                    existing.transfersFromProvincial++;
                    existing.transfersFromProvincialQty += movement.quantity;
                    console.log(`Transfer from Provincial on ${dateStr}, qty: ${movement.quantity}`);
                }

                // Count as 'dispenses' (จ่ายออก) if:
                // 1. movementType is 'dispense' and going out from this shelter
                // 2. movementType is 'transfer' and going out from this shelter (but NOT to provincial)
                if (isDispenseFromShelter && (movement.movementType === 'dispense' || movement.movementType === 'transfer')) {
                    existing.dispenses++;
                    existing.dispensesQty += movement.quantity;
                    console.log(`Dispense: ${movement.movementType} on ${dateStr}, qty: ${movement.quantity}`);
                }

                movementsByDate.set(dateStr, existing);
            });

            // Convert to array
            const recentMovements = Array.from(movementsByDate.entries()).map(([date, data]) => ({
                date,
                receives: data.receives,
                receivesQty: data.receivesQty,
                transfersFromProvincial: data.transfersFromProvincial,
                transfersFromProvincialQty: data.transfersFromProvincialQty,
                dispenses: data.dispenses,
                dispensesQty: data.dispensesQty
            }));

            const byCategory = Array.from(categoryMap.entries()).map(([itemName, data]) => ({
                itemName, // ชื่อสินค้า เช่น ข้าวสาร, น้ำดื่ม
                category: data.category, // category สำหรับกำหนด icon
                count: data.count,
                totalQuantity: data.totalQuantity
            })).sort((a, b) => b.totalQuantity - a.totalQuantity).slice(0, 10); // แสดงแค่ top 10

            return NextResponse.json({
                shelterName: shelter.name,
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
