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
      .map(stock => {
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

  } catch (error: any) {
    console.error('Public alerts error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}