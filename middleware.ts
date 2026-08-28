import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

const PROTECTED_ROUTES = ['/dashboard', '/emergency', '/appointments', '/account', '/reports', '/admin', '/operator'];
const AUTH_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password'];
const ADMIN_ROUTES = ['/admin'];
const OPERATOR_ROUTES = ['/operator'];

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_ROUTES.some(r => pathname.startsWith(r));
  const isAuthRoute = AUTH_ROUTES.some(r => pathname.startsWith(r));

  if (!isProtected && !isAuthRoute) return response;

  // Get session from cookies
  const authCookie = request.cookies.get('sb-access-token') ||
    request.cookies.getAll().find(c => c.name.includes('auth-token'));

  // For protected routes without session, redirect to login
  if (isProtected && !authCookie) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public|api/health).*)'],
};
