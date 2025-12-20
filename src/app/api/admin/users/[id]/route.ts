import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { connectDB } from '@/lib/db/mongodb';
import User from '@/lib/db/models/User';
import { userUpdateSchema } from '@/lib/validations';
import { errorTracker, createErrorResponse, formatValidationErrors } from '@/lib/error-tracker';
import { ZodError } from 'zod';
import bcrypt from 'bcryptjs';

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
        if (!decoded || decoded.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();

        const user = await User.findById(id)
            .select('-password')
            .populate('assignedShelterId', 'name code')
            .lean();

        if (!user) {
            return NextResponse.json({ error: 'ไม่พบผู้ใช้' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            user
        });
    } catch (error) {
        errorTracker.logError(error, { endpoint: `/api/admin/users/${id}`, method: 'GET' });
        return NextResponse.json(
            createErrorResponse(error, 'ไม่สามารถโหลดข้อมูลผู้ใช้ได้'),
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
        const validatedData = userUpdateSchema.parse(body);

        await connectDB();

        // Check if username is being changed and if it already exists
        if (validatedData.username) {
            const existingUsername = await User.findOne({
                username: validatedData.username,
                _id: { $ne: id }
            });
            if (existingUsername) {
                return NextResponse.json(
                    { error: 'ชื่อผู้ใช้นี้มีอยู่ในระบบแล้ว' },
                    { status: 400 }
                );
            }
        }

        // Check if email is being changed and if it already exists
        if (validatedData.email) {
            const existingEmail = await User.findOne({
                email: validatedData.email,
                _id: { $ne: id }
            });
            if (existingEmail) {
                return NextResponse.json(
                    { error: 'อีเมลนี้มีอยู่ในระบบแล้ว' },
                    { status: 400 }
                );
            }
        }

        // Hash password if it's being changed
        const updateData: Record<string, unknown> = { ...validatedData };
        if (validatedData.password) {
            updateData.password = await bcrypt.hash(validatedData.password, 10);
        }

        const user = await User.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return NextResponse.json({ error: 'ไม่พบผู้ใช้' }, { status: 404 });
        }

        errorTracker.logInfo('User updated successfully', {
            userId: user._id,
            updatedBy: decoded.userId
        });

        return NextResponse.json({
            success: true,
            user,
            message: 'อัพเดทผู้ใช้สำเร็จ'
        });
    } catch (error) {
        if (error instanceof ZodError) {
            return NextResponse.json(
                { error: 'ข้อมูลไม่ถูกต้อง', details: formatValidationErrors(error.issues) },
                { status: 400 }
            );
        }

        errorTracker.logError(error, { endpoint: `/api/admin/users/${id}`, method: 'PATCH' });
        return NextResponse.json(
            createErrorResponse(error, 'ไม่สามารถอัพเดทผู้ใช้ได้'),
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

        // Prevent deleting yourself
        if (decoded.userId === id) {
            return NextResponse.json(
                { error: 'ไม่สามารถลบบัญชีของตัวเองได้' },
                { status: 400 }
            );
        }

        await connectDB();

        const user = await User.findByIdAndDelete(id);

        if (!user) {
            return NextResponse.json({ error: 'ไม่พบผู้ใช้' }, { status: 404 });
        }

        errorTracker.logInfo('User deleted successfully', {
            userId: id,
            username: user.username,
            deletedBy: decoded.userId
        });

        return NextResponse.json({
            success: true,
            message: 'ลบผู้ใช้สำเร็จ'
        });
    } catch (error) {
        errorTracker.logError(error, { endpoint: `/api/admin/users/${id}`, method: 'DELETE' });
        return NextResponse.json(
            createErrorResponse(error, 'ไม่สามารถลบผู้ใช้ได้'),
            { status: 500 }
        );
    }
}
