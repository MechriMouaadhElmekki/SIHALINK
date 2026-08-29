import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const { data: apt } = await supabase
    .from('appointments')
    .select('id, status')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single();

  if (!apt) return NextResponse.json({ error: 'لم يتم العثور على الموعد' }, { status: 404 });
  if (!['REQUESTED','CONFIRMED'].includes(apt.status)) {
    return NextResponse.json({ error: 'لا يمكن إلغاء هذا الموعد' }, { status: 422 });
  }

  const { error } = await supabase
    .from('appointments')
    .update({ status: 'CANCELLED' })
    .eq('id', params.id)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: 'خطأ في الإلغاء' }, { status: 500 });
  return NextResponse.redirect(new URL('/appointments', _req.url));
}
