import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { connectDB } from '@/lib/db/mongodb';
import Shelter from '@/lib/db/models/Shelter';
import { shelterUpdateSchema } from '@/lib/validations';
import { errorTracker, createErrorResponse, formatValidationErrors } from '@/lib/error-tracker';
import { ZodError } from 'zod';

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

        const shelter = await Shelter.findById(id).lean();

        if (!shelter) {
            return NextResponse.json({ error: 'ไม่พบศูนย์พักพิง' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            shelter
        });
    } catch (error) {
        errorTracker.logError(error, { endpoint: `/api/admin/shelters/${id}`, method: 'GET' });
        return NextResponse.json(
            createErrorResponse(error, 'ไม่สามารถโหลดข้อมูลศูนย์พักพิงได้'),
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
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();

        // Validate input
        const validatedData = shelterUpdateSchema.parse(body);

        await connectDB();

        // Check if code is being changed and if it already exists
        if (validatedData.code) {
            const existingShelter = await Shelter.findOne({
                code: validatedData.code,
                _id: { $ne: id }
            });
            if (existingShelter) {
                return NextResponse.json(
                    { error: 'รหัสศูนย์พักพิงนี้มีอยู่ในระบบแล้ว' },
                    { status: 400 }
                );
            }
        }

        const shelter = await Shelter.findByIdAndUpdate(
            id,
            { $set: validatedData },
            { new: true, runValidators: true }
        );

        if (!shelter) {
            return NextResponse.json({ error: 'ไม่พบศูนย์พักพิง' }, { status: 404 });
        }

        errorTracker.logInfo('Shelter updated successfully', {
            shelterId: shelter._id,
            userId: decoded.userId
        });

        return NextResponse.json({
            success: true,
            shelter,
            message: 'อัพเดทศูนย์พักพิงสำเร็จ'
        });
    } catch (error) {
        if (error instanceof ZodError) {
            return NextResponse.json(
                { error: 'ข้อมูลไม่ถูกต้อง', details: formatValidationErrors(error.issues) },
                { status: 400 }
            );
        }

        errorTracker.logError(error, { endpoint: `/api/admin/shelters/${id}`, method: 'PATCH' });
        return NextResponse.json(
            createErrorResponse(error, 'ไม่สามารถอัพเดทศูนย์พักพิงได้'),
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest, context: RouteParams) {
    const { id } = await context.params;
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

        // TODO: Check if shelter has any stock or users before deleting
        // const hasStock = await Stock.exists({ shelterId: params.id });
        // if (hasStock) {
        //   return NextResponse.json(
        //     { error: 'ไม่สามารถลบศูนย์พักพิงที่มีสต๊อกอยู่ได้' },
        //     { status: 400 }
        //   );
        // }

        const shelter = await Shelter.findByIdAndDelete(id);

        if (!shelter) {
            return NextResponse.json({ error: 'ไม่พบศูนย์พักพิง' }, { status: 404 });
        }

        errorTracker.logInfo('Shelter deleted successfully', {
            shelterId: id,
            code: shelter.code,
            userId: decoded.userId
        });

        return NextResponse.json({
            success: true,
            message: 'ลบศูนย์พักพิงสำเร็จ'
        });
    } catch (error) {
        errorTracker.logError(error, { endpoint: `/api/admin/shelters/${id}`, method: 'DELETE' });
        return NextResponse.json(
            createErrorResponse(error, 'ไม่สามารถลบศูนย์พักพิงได้'),
            { status: 500 }
        );
    }
}
