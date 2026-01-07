import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { connectDB } from '@/lib/db/mongodb';
import Shelter from '@/lib/db/models/Shelter';
import { errorTracker, createErrorResponse } from '@/lib/error-tracker';

interface BulkShelterData {
    name: string;
    location: {
        province: string;
        district: string;
        subdistrict?: string;
        address?: string;
    };
    capacity: number;
    status?: string;
}

// Helper function to generate shelter code
async function generateShelterCode(startingNumber?: number): Promise<string> {
    if (startingNumber) {
        return `SH-${startingNumber.toString().padStart(3, '0')}`;
    }

    const lastShelter = await Shelter.findOne({}).sort({ code: -1 }).select('code').lean();

    if (!lastShelter || !lastShelter.code) {
        return 'SH-001';
    }

    // Extract number from code like "SH-001"
    const match = lastShelter.code.match(/SH-(\d+)/);
    if (match) {
        const nextNumber = parseInt(match[1], 10) + 1;
        return `SH-${nextNumber.toString().padStart(3, '0')}`;
    }

    // Fallback: count existing shelters
    const count = await Shelter.countDocuments();
    return `SH-${(count + 1).toString().padStart(3, '0')}`;
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

        const { shelters } = await request.json() as { shelters: BulkShelterData[] };

        if (!Array.isArray(shelters) || shelters.length === 0) {
            return NextResponse.json(
                { error: 'ต้องมีข้อมูลศูนย์พักพิงอย่างน้อย 1 รายการ' },
                { status: 400 }
            );
        }

        await connectDB();

        // Get starting code number
        const lastShelter = await Shelter.findOne({}).sort({ code: -1 }).select('code').lean();
        let nextNumber = 1;
        if (lastShelter?.code) {
            const match = lastShelter.code.match(/SH-(\d+)/);
            if (match) {
                nextNumber = parseInt(match[1], 10) + 1;
            }
        }

        let successCount = 0;
        let errorCount = 0;
        const errors: { index: number; name: string; error: string }[] = [];

        // Process in batches of 50
        const BATCH_SIZE = 50;
        for (let i = 0; i < shelters.length; i += BATCH_SIZE) {
            const batch = shelters.slice(i, i + BATCH_SIZE);

            const sheltersToInsert = [];

            for (let j = 0; j < batch.length; j++) {
                const item = batch[j];
                const globalIndex = i + j;

                try {
                    // Validate required fields
                    if (!item.name || !item.location?.district) {
                        errors.push({
                            index: globalIndex,
                            name: item.name || `รายการ ${globalIndex + 1}`,
                            error: 'ข้อมูลไม่ครบถ้วน (ต้องมีชื่อและอำเภอ)'
                        });
                        errorCount++;
                        continue;
                    }

                    // Check for duplicate name in database
                    const existingShelter = await Shelter.findOne({ name: item.name });
                    if (existingShelter) {
                        errors.push({
                            index: globalIndex,
                            name: item.name,
                            error: 'ชื่อศูนย์พักพิงนี้มีอยู่แล้ว'
                        });
                        errorCount++;
                        continue;
                    }

                    const code = await generateShelterCode(nextNumber);
                    nextNumber++;

                    sheltersToInsert.push({
                        name: item.name,
                        code,
                        location: {
                            province: item.location.province || 'ศรีสะเกษ',
                            district: item.location.district,
                            subdistrict: item.location.subdistrict || '',
                            address: item.location.address || ''
                        },
                        capacity: Number(item.capacity) || 100,
                        currentOccupancy: 0,
                        status: item.status || 'active'
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
            if (sheltersToInsert.length > 0) {
                try {
                    const result = await Shelter.insertMany(sheltersToInsert, { ordered: false });
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
                                name: sheltersToInsert[writeError.index]?.name || 'Unknown',
                                error: writeError.errmsg || 'Bulk insert error'
                            });
                        }
                    }
                }
            }
        }

        errorTracker.logInfo('Bulk shelter import completed', {
            totalItems: shelters.length,
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
        errorTracker.logError(error, { endpoint: '/api/admin/shelters/bulk', method: 'POST' });
        return NextResponse.json(
            createErrorResponse(error, 'ไม่สามารถนำเข้าข้อมูลได้'),
            { status: 500 }
        );
    }
}
