import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const schema = z.object({
  doctor_id: z.string().uuid(),
  appointment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  appointment_time: z.string().regex(/^\d{2}:\d{2}$/),
  consultation_type: z.enum(['IN_PERSON','VIDEO','PHONE','HOME_VISIT']).default('IN_PERSON'),
  reason: z.string().max(500).optional().default(''),
  notes: z.string().max(1000).optional().default(''),
});

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'بيانات غير صالحة', details: parsed.error.flatten() }, { status: 422 });

  const d = parsed.data;
  // Verify appointment date is not in the past
  if (d.appointment_date < new Date().toISOString().split('T')[0]) {
    return NextResponse.json({ error: 'تاريخ الموعد في الماضي' }, { status: 422 });
  }

  const { data, error } = await supabase
    .from('appointments')
    .insert({ user_id: user.id, status: 'REQUESTED', ...d })
    .select('id, appointment_date, appointment_time, status')
    .single();

  if (error) {
    console.error('[appointments POST]', error);
    return NextResponse.json({ error: 'خطأ في حجز الموعد' }, { status: 500 });
  }

  await supabase.from('notifications').insert({
    user_id: user.id,
    type: 'APPOINTMENT_REQUESTED',
    title_ar: 'تم إرسال طلب الحجز',
    message_ar: `موعدك بتاريخ ${d.appointment_date} قيد المراجعة.`,
    related_appointment_id: data!.id,
    is_read: false,
  }).maybeSingle();

  return NextResponse.json(data, { status: 201 });
}

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const { data, error } = await supabase
    .from('appointments')
    .select('id, appointment_date, appointment_time, consultation_type, status, reason, doctors(first_name, last_name, specialty)')
    .eq('user_id', user.id)
    .order('appointment_date', { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: 'خطأ' }, { status: 500 });
  return NextResponse.json({ data });
}
