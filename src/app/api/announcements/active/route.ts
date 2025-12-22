import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import Announcement from '@/lib/db/models/Announcement';
import { errorTracker, createErrorResponse } from '@/lib/error-tracker';

export async function GET() {
    try {
        await connectDB();

        // Get only active announcements
        const announcements = await Announcement.find({ isActive: true })
            .select('title content type')
            .sort({ createdAt: -1 })
            .limit(5) // จำกัดสูงสุด 5 ประกาศ
            .lean();

        errorTracker.logInfo('Active announcements fetched successfully', {
            count: announcements.length
        });

        return NextResponse.json({
            success: true,
            announcements
        });
    } catch (error) {
        errorTracker.logError(error, { endpoint: '/api/announcements/active', method: 'GET' });
        return NextResponse.json(
            createErrorResponse(error, 'ไม่สามารถโหลดข้อมูลประกาศได้'),
            { status: 500 }
        );
    }
}
