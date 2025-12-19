// src/app/api/stock/public/overview/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stock from '@/lib/db/models/Stock';
import dbConnect from '@/lib/db/mongodb';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    // ดึงข้อมูลสรุปทั้งหมด
    const allStocks = await Stock.find({});

    const totalItems = allStocks.length;
    const totalQuantity = allStocks.reduce((sum, s) => sum + s.totalQuantity, 0);
    const totalReceived = allStocks.reduce((sum, s) => sum + s.totalReceived, 0);
    const totalDispensed = allStocks.reduce((sum, s) => sum + s.totalDispensed, 0);

    // แยกตามหมวด
    const byCategory = {
      food: { items: 0, quantity: 0 },
      medicine: { items: 0, quantity: 0 },
      clothing: { items: 0, quantity: 0 },
      other: { items: 0, quantity: 0 }
    };

    allStocks.forEach(stock => {
      byCategory[stock.category].items++;
      byCategory[stock.category].quantity += stock.totalQuantity;
    });

    // นับแจ้งเตือน
    let lowStock = 0;
    let outOfStock = 0;

    allStocks.forEach(stock => {
      const status = stock.getStatus();
      if (status === 'low' || status === 'critical') lowStock++;
      if (status === 'outOfStock') outOfStock++;
    });

    return NextResponse.json({
      totalItems,
      totalQuantity,
      totalReceived,
      totalDispensed,
      byCategory,
      alerts: {
        lowStock,
        outOfStock
      },
      lastUpdated: new Date()
    });

  } catch (error: any) {
    console.error('Public overview error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock overview' },
      { status: 500 }
    );
  }
}