
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import { withAdminAuth } from '@/lib/auth/rbac';
import Stock from '@/lib/db/models/Stock';
import Shelter from '@/lib/db/models/Shelter';

export async function GET(req: NextRequest) {
  return withAdminAuth(req, async (req, user) => {
    try {
      await dbConnect();

      // ดึงศูนย์ทั้งหมด
      const shelters = await Shelter.find({ status: 'active' });

      // ดึงสต๊อกทั้งหมด
      const allStocks = await Stock.find({});

      // คำนวณสรุปแต่ละศูนย์
      const shelterSummary = shelters.map((shelter: { _id: { toString: () => string }; name: string; code: string; location: string; capacity: number; currentOccupancy: number }) => {
        let totalItems = 0;
        let totalQuantity = 0;
        let lowStockCount = 0;
        let criticalCount = 0;

        allStocks.forEach((stock: { shelterStock: Array<{ shelterId: { toString: () => string }; quantity: number }>; criticalLevel: number; minStockLevel: number }) => {
          const shelterStock = stock.shelterStock.find(
            (s: { shelterId: { toString: () => string } }) => s.shelterId.toString() === shelter._id.toString()
          );

          if (shelterStock && shelterStock.quantity > 0) {
            totalItems++;
            totalQuantity += shelterStock.quantity;

            if (shelterStock.quantity <= stock.criticalLevel) {
              criticalCount++;
            } else if (shelterStock.quantity <= stock.minStockLevel) {
              lowStockCount++;
            }
          }
        });

        // กำหนดสถานะ
        let status: 'normal' | 'tight' | 'critical' = 'normal';
        if (criticalCount > 0) {
          status = 'critical';
        } else if (lowStockCount >= 3) {
          status = 'tight';
        }

        return {
          shelterId: shelter._id,
          shelterName: shelter.name,
          shelterCode: shelter.code,
          location: shelter.location,
          totalItems,
          totalQuantity,
          alerts: {
            low: lowStockCount,
            critical: criticalCount,
            total: lowStockCount + criticalCount
          },
          status,
          capacity: shelter.capacity,
          currentOccupancy: shelter.currentOccupancy
        };
      });

      return NextResponse.json({
        shelters: shelterSummary,
        summary: {
          totalShelters: shelters.length,
          normalShelters: shelterSummary.filter((s: { status: string }) => s.status === 'normal').length,
          tightShelters: shelterSummary.filter((s: { status: string }) => s.status === 'tight').length,
          criticalShelters: shelterSummary.filter((s: { status: string }) => s.status === 'critical').length
        }
      });

    } catch (error: unknown) {
      const err = error as Error;
      console.error('Get all shelters error:', err);
      return NextResponse.json(
        { error: 'Failed to fetch shelter data' },
        { status: 500 }
      );
    }
  });
}
