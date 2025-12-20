import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { connectDB } from '@/lib/db/mongodb';
import Announcement from '@/lib/db/models/Announcement';
import { announcementSchema } from '@/lib/validations';
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

        const announcements = await Announcement.find({})
            .populate('createdBy', 'username')
            .sort({ createdAt: -1 })
            .lean();

        errorTracker.logInfo('Announcements fetched successfully', {
            count: announcements.length,
            userId: decoded.userId
        });

        return NextResponse.json({
            success: true,
            announcements
        });
    } catch (error) {
        errorTracker.logError(error, { endpoint: '/api/admin/announcements', method: 'GET' });
        return NextResponse.json(
            createErrorResponse(error, 'ไม่สามารถโหลดข้อมูลประกาศได้'),
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
        const validatedData = announcementSchema.parse(body);

        await connectDB();

        // Create new announcement
        const announcement = await Announcement.create({
            ...validatedData,
            createdBy: decoded.userId
        });

        // Populate createdBy for response
        await announcement.populate('createdBy', 'username');

        errorTracker.logInfo('Announcement created successfully', {
            announcementId: announcement._id,
            title: announcement.title,
            type: announcement.type,
            userId: decoded.userId
        });

        return NextResponse.json({
            success: true,
            announcement,
            message: 'สร้างประกาศสำเร็จ'
        }, { status: 201 });
    } catch (error) {
        if (error instanceof ZodError) {
            return NextResponse.json(
                { error: 'ข้อมูลไม่ถูกต้อง', details: formatValidationErrors(error.issues) },
                { status: 400 }
            );
        }

        errorTracker.logError(error, { endpoint: '/api/admin/announcements', method: 'POST' });
        return NextResponse.json(
            createErrorResponse(error, 'ไม่สามารถสร้างประกาศได้'),
            { status: 500 }
        );
    }
}
