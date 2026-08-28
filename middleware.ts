import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PROTECTED_ROUTES = ['/dashboard', '/emergency', '/reports', '/appointments', '/account', '/first-aid', '/doctors', '/facilities', '/pharmacies', '/laboratories', '/notifications'];
const ADMIN_ROUTES = ['/admin'];
const OPERATOR_ROUTES = ['/operator'];
const AUTH_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email'];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return request.cookies.get(name)?.value; },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  const pathname = request.nextUrl.pathname;

  const isProtected = PROTECTED_ROUTES.some(r => pathname.startsWith(r));
  const isAdmin = ADMIN_ROUTES.some(r => pathname.startsWith(r));
  const isOperator = OPERATOR_ROUTES.some(r => pathname.startsWith(r));
  const isAuth = AUTH_ROUTES.some(r => pathname.startsWith(r));

  if ((isProtected || isAdmin || isOperator) && !session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuth && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
