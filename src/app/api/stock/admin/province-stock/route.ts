// src/app/api/stock/admin/province-stock/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import { withAdminAuth } from '@/lib/auth/rbac';
import Stock from '@/lib/db/models/Stock';
import StockMovement from '@/lib/db/models/StockMovement';

export async function GET(req: NextRequest) {
  return withAdminAuth(req, async (req, user) => {
    try {
      await dbConnect();

      // ดึงสต๊อกทั้งหมด
      const allStocks = await Stock.find({});

      // คำนวณภาพรวมจังหวัด
      let totalProvincialStock = 0;
      let totalShelterStock = 0;
      let lowStockItems = 0;
      let outOfStockItems = 0;

      const categoryBreakdown = {
        food: { provincial: 0, shelter: 0, items: 0 },
        medicine: { provincial: 0, shelter: 0, items: 0 },
        clothing: { provincial: 0, shelter: 0, items: 0 },
        other: { provincial: 0, shelter: 0, items: 0 }
      };

      const provincialStockList: any[] = [];

      allStocks.forEach(stock => {
        totalProvincialStock += stock.provincialStock;
        
        const shelterTotal = stock.shelterStock.reduce((sum, s) => sum + s.quantity, 0);
        totalShelterStock += shelterTotal;

        // แยกตามหมวด
        categoryBreakdown[stock.category].provincial += stock.provincialStock;
        categoryBreakdown[stock.category].shelter += shelterTotal;
        categoryBreakdown[stock.category].items++;

        // นับแจ้งเตือน
        const status = stock.getStatus();
        if (status === 'low' || status === 'critical') lowStockItems++;
        if (status === 'outOfStock') outOfStockItems++;

        // รายการที่ค้างอยู่ที่จังหวัด
        if (stock.provincialStock > 0) {
          provincialStockList.push({
            stockId: stock._id,
            itemName: stock.itemName,
            category: stock.category,
            quantity: stock.provincialStock,
            unit: stock.unit,
            status: stock.provincialStock <= stock.criticalLevel ? 'critical'
                  : stock.provincialStock <= stock.minStockLevel ? 'low'
                  : 'sufficient'
          });
        }
      });

      // ดึงสถิติการเคลื่อนไหว 7 วันล่าสุด
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentMovements = await StockMovement.aggregate([
        {
          $match: {
            performedAt: { $gte: sevenDaysAgo }
          }
        },
        {
          $group: {
            _id: '$movementType',
            count: { $sum: 1 },
            totalQuantity: { $sum: '$quantity' }
          }
        }
      ]);

      const movementStats = {
        receive: { count: 0, quantity: 0 },
        transfer: { count: 0, quantity: 0 },
        dispense: { count: 0, quantity: 0 }
      };

      recentMovements.forEach(m => {
        movementStats[m._id as keyof typeof movementStats] = {
          count: m.count,
          quantity: m.totalQuantity
        };
      });

      return NextResponse.json({
        overview: {
          totalProvincialStock,
          totalShelterStock,
          totalStock: totalProvincialStock + totalShelterStock,
          totalItems: allStocks.length,
          alerts: {
            low: lowStockItems,
            outOfStock: outOfStockItems
          }
        },
        byCategory: categoryBreakdown,
        provincialStock: provincialStockList.sort((a, b) => b.quantity - a.quantity),
        recentActivity: movementStats,
        lastUpdated: new Date()
      });

    } catch (error: any) {
      console.error('Get province stock error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch province stock data' },
        { status: 500 }
      );
    }
  });
}