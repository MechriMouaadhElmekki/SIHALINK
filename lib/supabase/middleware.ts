/**
 * Supabase session-refresh helper for Next.js middleware.
 *
 * Uses getAll/setAll cookie API required by @supabase/ssr ^0.3.0.
 * The old get/set/remove API was removed in this version.
 *
 * Called from the root middleware.ts on every protected request.
 * Refreshes the auth token cookie so it doesn't expire mid-session.
 */
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          // Write cookies into the cloned request first (for downstream reads),
          // then create a fresh response so Set-Cookie headers are emitted.
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: use getUser() not getSession().
  // getSession() reads only from the cookie and cannot be trusted server-side
  // (susceptible to cookie spoofing). getUser() validates the JWT with the
  // Supabase auth server.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user };
}
