// src/app/api/stock/admin/requests/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import { withAdminAuth } from '@/lib/auth/rbac';
import StockRequest from '@/lib/db/models/StockRequest';

export async function GET(req: NextRequest) {
  return withAdminAuth(req, async (req, user) => {
    try {
      await dbConnect();

      const searchParams = req.nextUrl.searchParams;
      const status = searchParams.get('status');
      const shelterId = searchParams.get('shelterId');
      const limit = parseInt(searchParams.get('limit') || '50');
      const skip = parseInt(searchParams.get('skip') || '0');

      // สร้าง query
      const query: any = {};

      if (status && ['pending', 'approved', 'rejected', 'partial'].includes(status)) {
        query.status = status;
      }

      if (shelterId) {
        query.shelterId = shelterId;
      }

      // ดึงคำร้อง
      const requests = await StockRequest.find(query)
        .sort({ requestedAt: -1 })
        .limit(limit)
        .skip(skip)
        .populate('shelterId', 'name code location')
        .populate('requestedBy', 'name email')
        .populate('reviewedBy', 'name');

      const total = await StockRequest.countDocuments(query);

      // สรุปตามสถานะ
      const statusSummary = await StockRequest.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const summary = {
        pending: 0,
        approved: 0,
        rejected: 0,
        partial: 0
      };

      statusSummary.forEach(s => {
        summary[s._id as keyof typeof summary] = s.count;
      });

      return NextResponse.json({
        requests: requests.map(r => ({
          id: r._id,
          requestNumber: r.requestNumber,
          shelter: r.shelterId,
          requestedBy: r.requestedBy,
          requestedAt: r.requestedAt,
          status: r.status,
          itemCount: r.items.length,
          totalQuantity: r.items.reduce((sum, i) => sum + i.requestedQuantity, 0),
          reviewedBy: r.reviewedBy,
          reviewedAt: r.reviewedAt,
          deliveryStatus: r.deliveryStatus,
          urgency: r.items.some(i => i.reason?.toLowerCase().includes('urgent')) 
            ? 'high' 
            : 'normal'
        })),
        pagination: {
          total,
          limit,
          skip,
          hasMore: skip + limit < total
        },
        summary
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