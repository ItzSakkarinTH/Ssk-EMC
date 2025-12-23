import { createHmac } from 'crypto';

const ACCESS_TOKEN_EXPIRY = 24 * 60 * 60; // 24 hours (seconds)
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 7 days (seconds)

// Base64Url encoding/decoding without external libraries
const base64UrlEncode = (str: string): string => {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
};

const base64UrlDecode = (str: string): string => {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  return Buffer.from(str, 'base64').toString();
};

export interface TokenPayload {
  userId: string;
  username: string;
  fullName?: string;
  email: string;
  role: 'admin' | 'staff' | 'viewer';
  assignedShelterId?: string;
  sessionId: string;
  exp?: number;
  iat?: number;
  [key: string]: unknown;
}

export interface RefreshTokenPayload {
  userId: string;
  sessionId: string;
  tokenId: string;
  exp?: number;
  iat?: number;
}

export class JWTService {
  private static getSecret(type: 'access' | 'refresh'): string {
    return type === 'access'
      ? process.env.JWT_SECRET || 'default-access-secret'
      : process.env.JWT_REFRESH_SECRET || 'default-refresh-secret';
  }

  private static sign(payload: object, secret: string, expiresIn: number): string {
    const header = { alg: 'HS256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);

    const fullPayload = {
      ...payload,
      iat: now,
      exp: now + expiresIn,
      iss: 'sisaket-ems',
      aud: 'sisaket-ems-users'
    };

    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));

    const signature = createHmac('sha256', secret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  private static verify<T>(token: string, secret: string): T | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const [encodedHeader, encodedPayload, signature] = parts;

      const expectedSignature = createHmac('sha256', secret)
        .update(`${encodedHeader}.${encodedPayload}`)
        .digest('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');

      if (signature !== expectedSignature) return null;

      const payload = JSON.parse(base64UrlDecode(encodedPayload));

      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        return null;
      }

      return payload as T;
    } catch (error) {
      console.error('JWT Verify Error:', error);
      return null;
    }
  }

  static async generateAccessToken(payload: TokenPayload): Promise<string> {
    return this.sign(payload, this.getSecret('access'), ACCESS_TOKEN_EXPIRY);
  }

  static async generateRefreshToken(
    userId: string,
    sessionId: string,
    tokenId: string
  ): Promise<string> {
    const payload: RefreshTokenPayload = { userId, sessionId, tokenId };
    return this.sign(payload, this.getSecret('refresh'), REFRESH_TOKEN_EXPIRY);
  }

  static async verifyAccessToken(token: string): Promise<TokenPayload | null> {
    return this.verify<TokenPayload>(token, this.getSecret('access'));
  }

  static async verifyRefreshToken(token: string): Promise<RefreshTokenPayload | null> {
    return this.verify<RefreshTokenPayload>(token, this.getSecret('refresh'));
  }
}
