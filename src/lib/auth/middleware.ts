import { NextRequest } from 'next/server';
import { JWTService, TokenPayload } from './jwt';

export interface AuthContext {
  user: TokenPayload;
  isAuthenticated: boolean;
}

export async function authenticate(req: NextRequest): Promise<AuthContext | null> {
  try {
    let token: string | undefined;

    // Try Authorization header first
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    // Fallback to cookie (เผื่อไว้ถ้าเรียกจาก browser โดยตรง)
    if (!token) {
      token = req.cookies.get('accessToken')?.value;
    }

    if (!token) {
      return null;
    }

    // Verify JWT token
    const user = await JWTService.verifyAccessToken(token);

    if (!user) {
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
export function requireRole(allowedRoles: Array<'admin' | 'staff' | 'viewer'>) {
  return (context: AuthContext | null): boolean => {
    if (!context || !context.isAuthenticated) {
      return false;
    }
    return allowedRoles.includes(context.user.role);
  };
}