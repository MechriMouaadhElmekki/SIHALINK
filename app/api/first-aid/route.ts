import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') ?? '';
  const category = searchParams.get('category') ?? '';
  const severity = searchParams.get('severity') ?? '';
  const limit = Math.min(100, parseInt(searchParams.get('limit') ?? '20'));
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const from = (page - 1) * limit;

  let query = supabase
    .from('first_aid_guides')
    .select('id, title_ar, summary_ar, category, severity, estimated_time_minutes', { count: 'exact' })
    .eq('is_published', true)
    .order('severity', { ascending: true })
    .order('title_ar', { ascending: true })
    .range(from, from + limit - 1);

  if (search) query = query.ilike('title_ar', `%${search}%`);
  if (category) query = query.eq('category', category);
  if (severity) query = query.eq('severity', severity);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: 'خطأ' }, { status: 500 });
  return NextResponse.json({ data, count, page, limit });
}
