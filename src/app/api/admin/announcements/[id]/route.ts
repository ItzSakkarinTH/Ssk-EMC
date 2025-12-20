import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { connectDB } from '@/lib/db/mongodb';
import Announcement from '@/lib/db/models/Announcement';
import { announcementUpdateSchema } from '@/lib/validations';
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

        const announcement = await Announcement.findById(id)
            .populate('createdBy', 'username')
            .lean();

        if (!announcement) {
            return NextResponse.json({ error: 'ไม่พบประกาศ' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            announcement
        });
    } catch (error) {
        errorTracker.logError(error, { endpoint: `/api/admin/announcements/${id}`, method: 'GET' });
        return NextResponse.json(
            createErrorResponse(error, 'ไม่สามารถโหลดข้อมูลประกาศได้'),
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
        const validatedData = announcementUpdateSchema.parse(body);

        await connectDB();

        const announcement = await Announcement.findByIdAndUpdate(
            id,
            { $set: validatedData },
            { new: true, runValidators: true }
        ).populate('createdBy', 'username');

        if (!announcement) {
            return NextResponse.json({ error: 'ไม่พบประกาศ' }, { status: 404 });
        }

        errorTracker.logInfo('Announcement updated successfully', {
            announcementId: announcement._id,
            userId: decoded.userId
        });

        return NextResponse.json({
            success: true,
            announcement,
            message: 'อัพเดทประกาศสำเร็จ'
        });
    } catch (error) {
        if (error instanceof ZodError) {
            return NextResponse.json(
                { error: 'ข้อมูลไม่ถูกต้อง', details: formatValidationErrors(error.issues) },
                { status: 400 }
            );
        }

        errorTracker.logError(error, { endpoint: `/api/admin/announcements/${id}`, method: 'PATCH' });
        return NextResponse.json(
            createErrorResponse(error, 'ไม่สามารถอัพเดทประกาศได้'),
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

        const announcement = await Announcement.findByIdAndDelete(id);

        if (!announcement) {
            return NextResponse.json({ error: 'ไม่พบประกาศ' }, { status: 404 });
        }

        errorTracker.logInfo('Announcement deleted successfully', {
            announcementId: id,
            title: announcement.title,
            userId: decoded.userId
        });

        return NextResponse.json({
            success: true,
            message: 'ลบประกาศสำเร็จ'
        });
    } catch (error) {
        errorTracker.logError(error, { endpoint: `/api/admin/announcements/${id}`, method: 'DELETE' });
        return NextResponse.json(
            createErrorResponse(error, 'ไม่สามารถลบประกาศได้'),
            { status: 500 }
        );
    }
}
