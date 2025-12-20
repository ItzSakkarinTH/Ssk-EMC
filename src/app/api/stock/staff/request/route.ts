
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import { withStaffAuth } from '@/lib/auth/rbac';
import StockRequest, { IStockRequest, IRequestItem } from '@/lib/db/models/StockRequest';
import Stock from '@/lib/db/models/Stock';
import { Types } from 'mongoose';

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
      type EnrichedItem = IRequestItem & { warning?: string };
      const enrichedItems: EnrichedItem[] = await Promise.all(
        items.map(async (item: { stockId: string; quantity: number; reason: string }) => {
          const stock = await Stock.findById(item.stockId);
          if (!stock) {
            throw new Error(`Stock ${item.stockId} not found`);
          }

          const baseItem = {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            stockId: new Types.ObjectId(item.stockId) as any,
            itemName: stock.itemName,
            requestedQuantity: item.quantity,
            unit: stock.unit,
            reason: item.reason
          };

          if (stock.provincialStock < item.quantity) {
            return {
              ...baseItem,
              warning: `Provincial stock insufficient (available: ${stock.provincialStock})`
            };
          }

          return baseItem;
        })
      );

      // สร้างคำร้อง
      const requestItems = enrichedItems.map((item) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { warning: _, ...cleanItem } = item;
        return cleanItem as IRequestItem;
      });
      const request = await StockRequest.createRequest({
        shelterId: user.assignedShelterId as string,
        requestedBy: user.userId,
        items: requestItems
      });

      // ตรวจสอบว่ามี warning หรือไม่
      const warnings = enrichedItems
        .filter((item) => item.warning)
        .map((item) => `${item.itemName}: ${item.warning}`);

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

    } catch (error: unknown) {
      const err = error as Error;
      console.error('Create request error:', err);

      if (err.message?.includes('not found')) {
        return NextResponse.json(
          { error: err.message },
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

      const shelterId = user.assignedShelterId as string;
      const searchParams = req.nextUrl.searchParams;
      const status = searchParams.get('status');

      const query: { shelterId: string; status?: string } = { shelterId };
      if (status && ['pending', 'approved', 'rejected', 'partial'].includes(status)) {
        query.status = status;
      }

      const requests = await StockRequest.find(query)
        .sort({ requestedAt: -1 })
        .limit(50)
        .populate('requestedBy', 'name')
        .populate('reviewedBy', 'name');

      return NextResponse.json({
        requests: requests.map((r: IStockRequest) => ({
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

    } catch (error: unknown) {
      const err = error as Error;
      console.error('Get requests error:', err);
      return NextResponse.json(
        { error: 'Failed to fetch requests' },
        { status: 500 }
      );
    }
  });
}