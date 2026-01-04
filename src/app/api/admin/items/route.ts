import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { connectDB } from '@/lib/db/mongodb';
import StockItem from '@/lib/db/models/StockItem';
import { itemSchema } from '@/lib/validations';
import { errorTracker, createErrorResponse, formatValidationErrors } from '@/lib/error-tracker';
import { ZodError } from 'zod';

export async function GET(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decoded = await verifyToken(token);
        if (!decoded || decoded.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();

        const items = await StockItem.find({}).sort({ category: 1, name: 1 }).lean();

        errorTracker.logInfo('Items fetched successfully', {
            count: items.length,
            userId: decoded.userId
        });

        return NextResponse.json({
            success: true,
            items
        });
    } catch (error) {
        errorTracker.logError(error, { endpoint: '/api/admin/items', method: 'GET' });
        return NextResponse.json(
            createErrorResponse(error, 'ไม่สามารถโหลดข้อมูลสินค้าได้'),
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
        if (!decoded || decoded.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();

        // Validate input
        const validatedData = itemSchema.parse(body);

        await connectDB();

        // Check if item with same name already exists
        const existingItem = await StockItem.findOne({
            name: validatedData.name,
            category: validatedData.category
        });

        if (existingItem) {
            return NextResponse.json(
                { error: 'สินค้านี้มีอยู่ในระบบแล้ว' },
                { status: 400 }
            );
        }

        // Create new item - transform null maxStock to undefined for Mongoose compatibility
        const itemData = {
            ...validatedData,
            maxStock: validatedData.maxStock ?? undefined
        };
        const item = await StockItem.create(itemData);

        errorTracker.logInfo('Item created successfully', {
            itemId: item._id,
            name: item.name,
            userId: decoded.userId
        });

        return NextResponse.json({
            success: true,
            item,
            message: 'สร้างรายการสินค้าสำเร็จ'
        }, { status: 201 });
    } catch (error) {
        if (error instanceof ZodError) {
            return NextResponse.json(
                { error: 'ข้อมูลไม่ถูกต้อง', details: formatValidationErrors(error.issues) },
                { status: 400 }
            );
        }

        errorTracker.logError(error, { endpoint: '/api/admin/items', method: 'POST' });
        return NextResponse.json(
            createErrorResponse(error, 'ไม่สามารถสร้างรายการสินค้าได้'),
            { status: 500 }
        );
    }
}
