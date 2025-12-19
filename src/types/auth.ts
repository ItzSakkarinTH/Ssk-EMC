export type UserRole = 'staff' | 'admin';

export interface User {
  _id: string;
  email: string;
  name: string;
  role: UserRole;
  assignedShelterId?: string;
  isActive: boolean;
  createdAt: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface JWTPayload {
  userId: string;
  role: UserRole;
  assignedShelterId?: string;
  sessionId: string;
  ip: string;
  userAgent: string;
}

export interface Session {
  sessionId: string;
  userId: string;
  createdAt: Date;
  lastActivity: Date;
  ip: string;
  userAgent: string;
  isActive: boolean;
}