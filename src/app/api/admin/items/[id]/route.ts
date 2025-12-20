import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { connectDB } from '@/lib/db/mongodb';
import StockItem from '@/lib/db/models/StockItem';
import { itemUpdateSchema } from '@/lib/validations';
import { errorTracker, createErrorResponse, formatValidationErrors } from '@/lib/error-tracker';
import { ZodError } from 'zod';

interface RouteParams {
    params: {
        id: string;
    };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();

        const item = await StockItem.findById(params.id).lean();

        if (!item) {
            return NextResponse.json({ error: 'ไม่พบรายการสินค้า' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            item
        });
    } catch (error) {
        errorTracker.logError(error, { endpoint: `/api/admin/items/${params.id}`, method: 'GET' });
        return NextResponse.json(
            createErrorResponse(error, 'ไม่สามารถโหลดข้อมูลสินค้าได้'),
            { status: 500 }
        );
    }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decoded = verifyToken(token);
        if (!decoded || decoded.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();

        // Validate input
        const validatedData = itemUpdateSchema.parse(body);

        await connectDB();

        const item = await StockItem.findByIdAndUpdate(
            params.id,
            { $set: validatedData },
            { new: true, runValidators: true }
        );

        if (!item) {
            return NextResponse.json({ error: 'ไม่พบรายการสินค้า' }, { status: 404 });
        }

        errorTracker.logInfo('Item updated successfully', {
            itemId: item._id,
            userId: decoded.userId
        });

        return NextResponse.json({
            success: true,
            item,
            message: 'อัพเดทรายการสินค้าสำเร็จ'
        });
    } catch (error) {
        if (error instanceof ZodError) {
            return NextResponse.json(
                { error: 'ข้อมูลไม่ถูกต้อง', details: formatValidationErrors(error.issues) },
                { status: 400 }
            );
        }

        errorTracker.logError(error, { endpoint: `/api/admin/items/${params.id}`, method: 'PATCH' });
        return NextResponse.json(
            createErrorResponse(error, 'ไม่สามารถอัพเดทรายการสินค้าได้'),
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decoded = verifyToken(token);
        if (!decoded || decoded.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();

        // TODO: Check if item has any stock before deleting
        // const hasStock = await Stock.exists({ itemId: params.id });
        // if (hasStock) {
        //   return NextResponse.json(
        //     { error: 'ไม่สามารถลบสินค้าที่มีสต๊อกอยู่ได้' },
        //     { status: 400 }
        //   );
        // }

        const item = await StockItem.findByIdAndDelete(params.id);

        if (!item) {
            return NextResponse.json({ error: 'ไม่พบรายการสินค้า' }, { status: 404 });
        }

        errorTracker.logInfo('Item deleted successfully', {
            itemId: params.id,
            name: item.name,
            userId: decoded.userId
        });

        return NextResponse.json({
            success: true,
            message: 'ลบรายการสินค้าสำเร็จ'
        });
    } catch (error) {
        errorTracker.logError(error, { endpoint: `/api/admin/items/${params.id}`, method: 'DELETE' });
        return NextResponse.json(
            createErrorResponse(error, 'ไม่สามารถลบรายการสินค้าได้'),
            { status: 500 }
        );
    }
}
