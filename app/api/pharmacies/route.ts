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
  const wilaya = searchParams.get('wilaya');
  const search = searchParams.get('q');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '12'), 50);
  const offset = (page - 1) * limit;

  let query = supabase
    .from('pharmacies')
    .select('*', { count: 'exact' })
    .eq('is_active', true)
    .range(offset, offset + limit - 1)
    .order('name');

  if (wilaya) query = query.eq('wilaya', wilaya);
  if (search) query = query.ilike('name', `%${search}%`);

  const { data: pharmacies, count, error } = await query;
  if (error) return NextResponse.json({ error: 'Failed to fetch pharmacies' }, { status: 500 });

  return NextResponse.json({ pharmacies, total: count, page, limit });
}
