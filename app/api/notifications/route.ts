import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const unread_only = searchParams.get('unread_only') === 'true';
  const limit = Math.min(100, parseInt(searchParams.get('limit') ?? '30'));

  let query = supabase
    .from('notifications')
    .select('id, type, title_ar, message_ar, is_read, created_at, related_report_id, related_appointment_id', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (unread_only) query = query.eq('is_read', false);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: 'خطأ' }, { status: 500 });
  return NextResponse.json({ data, count });
}

export async function PATCH(req: NextRequest) {
  const supabase = createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const ids: string[] | undefined = body.ids;
  const mark_all: boolean = body.mark_all === true;

  let query = supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id);

  if (!mark_all && ids && ids.length > 0) {
    query = query.in('id', ids);
  }

  const { error } = await query;
  if (error) return NextResponse.json({ error: 'خطأ في التحديث' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
