import { NextResponse } from 'next/server';
import Stock from '@/lib/db/models/Stock';
import dbConnect from '@/lib/db/mongodb';

export async function GET() {
  try {
    await dbConnect();

    // ดึงรายการที่มีปัญหา (น้อยกว่า 200)
    const allStocks = await Stock.find({ totalQuantity: { $lt: 200 } })
      .select('itemName category totalQuantity unit')
      .sort({ totalQuantity: 1 }) // เรียงจากน้อยไปมาก
      .limit(10); // ดึงมาแค่ 10 รายการพอ

    const alerts = allStocks.map(stock => {
      const q = stock.totalQuantity;
      let status: 'critical' | 'low' = 'low';
      if (q < 50) status = 'critical';

      return {
        itemName: stock.itemName,
        category: stock.category,
        currentStock: q,
        unit: stock.unit,
        status: status
      };
    });

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