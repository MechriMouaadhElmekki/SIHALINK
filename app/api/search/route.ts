import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') ?? '').trim();
  if (q.length < 2) return NextResponse.json({ doctors: [], pharmacies: [], facilities: [], guides: [] });

  const [doctors, pharmacies, facilities, guides] = await Promise.all([
    supabase
      .from('doctors')
      .select('id, first_name, last_name, specialty, wilaya')
      .eq('is_active', true)
      .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,specialty.ilike.%${q}%`)
      .limit(5),
    supabase
      .from('pharmacies')
      .select('id, name, city, wilaya, is_on_duty')
      .ilike('name', `%${q}%`)
      .limit(5),
    supabase
      .from('health_facilities')
      .select('id, name, facility_type, city, wilaya')
      .ilike('name', `%${q}%`)
      .limit(5),
    supabase
      .from('first_aid_guides')
      .select('id, title_ar, severity')
      .eq('is_published', true)
      .ilike('title_ar', `%${q}%`)
      .limit(5),
  ]);

  return NextResponse.json({
    doctors: doctors.data ?? [],
    pharmacies: pharmacies.data ?? [],
    facilities: facilities.data ?? [],
    guides: guides.data ?? [],
  });
}
