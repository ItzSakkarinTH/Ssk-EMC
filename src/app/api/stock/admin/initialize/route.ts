import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { connectDB } from '@/lib/db/mongodb';
import Stock from '@/lib/db/models/Stock';
import StockMovement from '@/lib/db/models/StockMovement';
import { errorTracker, createErrorResponse } from '@/lib/error-tracker';
import { generateReferenceId } from '@/lib/utils/ref-id';
import { z } from 'zod';

const initializeSchema = z.object({
    itemName: z.string().min(1, 'กรุณาระบุชื่อสินค้า'),
    category: z.string().min(1, 'กรุณาระบุหมวดหมู่'),
    unit: z.string().min(1, 'กรุณาระบุหน่วย'),
    initialQuantity: z.number().min(0, 'จำนวนต้องไม่เป็นลบ'),
    supplier: z.string().optional(),
    notes: z.string().optional(),
    receivedDate: z.string().optional(), // วันเวลาที่รับ
    minStockLevel: z.number().positive('สต็อกต่ำสุดต้องมากกว่า 0'),
    criticalLevel: z.number().positive('ระดับวิกฤติต้องมากกว่า 0')
});

export async function POST(request: NextRequest) {
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
        const validatedData = initializeSchema.parse(body);

        await connectDB();

        // Check if stock already exists
        const existingStock = await Stock.findOne({ itemName: validatedData.itemName });
        if (existingStock) {
            return NextResponse.json(
                { error: 'สินค้านี้มีอยู่ในระบบสต็อกแล้ว' },
                { status: 400 }
            );
        }

        // Map Thai category to English enum
        const categoryMap: Record<string, 'food' | 'medicine' | 'clothing' | 'other'> = {
            'อาหาร': 'food',
            'เครื่องดื่ม': 'food',
            'ยา': 'medicine',
            'เวชภัณฑ์': 'medicine',
            'เสื้อผ้า': 'clothing',
            'ผ้าห่ม': 'clothing',
            'อุปกรณ์อาบน้ำ': 'other',
            'อุปกรณ์ทำความสะอาด': 'other',
            'อื่นๆ': 'other'
        };

        const categoryEnum = categoryMap[validatedData.category] || 'other';

        // Create stock record
        const stock = await Stock.create({
            itemName: validatedData.itemName,
            category: categoryEnum,
            unit: validatedData.unit,
            provincialStock: validatedData.initialQuantity,
            shelterStock: [],
            totalQuantity: validatedData.initialQuantity,
            totalReceived: validatedData.initialQuantity,
            totalDispensed: 0,
            minStockLevel: validatedData.minStockLevel,
            criticalLevel: validatedData.criticalLevel,
            metadata: {
                createdAt: new Date(),
                updatedAt: new Date(),
                createdBy: decoded.userId
            }
        });

        // If initialQuantity > 0, create movement record
        if (validatedData.initialQuantity > 0) {
            const receivedAt = validatedData.receivedDate
                ? new Date(validatedData.receivedDate)
                : new Date();

            await StockMovement.create({
                stockId: stock._id,
                movementType: 'receive',
                quantity: validatedData.initialQuantity,
                unit: validatedData.unit,
                from: {
                    type: 'external',
                    id: null,
                    name: validatedData.supplier || 'Initial Stock'
                },
                to: {
                    type: 'provincial',
                    id: null,
                    name: 'กองกลาง'
                },
                performedBy: decoded.userId,
                performedAt: receivedAt,
                notes: validatedData.notes || 'การสร้างรายการสต็อกครั้งแรก',
                referenceId: generateReferenceId('INIT'),
                snapshot: {
                    before: 0,
                    after: validatedData.initialQuantity
                }
            });
        }

        errorTracker.logInfo('Stock initialized successfully', {
            stockId: stock._id,
            itemName: stock.itemName,
            initialQuantity: validatedData.initialQuantity,
            userId: decoded.userId
        });

        return NextResponse.json({
            success: true,
            message: 'เพิ่มสินค้าเข้าระบบสต็อกสำเร็จ',
            stock: {
                _id: stock._id,
                itemName: stock.itemName,
                category: stock.category,
                provincialStock: stock.provincialStock,
                totalQuantity: stock.totalQuantity
            }
        }, { status: 201 });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'ข้อมูลไม่ถูกต้อง', details: error.issues },
                { status: 400 }
            );
        }

        errorTracker.logError(error, { endpoint: '/api/stock/admin/initialize', method: 'POST' });
        return NextResponse.json(
            createErrorResponse(error, 'ไม่สามารถเพิ่มสินค้าเข้าระบบสต็อกได้'),
            { status: 500 }
        );
    }
}
