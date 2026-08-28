import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const cookieStore = cookies();
  const supabase = createServerClient(
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

  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');

  let query = supabase
    .from('first_aid_guides')
    .select('*, first_aid_categories(name_ar, name_fr, name_en, icon), first_aid_steps(* ORDER BY step_order ASC)')
    .eq('status', 'PUBLISHED');

  if (category) query = query.eq('category_id', category);

  const { data: guides, error } = await query;
  if (error) return NextResponse.json({ error: 'Failed to fetch guides' }, { status: 500 });

  return NextResponse.json({ guides });
}
