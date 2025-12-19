import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import { withAdminAuth } from '@/lib/auth/rbac';
import StockMovement from '@/lib/db/models/StockMovement';
import Stock from '@/lib/db/models/Stock';

export async function GET(req: NextRequest) {
    return withAdminAuth(req, async (req, user) => {
        try {
            await dbConnect();

            const searchParams = req.nextUrl.searchParams;
            const period = searchParams.get('period') || '7days';

            let daysAgo = 7;
            if (period === '30days') daysAgo = 30;
            if (period === '90days') daysAgo = 90;

            const startDate = new Date();
            startDate.setDate(startDate.getDate() - daysAgo);

            // วิเคราะห์การเคลื่อนไหว
            const movements = await StockMovement.find({
                performedAt: { $gte: startDate }
            }).populate('stockId', 'itemName category');

            // คำนวณสถิติ
            const received = movements.filter((m: { movementType: string }) => m.movementType === 'receive');
            const dispensed = movements.filter((m: { movementType: string }) => m.movementType === 'dispense');

            const totalReceived = received.reduce((sum: number, m: { quantity: number }) => sum + m.quantity, 0);
            const totalDispensed = dispensed.reduce((sum: number, m: { quantity: number }) => sum + m.quantity, 0);

            // อัตราหมุนเวียน = เบิกจ่าย / เฉลี่ยสต๊อก
            const allStocks = await Stock.find({});
            const avgStock = allStocks.reduce((sum: number, s: { totalQuantity: number }) => sum + s.totalQuantity, 0) / allStocks.length;
            const turnoverRate = avgStock > 0 ? totalDispensed / avgStock : 0;

            // Top รับเข้า
            const receivedByItem: Record<string, number> = {};
            received.forEach((m: { stockId: unknown; quantity: number }) => {
                const name = (m.stockId as { itemName?: string })?.itemName || 'Unknown';
                receivedByItem[name] = (receivedByItem[name] || 0) + m.quantity;
            });

            const topReceived = Object.entries(receivedByItem)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([name, quantity]) => ({ name, quantity }));

            // Top เบิกจ่าย
            const dispensedByItem: Record<string, number> = {};
            dispensed.forEach((m: { stockId: unknown; quantity: number }) => {
                const name = (m.stockId as { itemName?: string })?.itemName || 'Unknown';
                dispensedByItem[name] = (dispensedByItem[name] || 0) + m.quantity;
            });

            const topDispensed = Object.entries(dispensedByItem)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([name, quantity]) => ({ name, quantity }));

            // Category Distribution
            const categoryDistribution: Record<string, number> = {
                food: 0,
                medicine: 0,
                clothing: 0,
                other: 0
            };

            allStocks.forEach((stock: { category: string; totalQuantity: number }) => {
                categoryDistribution[stock.category] += stock.totalQuantity;
            });

            return NextResponse.json({
                turnoverRate,
                avgDaysInStock: daysAgo / (turnoverRate || 1),
                topReceived,
                topDispensed,
                categoryDistribution,
                summary: {
                    totalReceived,
                    totalDispensed,
                    period: daysAgo
                }
            });

        } catch (error: unknown) {
            const err = error as Error;
            console.error('Analytics error:', err);
            return NextResponse.json(
                { error: 'Failed to fetch analytics' },
                { status: 500 }
            );
        }
    });
}