// ============================================================
// POST /api/emergency/reports/[id]/cancel
//
// Citizen cancellation of their own emergency report.
//
// Batch 3 fixes:
//   NEW-CANCEL-02: Removed hardcoded CANCELLABLE_STATUSES.
//     Now uses canUserCancel() from the canonical state machine.
//   BUG-AUDIT-01: Fixed entity → entity_type in audit_logs insert
//     (the legacy cancel route used 'entity' which does not exist
//      on the audit_logs table per types/database.ts AuditLog).
//   BUG-CANCEL-01: The DB update result is now verified. The old
//     route called `await supabase.from(...).update(...)` and
//     returned HTTP 200 without checking whether the row changed.
//   SAFETY: createClient() (session client) is used for the UPDATE
//     so RLS applies. The user can only cancel their own reports
//     because the SELECT already filters by user_id = user.id.
//
// Citizen vs. operator cancellation:
//   canUserCancel(status) — authoritative for citizens.
//     Currently: DRAFT | SUBMITTED only.
//     Operator cancellation is handled by the operator endpoint.
//
// IMPORTANT: RECEIVED is NOT in canUserCancel(). The old route
//   had 'RECEIVED' in CANCELLABLE_STATUSES, which was inconsistent
//   with the canonical state machine. This batch follows the
//   canonical implementation. If business rules require re-adding
//   RECEIVED, update canUserCancel() in state-machine.ts directly.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { canUserCancel } from '@/lib/emergency/state-machine';
import { writeAuditLog } from '@/lib/audit';
import type { ReportStatus } from '@/types/database';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();

  // ── Step 1: Authentication ───────────────────────────────────
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json(
      { error: 'المصادقة مطلوبة' },
      { status: 401 }
    );
  }

  // ── Step 2: Load the report (ownership check via user_id) ────
  const { data: report } = await supabase
    .from('emergency_reports')
    .select('id, status, user_id, report_number')
    .eq('id', params.id)
    .eq('user_id', user.id)             // citizen can only see own reports
    .single();

  if (!report) {
    return NextResponse.json(
      { error: 'لم يتم العثور على البلاغ' },
      { status: 404 }
    );
  }

  const currentStatus = report.status as ReportStatus;

  // ── Step 3: State-machine check — citizen perspective ────────
  // canUserCancel uses lib/emergency/state-machine.ts (canonical).
  // Currently returns true for DRAFT | SUBMITTED only.
  if (!canUserCancel(currentStatus)) {
    return NextResponse.json(
      { error: 'هذا البلاغ لا يمكن إلغاؤه في حالته الحالية' },
      { status: 422 }
    );
  }

  // ── Step 4: Parse body ───────────────────────────────────────
  const body = await request.json().catch(() => ({})) as Record<string, string>;
  const reason = body.reason || 'ألغى المستخدم البلاغ';

  // ── Step 5: Atomic UPDATE with concurrency guard ─────────────
  // WHERE id = reportId AND status = currentStatus prevents
  // a race where the operator moved the status between our
  // SELECT and this UPDATE.
  const { data: updatedRows, error: updateError } = await supabase
    .from('emergency_reports')
    .update({
      status: 'CANCELLED',
      cancellation_reason: reason,
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.id)
    .eq('status', currentStatus)        // ← concurrency guard
    .select('id, status');

  if (updateError) {
    console.error('[cancel] update error:', updateError);
    return NextResponse.json(
      { error: 'فشل إلغاء البلاغ' },
      { status: 500 }
    );
  }

  // Verify the row was actually updated.
  if (!updatedRows || updatedRows.length === 0) {
    return NextResponse.json(
      {
        error: 'حالة البلاغ تغيّرت. أعد المحاولة.',
        code: 'STALE_STATE',
      },
      { status: 409 }
    );
  }

  // ── Step 6: Record event ──────────────────────────────────────
  // Best-effort. Failure does not undo the successful cancellation.
  await supabase.from('emergency_report_events').insert({
    report_id: params.id,
    event_type: 'STATUS_CHANGED_TO_CANCELLED',
    actor_id: user.id,
    actor_role: 'USER',
    description: reason,
    metadata: { previous_status: currentStatus, new_status: 'CANCELLED' },
    is_visible_to_user: true,
  });

  // ── Step 7: Audit log ────────────────────────────────────────
  // FIXED: entity_type (not entity) — matches AuditLog type in types/database.ts
  await writeAuditLog({
    actor_id: user.id,
    actor_role: 'USER',
    action: 'EMERGENCY_REPORT_CANCELLED',
    entity_type: 'emergency_reports',   // ← was 'entity' in old route (bug)
    entity_id: params.id,
    metadata: { reason, previous_status: currentStatus },
  });

  return NextResponse.json({ success: true });
}
