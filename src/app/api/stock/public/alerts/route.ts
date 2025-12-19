import { NextRequest, NextResponse } from 'next/server';
import Stock from '@/lib/db/models/Stock';
import dbConnect from '@/lib/db/mongodb';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    // ดึงรายการที่มีปัญหา
    const allStocks = await Stock.find({}).select(
      'itemName category totalQuantity minStockLevel criticalLevel unit'
    );

    const alerts = allStocks
      .map((stock: { getStatus: () => string; itemName: string; category: string; totalQuantity: number; minStockLevel: number; unit: string }) => {
        const status = stock.getStatus();
        if (status === 'sufficient') return null;

        return {
          itemName: stock.itemName,
          category: stock.category,
          currentStock: stock.totalQuantity,
          minLevel: stock.minStockLevel,
          unit: stock.unit,
          status
        };
      })
      .filter(Boolean);

    return NextResponse.json({ alerts });

  } catch (error: unknown) {
    const err = error as Error;
    console.error('Public alerts error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}