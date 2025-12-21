import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { connectDB } from '@/lib/db/mongodb';
import Shelter from '@/lib/db/models/Shelter';
import User from '@/lib/db/models/User';
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

        // Map staff to their shelters
        const shelters = sheltersRaw.map(shelter => {
            const assignedStaff = staffUsers.filter(
                staff => staff.assignedShelterId?.toString() === shelter._id.toString()
            );

            return {
                ...shelter,
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
        const { assignedStaffId, ...shelterData } = body;

        // Validate input
        const validatedData = shelterSchema.parse(shelterData);

        await connectDB();

        // Check if code already exists
        const existingShelter = await Shelter.findOne({ code: validatedData.code });
        if (existingShelter) {
            return NextResponse.json(
                { error: 'รหัสศูนย์พักพิงนี้มีอยู่ในระบบแล้ว' },
                { status: 400 }
            );
        }

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
