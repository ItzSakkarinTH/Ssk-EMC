
import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

export interface JWTPayload {
  userId: string;
  role: 'staff' | 'admin';
  assignedShelterId?: string;
  sessionId: string;
  ip: string;
  userAgent: string;
}

interface StockWithShelters {
  itemName: string;
  category: string;
  totalQuantity: number;
  unit: string;
  minStockLevel: number;
  criticalLevel: number;
  getStatus: () => string;
  shelterStock: Array<{
    shelterId: { toString: () => string };
    quantity: number;
    lastUpdated?: Date;
  }>;
}

// ตรวจสอบ JWT Token
export async function verifyToken(req: NextRequest): Promise<JWTPayload | null> {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    // ตรวจสอบ IP และ User-Agent
    const currentIP = req.headers.get('x-forwarded-for') || 'unknown';
    const currentUA = req.headers.get('user-agent') || 'unknown';

    if (decoded.ip !== currentIP || decoded.userAgent !== currentUA) {
      console.warn('Session mismatch detected', {
        user: decoded.userId,
        expectedIP: decoded.ip,
        actualIP: currentIP
      });
      return null;
    }

    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

// ตรวจสอบว่าเป็น Admin หรือไม่
export function requireAdmin(user: JWTPayload | null): boolean {
  return user?.role === 'admin';
}

// ตรวจสอบว่า Staff มีสิทธิ์เข้าถึงศูนย์นี้หรือไม่
export function canAccessShelter(user: JWTPayload | null, shelterId: string): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (user.role === 'staff' && user.assignedShelterId === shelterId) return true;
  return false;
}

// กรองข้อมูล Stock ตาม Role
export function filterStockByRole(stock: StockWithShelters, user: JWTPayload | null) {
  if (!user) {
    // Public: ไม่แสดงรายละเอียดศูนย์
    return {
      itemName: stock.itemName,
      category: stock.category,
      totalQuantity: stock.totalQuantity,
      unit: stock.unit,
      status: stock.getStatus()
    };
  }

  if (user.role === 'admin') {
    // Admin: เห็นทุกอย่าง
    return stock;
  }

  if (user.role === 'staff' && user.assignedShelterId) {
    // Staff: เห็นเฉพาะศูนย์ตัวเอง
    const shelterStock = stock.shelterStock.find(
      (s) => s.shelterId.toString() === user.assignedShelterId
    );

    return {
      itemName: stock.itemName,
      category: stock.category,
      unit: stock.unit,
      myShelterStock: shelterStock?.quantity || 0,
      lastUpdated: shelterStock?.lastUpdated,
      status: shelterStock
        ? (shelterStock.quantity <= stock.criticalLevel ? 'critical'
          : shelterStock.quantity <= stock.minStockLevel ? 'low'
            : 'sufficient')
        : 'unavailable'
    };
  }

  return null;
}

// Middleware helper สำหรับ API Routes
export async function withAuth(
  req: NextRequest,
  handler: (req: NextRequest, user: JWTPayload) => Promise<Response>
): Promise<Response> {
  const user = await verifyToken(req);

  if (!user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return handler(req, user);
}

// Middleware helper สำหรับ Admin เท่านั้น
export async function withAdminAuth(
  req: NextRequest,
  handler: (req: NextRequest, user: JWTPayload) => Promise<Response>
): Promise<Response> {
  const user = await verifyToken(req);

  if (!user || user.role !== 'admin') {
    return new Response(
      JSON.stringify({ error: 'Forbidden: Admin access required' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return handler(req, user);
}

// Middleware helper สำหรับ Staff (ต้องมี shelterId)
export async function withStaffAuth(
  req: NextRequest,
  handler: (req: NextRequest, user: JWTPayload) => Promise<Response>
): Promise<Response> {
  const user = await verifyToken(req);

  if (!user || (user.role !== 'staff' && user.role !== 'admin')) {
    return new Response(
      JSON.stringify({ error: 'Forbidden: Staff access required' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (user.role === 'staff' && !user.assignedShelterId) {
    return new Response(
      JSON.stringify({ error: 'Forbidden: No shelter assigned' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return handler(req, user);
}

// ตรวจสอบว่าสามารถดำเนินการกับ Stock Movement ได้หรือไม่
export function canPerformStockAction(
  user: JWTPayload,
  action: 'receive' | 'dispense' | 'transfer',
  shelterId?: string
): { allowed: boolean; reason?: string } {

  if (user.role === 'admin') {
    return { allowed: true };
  }

  if (user.role === 'staff') {
    if (!user.assignedShelterId) {
      return { allowed: false, reason: 'No shelter assigned' };
    }

    if (action === 'transfer') {
      return { allowed: false, reason: 'Staff cannot transfer between shelters' };
    }

    if (shelterId && shelterId !== user.assignedShelterId) {
      return { allowed: false, reason: 'Cannot access other shelter' };
    }

    return { allowed: true };
  }

  return { allowed: false, reason: 'Invalid role' };
}
