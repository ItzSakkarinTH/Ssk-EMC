import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { getDatabase } from '@/lib/db/mongodb-native';
import { verifyPassword, generateToken } from '@/lib/auth/password';
import { JWTService } from '@/lib/auth/jwt';
import { checkLoginRateLimit, incrementRateLimit, resetRateLimit } from '@/lib/auth/rate-limit';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { identifier, password } = body;

        if (!identifier || !password) {
            return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
        }

        // Rate Limit Check
        const headersList = await headers();
        const ip = headersList.get('x-forwarded-for') || 'unknown';
        const limitKey = `${ip}:${identifier}`;
        const rateLimit = checkLoginRateLimit(limitKey);

        if (!rateLimit.allowed) {
            return NextResponse.json(
                { error: 'Too many login attempts. Please try again later.' },
                { status: 429 }
            );
        }

        // DB Connection
        const db = await getDatabase();
        const user = await db.collection('users').findOne({
            $or: [{ username: identifier }, { email: identifier }]
        });

        if (!user || !(await verifyPassword(password, user.password))) {
            incrementRateLimit(limitKey);
            return NextResponse.json({ error: 'รหัสผ่านไม่ถูกต้อง' }, { status: 401 });
        }

        // Reset Rate Limit
        resetRateLimit(limitKey);

        // Generate Tokens
        const sessionId = generateToken(16);
        const accessToken = await JWTService.generateAccessToken({
            userId: user._id.toString(),
            username: user.username,
            email: user.email,
            role: user.role,
            sessionId
        });

        const refreshToken = await JWTService.generateRefreshToken(
            user._id.toString(),
            sessionId,
            generateToken(16)
        );

        // Set Cookie
        const cookieStore = await cookies();
        const isProduction = process.env.NODE_ENV === 'production';

        cookieStore.set('accessToken', accessToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'lax',
            maxAge: 24 * 60 * 60, // 24 hours
            path: '/'
        });

        cookieStore.set('refreshToken', refreshToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60, // 7 days
            path: '/'
        });

        return NextResponse.json({
            success: true,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
