
import { NextRequest, NextResponse } from 'next/server';
import Stock from '@/lib/db/models/Stock';
import Shelter from '@/lib/db/models/Shelter';
import dbConnect from '@/lib/db/mongodb';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    // ดึงข้อมูลสรุปทั้งหมด
    const allStocks = await Stock.find({});

    const totalItems = allStocks.length;
    const totalQuantity = allStocks.reduce((sum: number, s: { totalQuantity: number }) => sum + s.totalQuantity, 0);
    const totalReceived = allStocks.reduce((sum: number, s: { totalReceived: number }) => sum + s.totalReceived, 0);
    const totalDispensed = allStocks.reduce((sum: number, s: { totalDispensed: number }) => sum + s.totalDispensed, 0);

    // ดึงข้อมูลศูนย์พักพิง
    const allShelters = await Shelter.find({});
    const totalShelters = allShelters.length;
    const activeShelters = allShelters.filter((s: { status: string }) => s.status === 'active').length;
    const inactiveShelters = allShelters.filter((s: { status: string }) => s.status === 'inactive').length;
    const fullShelters = allShelters.filter((s: { status: string }) => s.status === 'full').length;

    // แยกตามหมวด
    const byCategory = {
      food: { items: 0, quantity: 0 },
      medicine: { items: 0, quantity: 0 },
      clothing: { items: 0, quantity: 0 },
      other: { items: 0, quantity: 0 }
    };

    allStocks.forEach((stock: { category: 'food' | 'medicine' | 'clothing' | 'other'; totalQuantity: number }) => {
      byCategory[stock.category].items++;
      byCategory[stock.category].quantity += stock.totalQuantity;
    });

    // นับแจ้งเตือน
    let lowStock = 0;
    let outOfStock = 0;

    allStocks.forEach((stock: { getStatus: () => string }) => {
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
      shelters: {
        total: totalShelters,
        active: activeShelters,
        inactive: inactiveShelters,
        full: fullShelters
      },
      lastUpdated: new Date()
    });

  } catch (error: unknown) {
    const err = error as Error;
    console.error('Public overview error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch stock overview' },
      { status: 500 }
    );
  }
}