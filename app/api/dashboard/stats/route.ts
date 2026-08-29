import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const [reportsRes, appointmentsRes, notifRes, profileRes] = await Promise.all([
    supabase
      .from('emergency_reports')
      .select('id, status, priority, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('appointments')
      .select('id, appointment_date, appointment_time, status, doctors(first_name, last_name, specialty)')
      .eq('user_id', user.id)
      .in('status', ['REQUESTED', 'CONFIRMED'])
      .order('appointment_date', { ascending: true })
      .limit(3),
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false),
    supabase
      .from('profiles')
      .select('first_name, last_name, blood_type, profile_completion_score')
      .eq('id', user.id)
      .single(),
  ]);

  return NextResponse.json({
    recent_reports: reportsRes.data ?? [],
    upcoming_appointments: appointmentsRes.data ?? [],
    unread_notifications: notifRes.count ?? 0,
    profile: profileRes.data ?? null,
  });
}
