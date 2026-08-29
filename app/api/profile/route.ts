import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const schema = z.object({
  first_name:               z.string().max(100).optional(),
  last_name:                z.string().max(100).optional(),
  phone:                    z.string().max(20).optional(),
  date_of_birth:            z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
  blood_type:               z.enum(['A+','A-','B+','B-','AB+','AB-','O+','O-','']).optional(),
  wilaya:                   z.string().max(100).optional(),
  city:                     z.string().max(100).optional(),
  address:                  z.string().max(300).optional(),
  preferred_language:       z.enum(['ar','fr','en']).optional(),
  emergency_contact_name:   z.string().max(200).optional(),
  emergency_contact_phone:  z.string().max(20).optional(),
  medical_allergies:        z.string().max(500).optional(),
  chronic_conditions:       z.string().max(500).optional(),
});

export async function GET(_req: NextRequest) {
  const supabase = createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (error) return NextResponse.json({ error: 'خطأ' }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const supabase = createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 422 });

  const updates = Object.fromEntries(
    Object.entries(parsed.data).filter(([, v]) => v !== undefined && v !== '')
  );

  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', user.id)
    .select()
    .single();

  if (error) {
    console.error('[PATCH /api/profile]', error);
    return NextResponse.json({ error: 'خطأ في الحفظ' }, { status: 500 });
  }
  return NextResponse.json(data);
}
