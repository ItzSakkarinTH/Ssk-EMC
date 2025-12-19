// src/app/api/stock/staff/request/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import { withStaffAuth } from '@/lib/auth/rbac';
import StockRequest from '@/lib/db/models/StockRequest';
import Stock from '@/lib/db/models/Stock';

export async function POST(req: NextRequest) {
  return withStaffAuth(req, async (req, user) => {
    try {
      await dbConnect();

      const body = await req.json();
      const { items } = body;

      // Validation
      if (!items || !Array.isArray(items) || items.length === 0) {
        return NextResponse.json(
          { error: 'Items array is required and must not be empty' },
          { status: 400 }
        );
      }

      // ตรวจสอบแต่ละ item
      for (const item of items) {
        if (!item.stockId || !item.quantity || !item.reason) {
          return NextResponse.json(
            { error: 'Each item must have stockId, quantity, and reason' },
            { status: 400 }
          );
        }

        if (item.quantity <= 0) {
          return NextResponse.json(
            { error: 'Quantity must be positive' },
            { status: 400 }
          );
        }
      }

      // ดึงข้อมูลสต๊อกเพื่อเติม itemName และ unit
      const enrichedItems = await Promise.all(
        items.map(async (item: any) => {
          const stock = await Stock.findById(item.stockId);
          if (!stock) {
            throw new Error(`Stock ${item.stockId} not found`);
          }

          // ตรวจสอบว่ามีสต๊อกเพียงพอใน provincial หรือไม่
          if (stock.provincialStock < item.quantity) {
            return {
              ...item,
              itemName: stock.itemName,
              unit: stock.unit,
              warning: `Provincial stock insufficient (available: ${stock.provincialStock})`
            };
          }

          return {
            stockId: item.stockId,
            itemName: stock.itemName,
            requestedQuantity: item.quantity,
            unit: stock.unit,
            reason: item.reason
          };
        })
      );

      // สร้างคำร้อง
      const request = await StockRequest.createRequest({
        shelterId: user.assignedShelterId!,
        requestedBy: user.userId,
        items: enrichedItems
      });

      // ตรวจสอบว่ามี warning หรือไม่
      const warnings = enrichedItems
        .filter((item: any) => item.warning)
        .map((item: any) => `${item.itemName}: ${item.warning}`);

      return NextResponse.json({
        success: true,
        requestId: request._id,
        requestNumber: request.requestNumber,
        status: 'pending',
        warnings: warnings.length > 0 ? warnings : null,
        message: warnings.length > 0 
          ? 'Request created but some items may not be fully available'
          : 'Request created successfully'
      });

    } catch (error: any) {
      console.error('Create request error:', error);
      
      if (error.message?.includes('not found')) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to create request' },
        { status: 500 }
      );
    }
  });
}

// GET: ดูคำร้องของศูนย์ตัวเอง
export async function GET(req: NextRequest) {
  return withStaffAuth(req, async (req, user) => {
    try {
      await dbConnect();

      const shelterId = user.assignedShelterId!;
      const searchParams = req.nextUrl.searchParams;
      const status = searchParams.get('status');

      const query: any = { shelterId };
      if (status && ['pending', 'approved', 'rejected', 'partial'].includes(status)) {
        query.status = status;
      }

      const requests = await StockRequest.find(query)
        .sort({ requestedAt: -1 })
        .limit(50)
        .populate('requestedBy', 'name')
        .populate('reviewedBy', 'name');

      return NextResponse.json({
        requests: requests.map(r => ({
          id: r._id,
          requestNumber: r.requestNumber,
          status: r.status,
          itemCount: r.items.length,
          requestedAt: r.requestedAt,
          requestedBy: r.requestedBy,
          reviewedBy: r.reviewedBy,
          reviewedAt: r.reviewedAt,
          deliveryStatus: r.deliveryStatus
        }))
      });

    } catch (error: any) {
      console.error('Get requests error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch requests' },
        { status: 500 }
      );
    }
  });
}