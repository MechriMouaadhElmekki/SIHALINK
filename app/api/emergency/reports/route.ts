import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
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

  // ── Step 1: Insert into emergency_reports (only columns that exist on the table) ──
  const { data: report, error: reportErr } = await supabase
    .from('emergency_reports')
    .insert({
      user_id: user.id,
      report_number,
      emergency_type: d.emergency_type,
      description: d.description || null,
      affected_count: d.affected_count,
      additional_info: d.additional_info || null,
      priority: d.priority,
      status: 'SUBMITTED',
    })
    .select('id, report_number, status, priority')
    .single();

  if (reportErr || !report) {
    console.error('[emergency/reports POST] report insert:', reportErr);
    return NextResponse.json({ error: 'خطأ في حفظ البلاغ' }, { status: 500 });
  }

  const reportId = report.id;

  // ── Step 2: Insert related rows; compensate (delete report) on failure ──
  const relatedInserts: Promise<{ error: unknown }>[] = [];

  // 2a. Location → emergency_locations
  if (d.location) {
    relatedInserts.push(
      supabase.from('emergency_locations').insert({
        report_id: reportId,
        latitude: d.location.latitude,
        longitude: d.location.longitude,
        accuracy: d.location.accuracy ?? null,
        address: d.location.address ?? null,
        city: d.location.city ?? null,
        wilaya: d.location.wilaya ?? null,
        commune: d.location.commune ?? null,
        is_manual: d.location.is_manual,
      })
    );
  }

  // 2b. Triage answers → emergency_triage_answers
  if (d.triage_answers.length > 0) {
    const triageRows = d.triage_answers.map((a) => ({
      report_id: reportId,
      question_key: a.question_key,
      question_text_ar: a.question_text_ar,
      answer: a.answer,
      answer_display_ar: a.answer_display_ar,
      weight: a.weight,
    }));
    relatedInserts.push(supabase.from('emergency_triage_answers').insert(triageRows));
  }

  if (relatedInserts.length > 0) {
    const results = await Promise.all(relatedInserts);
    const failed = results.find((r) => r.error);
    if (failed) {
      console.error('[emergency/reports POST] related insert failed:', failed.error);
      // Compensating delete — use admin client to bypass RLS on the freshly-created row
      const admin = createAdminClient();
      await admin.from('emergency_reports').delete().eq('id', reportId);
      return NextResponse.json({ error: 'خطأ في حفظ بيانات البلاغ' }, { status: 500 });
    }
  }

  // ── Step 3: Notification (best-effort, non-blocking) ──
  // type must be one of the schema enum values; use 'emergency_update'
  // columns: title_ar, body_ar, related_entity_type, related_entity_id
  supabase.from('notifications').insert({
    user_id: user.id,
    type: 'emergency_update',
    title_ar: 'تم استلام بلاغك',
    body_ar: `بلاغك رقم ${report_number} قيد المعالجة.`,
    related_entity_type: 'emergency_report',
    related_entity_id: reportId,
    is_read: false,
  }).then(({ error: notifErr }) => {
    if (notifErr) console.error('[emergency/reports POST] notification:', notifErr);
  });

  return NextResponse.json({
    id: reportId,
    report_number: report.report_number,
    status: report.status,
    priority: report.priority,
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

  // Select only columns that exist on emergency_reports;
  // join emergency_locations for wilaya/city summary
  let query = supabase
    .from('emergency_reports')
    .select(
      'id, report_number, emergency_type, priority, status, created_at, emergency_locations(wilaya, city)',
      { count: 'exact' }
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(from, from + limit - 1);

  if (status) query = query.eq('status', status);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: 'خطأ في جلب البلاغات' }, { status: 500 });

  return NextResponse.json({ data, count, page, limit });
}
