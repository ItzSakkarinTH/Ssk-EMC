import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { withStaffAuth } from '@/lib/auth/rbac';
import Stock from '@/lib/db/models/Stock';
import StockMovement from '@/lib/db/models/StockMovement';
import { errorTracker } from '@/lib/error-tracker';
import mongoose from 'mongoose';

export async function POST(req: NextRequest) {
  return withStaffAuth(req, async (_req, user) => {
    try {
      await connectDB();

      const body = await req.json();
      const { items, from, referenceId, notes } = body;

      // Validation
      if (!items || !Array.isArray(items) || items.length === 0) {
        return NextResponse.json(
          { error: 'กรุณาเลือกสินค้าอย่างน้อย 1 รายการ' },
          { status: 400 }
        );
      }

      if (!from || !from.trim()) {
        return NextResponse.json(
          { error: 'กรุณาระบุแหล่งที่มา' },
          { status: 400 }
        );
      }

      const shelterId = user.assignedShelterId;
      if (!shelterId) {
        return NextResponse.json(
          { error: 'ไม่พบข้อมูลศูนย์พักพิง' },
          { status: 400 }
        );
      }

      const movements = [];

      // Process each item
      for (const item of items) {
        const { stockId, quantity } = item;

        if (!stockId || !quantity || quantity <= 0) {
          return NextResponse.json(
            { error: 'ข้อมูลสินค้าไม่ถูกต้อง' },
            { status: 400 }
          );
        }

        // Find the stock item (provincial stock where shelterRef = null)
        const stock = await Stock.findOne({
          _id: stockId,
          shelterRef: null
        });

        if (!stock) {
          return NextResponse.json(
            { error: `ไม่พบสต็อก: ${stockId}` },
            { status: 404 }
          );
        }

        // Find or create shelter stock entry
        const shelterStock = stock.shelterStock.find(
          (s: { shelterId: mongoose.Types.ObjectId }) =>
            s.shelterId.toString() === shelterId.toString()
        );

        const beforeQty = shelterStock ? shelterStock.quantity : 0;

        if (shelterStock) {
          shelterStock.quantity += quantity;
          shelterStock.lastUpdated = new Date();
        } else {
          stock.shelterStock.push({
            shelterId: new mongoose.Types.ObjectId(shelterId),
            quantity,
            lastUpdated: new Date()
          });
        }

        await stock.save();

        // Create movement log
        const movement = await StockMovement.create({
          stockId: stock._id,
          movementType: 'receive',
          quantity,
          unit: stock.unit,
          from: {
            type: 'external',
            name: from.trim()
          },
          to: {
            type: 'shelter',
            name: user.assignedShelterName || 'ศูนย์พักพิง'
          },
          performedBy: new mongoose.Types.ObjectId(user.userId),
          notes: notes?.trim() || `รับเข้าจาก ${from.trim()}`,
          referenceId: referenceId?.trim(),
          itemName: stock.itemName,
          snapshot: {
            before: beforeQty,
            after: shelterStock ? shelterStock.quantity : quantity
          }
        });

        movements.push(movement);
      }

      errorTracker.logInfo('Stock received successfully', {
        shelterId,
        userId: user.userId,
        itemCount: items.length,
        from
      });

      return NextResponse.json({
        success: true,
        message: 'รับเข้าสต็อกสำเร็จ',
        movementCount: movements.length
      });

    } catch (error) {
      errorTracker.logError(error, { endpoint: '/api/stock/staff/receive', method: 'POST' });
      return NextResponse.json(
        { error: 'ไม่สามารถรับเข้าสต็อกได้' },
        { status: 500 }
      );
    }
  });
}