// src/app/api/stock/admin/transfer/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import { withAdminAuth } from '@/lib/auth/rbac';
import { StockService } from '@/lib/stock/service';

export async function POST(req: NextRequest) {
  return withAdminAuth(req, async (req, user) => {
    try {
      await dbConnect();

      const body = await req.json();
      const { stockId, quantity, fromShelterId, toShelterId, notes } = body;

      // Validation
      if (!stockId || !quantity || !fromShelterId || !toShelterId) {
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

      if (fromShelterId === toShelterId) {
        return NextResponse.json(
          { error: 'Cannot transfer to the same shelter' },
          { status: 400 }
        );
      }

      // โอนสต๊อก
      await StockService.transferStock({
        stockId,
        fromShelterId,
        toShelterId,
        quantity,
        userId: user.userId,
        notes
      });

      return NextResponse.json({
        success: true,
        message: 'Stock transferred successfully'
      });

    } catch (error: any) {
      console.error('Transfer error:', error);
      
      if (error.message === 'Stock not found') {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }

      if (error.message?.includes('Insufficient')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to transfer stock' },
        { status: 500 }
      );
    }
  });
}