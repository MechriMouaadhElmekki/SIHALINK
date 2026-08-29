import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') ?? '';
  const facility_type = searchParams.get('facility_type') ?? '';
  const wilaya = searchParams.get('wilaya') ?? '';
  const has_emergency = searchParams.get('has_emergency') === 'true';
  const limit = Math.min(100, parseInt(searchParams.get('limit') ?? '20'));
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const from = (page - 1) * limit;

  let query = supabase
    .from('health_facilities')
    .select('id, name, facility_type, address, city, wilaya, phone, emergency_phone, opening_hours, has_emergency, latitude, longitude', { count: 'exact' })
    .order('has_emergency', { ascending: false })
    .order('name', { ascending: true })
    .range(from, from + limit - 1);

  if (search) query = query.ilike('name', `%${search}%`);
  if (facility_type) query = query.eq('facility_type', facility_type);
  if (wilaya) query = query.eq('wilaya', wilaya);
  if (has_emergency) query = query.eq('has_emergency', true);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: 'خطأ' }, { status: 500 });
  return NextResponse.json({ data, count, page, limit });
}
