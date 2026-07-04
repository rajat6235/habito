import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_ROUTES  = ['/', '/login', '/register', '/forgot-password'];
const AUTH_ROUTES    = ['/login', '/register', '/forgot-password'];
const ADMIN_ROUTES   = ['/admin'];
const PROTECTED_PREFIX = '/app';

function isPublicRoute(path: string) {
  return PUBLIC_ROUTES.some(r => path === r) ||
    path.startsWith('/reset-password') ||
    path.startsWith('/verify-email') ||
    path.startsWith('/_next') ||
    path.startsWith('/api') ||
    path.startsWith('/icons') ||
    path === '/manifest.json' ||
    path === '/sw.js';
}

function isAuthRoute(path: string) {
  return AUTH_ROUTES.includes(path) ||
    path.startsWith('/reset-password') ||
    path.startsWith('/verify-email');
}

function isAdminRoute(path: string) {
  return ADMIN_ROUTES.some(r => path.startsWith(r));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Read access token from cookie (set by auth service as a short-lived cookie for SSR)
  // In practice, access tokens are in-memory; we use a lightweight "auth" cookie
  // to indicate session existence without storing the actual token.
  const hasSession = Boolean(request.cookies.get('habito_session'));
  const userRole   = request.cookies.get('habito_role')?.value ?? '';

  // Public static / API routes — always allow
  if (isPublicRoute(pathname)) {
    // Redirect authenticated users away from auth pages
    if (hasSession && isAuthRoute(pathname)) {
      return NextResponse.redirect(new URL('/app', request.url));
    }
    return NextResponse.next();
  }

  // Protected app routes — require session
  if (pathname.startsWith(PROTECTED_PREFIX)) {
    if (!hasSession) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('return', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // Admin routes — require admin role
  if (isAdminRoute(pathname)) {
    if (!hasSession) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('return', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (!['admin', 'super_admin'].includes(userRole)) {
      return NextResponse.redirect(new URL('/app', request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  // Match all routes except static files handled by Next.js
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};
