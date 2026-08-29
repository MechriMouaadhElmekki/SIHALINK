import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') ?? '';
  const wilaya = searchParams.get('wilaya') ?? '';
  const on_duty = searchParams.get('on_duty') === 'true';
  const limit = Math.min(100, parseInt(searchParams.get('limit') ?? '20'));
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const from = (page - 1) * limit;

  let query = supabase
    .from('pharmacies')
    .select('id, name, address, city, wilaya, phone, opening_hours, is_on_duty, latitude, longitude', { count: 'exact' })
    .order('is_on_duty', { ascending: false })
    .order('name', { ascending: true })
    .range(from, from + limit - 1);

  if (search) query = query.ilike('name', `%${search}%`);
  if (wilaya) query = query.eq('wilaya', wilaya);
  if (on_duty) query = query.eq('is_on_duty', true);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: 'خطأ' }, { status: 500 });
  return NextResponse.json({ data, count, page, limit });
}
