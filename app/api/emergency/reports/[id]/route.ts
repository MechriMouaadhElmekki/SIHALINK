import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

function createSupabaseServerClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) { return cookieStore.get(name)?.value; },
        set(name, value, options) { cookieStore.set({ name, value, ...options }); },
        remove(name, options) { cookieStore.set({ name, value: '', ...options }); },
      },
    }
  );
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: report, error } = await supabase
    .from('emergency_reports')
    .select(`
      *,
      emergency_locations(*),
      emergency_report_events(* ORDER BY created_at ASC),
      emergency_media(*)
    `)
    .eq('id', params.id)
    .eq('user_id', user.id) // RLS enforced at DB but also here
    .single();

  if (error || !report) return NextResponse.json({ error: 'Report not found' }, { status: 404 });

  return NextResponse.json({ report });
}
