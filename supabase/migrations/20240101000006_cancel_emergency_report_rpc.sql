-- ============================================================
-- SIHALINK — Migration 006
-- Citizen cancellation SECURITY DEFINER RPC
-- Batch 6A — Phase 1B RLS Hardening
-- ============================================================
--
-- PROBLEM RESOLVED:
--   The citizen cancellation route (POST /api/emergency/reports/[id]/cancel)
--   used the session (authenticated) client to UPDATE emergency_reports.
--   No RLS UPDATE policy covered citizen updates on non-DRAFT rows:
--     - reports_update_own_draft requires status = 'DRAFT' in USING + WITH CHECK
--     - reports_update_operator requires is_operator_or_admin()
--   A SUBMITTED report therefore could not be cancelled via direct UPDATE.
--
-- SOLUTION:
--   A narrowly scoped SECURITY DEFINER function performs the atomic
--   cancellation UPDATE. Authorization is enforced inside the function
--   because SECURITY DEFINER bypasses caller RLS.
--
-- EXISTING TRIGGERS PRESERVED (not duplicated):
--   update_emergency_reports_updated_at — BEFORE UPDATE → sets updated_at
--   record_report_status_change_trigger — AFTER UPDATE → inserts into
--     report_status_history and emergency_report_events (generic STATUS_CHANGED)
--   The application route continues to insert the richer
--   STATUS_CHANGED_TO_CANCELLED event with actor_id, actor_role, and
--   description — this is intentional and complementary.
--
-- COLUMNS THIS FUNCTION CAN MODIFY (exhaustive list):
--   status            TEXT   → 'CANCELLED'
--   cancellation_reason TEXT → caller-supplied reason (TEXT, not arbitrary SQL)
--   cancelled_at      TIMESTAMPTZ → NOW() at execution time
--   updated_at        TIMESTAMPTZ → set by existing BEFORE UPDATE trigger
--
-- COLUMNS THIS FUNCTION CANNOT MODIFY (protected by fixed SQL):
--   id, report_number, user_id, emergency_type, priority,
--   description, additional_info, affected_count,
--   assigned_operator_id, false_report_flag, is_demo,
--   resolved_at, created_at
-- ============================================================

-- ============================================================
-- FUNCTION: cancel_emergency_report
-- ============================================================
CREATE OR REPLACE FUNCTION public.cancel_emergency_report(
  p_report_id         UUID,
  p_cancellation_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller_id     UUID;
  v_current_status TEXT;
  v_rows_updated  INTEGER;
BEGIN
  -- ── 1. Require an authenticated caller ──────────────────────
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RETURN jsonb_build_object(
      'ok',    FALSE,
      'code',  'UNAUTHENTICATED',
      'error', 'Authentication required'
    );
  END IF;

  -- ── 2. Validate arguments ────────────────────────────────────
  IF p_report_id IS NULL THEN
    RETURN jsonb_build_object(
      'ok',    FALSE,
      'code',  'INVALID_ARGUMENT',
      'error', 'report_id is required'
    );
  END IF;

  -- ── 3. Fetch current status; enforce ownership ───────────────
  -- A single lookup that simultaneously checks:
  --   a. the report exists
  --   b. user_id = auth.uid() (ownership — prevents cross-user cancellation)
  SELECT er.status
    INTO v_current_status
    FROM public.emergency_reports er
   WHERE er.id      = p_report_id
     AND er.user_id = v_caller_id;

  IF NOT FOUND THEN
    -- Either the report does not exist OR it belongs to a different user.
    -- Return the same response for both to avoid information leakage.
    RETURN jsonb_build_object(
      'ok',    FALSE,
      'code',  'NOT_FOUND',
      'error', 'Report not found or access denied'
    );
  END IF;

  -- ── 4. Enforce citizen-cancellable statuses ──────────────────
  -- Mirrors canUserCancel() in lib/emergency/state-machine.ts:
  --   DRAFT → CANCELLED
  --   SUBMITTED → CANCELLED
  -- Deliberate minimal duplication: only these two transitions are
  -- encoded here. The full TypeScript state machine is NOT reproduced.
  IF v_current_status NOT IN ('DRAFT', 'SUBMITTED') THEN
    RETURN jsonb_build_object(
      'ok',        FALSE,
      'code',      'NOT_CANCELLABLE',
      'error',     'Report cannot be cancelled in its current state',
      'status',    v_current_status
    );
  END IF;

  -- ── 5. Atomic UPDATE with concurrency guard ──────────────────
  -- WHERE id = p_report_id AND user_id = v_caller_id AND status = v_current_status
  -- prevents a TOCTOU race: if an operator moved the status between
  -- our SELECT and this UPDATE, zero rows are affected.
  --
  -- Columns written (fixed — no dynamic SQL):
  --   status            → 'CANCELLED'
  --   cancellation_reason → p_cancellation_reason (TEXT parameter)
  --   cancelled_at      → NOW()
  --
  -- updated_at is NOT set here: the existing BEFORE UPDATE trigger
  -- update_emergency_reports_updated_at handles it automatically.
  UPDATE public.emergency_reports
     SET status              = 'CANCELLED',
         cancellation_reason = p_cancellation_reason,
         cancelled_at        = NOW()
   WHERE id      = p_report_id
     AND user_id = v_caller_id          -- ownership guard (defence in depth)
     AND status  = v_current_status;    -- concurrency guard

  GET DIAGNOSTICS v_rows_updated = ROW_COUNT;

  IF v_rows_updated = 0 THEN
    -- Status changed concurrently between SELECT and UPDATE.
    RETURN jsonb_build_object(
      'ok',   FALSE,
      'code', 'STALE_STATE',
      'error','Report state changed concurrently. Please retry.'
    );
  END IF;

  -- ── 6. Return success ────────────────────────────────────────
  -- The application route continues to handle:
  --   - emergency_report_events (richer STATUS_CHANGED_TO_CANCELLED insert)
  --   - audit_logs (via writeAuditLog)
  --   - notifications
  -- These are NOT duplicated in SQL.
  RETURN jsonb_build_object(
    'ok',     TRUE,
    'code',   'CANCELLED',
    'status', 'CANCELLED'
  );

EXCEPTION WHEN OTHERS THEN
  -- Surface unexpected errors without leaking internal detail.
  RETURN jsonb_build_object(
    'ok',    FALSE,
    'code',  'INTERNAL_ERROR',
    'error', 'An unexpected error occurred'
  );
END;
$$;

-- ============================================================
-- EXECUTE PRIVILEGES
-- ============================================================

-- 1. Revoke from PUBLIC immediately (PostgreSQL grants EXECUTE to
--    PUBLIC by default on new functions — this removes that exposure).
REVOKE EXECUTE ON FUNCTION public.cancel_emergency_report(UUID, TEXT) FROM PUBLIC;

-- 2. Grant only to the authenticated role (Supabase session users).
--    anon is deliberately excluded: unauthenticated callers are
--    rejected inside the function anyway, but belt-and-suspenders.
GRANT EXECUTE ON FUNCTION public.cancel_emergency_report(UUID, TEXT) TO authenticated;

-- ============================================================
-- OWNERSHIP
-- ============================================================
-- The function is owned by the migration-executing role (postgres).
-- SECURITY DEFINER runs with the owner's privileges, which is
-- required for the UPDATE to succeed on rows that the caller's
-- RLS policies do not cover (non-DRAFT rows under authenticated).
-- Authorization is therefore enforced exclusively inside the function.
-- ============================================================
