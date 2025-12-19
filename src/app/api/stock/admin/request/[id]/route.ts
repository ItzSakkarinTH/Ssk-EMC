
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import { withAdminAuth } from '@/lib/auth/rbac';
import StockRequest from '@/lib/db/models/StockRequest';
import { StockService } from '@/lib/stock/service';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAdminAuth(req, async (req, user) => {
    try {
      await dbConnect();

      const body = await req.json();
      const { status, approvedItems, adminNotes } = body;

      // Validation
      if (!status || !['approved', 'rejected', 'partial'].includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status' },
          { status: 400 }
        );
      }

      // ดึงคำร้อง
      const request = await StockRequest.findById(params.id);
      if (!request) {
        return NextResponse.json(
          { error: 'Request not found' },
          { status: 404 }
        );
      }

      if (request.status !== 'pending') {
        return NextResponse.json(
          { error: 'Request already processed' },
          { status: 400 }
        );
      }

      // อัปเดตสถานะ
      request.status = status;
      request.reviewedBy = user.userId;
      request.reviewedAt = new Date();
      request.adminNotes = adminNotes || '';

      if (status === 'approved' || status === 'partial') {
        request.approvedItems = approvedItems || request.items.map((item: { stockId: unknown; requestedQuantity: number }) => ({
          stockId: item.stockId,
          approvedQuantity: status === 'approved' ? item.requestedQuantity : 0
        }));

        // โอนของจาก Provincial ไปยังศูนย์
        for (const approvedItem of request.approvedItems) {
          if (approvedItem.approvedQuantity > 0) {
            await StockService.transferStock({
              stockId: approvedItem.stockId.toString(),
              fromShelterId: 'provincial',
              toShelterId: request.shelterId.toString(),
              quantity: approvedItem.approvedQuantity,
              userId: user.userId,
              notes: `Approved request: ${request.requestNumber}`
            });
          }
        }

        request.deliveryStatus = 'in_transit';
      }

      await request.save();

      return NextResponse.json({
        success: true,
        requestId: request._id,
        status: request.status,
        approvalRate: request.getApprovalRate()
      });

    } catch (error: unknown) {
      const err = error as Error;
      console.error('Request approval error:', err);

      if (err.message?.includes('Insufficient')) {
        return NextResponse.json(
          { error: 'Insufficient provincial stock to fulfill request' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to process request' },
        { status: 500 }
      );
    }
  });
}

// GET: ดึงรายละเอียดคำร้อง
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAdminAuth(req, async (req, user) => {
    try {
      await dbConnect();

      const request = await StockRequest.findById(params.id)
        .populate('shelterId', 'name location')
        .populate('requestedBy', 'name email')
        .populate('reviewedBy', 'name');

      if (!request) {
        return NextResponse.json(
          { error: 'Request not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(request);

    } catch (error: unknown) {
      const err = error as Error;
      console.error('Get request error:', err);
      return NextResponse.json(
        { error: 'Failed to fetch request' },
        { status: 500 }
      );
    }
  });
}