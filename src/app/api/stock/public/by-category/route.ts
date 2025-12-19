// src/app/api/stock/public/by-category/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stock from '@/lib/db/models/Stock';
import dbConnect from '@/lib/db/mongodb';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const searchParams = req.nextUrl.searchParams;
    const category = searchParams.get('category');

    if (!category || !['food', 'medicine', 'clothing', 'other'].includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      );
    }

    const stocks = await Stock.find({ category })
      .select('itemName totalQuantity unit minStockLevel criticalLevel')
      .sort({ totalQuantity: -1 });

    const items = stocks.map(stock => ({
      itemName: stock.itemName,
      totalQuantity: stock.totalQuantity,
      unit: stock.unit,
      status: stock.getStatus()
    }));

    return NextResponse.json({
      category,
      itemCount: items.length,
      items
    });

  } catch (error: any) {
    console.error('Public category error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category data' },
      { status: 500 }
    );
  }
}