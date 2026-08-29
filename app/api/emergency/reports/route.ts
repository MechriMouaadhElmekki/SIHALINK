import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { generateReportNumber } from '@/lib/utils';

const bodySchema = z.object({
  emergency_type: z.string().min(1),
  description: z.string().max(1000).optional().default(''),
  affected_count: z.number().int().min(1).max(100).default(1),
  additional_info: z.string().max(2000).optional().default(''),
  triage_answers: z.array(
    z.object({
      question_key: z.string(),
      question_text_ar: z.string(),
      answer: z.string(),
      answer_display_ar: z.string(),
      weight: z.number(),
    })
  ).default([]),
  priority: z.enum(['CRITICAL','HIGH','MEDIUM','LOW']).default('MEDIUM'),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
    accuracy: z.number().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    wilaya: z.string().optional(),
    commune: z.string().optional(),
    is_manual: z.boolean(),
  }).nullable().optional(),
});

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 }); }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'تحقق من البيانات', details: parsed.error.flatten() }, { status: 422 });
  }

  const d = parsed.data;
  const report_number = generateReportNumber();

  const { data: report, error } = await supabase
    .from('emergency_reports')
    .insert({
      user_id: user.id,
      report_number,
      emergency_type: d.emergency_type,
      description: d.description,
      affected_count: d.affected_count,
      additional_info: d.additional_info,
      triage_answers: d.triage_answers,
      priority: d.priority,
      status: 'SUBMITTED',
      location_latitude: d.location?.latitude ?? null,
      location_longitude: d.location?.longitude ?? null,
      location_accuracy: d.location?.accuracy ?? null,
      location_address: d.location?.address ?? null,
      location_city: d.location?.city ?? null,
      location_wilaya: d.location?.wilaya ?? null,
      location_commune: d.location?.commune ?? null,
      location_is_manual: d.location?.is_manual ?? false,
    })
    .select('id, report_number, status, priority')
    .single();

  if (error) {
    console.error('[emergency/reports POST]', error);
    return NextResponse.json({ error: 'خطأ في حفظ البلاغ' }, { status: 500 });
  }

  // Create notification
  await supabase.from('notifications').insert({
    user_id: user.id,
    type: 'REPORT_SUBMITTED',
    title_ar: 'تم استلام بلاغك',
    message_ar: `بلاغك رقم ${report_number} قيد المعالجة.`,
    related_report_id: report!.id,
    is_read: false,
  }).maybeSingle();

  return NextResponse.json({
    id: report!.id,
    report_number: report!.report_number,
    status: report!.status,
    priority: report!.priority,
  }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(50, parseInt(searchParams.get('limit') || '20'));
  const status = searchParams.get('status');
  const from = (page - 1) * limit;

  let query = supabase
    .from('emergency_reports')
    .select('id, report_number, emergency_type, priority, status, created_at, location_wilaya, location_city', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(from, from + limit - 1);

  if (status) query = query.eq('status', status);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: 'خطأ في جلب البلاغات' }, { status: 500 });

  return NextResponse.json({ data, count, page, limit });
}
