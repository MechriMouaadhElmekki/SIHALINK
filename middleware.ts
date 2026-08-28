import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const publicPaths = ['/', '/login', '/register', '/forgot-password', '/reset-password', '/verify-email'];
const adminPaths = ['/admin'];
const operatorPaths = ['/operator'];

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
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

  const path = request.nextUrl.pathname;
  const isPublicPath = publicPaths.some(p => path === p || path.startsWith('/api/'));

  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', path);
    return NextResponse.redirect(url);
  }

  if (user) {
    // Check role-based path access
    if (adminPaths.some(p => path.startsWith(p)) || operatorPaths.some(p => path.startsWith(p))) {
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role_name')
        .eq('user_id', user.id);

      const userRoles = roles?.map(r => r.role_name) ?? [];

      if (path.startsWith('/admin') && !userRoles.some(r => ['ADMIN','SUPER_ADMIN'].includes(r))) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      if (path.startsWith('/operator') && !userRoles.some(r => ['EMERGENCY_OPERATOR','ADMIN','SUPER_ADMIN'].includes(r))) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }

    // Redirect logged-in users away from auth pages
    if (['/login', '/register'].includes(path)) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
