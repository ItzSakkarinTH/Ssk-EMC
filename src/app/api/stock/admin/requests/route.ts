import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { connectDB } from '@/lib/db/mongodb';
import StockRequest from '@/lib/db/models/StockRequest';
import { stockRequestSchema } from '@/lib/validations';
import { errorTracker, createErrorResponse, formatValidationErrors } from '@/lib/error-tracker';
import { ZodError } from 'zod';
import { Types } from 'mongoose';

interface PopulatedStockRequest {
    _id: Types.ObjectId;
    requestNumber: string;
    shelterId: {
        name: string;
        code: string;
    } | null;
    requestedBy: {
        username: string;
    } | null;
    reviewedBy?: {
        username: string;
    } | null;
    items: Array<{
        stockId: Types.ObjectId;
        requestedQuantity: number;
        itemName: string;
        unit: string;
        reason: string;
    }>;
    status: string;
    createdAt: Date;
    urgency?: string;
}

export async function GET(request: NextRequest) {
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

        // Admin sees all requests, Staff sees only their shelter's requests
        const query = decoded.role === 'admin'
            ? {}
            : { requestedBy: decoded.userId };

        const requests = await StockRequest.find(query)
            .populate('shelterId', 'name code')
            .populate('requestedBy', 'username')
            .populate('reviewedBy', 'username')
            .populate('items.stockId', 'itemName unit')
            .sort({ createdAt: -1 })
            .lean() as unknown as PopulatedStockRequest[];

        // Transform to match frontend interface
        const transformedRequests = requests.map((req) => ({
            id: req._id.toString(),
            requestNumber: req.requestNumber,
            shelter: req.shelterId ? {
                name: req.shelterId.name,
                code: req.shelterId.code
            } : { name: 'Unknown', code: '' },
            requestedBy: req.requestedBy ? {
                name: req.requestedBy.username
            } : { name: 'Unknown' },
            requestedAt: req.createdAt,
            status: req.status,
            itemCount: req.items?.length || 0,
            urgency: req.urgency || 'normal'
        }));

        errorTracker.logInfo('Stock requests fetched successfully', {
            count: transformedRequests.length,
            userId: decoded.userId
        });

        return NextResponse.json({
            success: true,
            requests: transformedRequests
        });
    } catch (error) {
        errorTracker.logError(error, { endpoint: '/api/stock/admin/requests', method: 'GET' });
        return NextResponse.json(
            createErrorResponse(error, 'ไม่สามารถโหลดข้อมูลคำร้องได้'),
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decoded = await verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();

        // Validate input
        const validatedData = stockRequestSchema.parse(body);

        await connectDB();

        // Get user's shelter (for staff)
        let shelterId = body.shelterId;
        if (decoded.role === 'staff') {
            // Staff can only create requests for their own shelter
            const User = (await import('@/lib/db/models/User')).default;
            const user = await User.findById(decoded.userId).select('shelter');
            if (!user?.shelter) {
                return NextResponse.json(
                    { error: 'ไม่พบข้อมูลศูนย์พักพิงของคุณ' },
                    { status: 400 }
                );
            }
            shelterId = user.shelter;
        }


        // Create stock request
        // Convert items to have proper ObjectId
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const itemsWithObjectId = validatedData.items.map((item: any) => ({
            stockId: new Types.ObjectId(item.stockId),
            itemName: item.itemName || '',
            requestedQuantity: item.requestedQuantity,
            unit: item.unit || '',
            reason: item.reason || ''
        }));

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const stockRequest: any = await StockRequest.createRequest({
            shelterId,
            requestedBy: decoded.userId,
            items: itemsWithObjectId
        });

        // Populate for response
        await stockRequest.populate([
            { path: 'shelterId', select: 'name code' },
            { path: 'requestedBy', select: 'username' }
        ]);

        errorTracker.logInfo('Stock request created successfully', {
            requestId: stockRequest._id,
            shelterId,
            itemCount: validatedData.items.length,
            userId: decoded.userId
        });

        return NextResponse.json({
            success: true,
            request: stockRequest,
            message: 'สร้างคำร้องขอสินค้าสำเร็จ'
        }, { status: 201 });
    } catch (error) {
        if (error instanceof ZodError) {
            return NextResponse.json(
                { error: 'ข้อมูลไม่ถูกต้อง', details: formatValidationErrors(error.issues) },
                { status: 400 }
            );
        }

        errorTracker.logError(error, { endpoint: '/api/stock/admin/requests', method: 'POST' });
        return NextResponse.json(
            createErrorResponse(error, 'ไม่สามารถสร้างคำร้องขอสินค้าได้'),
            { status: 500 }
        );
    }
}
