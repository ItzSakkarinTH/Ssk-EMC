import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { connectDB } from '@/lib/db/mongodb';
import Shelter from '@/lib/db/models/Shelter';
import User from '@/lib/db/models/User';
import Stock from '@/lib/db/models/Stock';
import { shelterSchema } from '@/lib/validations';
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

        // Find all staff users assigned to shelters
        const staffUsers = await User.find({ role: 'staff' }).select('_id username name email assignedShelterId').lean();

        // Get all shelters
        const sheltersRaw = await Shelter.find({}).sort({ createdAt: -1 }).lean();

        // Get all stock items
        const allStock = await Stock.find({}).lean();

        // Map staff and stock count to their shelters
        const shelters = sheltersRaw.map(shelter => {
            const assignedStaff = staffUsers.filter(
                staff => staff.assignedShelterId?.toString() === shelter._id.toString()
            );

            // Count distinct stock items for this shelter
            const stockItemsCount = allStock.filter(stock =>
                stock.shelterStock?.some((s: { shelterId: { toString: () => string }; quantity: number }) =>
                    s.shelterId?.toString() === shelter._id.toString() && s.quantity > 0
                )
            ).length;

            return {
                ...shelter,
                currentOccupancy: stockItemsCount, // จำนวนสินค้าจริงที่มี
                assignedStaff: assignedStaff.map(staff => ({
                    _id: staff._id,
                    username: staff.username,
                    name: staff.name || staff.username,
                    email: staff.email
                }))
            };
        });

        errorTracker.logInfo('Shelters fetched successfully', {
            count: shelters.length,
            userId: decoded.userId
        });

        return NextResponse.json({
            success: true,
            shelters
        });
    } catch (error) {
        errorTracker.logError(error, { endpoint: '/api/admin/shelters', method: 'GET' });
        return NextResponse.json(
            createErrorResponse(error, 'ไม่สามารถโหลดข้อมูลศูนย์พักพิงได้'),
            { status: 500 }
        );
    }
}

// Helper function to generate shelter code
async function generateShelterCode(): Promise<string> {
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

        const body = await request.json();
        const { assignedStaffId, code: providedCode, ...shelterData } = body;

        await connectDB();

        // Generate code automatically if not provided
        let shelterCode = providedCode;
        if (!shelterCode || shelterCode.trim() === '') {
            shelterCode = await generateShelterCode();
        } else {
            // Check if provided code already exists
            const existingShelter = await Shelter.findOne({ code: shelterCode });
            if (existingShelter) {
                return NextResponse.json(
                    { error: 'รหัสศูนย์พักพิงนี้มีอยู่ในระบบแล้ว' },
                    { status: 400 }
                );
            }
        }

        // Validate input (without code since we handle it separately)
        const dataToValidate = { ...shelterData, code: shelterCode };
        const validatedData = shelterSchema.parse(dataToValidate);

        // Create new shelter
        const shelter = await Shelter.create({
            ...validatedData,
            currentOccupancy: 0,
            status: 'active'
        });

        // Assign staff if provided
        if (assignedStaffId) {
            await User.findByIdAndUpdate(assignedStaffId, {
                assignedShelterId: shelter._id
            });
        }

        errorTracker.logInfo('Shelter created successfully', {
            shelterId: shelter._id,
            code: shelter.code,
            assignedStaffId: assignedStaffId || null,
            userId: decoded.userId
        });

        return NextResponse.json({
            success: true,
            shelter,
            message: 'สร้างศูนย์พักพิงสำเร็จ'
        }, { status: 201 });
    } catch (error) {
        if (error instanceof ZodError) {
            return NextResponse.json(
                { error: 'ข้อมูลไม่ถูกต้อง', details: formatValidationErrors(error.issues) },
                { status: 400 }
            );
        }

        errorTracker.logError(error, { endpoint: '/api/admin/shelters', method: 'POST' });
        return NextResponse.json(
            createErrorResponse(error, 'ไม่สามารถสร้างศูนย์พักพิงได้'),
            { status: 500 }
        );
    }
}
