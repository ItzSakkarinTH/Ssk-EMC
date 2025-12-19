
import { NextRequest, NextResponse } from 'next/server';
import Stock from '@/lib/db/models/Stock';
import Shelter from '@/lib/db/models/Shelter';
import dbConnect from '@/lib/db/mongodb';
import { withStaffAuth } from '@/lib/auth/rbac';

export async function GET(req: NextRequest) {
  return withStaffAuth(req, async (req, user) => {
    try {
      await dbConnect();

      const shelterId = user.assignedShelterId!;

      // ดึงข้อมูลศูนย์
      const shelter = await Shelter.findById(shelterId);
      if (!shelter) {
        return NextResponse.json(
          { error: 'Shelter not found' },
          { status: 404 }
        );
      }

      // ดึงสต๊อกทั้งหมดที่มีในศูนย์นี้
      const stocks = await Stock.find({
        'shelterStock.shelterId': shelterId
      });

      const stockList = stocks.map((stock: { _id: { toString: () => string }; getShelterStock: (id: string) => { quantity: number; lastUpdated: Date } | null; itemName: string; category: string; unit: string; criticalLevel: number; minStockLevel: number }) => {
        const shelterStock = stock.getShelterStock(shelterId);

        return {
          stockId: stock._id.toString(),
          itemName: stock.itemName,
          category: stock.category,
          quantity: shelterStock?.quantity || 0,
          unit: stock.unit,
          status: shelterStock
            ? (shelterStock.quantity <= stock.criticalLevel ? 'critical'
              : shelterStock.quantity <= stock.minStockLevel ? 'low'
                : 'sufficient')
            : 'unavailable',
          lastUpdated: shelterStock?.lastUpdated || null,
          minStockLevel: stock.minStockLevel,
          criticalLevel: stock.criticalLevel
        };
      }).filter((s: { quantity: number }) => s.quantity > 0); // แสดงเฉพาะของที่มีอยู่

      return NextResponse.json({
        shelterId,
        shelterName: shelter.name,
        totalItems: stockList.length,
        stock: stockList
      });

    } catch (error: unknown) {
      const err = error as Error;
      console.error('Staff shelter stock error:', err);
      return NextResponse.json(
        { error: 'Failed to fetch shelter stock' },
        { status: 500 }
      );
    }
  });
}