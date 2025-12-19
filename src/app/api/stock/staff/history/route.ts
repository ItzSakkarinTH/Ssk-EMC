
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import { withStaffAuth } from '@/lib/auth/rbac';
import StockMovement from '@/lib/db/models/StockMovement';

export async function GET(req: NextRequest) {
  return withStaffAuth(req, async (req, user) => {
    try {
      await dbConnect();

      const shelterId = user.assignedShelterId!;
      const searchParams = req.nextUrl.searchParams;

      const movementType = searchParams.get('type'); // receive, dispense, transfer
      const limit = parseInt(searchParams.get('limit') || '50');
      const skip = parseInt(searchParams.get('skip') || '0');

      // สร้าง query
      const query: {
        $or: Array<{ 'from.id'?: string; 'to.id'?: string }>;
        movementType?: string;
      } = {
        $or: [
          { 'from.id': shelterId },
          { 'to.id': shelterId }
        ]
      };

      if (movementType && ['receive', 'dispense', 'transfer'].includes(movementType)) {
        query.movementType = movementType;
      }

      // ดึงข้อมูล
      const movements = await StockMovement.find(query)
        .sort({ performedAt: -1 })
        .limit(limit)
        .skip(skip)
        .populate('stockId', 'itemName category')
        .populate('performedBy', 'name');

      const total = await StockMovement.countDocuments(query);

      // จัดรูปแบบข้อมูล
      const history = movements.map((m: { _id: unknown; stockId: unknown; movementType: string; quantity: number; unit: string; from: unknown; to: unknown; performedBy: unknown; performedAt: Date; notes: string; referenceId: string; snapshot: unknown }) => ({
        id: m._id,
        stockId: m.stockId,
        movementType: m.movementType,
        quantity: m.quantity,
        unit: m.unit,
        from: m.from,
        to: m.to,
        performedBy: m.performedBy,
        performedAt: m.performedAt,
        notes: m.notes,
        referenceId: m.referenceId,
        snapshot: m.snapshot
      }));

      return NextResponse.json({
        history,
        pagination: {
          total,
          limit,
          skip,
          hasMore: skip + limit < total
        }
      });

    } catch (error: unknown) {
      const err = error as Error;
      console.error('Get history error:', err);
      return NextResponse.json(
        { error: 'Failed to fetch history' },
        { status: 500 }
      );
    }
  });
}