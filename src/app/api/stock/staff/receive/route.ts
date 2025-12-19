// src/app/api/stock/staff/receive/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import { withStaffAuth, canPerformStockAction } from '@/lib/auth/rbac';
import { StockService } from '@/lib/stock/service';

export async function POST(req: NextRequest) {
  return withStaffAuth(req, async (req, user) => {
    try {
      await dbConnect();

      const body = await req.json();
      const { stockId, quantity, from, referenceId, notes } = body;

      // Validation
      if (!stockId || !quantity || !from) {
        return NextResponse.json(
          { error: 'Missing required fields: stockId, quantity, from' },
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
      const permission = canPerformStockAction(user, 'receive', shelterId);
      if (!permission.allowed) {
        return NextResponse.json(
          { error: permission.reason },
          { status: 403 }
        );
      }

      // รับเข้าสต๊อก
      const result = await StockService.receiveStock({
        stockId,
        quantity,
        destination: 'shelter',
        shelterId,
        userId: user.userId,
        from,
        referenceId,
        notes
      });

      return NextResponse.json({
        success: true,
        newQuantity: result.newQuantity,
        message: 'Stock received successfully'
      });

    } catch (error: any) {
      console.error('Receive stock error:', error);
      
      if (error.message === 'Stock not found') {
        return NextResponse.json(
          { error: 'Stock item not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to receive stock' },
        { status: 500 }
      );
    }
  });
}