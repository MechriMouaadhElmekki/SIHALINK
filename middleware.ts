import { NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

/**
 * Paths that do NOT require authentication.
 * Keep this list minimal — everything not listed here is protected.
 */
const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/auth/callback',
  '/auth/confirm',
  // Sentry tunnel route (set via tunnelRoute in next.config.mjs).
  // Must be public so Sentry can POST error events even before auth.
  '/monitoring',
  // Health check endpoint — must be accessible without auth for uptime
  // monitors, load-balancer probes, and CI smoke tests.
  '/api/health',
  // PWA assets — must be accessible without auth so the service worker
  // can install and the offline page works for unauthenticated visits.
  '/sw.js',
  '/manifest.json',
  '/offline.html',
];

/**
 * Path prefixes that are always public (no auth check).
 * Checked with startsWith so /icons/foo.svg is covered by '/icons'.
 */
const PUBLIC_PREFIXES = [
  '/_next',
  '/favicon',
  '/api/auth',
  '/icons',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Pass through public exact paths and public prefixes without any auth
  //    check. This avoids a Supabase round-trip on every static asset.
  if (
    PUBLIC_PATHS.includes(pathname) ||
    PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))
  ) {
    return NextResponse.next();
  }

  // 2. For all other routes: refresh the Supabase session cookie and validate
  //    the user JWT with the auth server (getUser(), not getSession()).
  const { response, user } = await updateSession(request);

  // 3. Redirect unauthenticated users to /login, preserving the intended path
  //    as a ?redirect= query parameter so they land back after sign-in.
  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  /*
   * Match all request paths EXCEPT:
   *   - _next/static  (built JS/CSS chunks)
   *   - _next/image   (Next.js image optimisation)
   *   - favicon.ico
   *   - Files with image/font/media extensions
   *
   * PWA-specific paths (/sw.js, /manifest.json, /offline.html, /icons/*) are
   * handled by the PUBLIC_PATHS / PUBLIC_PREFIXES check above rather than the
   * matcher, so they go through the middleware function but return early
   * before any Supabase call.
   */
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|otf)$).*)',
  ],
};
