import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const createSchema = z.object({
  doctor_id: z.string().uuid(),
  appointment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  appointment_time: z.string().regex(/^\d{2}:\d{2}$/),
  consultation_type: z.enum(['IN_PERSON', 'VIDEO', 'PHONE']),
  reason: z.string().min(5).max(500),
});

function createClient() {
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

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });

    const { doctor_id, appointment_date, appointment_time, consultation_type, reason } = parsed.data;

    // Prevent double booking - check at DB level
    const { data: existing } = await supabase
      .from('appointments')
      .select('id')
      .eq('doctor_id', doctor_id)
      .eq('appointment_date', appointment_date)
      .eq('appointment_time', appointment_time)
      .not('status', 'in', '(CANCELLED_BY_USER,CANCELLED_BY_DOCTOR)')
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'هذا الموعد محجوز بالفعل. يرجى اختيار وقت آخر.' }, { status: 409 });
    }

    const { data: appointment, error } = await supabase
      .from('appointments')
      .insert({
        user_id: user.id,
        doctor_id,
        appointment_date,
        appointment_time,
        consultation_type,
        reason,
        status: 'REQUESTED',
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: 'Failed to create appointment' }, { status: 500 });

    await supabase.from('notifications').insert({
      user_id: user.id,
      type: 'APPOINTMENT_UPDATE',
      title: 'تم حجز موعدك',
      body: `تم تقديم طلب موعد ليوم ${appointment_date} الساعة ${appointment_time}`,
      data: { appointment_id: appointment.id },
    });

    await supabase.from('audit_logs').insert({
      actor_id: user.id,
      action: 'APPOINTMENT_CREATED',
      entity: 'appointments',
      entity_id: appointment.id,
    });

    return NextResponse.json({ success: true, appointment }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  let query = supabase
    .from('appointments')
    .select('*, doctors(*, profiles(first_name, last_name, avatar_url)), specialties(*)')
    .eq('user_id', user.id)
    .order('appointment_date', { ascending: false });

  if (status) query = query.eq('status', status);

  const { data: appointments, error } = await query;
  if (error) return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 });

  return NextResponse.json({ appointments });
}
