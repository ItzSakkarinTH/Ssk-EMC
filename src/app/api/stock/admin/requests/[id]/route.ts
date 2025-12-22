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
            .lean();

        if (!stockRequest) {
            return NextResponse.json({ error: 'ไม่พบคำขอสินค้า' }, { status: 404 });
        }

        return NextResponse.json(stockRequest);
    } catch (error) {
        errorTracker.logError(error, { endpoint: `/api/stock/admin/requests/${id}`, method: 'GET' });
        return NextResponse.json(
            createErrorResponse(error, 'ไม่สามารถโหลดข้อมูลคำขอได้'),
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
        const { status, adminNotes } = body;

        if (!status || !['approved', 'rejected'].includes(status)) {
            return NextResponse.json(
                { error: 'สถานะไม่ถูกต้อง (approved หรือ rejected)' },
                { status: 400 }
            );
        }

        await connectDB();

        const stockRequest = await StockRequest.findById(id).populate('shelterId');

        if (!stockRequest) {
            return NextResponse.json({ error: 'ไม่พบคำขอสินค้า' }, { status: 404 });
        }

        if (stockRequest.status !== 'pending') {
            return NextResponse.json(
                { error: 'คำขอนี้ได้รับการพิจารณาแล้ว' },
                { status: 400 }
            );
        }

        if (status === 'rejected') {
            // Reject request
            stockRequest.status = 'rejected';
            stockRequest.reviewedBy = new mongoose.Types.ObjectId(decoded.userId);
            stockRequest.reviewedAt = new Date();
            stockRequest.adminNotes = adminNotes || 'ปฏิเสธคำขอ';
            await stockRequest.save();

            errorTracker.logInfo('Stock request rejected', {
                requestId: id,
                userId: decoded.userId
            });

            return NextResponse.json({
                success: true,
                message: 'ปฏิเสธคำขอสำเร็จ'
            });
        }

        // Approve request - Transfer stock
        const movements = [];

        for (const item of stockRequest.items) {
            // Find provincial stock (shelterRef = null)
            const provincialStock = await Stock.findOne({
                _id: item.stockId,
                shelterRef: null
            });

            if (!provincialStock) {
                return NextResponse.json(
                    { error: `ไม่พบสต็อกจังหวัดสำหรับ ${item.itemName}` },
                    { status: 404 }
                );
            }

            if (provincialStock.provincialStock < item.requestedQuantity) {
                return NextResponse.json(
                    { error: `สต็อกจังหวัดไม่เพียงพอสำหรับ ${item.itemName} (มีอยู่ ${provincialStock.provincialStock} ${item.unit})` },
                    { status: 400 }
                );
            }

            // Deduct from provincial
            const beforeProvincial = provincialStock.provincialStock;
            provincialStock.provincialStock -= item.requestedQuantity;

            // Add to shelter
            const shelterId = (stockRequest.shelterId as unknown as { _id: mongoose.Types.ObjectId; name: string })._id;
            const shelterStock = provincialStock.shelterStock.find(
                (s: { shelterId: mongoose.Types.ObjectId; quantity: number; lastUpdated: Date }) =>
                    s.shelterId.toString() === shelterId.toString()
            );

            const beforeShelter = shelterStock ? shelterStock.quantity : 0;

            if (shelterStock) {
                shelterStock.quantity += item.requestedQuantity;
                shelterStock.lastUpdated = new Date();
            } else {
                provincialStock.shelterStock.push({
                    shelterId: shelterId,
                    quantity: item.requestedQuantity,
                    lastUpdated: new Date()
                });
            }

            // Save once after all updates
            await provincialStock.save();

            // Create movement log
            const afterShelter = shelterStock ? shelterStock.quantity : item.requestedQuantity;
            const movement = await StockMovement.create({
                stockId: provincialStock._id,
                movementType: 'transfer',
                quantity: item.requestedQuantity,
                unit: item.unit,
                from: {
                    type: 'provincial',
                    name: 'กองกลางจังหวัด'
                },
                to: {
                    type: 'shelter',
                    name: (stockRequest.shelterId as unknown as { name: string }).name
                },
                performedBy: new mongoose.Types.ObjectId(decoded.userId),
                notes: `อนุมัติคำขอ ${stockRequest.requestNumber}${adminNotes ? ': ' + adminNotes : ''}. จังหวัด: ${beforeProvincial} → ${provincialStock.provincialStock}, ศูนย์: ${beforeShelter} → ${afterShelter}`,
                referenceId: stockRequest.requestNumber,
                itemName: item.itemName,
                snapshot: {
                    before: beforeProvincial,
                    after: provincialStock.provincialStock
                }
            });

            movements.push(movement);
        }

        // Update request status
        stockRequest.status = 'approved';
        stockRequest.reviewedBy = new mongoose.Types.ObjectId(decoded.userId);
        stockRequest.reviewedAt = new Date();
        stockRequest.adminNotes = adminNotes || 'อนุมัติคำขอ';
        await stockRequest.save();

        errorTracker.logInfo('Stock request approved', {
            requestId: id,
            movementCount: movements.length,
            userId: decoded.userId
        });

        return NextResponse.json({
            success: true,
            message: 'อนุมัติคำขอและโอนสต็อกสำเร็จ'
        });
    } catch (error) {
        errorTracker.logError(error, { endpoint: `/api/stock/admin/requests/${id}`, method: 'PATCH' });
        return NextResponse.json(
            createErrorResponse(error, 'ไม่สามารถพิจารณาคำขอได้'),
            { status: 500 }
        );
    }
}
