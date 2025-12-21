import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { connectDB } from '@/lib/db/mongodb';
import User from '@/lib/db/models/User';
import { userCreateSchema } from '@/lib/validations';
import { errorTracker, createErrorResponse, formatValidationErrors } from '@/lib/error-tracker';
import { ZodError } from 'zod';
import bcrypt from 'bcryptjs';

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

        // Get role filter from query params
        const { searchParams } = new URL(request.url);
        const roleFilter = searchParams.get('role');

        const query = roleFilter ? { role: roleFilter } : {};

        const users = await User.find(query)
            .select('-password') // Don't return passwords
            .populate('assignedShelterId', 'name code')
            .sort({ createdAt: -1 })
            .lean();

        errorTracker.logInfo('Users fetched successfully', {
            count: users.length,
            roleFilter: roleFilter || 'all',
            userId: decoded.userId
        });

        return NextResponse.json({
            success: true,
            users
        });
    } catch (error) {
        errorTracker.logError(error, { endpoint: '/api/admin/users', method: 'GET' });
        return NextResponse.json(
            createErrorResponse(error, 'ไม่สามารถโหลดข้อมูลผู้ใช้ได้'),
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
        const validatedData = userCreateSchema.parse(body);

        await connectDB();

        // Check if username already exists
        const existingUsername = await User.findOne({ username: validatedData.username });
        if (existingUsername) {
            return NextResponse.json(
                { error: 'ชื่อผู้ใช้นี้มีอยู่ในระบบแล้ว' },
                { status: 400 }
            );
        }

        // Check if email already exists
        const existingEmail = await User.findOne({ email: validatedData.email });
        if (existingEmail) {
            return NextResponse.json(
                { error: 'อีเมลนี้มีอยู่ในระบบแล้ว' },
                { status: 400 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(validatedData.password, 10);

        // Create new user
        const user = await User.create({
            ...validatedData,
            password: hashedPassword
        });

        // Remove password from response
        const userResponse = user.toObject();
        delete userResponse.password;

        errorTracker.logInfo('User created successfully', {
            userId: user._id,
            username: user.username,
            createdBy: decoded.userId
        });

        return NextResponse.json({
            success: true,
            user: userResponse,
            message: 'สร้างผู้ใช้สำเร็จ'
        }, { status: 201 });
    } catch (error) {
        if (error instanceof ZodError) {
            return NextResponse.json(
                { error: 'ข้อมูลไม่ถูกต้อง', details: formatValidationErrors(error.issues) },
                { status: 400 }
            );
        }

        errorTracker.logError(error, { endpoint: '/api/admin/users', method: 'POST' });
        return NextResponse.json(
            createErrorResponse(error, 'ไม่สามารถสร้างผู้ใช้ได้'),
            { status: 500 }
        );
    }
}
