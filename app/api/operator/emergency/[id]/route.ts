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
//   4. 404 on PGRST116 (no row); 500 on all other report errors.
//      Do NOT convert non-PGRST116 DB errors to 404.
//   5. Fetch related data via authenticated session client in parallel:
//      - emergency_locations   (locations_select_operator RLS)
//      - emergency_triage_answers (triage_select_operator RLS)
//      - emergency_report_events  (events_select_operator RLS)
//        ALL events regardless of is_visible_to_user
//   6. Surface any related-data query error as HTTP 500.
//      An empty array is legitimately possible (no locations recorded,
//      no triage taken, no events yet). A query *error* is not empty
//      data — it must not be silently returned as [] to the caller.
//   7. Return composed detail object on full success.
//
// RLS coverage (verified Batch 3):
//   reports_select_operator        → is_operator_or_admin() → SELECT all
//   locations_select_operator      → is_operator_or_admin() → SELECT all
//   triage_select_operator         → is_operator_or_admin() → SELECT all
//   events_select_operator         → is_operator_or_admin() → SELECT all
//
// No service-role client is used for reads in this endpoint.
//
// Column sources (all verified against migration 001_initial_schema.sql):
//   emergency_reports        — id, report_number, user_id, emergency_type,
//                              priority, status, description, additional_info,
//                              affected_count, assigned_operator_id,
//                              false_report_flag, cancellation_reason,
//                              cancelled_at, resolved_at, is_demo,
//                              created_at, updated_at
//   emergency_locations      — id, latitude, longitude, accuracy, altitude,
//                              address, city, wilaya, commune, is_manual,
//                              captured_at, created_at
//   emergency_triage_answers — id, question_key, question_text_ar,
//                              question_text_fr, question_text_en, answer,
//                              answer_display_ar, weight, created_at
//   emergency_report_events  — id, event_type, actor_id, actor_role,
//                              description, metadata, is_visible_to_user,
//                              created_at
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUser, getUserRoles } from '@/lib/auth';
import type { UserRole } from '@/types/database';

// ── Operator-permitted roles ──────────────────────────────────────────────────
const OPERATOR_ROLES: UserRole[] = [
  'EMERGENCY_OPERATOR',
  'ADMIN',
  'SUPER_ADMIN',
];

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  // ── Step 1: Authentication ───────────────────────────────────────────────────
  const user = await getUser();
  if (!user) {
    return NextResponse.json(
      { error: 'المصادقة مطلوبة' },
      { status: 401 }
    );
  }

  // ── Step 2: Active role check ────────────────────────────────────────────────
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

  // ── Step 3: Fetch report ─────────────────────────────────────────────────────
  // Authenticated session client — RLS reports_select_operator permits
  // operators to SELECT any row. No service-role bypass.
  //
  // All columns verified against migration 001_initial_schema.sql.
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

  // ── Step 4: 404 / 500 for report errors ─────────────────────────────────────
  // .single() returns PGRST116 when no row matches.
  // Only PGRST116 becomes 404 — all other errors remain 500.
  // Never conflate a database error with "report not found".
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

  // ── Step 5: Fetch related data in parallel ───────────────────────────────────
  // All three queries use the authenticated session client.
  // RLS operator policies cover all three tables without ownership
  // restriction — is_operator_or_admin() resolves to TRUE for this user.
  //
  // emergency_report_events: ALL events are returned regardless of
  // is_visible_to_user. The citizen SELECT policy filters on that flag;
  // events_select_operator does not. The field is preserved in the response
  // so the operator UI can distinguish citizen-visible vs internal events.
  //
  // All column names verified against migration 001_initial_schema.sql.
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

  // ── Step 6: Surface related-data errors as 500 ──────────────────────────────
  // An empty array (data: [], error: null) is legitimate — a new report
  // may have no locations yet, no triage, no events. That is correctly
  // returned as []. A query *error* (error: non-null) is NOT empty data.
  // Returning it silently as [] would mislead the caller into believing the
  // related table is simply empty when in fact the query failed.
  // No project convention exists for swallowing partial failures
  // (the citizen detail route is a single-query route with no composition).
  if (locError) {
    console.error('[operator/emergency/[id] GET] locations error:', locError);
    return NextResponse.json(
      { error: 'خطأ في جلب بيانات الموقع' },
      { status: 500 }
    );
  }
  if (triageError) {
    console.error('[operator/emergency/[id] GET] triage error:', triageError);
    return NextResponse.json(
      { error: 'خطأ في جلب بيانات الفرز' },
      { status: 500 }
    );
  }
  if (eventsError) {
    console.error('[operator/emergency/[id] GET] events error:', eventsError);
    return NextResponse.json(
      { error: 'خطأ في جلب سجل الأحداث' },
      { status: 500 }
    );
  }

  // ── Step 7: Response ─────────────────────────────────────────────────────────
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
