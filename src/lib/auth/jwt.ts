import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

export interface TokenPayload {
  userId: string;
  role: 'staff' | 'admin';
  assignedShelterId?: string;
  sessionId: string;
  ip: string;
  userAgent: string;
}

export interface RefreshTokenData {
  userId: string;
  sessionId: string;
  tokenId: string;
  expiresAt: Date;
  isUsed: boolean;
  ip: string;
  userAgent: string;
}

// In-memory store สำหรับ Refresh Token (ในระบบจริงควรใช้ Redis)
const refreshTokenStore = new Map<string, RefreshTokenData>();

// In-memory store สำหรับ Revoked Tokens
const revokedTokens = new Set<string>();

export class JWTService {

  // สร้าง Access Token
  static generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: ACCESS_TOKEN_EXPIRY
    });
  }

  // สร้าง Refresh Token
  static generateRefreshToken(
    userId: string,
    sessionId: string,
    ip: string,
    userAgent: string
  ): { token: string; tokenId: string } {

    const tokenId = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const token = jwt.sign(
      { userId, sessionId, tokenId },
      JWT_REFRESH_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRY }
    );

    // บันทึกข้อมูล Refresh Token
    refreshTokenStore.set(tokenId, {
      userId,
      sessionId,
      tokenId,
      expiresAt,
      isUsed: false,
      ip,
      userAgent
    });

    return { token, tokenId };
  }

  // ตรวจสอบ Access Token
  static verifyAccessToken(token: string): TokenPayload | null {
    try {
      // ตรวจสอบว่า token ถูก revoke หรือไม่
      if (revokedTokens.has(token)) {
        return null;
      }

      const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
      return decoded;
    } catch (error) {
      return null;
    }
  }

  // ตรวจสอบ Refresh Token และออก Token ใหม่ (Rotate)
  static async rotateRefreshToken(
    refreshToken: string,
    currentIp: string,
    currentUA: string
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    tokenId: string;
  } | null> {

    try {
      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { tokenId: string; userId: string; sessionId: string };
      const { tokenId, userId, sessionId } = decoded;

      // ตรวจสอบ token data
      const tokenData = refreshTokenStore.get(tokenId);
      if (!tokenData) {
        throw new Error('Token not found');
      }

      // ตรวจสอบว่า token ถูกใช้ไปแล้วหรือไม่
      if (tokenData.isUsed) {
        console.warn('🚨 Refresh Token Reuse Detected!', { userId, tokenId });
        // Revoke ทุก token ของ user นี้
        this.revokeAllUserSessions(userId);
        throw new Error('Token reuse detected - all sessions revoked');
      }

      // ตรวจสอบ IP และ User-Agent
      if (tokenData.ip !== currentIp || tokenData.userAgent !== currentUA) {
        console.warn('🚨 Session Mismatch Detected!', {
          userId,
          expectedIP: tokenData.ip,
          actualIP: currentIp
        });
        this.revokeSession(sessionId);
        throw new Error('Session compromised');
      }

      // Mark token as used
      tokenData.isUsed = true;

      // สร้าง token ใหม่
      const user = {
        userId,
        role: 'staff' as const, // จริงควรดึงจาก DB
        sessionId
      };

      const newAccessToken = this.generateAccessToken({
        ...user,
        ip: currentIp,
        userAgent: currentUA
      });

      const { token: newRefreshToken, tokenId: newTokenId } =
        this.generateRefreshToken(userId, sessionId, currentIp, currentUA);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        tokenId: newTokenId
      };

    } catch (error: unknown) {
      const err = error as Error;
      console.error('Rotate token error:', err.message);
      return null;
    }
  }

  // Revoke session
  static revokeSession(sessionId: string) {
    // ลบทุก refresh token ของ session นี้
    for (const [tokenId, data] of refreshTokenStore.entries()) {
      if (data.sessionId === sessionId) {
        refreshTokenStore.delete(tokenId);
      }
    }
  }

  // Revoke ทุก session ของ user
  static revokeAllUserSessions(userId: string) {
    for (const [tokenId, data] of refreshTokenStore.entries()) {
      if (data.userId === userId) {
        refreshTokenStore.delete(tokenId);
      }
    }
  }

  // Revoke Access Token
  static revokeAccessToken(token: string) {
    revokedTokens.add(token);

    // Clean up หลัง 1 ชั่วโมง (มากกว่า expiry)
    setTimeout(() => {
      revokedTokens.delete(token);
    }, 60 * 60 * 1000);
  }

  // Cleanup expired tokens
  static cleanupExpiredTokens() {
    const now = new Date();
    for (const [tokenId, data] of refreshTokenStore.entries()) {
      if (data.expiresAt < now) {
        refreshTokenStore.delete(tokenId);
      }
    }
  }
}

// Cleanup ทุก 1 ชั่วโมง
setInterval(() => {
  JWTService.cleanupExpiredTokens();
}, 60 * 60 * 1000);
