import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/unauthorized',
  '/',
  '/about',
  '/first-aid',
];

const PROTECTED_ROUTE_PREFIXES = [
  '/dashboard',
  '/emergency',
  '/reports',
  '/appointments',
  '/profile',
  '/settings',
  '/notifications',
];

const ADMIN_ROUTE_PREFIXES = ['/admin'];
const OPERATOR_ROUTE_PREFIXES = ['/operator'];

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  // Locale cookie for i18n
  const localeCookie = request.cookies.get('locale')?.value;
  if (!localeCookie) {
    supabaseResponse.cookies.set('locale', 'ar', { path: '/', maxAge: 60 * 60 * 24 * 365 });
  }

  // Redirect logged-in users away from auth pages
  if (user && ['/login', '/register'].includes(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Protect dashboard/app routes
  const isProtected = PROTECTED_ROUTE_PREFIXES.some(p => pathname.startsWith(p));
  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(url);
  }

  // Admin routes - basic check (full role check happens server-side)
  const isAdminRoute = ADMIN_ROUTE_PREFIXES.some(p => pathname.startsWith(p));
  if (isAdminRoute && !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const isOperatorRoute = OPERATOR_ROUTE_PREFIXES.some(p => pathname.startsWith(p));
  if (isOperatorRoute && !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
