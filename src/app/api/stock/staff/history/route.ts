
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { withStaffAuth } from '@/lib/auth/rbac';
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

      // Get all movements related to this shelter
      const movements = await StockMovement.find({
        $or: [
          { 'to.type': 'shelter' },
          { 'from.type': 'shelter' }
        ]
      })
        .sort({ createdAt: -1 })
        .populate('performedBy', 'username')
        .lean();

      // Format movements
      const formattedMovements = movements.map(m => ({
        _id: m._id.toString(),
        itemName: m.itemName,
        stockId: {
          itemName: m.itemName
        },
        movementType: m.movementType,
        quantity: m.quantity,
        unit: m.unit,
        from: m.from,
        to: m.to,
        performedBy: m.performedBy,
        createdAt: m.createdAt,
        referenceId: m.referenceId,
        notes: m.notes
      }));

      return NextResponse.json({
        movements: formattedMovements,
        total: formattedMovements.length
      });

    } catch (error: unknown) {
      errorTracker.logError(error, { endpoint: '/api/stock/staff/history' });
      return NextResponse.json(
        { error: 'ไม่สามารถโหลดประวัติได้' },
        { status: 500 }
      );
    }
  });
}
