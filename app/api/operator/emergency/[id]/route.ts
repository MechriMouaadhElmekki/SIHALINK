// ============================================================
// GET /api/operator/emergency/[id]
//
// Operator emergency report detail endpoint.
//
// Performs in strict order:
//   1. Authentication
//   2. Active EMERGENCY_OPERATOR or ADMIN/SUPER_ADMIN role check
//      (expiry-aware via Phase 1A getUserRoles)
//   3. Fetch emergency_reports row (session client / RLS)
//   4. 404 on missing row — do NOT convert DB errors to 404
//   5. Fetch related data via authenticated session client:
//      - emergency_locations   (locations_select_operator RLS)
//      - emergency_triage_answers (triage_select_operator RLS)
//      - emergency_report_events  (events_select_operator RLS)
//        ALL events regardless of is_visible_to_user
//   6. Return composed detail object
//
// RLS coverage (verified in Batch 3):
//   reports_select_operator        → is_operator_or_admin() → SELECT all
//   locations_select_operator      → is_operator_or_admin() → SELECT all
//   triage_select_operator         → is_operator_or_admin() → SELECT all
//   events_select_operator         → is_operator_or_admin() → SELECT all
//
// No service-role client is used for reads in this endpoint.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUser, getUserRoles } from '@/lib/auth';
import type { UserRole } from '@/types/database';

// ── Operator-permitted roles ─────────────────────────────────
const OPERATOR_ROLES: UserRole[] = [
  'EMERGENCY_OPERATOR',
  'ADMIN',
  'SUPER_ADMIN',
];

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  // ── Step 1: Authentication ───────────────────────────────────
  const user = await getUser();
  if (!user) {
    return NextResponse.json(
      { error: 'المصادقة مطلوبة' },
      { status: 401 }
    );
  }

  // ── Step 2: Active role check ────────────────────────────────
  // getUserRoles() enforces expires_at (ROOT-01 fix).
  const roles = await getUserRoles(user.id);
  const isOperator = OPERATOR_ROLES.some((r) => roles.includes(r));
  if (!isOperator) {
    return NextResponse.json(
      { error: 'غير مصرح لك بهذا الإجراء' },
      { status: 403 }
    );
  }

  const reportId = params.id;

  // ── Step 3: Fetch report ──────────────────────────────────────
  // Use authenticated session client — RLS reports_select_operator permits
  // operators to SELECT any row. Do NOT use service-role for this read.
  //
  // Full field set for operator detail (all schema columns on emergency_reports):
  const supabase = createClient();

  const { data: report, error: reportError } = await supabase
    .from('emergency_reports')
    .select(
      [
        'id',
        'report_number',
        'user_id',
        'emergency_type',
        'priority',
        'status',
        'description',
        'additional_info',
        'affected_count',
        'assigned_operator_id',
        'false_report_flag',
        'cancellation_reason',
        'cancelled_at',
        'resolved_at',
        'is_demo',
        'created_at',
        'updated_at',
      ].join(', ')
    )
    .eq('id', reportId)
    .single();

  // ── Step 4: 404 handling ─────────────────────────────────────
  // .single() returns an error with code PGRST116 if no row matches.
  // Only convert PGRST116 to 404 — preserve other errors as 500.
  if (reportError) {
    if (reportError.code === 'PGRST116') {
      return NextResponse.json(
        { error: 'لم يتم العثور على البلاغ' },
        { status: 404 }
      );
    }
    console.error('[operator/emergency/[id] GET] report fetch error:', reportError);
    return NextResponse.json(
      { error: 'خطأ في جلب بيانات البلاغ' },
      { status: 500 }
    );
  }

  // ── Step 5: Fetch related data in parallel ───────────────────
  // All queries use the authenticated session client.
  // RLS policies for operators cover all three tables without ownership
  // restriction — locations_select_operator, triage_select_operator,
  // events_select_operator all resolve via is_operator_or_admin().
  //
  // emergency_report_events: ALL events are returned regardless of
  // is_visible_to_user. The citizen SELECT policy filters on that flag;
  // the operator SELECT policy (events_select_operator) does not.
  const [
    { data: locations, error: locError },
    { data: triage, error: triageError },
    { data: events, error: eventsError },
  ] = await Promise.all([
    supabase
      .from('emergency_locations')
      .select(
        [
          'id',
          'latitude',
          'longitude',
          'accuracy',
          'altitude',
          'address',
          'city',
          'wilaya',
          'commune',
          'is_manual',
          'captured_at',
          'created_at',
        ].join(', ')
      )
      .eq('report_id', reportId)
      .order('created_at', { ascending: false }),

    supabase
      .from('emergency_triage_answers')
      .select(
        [
          'id',
          'question_key',
          'question_text_ar',
          'question_text_fr',
          'question_text_en',
          'answer',
          'answer_display_ar',
          'weight',
          'created_at',
        ].join(', ')
      )
      .eq('report_id', reportId)
      .order('created_at', { ascending: true }),

    supabase
      .from('emergency_report_events')
      .select(
        [
          'id',
          'event_type',
          'actor_id',
          'actor_role',
          'description',
          'metadata',
          'is_visible_to_user',
          'created_at',
        ].join(', ')
      )
      .eq('report_id', reportId)
      // Chronological order — oldest first for timeline reconstruction
      .order('created_at', { ascending: true }),
  ]);

  // Log non-fatal related-data errors but do not fail the response.
  // The core report record was fetched successfully; partial related data
  // is preferable to a 500 that blocks the operator from seeing the report.
  if (locError) {
    console.error('[operator/emergency/[id] GET] locations error:', locError);
  }
  if (triageError) {
    console.error('[operator/emergency/[id] GET] triage error:', triageError);
  }
  if (eventsError) {
    console.error('[operator/emergency/[id] GET] events error:', eventsError);
  }

  // ── Step 6: Response ─────────────────────────────────────────
  return NextResponse.json(
    {
      report,
      locations: locations ?? [],
      triage_answers: triage ?? [],
      events: events ?? [],
    },
    { status: 200 }
  );
}
