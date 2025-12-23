
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { withStaffAuth } from '@/lib/auth/rbac';
import StockMovement from '@/lib/db/models/StockMovement';
import Shelter from '@/lib/db/models/Shelter';
import { errorTracker } from '@/lib/error-tracker';
import mongoose from 'mongoose';

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

      // Get shelter name for display
      const shelter = await Shelter.findById(shelterId).select('name').lean();
      const shelterName = shelter ? (shelter as { name: string }).name : 'ศูนย์พักพิง';

      // Get all movements related to THIS specific shelter
      const shelterObjectId = new mongoose.Types.ObjectId(shelterId);

      const movements = await StockMovement.find({
        $or: [
          { 'to.id': shelterObjectId },
          { 'from.id': shelterObjectId }
        ]
      })
        .sort({ createdAt: -1 })
        .populate('performedBy', 'username fullName')
        .populate('stockId', 'itemName category')
        .lean();

      // Format movements with proper shelter names
      const formattedMovements = movements.map(m => {
        const stock = m.stockId as { itemName?: string; category?: string } | null;
        return {
          _id: m._id.toString(),
          itemName: m.itemName || stock?.itemName || 'N/A',
          stockId: {
            itemName: m.itemName || stock?.itemName || 'N/A'
          },
          category: stock?.category,
          movementType: m.movementType,
          quantity: m.quantity,
          unit: m.unit,
          from: {
            ...m.from,
            name: m.from?.id?.toString() === shelterId ? shelterName : (m.from?.name || '-')
          },
          to: {
            ...m.to,
            name: m.to?.id?.toString() === shelterId ? shelterName : (m.to?.name || '-')
          },
          performedBy: m.performedBy,
          createdAt: m.createdAt,
          referenceId: m.referenceId,
          notes: m.notes
        };
      });

      return NextResponse.json({
        movements: formattedMovements,
        total: formattedMovements.length,
        shelterName
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
