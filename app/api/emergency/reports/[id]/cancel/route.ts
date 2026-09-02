// ============================================================
// POST /api/emergency/reports/[id]/cancel
//
// Citizen cancellation of their own emergency report.
//
// Batch 3 fixes (preserved):
//   NEW-CANCEL-02: Removed hardcoded CANCELLABLE_STATUSES.
//     Now uses canUserCancel() from the canonical state machine.
//   BUG-AUDIT-01: Fixed entity → entity_type in audit_logs insert.
//   BUG-CANCEL-01: The DB update result is verified.
//
// Batch 6A change (RLS hardening):
//   The direct `.from('emergency_reports').update(...)` is replaced
//   with a call to the cancel_emergency_report SECURITY DEFINER RPC.
//
//   Why: no citizen RLS UPDATE policy covered non-DRAFT rows.
//   reports_update_own_draft requires status = 'DRAFT' in USING.
//   A SUBMITTED report could not be cancelled via authenticated UPDATE.
//
//   The RPC enforces:
//     - auth.uid() is the row owner
//     - only DRAFT | SUBMITTED → CANCELLED is permitted
//     - the UPDATE is atomic with a concurrency guard
//     - only status, cancellation_reason, cancelled_at are written
//
//   Audit, events, and notifications remain in the application layer.
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

  // ── Step 1: Authentication ──────────────────────────────────
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json(
      { error: 'المصادقة مطلوبة' },
      { status: 401 }
    );
  }

  // ── Step 2: Load the report (ownership + metadata for events/audit) ──
  // We still SELECT before calling the RPC so that:
  //   a. we can return a 404 before bothering the RPC
  //   b. we have report_number and currentStatus for audit/event payloads
  // The RPC also re-checks ownership and status atomically inside SQL,
  // so this SELECT is not the security boundary — it is a UX / logging aid.
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

  // ── Step 3: State-machine check — citizen perspective ────────────
  // canUserCancel uses lib/emergency/state-machine.ts (canonical).
  // Currently returns true for DRAFT | SUBMITTED only.
  // The RPC enforces the same rule in SQL as defence-in-depth.
  if (!canUserCancel(currentStatus)) {
    return NextResponse.json(
      { error: 'هذا البلاغ لا يمكن إلغاؤه في حالته الحالية' },
      { status: 422 }
    );
  }

  // ── Step 4: Parse body ────────────────────────────────────────
  const body = await request.json().catch(() => ({})) as Record<string, string>;
  const reason = body.reason || 'ألغى المستخدم البلاغ';

  // ── Step 5: Call the narrowly scoped cancellation RPC ────────────
  // cancel_emergency_report(p_report_id, p_cancellation_reason) enforces:
  //   - auth.uid() present (redundant here, belt-and-suspenders)
  //   - user_id = auth.uid() on the row
  //   - status IN ('DRAFT', 'SUBMITTED')
  //   - atomic UPDATE with concurrency guard (WHERE status = currentStatus)
  //   - only status, cancellation_reason, cancelled_at written in SQL
  //   - updated_at handled by the existing BEFORE UPDATE trigger
  const { data: rpcResult, error: rpcError } = await supabase
    .rpc('cancel_emergency_report', {
      p_report_id:            params.id,
      p_cancellation_reason:  reason,
    });

  if (rpcError) {
    console.error('[cancel] RPC error:', rpcError);
    return NextResponse.json(
      { error: 'فشل إلغاء البلاغ' },
      { status: 500 }
    );
  }

  // RPC returns a JSONB result object with an 'ok' boolean and 'code' string.
  const result = rpcResult as { ok: boolean; code: string; error?: string; status?: string };

  if (!result.ok) {
    // Map RPC result codes to HTTP responses that match pre-Batch-6A semantics.
    if (result.code === 'STALE_STATE') {
      return NextResponse.json(
        {
          error: 'حالة البلاغ تغيّرت. أعد المحاولة.',
          code:  'STALE_STATE',
        },
        { status: 409 }
      );
    }

    if (result.code === 'NOT_FOUND') {
      return NextResponse.json(
        { error: 'لم يتم العثور على البلاغ' },
        { status: 404 }
      );
    }

    if (result.code === 'NOT_CANCELLABLE') {
      return NextResponse.json(
        { error: 'هذا البلاغ لا يمكن إلغاؤه في حالته الحالية' },
        { status: 422 }
      );
    }

    if (result.code === 'UNAUTHENTICATED') {
      return NextResponse.json(
        { error: 'المصادقة مطلوبة' },
        { status: 401 }
      );
    }

    // Catch-all for unexpected RPC error codes.
    console.error('[cancel] unexpected RPC result:', result);
    return NextResponse.json(
      { error: 'فشل إلغاء البلاغ' },
      { status: 500 }
    );
  }

  // ── Step 6: Record event ──────────────────────────────────────
  // Best-effort. Failure does not undo the successful cancellation.
  // Note: the record_report_status_change_trigger has already fired
  // (AFTER UPDATE) and inserted a generic STATUS_CHANGED event +
  // report_status_history row. This insert is complementary — it
  // records the richer citizen-specific event with actor_id, actor_role,
  // description, and metadata that the trigger does not set.
  await supabase.from('emergency_report_events').insert({
    report_id:         params.id,
    event_type:        'STATUS_CHANGED_TO_CANCELLED',
    actor_id:          user.id,
    actor_role:        'USER',
    description:       reason,
    metadata:          { previous_status: currentStatus, new_status: 'CANCELLED' },
    is_visible_to_user: true,
  });

  // ── Step 7: Audit log ───────────────────────────────────────
  await writeAuditLog({
    actor_id:    user.id,
    actor_role:  'USER',
    action:      'EMERGENCY_REPORT_CANCELLED',
    entity_type: 'emergency_reports',
    entity_id:   params.id,
    metadata:    { reason, previous_status: currentStatus },
  });

  return NextResponse.json({ success: true });
}
