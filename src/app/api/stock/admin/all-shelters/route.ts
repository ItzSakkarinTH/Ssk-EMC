import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import { withAdminAuth } from '@/lib/auth/rbac';
import Stock, { IStock, IShelterStock } from '@/lib/db/models/Stock';
import Shelter, { IShelter } from '@/lib/db/models/Shelter';
import { Types } from 'mongoose';

export async function GET(req: NextRequest) {
  return withAdminAuth(req, async () => {
    try {
      await dbConnect();

      // ดึงศูนย์ทั้งหมด แบบ JSON object (lean)
      const shelters = await Shelter.find({ status: { $in: ['active', 'full'] } }).lean() as unknown as (IShelter & { _id: Types.ObjectId })[];

      // ดึงสต๊อกทั้งหมด
      const allStocks = await Stock.find({}).lean() as unknown as (IStock & { _id: Types.ObjectId })[];

      if (!shelters) {
        return NextResponse.json({ shelters: [], summary: null });
      }

      // คำนวณสรุปแต่ละศูนย์
      const shelterSummary = shelters.map((shelter) => {
        let totalItems = 0;
        let totalQuantity = 0;
        let lowStockCount = 0;
        let criticalCount = 0;

        allStocks.forEach((stock) => {
          if (!stock.shelterStock) return;

          const shelterIdStr = shelter._id.toString();
          const shelterStock = stock.shelterStock.find(
            (s: IShelterStock) => s.shelterId && s.shelterId.toString() === shelterIdStr
          );

          if (shelterStock && shelterStock.quantity > 0) {
            totalItems++;
            totalQuantity += shelterStock.quantity;

            const critical = stock.criticalLevel || 5;
            const min = stock.minStockLevel || 10;

            if (shelterStock.quantity <= critical) {
              criticalCount++;
            } else if (shelterStock.quantity <= min) {
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
          shelterId: shelter._id.toString(),
          shelterName: shelter.name,
          shelterCode: shelter.code,
          location: typeof shelter.location === 'object'
            ? `${shelter.location.district}, ${shelter.location.province}`
            : shelter.location,
          totalItems,
          totalQuantity,
          alerts: {
            low: lowStockCount,
            critical: criticalCount,
            total: lowStockCount + criticalCount
          },
          status,
          capacity: shelter.capacity || 0,
          currentOccupancy: shelter.currentOccupancy || 0
        };
      });

      return NextResponse.json({
        shelters: shelterSummary,
        summary: {
          totalShelters: shelters.length,
          normalShelters: shelterSummary.filter((s) => s.status === 'normal').length,
          tightShelters: shelterSummary.filter((s) => s.status === 'tight').length,
          criticalShelters: shelterSummary.filter((s) => s.status === 'critical').length
        }
      });

    } catch (error: unknown) {
      console.error('Get all shelters api error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
      return NextResponse.json(
        { error: `API Error: ${errorMessage}` },
        { status: 500 }
      );
    }
  });
}
