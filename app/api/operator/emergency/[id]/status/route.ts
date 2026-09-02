// ============================================================
// POST /api/operator/emergency/[id]/status
//
// Operator emergency report lifecycle endpoint.
//
// Performs in strict order:
//   1. Authentication
//   2. Active EMERGENCY_OPERATOR or ADMIN/SUPER_ADMIN role check
//      (expiry-aware via Phase 1A getUserRoles)
//   3. Load report — 404 if absent
//   4. State-machine validation (lib/emergency/state-machine.ts)
//   5. Atomic DB update WHERE id AND status = expected_current
//      → 409 if row not updated (stale state / race condition)
//   6. Record emergency_report_events
//   7. Write audit_logs via writeAuditLog
//   8. Send notification via createNotification (best-effort)
//   9. Return updated report
//
// AUTHORITY CONSTRAINT:
//   This endpoint uses the MOCK dispatch provider only.
//   No real authority / government API is integrated.
//   Real dispatch is a future integration pending authorization.
//
// SERVICE-ROLE JUSTIFICATION:
//   The authenticated Supabase client is used for the status UPDATE.
//   createAdminClient is used ONLY for audit_logs and notifications,
//   which are operator-write-only tables with no RLS path for the
//   session client. Authorization is fully enforced BEFORE any
//   admin-client call. This does NOT repeat ROOT-02.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import {
  getUser,
  getUserRoles,
  AuthenticationError,
  AuthorizationError,
} from '@/lib/auth';
import {
  canTransition,
  isTerminalStatus,
} from '@/lib/emergency/state-machine';
import { writeAuditLog } from '@/lib/audit';
import { createNotification } from '@/lib/notifications';
import type { ReportStatus, UserRole } from '@/types/database';

// ── Operator-permitted roles ─────────────────────────────────
const OPERATOR_ROLES: UserRole[] = [
  'EMERGENCY_OPERATOR',
  'ADMIN',
  'SUPER_ADMIN',
];

// ── Arabic status labels for notifications ───────────────────
const STATUS_LABEL_AR: Record<ReportStatus, string> = {
  DRAFT: 'مسودة',
  SUBMITTED: 'مقدَّم',
  RECEIVED: 'مستلَم',
  UNDER_REVIEW: 'قيد المراجعة',
  ASSIGNED: 'مُحال',
  ACKNOWLEDGED: 'جارٍ التأكيد',
  IN_PROGRESS: 'جارٍ التنفيذ',
  RESOLVED: 'تمت المعالجة',
  CANCELLED: 'ملغى',
  REJECTED: 'مرفوض',
  FALSE_REPORT_REVIEW: 'مراجعة بلاغ كاذب',
  CLOSED: 'مغلق',
};

// ── Request schema ────────────────────────────────────────────
// Fields accepted by the operator. All transition-specific data
// maps to EXISTING schema columns (confirmed in pre-change audit).
//
// assigned_operator_id — EmergencyReport.assigned_operator_id
// reason               — stored in event description / audit metadata
//                        (cancellation_reason column used for CANCELLED)
//
// DO NOT add columns that don't exist on emergency_reports.
const bodySchema = z.object({
  target_status: z.enum([
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
  ] as [ReportStatus, ...ReportStatus[]]),
  reason: z.string().max(1000).optional(),
  // For ASSIGNED transitions — maps to existing assigned_operator_id column
  assigned_operator_id: z.string().uuid().optional(),
});

export async function POST(
  request: NextRequest,
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
  // getUserRoles() enforces expires_at filtering (ROOT-01 fix).
  // An expired EMERGENCY_OPERATOR or ADMIN will not appear here.
  const roles = await getUserRoles(user.id);
  const isOperator = OPERATOR_ROLES.some((r) => roles.includes(r));
  if (!isOperator) {
    return NextResponse.json(
      { error: 'غير مصرح لك بهذا الإجراء' },
      { status: 403 }
    );
  }

  // Determine the effective actor role for audit records
  const actorRole: UserRole = roles.includes('SUPER_ADMIN')
    ? 'SUPER_ADMIN'
    : roles.includes('ADMIN')
    ? 'ADMIN'
    : 'EMERGENCY_OPERATOR';

  // ── Step 3: Parse and validate request body ──────────────────
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'جسم الطلب غير صالح' },
      { status: 422 }
    );
  }

  const parsed = bodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'بيانات غير صالحة', details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { target_status, reason, assigned_operator_id } = parsed.data;
  const reportId = params.id;

  // ── Step 4 & 5: Load the report ──────────────────────────────
  // Use the authenticated session client (respects RLS).
  // Operators must be able to read emergency_reports — ensure RLS
  // policy allows EMERGENCY_OPERATOR reads; if not, this returns 404.
  const supabase = createClient();

  const { data: report, error: fetchError } = await supabase
    .from('emergency_reports')
    .select(
      'id, report_number, user_id, status, priority, emergency_type, assigned_operator_id'
    )
    .eq('id', reportId)
    .single();

  if (fetchError || !report) {
    return NextResponse.json(
      { error: 'لم يتم العثور على البلاغ' },
      { status: 404 }
    );
  }

  const currentStatus = report.status as ReportStatus;

  // ── Step 6: State-machine validation ─────────────────────────
  // ONLY lib/emergency/state-machine.ts (Batch 2 canonical).
  // lib/emergency-state-machine.ts is the legacy divergent file
  // and must NOT be used (it contains ESCALATED — not a real status).
  if (!canTransition(currentStatus, target_status)) {
    return NextResponse.json(
      {
        error: `الانتقال غير صالح: ${currentStatus} → ${target_status}`,
        current_status: currentStatus,
        valid_transitions: [],
      },
      { status: 409 }
    );
  }

  // ── Step 7: Transition-specific field preparation ────────────
  // Map to EXISTING emergency_reports columns only.
  // No new columns are invented here.
  const updatePayload: Record<string, unknown> = {
    status: target_status,
    updated_at: new Date().toISOString(),
  };

  if (target_status === 'ASSIGNED' && assigned_operator_id) {
    // assigned_operator_id exists on emergency_reports (confirmed in types/database.ts)
    updatePayload.assigned_operator_id = assigned_operator_id;
  }

  if (target_status === 'CANCELLED') {
    // cancellation_reason and cancelled_at exist on emergency_reports
    updatePayload.cancellation_reason = reason ?? 'إلغاء بواسطة المشغّل';
    updatePayload.cancelled_at = new Date().toISOString();
  }

  if (target_status === 'RESOLVED') {
    // resolved_at exists on emergency_reports
    updatePayload.resolved_at = new Date().toISOString();
  }

  if (target_status === 'FALSE_REPORT_REVIEW') {
    // false_report_flag exists on emergency_reports
    updatePayload.false_report_flag = true;
  }

  // ── Step 8: Atomic DB update ─────────────────────────────────
  // WHERE id = reportId AND status = currentStatus
  // This prevents race conditions: if another process changed the
  // status between our read and our write, the update will touch
  // zero rows and we return 409 rather than silently succeeding.
  const { data: updatedRows, error: updateError } = await supabase
    .from('emergency_reports')
    .update(updatePayload)
    .eq('id', reportId)
    .eq('status', currentStatus)          // ← concurrency guard
    .select('id, report_number, status, priority, emergency_type, updated_at')

  if (updateError) {
    console.error('[operator/status] update error:', updateError);
    return NextResponse.json(
      { error: 'فشل تحديث حالة البلاغ' },
      { status: 500 }
    );
  }

  // Verify that exactly one row was mutated.
  // If updatedRows is empty, the WHERE status = currentStatus guard
  // rejected the update — the report's status was changed concurrently.
  if (!updatedRows || updatedRows.length === 0) {
    return NextResponse.json(
      {
        error: 'حالة البلاغ تغيّرت. أعد المحاولة.',
        code: 'STALE_STATE',
      },
      { status: 409 }
    );
  }

  const updatedReport = updatedRows[0];

  // ── Step 9: Record event ──────────────────────────────────────
  // emergency_report_events columns (confirmed in ReportEvent type):
  // report_id, event_type, actor_id, actor_role, description, metadata,
  // is_visible_to_user
  //
  // This is best-effort (secondary operation). A failure here does NOT
  // undo the status mutation — we log and continue.
  const { error: eventError } = await supabase
    .from('emergency_report_events')
    .insert({
      report_id: reportId,
      event_type: `STATUS_CHANGED_TO_${target_status}`,
      actor_id: user.id,
      actor_role: actorRole,
      description: reason ?? null,
      metadata: {
        previous_status: currentStatus,
        new_status: target_status,
        ...(assigned_operator_id ? { assigned_operator_id } : {}),
      },
      is_visible_to_user: !['UNDER_REVIEW', 'FALSE_REPORT_REVIEW'].includes(
        target_status
      ),
    });

  if (eventError) {
    // Non-fatal: log the integrity limitation for follow-up.
    console.error('[operator/status] event insert failed:', eventError);
  }

  // ── Step 10: Audit log ───────────────────────────────────────
  // Uses lib/audit.ts → writeAuditLog
  // Canonical columns: actor_id, actor_role, action, entity_type,
  // entity_id, metadata, ip_address
  // NOTE: entity_type NOT entity (the cancel route has a bug — fixed separately)
  await writeAuditLog({
    actor_id: user.id,
    actor_role: actorRole,
    action: 'EMERGENCY_STATUS_TRANSITION',
    entity_type: 'emergency_reports',
    entity_id: reportId,
    metadata: {
      previous_status: currentStatus,
      new_status: target_status,
      report_number: report.report_number,
      reason: reason ?? null,
      ...(assigned_operator_id ? { assigned_operator_id } : {}),
    },
    ip_address:
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
  });

  // ── Step 11: Notification ────────────────────────────────────
  // Notify the citizen who owns the report.
  // Uses lib/notifications.ts → createNotification
  // Canonical type: 'emergency_update'
  // Fields: user_id, type, title_ar, body_ar,
  //         related_entity_type, related_entity_id
  //
  // Failure here does NOT convert the successful status transition
  // into an error. The core mutation already succeeded and was verified.
  const statusLabel = STATUS_LABEL_AR[target_status] ?? target_status;
  await createNotification({
    user_id: report.user_id,
    type: 'emergency_update',
    title_ar: 'تحديث حالة البلاغ',
    body_ar: `تم تحديث حالة بلاغك رقم ${report.report_number} إلى: ${statusLabel}.`,
    related_entity_type: 'emergency_report',
    related_entity_id: reportId,
  });

  // ── Step 12: Response ─────────────────────────────────────────
  return NextResponse.json(
    {
      id: updatedReport.id,
      report_number: updatedReport.report_number,
      status: updatedReport.status,
      priority: updatedReport.priority,
      emergency_type: updatedReport.emergency_type,
      previous_status: currentStatus,
      updated_at: updatedReport.updated_at,
    },
    { status: 200 }
  );
}
