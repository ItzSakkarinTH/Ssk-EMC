// src/app/api/stock/staff/dispense/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import { withStaffAuth, canPerformStockAction } from '@/lib/auth/rbac';
import { StockService } from '@/lib/stock/service';

export async function POST(req: NextRequest) {
  return withStaffAuth(req, async (req, user) => {
    try {
      await dbConnect();

      const body = await req.json();
      const { stockId, quantity, recipient, notes } = body;

      // Validation
      if (!stockId || !quantity || !recipient) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        );
      }

      if (quantity <= 0) {
        return NextResponse.json(
          { error: 'Quantity must be positive' },
          { status: 400 }
        );
      }

      const shelterId = user.assignedShelterId!;

      // ตรวจสอบสิทธิ์
      const permission = canPerformStockAction(user, 'dispense', shelterId);
      if (!permission.allowed) {
        return NextResponse.json(
          { error: permission.reason },
          { status: 403 }
        );
      }

      // เบิกจ่าย
      const result = await StockService.dispenseStock({
        stockId,
        shelterId,
        quantity,
        userId: user.userId,
        recipient,
        notes
      });

      return NextResponse.json({
        success: true,
        remainingStock: result.remainingStock,
        alert: result.alert ? 'Stock is running low' : null
      });

    } catch (error: any) {
      console.error('Dispense error:', error);
      
      if (error.message === 'Stock not found' || 
          error.message === 'Shelter stock not found') {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }

      if (error.message === 'Insufficient stock') {
        return NextResponse.json(
          { error: 'Not enough stock to dispense' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to dispense stock' },
        { status: 500 }
      );
    }
  });
}