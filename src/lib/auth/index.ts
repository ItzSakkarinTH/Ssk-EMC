// Simple token verification for Admin APIs
// Uses the existing JWT system from auth/jwt.ts

import { JWTService, TokenPayload } from './jwt';

export interface JWTPayload {
    userId: string;
    username: string;
    email: string;
    role: 'admin' | 'staff' | 'viewer';
    sessionId?: string;
    shelter?: string;
}

/**
 * Verify JWT token for Admin API routes
 * @param token - JWT token string
 * @returns Decoded payload or null if invalid
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
    try {
        const payload = await JWTService.verifyAccessToken(token);

        if (!payload) {
            return null;
        }

        return {
            userId: payload.userId,
            username: payload.username,
            email: payload.email,
            role: payload.role,
            sessionId: payload.sessionId,
            shelter: payload.shelter as string | undefined
        };
    } catch (error) {
        console.error('Token verification failed:', error);
        return null;
    }
}

/**
 * Sign a new JWT token (for compatibility)
 * @param payload - Token payload
 * @returns JWT token string
 */
export async function signToken(payload: JWTPayload): Promise<string> {
    const tokenPayload: TokenPayload = {
        userId: payload.userId,
        username: payload.username,
        email: payload.email,
        role: payload.role,
        sessionId: payload.sessionId || 'default-session'
    };

    return await JWTService.generateAccessToken(tokenPayload);
}

// Re-export for convenience
export { JWTService } from './jwt';
export type { TokenPayload } from './jwt';
