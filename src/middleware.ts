import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes - ไม่ต้อง auth
  const publicRoutes = [
    '/login',
    '/api/stock/public'
  ];

  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Staff routes - ต้องมี token
  if (pathname.startsWith('/staff')) {
    const token = request.cookies.get('accessToken')?.value;

    if (!token) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    // ในระบบจริงควรตรวจสอบ role ด้วย
    return NextResponse.next();
  }

  // Admin routes - ต้องเป็น admin
  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get('accessToken')?.value;

    if (!token) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    // ในระบบจริงต้องตรวจสอบ role จาก token
    // และ redirect ถ้าไม่ใช่ admin

    return NextResponse.next();
  }

  // API routes - ตรวจสอบ Authorization header
  if (pathname.startsWith('/api')) {
    // Public API ไม่ต้องตรวจสอบ
    if (pathname.startsWith('/api/stock/public') ||
      pathname.startsWith('/api/auth') ||
      pathname.startsWith('/api/announcements/active')) {
      return NextResponse.next();
    }

    // Protected API ต้องมี token
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Staff API
    if (pathname.startsWith('/api/stock/staff')) {
      // Role check จะทำใน API handler
      return NextResponse.next();
    }

    // Admin API
    if (pathname.startsWith('/api/stock/admin')) {
      // Role check จะทำใน API handler
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
