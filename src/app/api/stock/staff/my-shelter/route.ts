import { NextRequest, NextResponse } from 'next/server';
import Stock from '@/lib/db/models/Stock';
import Shelter from '@/lib/db/models/Shelter';
import { connectDB } from '@/lib/db/mongodb';
import { withStaffAuth } from '@/lib/auth/rbac';
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

      // ดึงข้อมูลศูนย์
      const shelter = await Shelter.findById(shelterId);
      if (!shelter) {
        return NextResponse.json(
          { error: 'ไม่พบศูนย์พักพิง' },
          { status: 404 }
        );
      }

      // ดึงสต็อกทั้งหมดในระบบ (provincial stock)
      const allStocks = await Stock.find({ shelterRef: null });

      const stockList = allStocks.map(stock => {
        const shelterStock = stock.shelterStock.find(
          (s: { shelterId: { toString: () => string } }) =>
            s.shelterId.toString() === shelterId.toString()
        );

        return {
          stockId: stock._id.toString(), // แก้จาก _id เป็น stockId
          itemName: stock.itemName,
          category: stock.category,
          unit: stock.unit,
          quantity: shelterStock?.quantity || 0, // แก้จาก currentQuantity เป็น quantity
          provincialStock: stock.provincialStock,
          status: shelterStock
            ? (shelterStock.quantity <= stock.criticalLevel ? 'critical'
              : shelterStock.quantity <= stock.minStockLevel ? 'low'
                : 'sufficient')
            : 'unavailable',
          lastUpdated: shelterStock?.lastUpdated || null
        };
      });

      return NextResponse.json({
        shelterId,
        shelterName: shelter.name,
        totalItems: stockList.length,
        stock: stockList
      });

    } catch (error: unknown) {
      errorTracker.logError(error, { endpoint: '/api/stock/staff/my-shelter' });
      return NextResponse.json(
        { error: 'ไม่สามารถโหลดข้อมูลสต็อกได้' },
        { status: 500 }
      );
    }
  });
}
