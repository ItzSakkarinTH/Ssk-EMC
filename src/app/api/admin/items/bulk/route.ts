import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { connectDB } from '@/lib/db/mongodb';
import StockItem from '@/lib/db/models/StockItem';
import { errorTracker, createErrorResponse } from '@/lib/error-tracker';

interface BulkItemData {
    name: string;
    category: string;
    unit: string;
    minStock?: number;
    maxStock?: number;
    description?: string;
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

        const { items } = await request.json() as { items: BulkItemData[] };

        if (!Array.isArray(items) || items.length === 0) {
            return NextResponse.json(
                { error: 'ต้องมีข้อมูลสินค้าอย่างน้อย 1 รายการ' },
                { status: 400 }
            );
        }

        await connectDB();

        let successCount = 0;
        let errorCount = 0;
        const errors: { index: number; name: string; error: string }[] = [];

        // Process in batches of 50
        const BATCH_SIZE = 50;
        for (let i = 0; i < items.length; i += BATCH_SIZE) {
            const batch = items.slice(i, i + BATCH_SIZE);

            const itemsToInsert = [];

            for (let j = 0; j < batch.length; j++) {
                const item = batch[j];
                const globalIndex = i + j;

                try {
                    // Validate required fields
                    if (!item.name || !item.category || !item.unit) {
                        errors.push({
                            index: globalIndex,
                            name: item.name || `รายการ ${globalIndex + 1}`,
                            error: 'ข้อมูลไม่ครบถ้วน (ต้องมีชื่อ, หมวดหมู่ และหน่วย)'
                        });
                        errorCount++;
                        continue;
                    }

                    // Check for duplicate name + category in database
                    const existingItem = await StockItem.findOne({
                        name: item.name,
                        category: item.category
                    });
                    if (existingItem) {
                        errors.push({
                            index: globalIndex,
                            name: item.name,
                            error: 'สินค้านี้มีอยู่ในหมวดหมู่นี้แล้ว'
                        });
                        errorCount++;
                        continue;
                    }

                    itemsToInsert.push({
                        name: item.name,
                        category: item.category,
                        unit: item.unit,
                        minStock: Number(item.minStock) || 0,
                        maxStock: item.maxStock ? Number(item.maxStock) : undefined,
                        description: item.description || ''
                    });
                } catch (err) {
                    errors.push({
                        index: globalIndex,
                        name: item.name || `รายการ ${globalIndex + 1}`,
                        error: err instanceof Error ? err.message : 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ'
                    });
                    errorCount++;
                }
            }

            // Bulk insert the batch
            if (itemsToInsert.length > 0) {
                try {
                    const result = await StockItem.insertMany(itemsToInsert, { ordered: false });
                    successCount += result.length;
                } catch (bulkError) {
                    // Handle partial failures in bulk insert
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const mongoError = bulkError as any;
                    if (mongoError.insertedDocs) {
                        successCount += mongoError.insertedDocs.length;
                    }
                    if (mongoError.writeErrors) {
                        errorCount += mongoError.writeErrors.length;
                        for (const writeError of mongoError.writeErrors) {
                            errors.push({
                                index: i + writeError.index,
                                name: itemsToInsert[writeError.index]?.name || 'Unknown',
                                error: writeError.errmsg || 'Bulk insert error'
                            });
                        }
                    }
                }
            }
        }

        errorTracker.logInfo('Bulk item import completed', {
            totalItems: items.length,
            successCount,
            errorCount,
            userId: decoded.userId
        });

        return NextResponse.json({
            success: true,
            message: `นำเข้าสำเร็จ ${successCount} รายการ${errorCount > 0 ? `, ล้มเหลว ${errorCount} รายการ` : ''}`,
            successCount,
            errorCount,
            errors: errors.slice(0, 10) // Return first 10 errors only
        });
    } catch (error) {
        errorTracker.logError(error, { endpoint: '/api/admin/items/bulk', method: 'POST' });
        return NextResponse.json(
            createErrorResponse(error, 'ไม่สามารถนำเข้าข้อมูลได้'),
            { status: 500 }
        );
    }
}
