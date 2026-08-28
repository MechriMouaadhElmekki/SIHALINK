import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const CANCELLABLE_STATUSES = ['DRAFT', 'SUBMITTED', 'RECEIVED'];

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: report } = await supabase
    .from('emergency_reports')
    .select('id, status, user_id')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single();

  if (!report) return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  if (!CANCELLABLE_STATUSES.includes(report.status)) {
    return NextResponse.json({ error: 'هذا البلاغ لا يمكن إلغاؤه في حالته الحالية' }, { status: 422 });
  }

  const body = await request.json().catch(() => ({})) as Record<string, string>;
  const reason = body.reason || 'ألغى المستخدم البلاغ';

  await supabase.from('emergency_reports').update({ status: 'CANCELLED' }).eq('id', params.id);
  await supabase.from('emergency_report_events').insert({
    report_id: params.id,
    event_type: 'REPORT_CANCELLED',
    actor_id: user.id,
    description: reason,
  });
  await supabase.from('audit_logs').insert({
    actor_id: user.id,
    action: 'EMERGENCY_REPORT_CANCELLED',
    entity: 'emergency_reports',
    entity_id: params.id,
    metadata: { reason },
  });

  return NextResponse.json({ success: true });
}
