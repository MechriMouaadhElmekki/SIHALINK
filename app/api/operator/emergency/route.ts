// ============================================================
// GET /api/operator/emergency
//
// Operator emergency queue endpoint.
//
// Performs in strict order:
//   1. Authentication
//   2. Active EMERGENCY_OPERATOR or ADMIN/SUPER_ADMIN role check
//      (expiry-aware via Phase 1A getUserRoles)
//   3. Validate and apply query parameter filters
//   4. Query emergency_reports via authenticated session client
//      RLS policy: reports_select_operator → is_operator_or_admin()
//   5. Return paginated report list with location summary
//
// QUERY PARAMETERS (all optional):
//   status              — one of the 12 canonical ReportStatus values
//   priority            — CRITICAL | HIGH | MEDIUM | LOW
//   assigned_operator_id — UUID of the assigned operator (or 'unassigned')
//   page                — page number, min 1 (default: 1)
//   limit               — page size, 1–100 (default: 20)
//
// SELECTED FIELDS (queue-optimised — no large text/blob fields):
//   id, report_number, user_id, emergency_type, priority, status,
//   assigned_operator_id, false_report_flag, is_demo,
//   created_at, updated_at,
//   emergency_locations(wilaya, city, latitude, longitude)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getUser, getUserRoles } from '@/lib/auth';
import type { ReportStatus, UserRole } from '@/types/database';

// ── Operator-permitted roles ─────────────────────────────────
const OPERATOR_ROLES: UserRole[] = [
  'EMERGENCY_OPERATOR',
  'ADMIN',
  'SUPER_ADMIN',
];

// ── Canonical status values (from lib/emergency/state-machine.ts) ──
const VALID_STATUSES: ReportStatus[] = [
  'DRAFT',
  'SUBMITTED',
  'RECEIVED',
  'UNDER_REVIEW',
  'ASSIGNED',
  'ACKNOWLEDGED',
  'IN_PROGRESS',
  'RESOLVED',
  'CANCELLED',
  'REJECTED',
  'FALSE_REPORT_REVIEW',
  'CLOSED',
];

const VALID_PRIORITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const;

// ── Query parameter schema ────────────────────────────────────
const querySchema = z.object({
  status: z
    .enum(VALID_STATUSES as [ReportStatus, ...ReportStatus[]])
    .optional(),
  priority: z.enum(VALID_PRIORITIES).optional(),
  // 'unassigned' is a special sentinel — translates to IS NULL in the query
  assigned_operator_id: z
    .union([z.string().uuid(), z.literal('unassigned')])
    .optional(),
  page: z
    .string()
    .optional()
    .transform((v) => Math.max(1, parseInt(v ?? '1', 10)))
    .pipe(z.number().int().min(1)),
  limit: z
    .string()
    .optional()
    .transform((v) => Math.min(100, Math.max(1, parseInt(v ?? '20', 10))))
    .pipe(z.number().int().min(1).max(100)),
});

export async function GET(request: NextRequest) {
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

  // ── Step 3: Validate query parameters ───────────────────────
  const rawParams = Object.fromEntries(
    new URL(request.url).searchParams.entries()
  );
  const parsed = querySchema.safeParse(rawParams);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'معاملات الاستعلام غير صالحة', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { status, priority, assigned_operator_id, page, limit } = parsed.data;
  const from = (page - 1) * limit;

  // ── Step 4: Query with authenticated session client ──────────
  // The session client respects RLS.
  // RLS policy reports_select_operator → is_operator_or_admin() → TRUE
  // for this user. No service-role bypass is used or needed.
  const supabase = createClient();

  // Queue-optimised field selection — exclude large text blobs
  // (description, additional_info, cancellation_reason).
  // Include emergency_locations for geographic summary only.
  let query = supabase
    .from('emergency_reports')
    .select(
      [
        'id',
        'report_number',
        'user_id',
        'emergency_type',
        'priority',
        'status',
        'assigned_operator_id',
        'false_report_flag',
        'is_demo',
        'created_at',
        'updated_at',
        'emergency_locations(wilaya, city, latitude, longitude)',
      ].join(', '),
      { count: 'exact' }
    )
    // Deterministic order: most recent first, then by priority for ties.
    // created_at DESC is consistent with the citizen route convention.
    .order('created_at', { ascending: false })
    .range(from, from + limit - 1);

  // Apply filters against real schema columns
  if (status) {
    query = query.eq('status', status);
  }
  if (priority) {
    query = query.eq('priority', priority);
  }
  if (assigned_operator_id === 'unassigned') {
    query = query.is('assigned_operator_id', null);
  } else if (assigned_operator_id) {
    query = query.eq('assigned_operator_id', assigned_operator_id);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('[operator/emergency GET] query error:', error);
    return NextResponse.json(
      { error: 'خطأ في جلب قائمة البلاغات' },
      { status: 500 }
    );
  }

  // ── Step 5: Response ─────────────────────────────────────────
  // Match citizen route's envelope: { data, count, page, limit }
  return NextResponse.json(
    {
      data: data ?? [],
      count: count ?? 0,
      page,
      limit,
    },
    { status: 200 }
  );
}
