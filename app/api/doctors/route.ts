import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') ?? '';
  const specialty = searchParams.get('specialty') ?? '';
  const wilaya = searchParams.get('wilaya') ?? '';
  const limit = Math.min(100, parseInt(searchParams.get('limit') ?? '20'));
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const from = (page - 1) * limit;

  let query = supabase
    .from('doctors')
    .select('id, first_name, last_name, specialty, wilaya, city, consultation_fee, years_experience, profile_image_url', { count: 'exact' })
    .eq('is_active', true)
    .order('last_name', { ascending: true })
    .range(from, from + limit - 1);

  if (search) {
    query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,specialty.ilike.%${search}%`);
  }
  if (specialty) query = query.ilike('specialty', `%${specialty}%`);
  if (wilaya) query = query.eq('wilaya', wilaya);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: 'خطأ في جلب البيانات' }, { status: 500 });

  return NextResponse.json({ data, count, page, limit });
}
