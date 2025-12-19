import { NextRequest } from 'next/server';
import { JWTService, TokenPayload } from './jwt';

export interface AuthContext {
  user: TokenPayload;
  isAuthenticated: boolean;
}

export async function authenticate(req: NextRequest): Promise<AuthContext | null> {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const user = JWTService.verifyAccessToken(token);

    if (!user) {
      return null;
    }

    // ตรวจสอบ IP และ User-Agent
    const currentIP = req.headers.get('x-forwarded-for') || req.ip || 'unknown';
    const currentUA = req.headers.get('user-agent') || 'unknown';

    if (user.ip !== currentIP || user.userAgent !== currentUA) {
      console.warn('🚨 Session mismatch', {
        user: user.userId,
        expectedIP: user.ip,
        actualIP: currentIP
      });
      
      // Revoke session
      JWTService.revokeSession(user.sessionId);
      return null;
    }

    return {
      user,
      isAuthenticated: true
    };

  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

// Middleware helper สำหรับตรวจสอบ role
export function requireRole(allowedRoles: Array<'staff' | 'admin'>) {
  return (context: AuthContext | null): boolean => {
    if (!context || !context.isAuthenticated) {
      return false;
    }
    return allowedRoles.includes(context.user.role);
  };
}