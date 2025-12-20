import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { connectDB } from '@/lib/db/mongodb';
import StockRequest from '@/lib/db/models/StockRequest';
import Stock from '@/lib/db/models/Stock';
import StockMovement from '@/lib/db/models/StockMovement';
import { errorTracker, createErrorResponse } from '@/lib/error-tracker';
import mongoose from 'mongoose';

interface RouteParams {
    params: Promise<{
        id: string;
    }>;
}

export async function GET(request: NextRequest, context: RouteParams) {
    const { id } = await context.params;
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decoded = await verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();

        const stockRequest = await StockRequest.findById(id)
            .populate('shelterId', 'name code')
            .populate('requestedBy', 'username')
            .populate('reviewedBy', 'username')
            .populate('items.stockItemId', 'name unit')
            .lean();

        if (!stockRequest) {
            return NextResponse.json({ error: 'ไม่พบคำร้องขอสินค้า' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            request: stockRequest
        });
    } catch (error) {
        errorTracker.logError(error, { endpoint: `/api/stock/admin/requests/${id}`, method: 'GET' });
        return NextResponse.json(
            createErrorResponse(error, 'ไม่สามารถโหลดข้อมูลคำร้องได้'),
            { status: 500 }
        );
    }
}

export async function PATCH(request: NextRequest, context: RouteParams) {
    const { id } = await context.params;
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decoded = await verifyToken(token);
        if (!decoded || decoded.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
        }

        const body = await request.json();
        const { action, items, notes } = body; // action: 'approve' | 'reject'

        if (!action || !['approve', 'reject'].includes(action)) {
            return NextResponse.json(
                { error: 'กรุณาระบุ action (approve หรือ reject)' },
                { status: 400 }
            );
        }

        await connectDB();

        const stockRequest = await StockRequest.findById(id)
            .populate('shelterId')
            .populate('items.stockItemId');

        if (!stockRequest) {
            return NextResponse.json({ error: 'ไม่พบคำร้องขอสินค้า' }, { status: 404 });
        }

        if (stockRequest.status !== 'pending') {
            return NextResponse.json(
                { error: 'คำร้องนี้ได้รับการพิจารณาแล้ว' },
                { status: 400 }
            );
        }

        if (action === 'reject') {
            // Reject request
            stockRequest.status = 'rejected';
            stockRequest.reviewedBy = decoded.userId as unknown as mongoose.Types.ObjectId;
            stockRequest.reviewedAt = new Date();
            stockRequest.reviewNotes = notes || 'ปฏิเสธคำร้อง';
            await stockRequest.save();

            errorTracker.logInfo('Stock request rejected', {
                requestId: id,
                userId: decoded.userId
            });

            return NextResponse.json({
                success: true,
                request: stockRequest,
                message: 'ปฏิเสธคำร้องสำเร็จ'
            });
        }

        // Approve request
        if (!items || !Array.isArray(items)) {
            return NextResponse.json(
                { error: 'กรุณาระบุจำนวนที่อนุมัติสำหรับแต่ละรายการ' },
                { status: 400 }
            );
        }

        let allApproved = true;
        const movements = [];

        // Process each item
        for (const approvalItem of items) {
            const requestItem = stockRequest.items.find(
                (item: { stockItemId: { _id: { toString: () => string } } }) =>
                    item.stockItemId._id.toString() === approvalItem.stockItemId
            );

            if (!requestItem) continue;

            const approvedQty = approvalItem.approvedQuantity || 0;
            requestItem.approvedQuantity = approvedQty;

            if (approvedQty < requestItem.requestedQuantity) {
                allApproved = false;
            }

            if (approvedQty > 0) {
                // Transfer stock from provincial to shelter
                const provincialStock = await Stock.findOne({
                    itemId: requestItem.stockItemId._id,
                    shelterId: null // Provincial stock
                });

                if (!provincialStock || provincialStock.currentQuantity < approvedQty) {
                    return NextResponse.json(
                        { error: `สต๊อกจังหวัดไม่เพียงพอสำหรับ ${requestItem.stockItemId.name}` },
                        { status: 400 }
                    );
                }

                // Update provincial stock
                const beforeProvincial = provincialStock.currentQuantity;
                provincialStock.currentQuantity -= approvedQty;
                await provincialStock.save();

                // Update shelter stock
                let shelterStock = await Stock.findOne({
                    itemId: requestItem.stockItemId._id,
                    shelterId: stockRequest.shelterId._id
                });

                if (shelterStock) {
                    shelterStock.currentQuantity += approvedQty;
                    await shelterStock.save();
                } else {
                    shelterStock = await Stock.create({
                        itemId: requestItem.stockItemId._id,
                        shelterId: stockRequest.shelterId._id,
                        currentQuantity: approvedQty,
                        unit: requestItem.stockItemId.unit,
                        minThreshold: 10,
                        maxCapacity: 1000
                    });
                }

                // Create movement log
                const movement = await StockMovement.create({
                    stockId: provincialStock._id,
                    movementType: 'transfer',
                    quantity: approvedQty,
                    unit: requestItem.stockItemId.unit,
                    from: {
                        type: 'provincial',
                        id: null,
                        name: 'กองกลางจังหวัด'
                    },
                    to: {
                        type: 'shelter',
                        id: stockRequest.shelterId._id,
                        name: stockRequest.shelterId.name
                    },
                    performedBy: decoded.userId,
                    notes: `อนุมัติคำร้อง #${stockRequest._id}`,
                    referenceId: `REQ-${stockRequest._id}`,
                    snapshot: {
                        before: beforeProvincial,
                        after: provincialStock.currentQuantity
                    }
                });

                movements.push(movement);
            }
        }

        // Update request status
        stockRequest.status = allApproved ? 'approved' : 'partially_approved';
        stockRequest.reviewedBy = decoded.userId as unknown as mongoose.Types.ObjectId;
        stockRequest.reviewedAt = new Date();
        stockRequest.reviewNotes = notes || 'อนุมัติคำร้อง';
        await stockRequest.save();

        errorTracker.logInfo('Stock request approved', {
            requestId: id,
            status: stockRequest.status,
            movementCount: movements.length,
            userId: decoded.userId
        });

        return NextResponse.json({
            success: true,
            request: stockRequest,
            movements,
            message: allApproved ? 'อนุมัติคำร้องสำเร็จ' : 'อนุมัติคำร้องบางส่วนสำเร็จ'
        });
    } catch (error) {
        errorTracker.logError(error, { endpoint: `/api/stock/admin/requests/${id}`, method: 'PATCH' });
        return NextResponse.json(
            createErrorResponse(error, 'ไม่สามารถพิจารณาคำร้องได้'),
            { status: 500 }
        );
    }
}
