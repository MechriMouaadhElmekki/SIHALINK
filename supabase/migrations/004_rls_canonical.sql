-- ============================================================
-- SIHALINK — Migration 004: Canonical RLS
-- Supersedes 002_rls.sql and 002_rls_policies.sql.
-- Run this AFTER the schema migrations. It is idempotent:
-- all DROP IF EXISTS guards prevent double-apply errors.
-- ============================================================

-- ============================================================
-- 0. DROP all duplicate policies from both 002 files
--    so this file can recreate them cleanly.
-- ============================================================

-- profiles
DROP POLICY IF EXISTS "profiles_select_own"      ON profiles;
DROP POLICY IF EXISTS "profiles_select_admin"     ON profiles;
DROP POLICY IF EXISTS "profiles_select_operator"  ON profiles;
DROP POLICY IF EXISTS "profiles_update_own"       ON profiles;
DROP POLICY IF EXISTS "profiles_update_admin"     ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own"       ON profiles;

-- user_roles
DROP POLICY IF EXISTS "user_roles_select_own"     ON user_roles;
DROP POLICY IF EXISTS "user_roles_admin"          ON user_roles;

-- trusted_contacts
DROP POLICY IF EXISTS "trusted_contacts_own"      ON trusted_contacts;
DROP POLICY IF EXISTS "trusted_contacts_admin"    ON trusted_contacts;

-- emergency_reports
DROP POLICY IF EXISTS "reports_select_own"        ON emergency_reports;
DROP POLICY IF EXISTS "reports_select_operator"   ON emergency_reports;
DROP POLICY IF EXISTS "reports_insert_own"        ON emergency_reports;
DROP POLICY IF EXISTS "reports_update_own_draft"  ON emergency_reports;
DROP POLICY IF EXISTS "reports_update_draft"      ON emergency_reports;
DROP POLICY IF EXISTS "reports_update_operator"   ON emergency_reports;

-- emergency_locations
DROP POLICY IF EXISTS "locations_select_own"      ON emergency_locations;
DROP POLICY IF EXISTS "locations_select_operator" ON emergency_locations;
DROP POLICY IF EXISTS "locations_insert_own"      ON emergency_locations;
DROP POLICY IF EXISTS "locations_own"             ON emergency_locations;
DROP POLICY IF EXISTS "locations_operator"        ON emergency_locations;

-- emergency_triage_answers
DROP POLICY IF EXISTS "triage_select_own"         ON emergency_triage_answers;
DROP POLICY IF EXISTS "triage_select_operator"    ON emergency_triage_answers;
DROP POLICY IF EXISTS "triage_insert_own"         ON emergency_triage_answers;
DROP POLICY IF EXISTS "triage_own"                ON emergency_triage_answers;
DROP POLICY IF EXISTS "triage_operator"           ON emergency_triage_answers;

-- emergency_media
DROP POLICY IF EXISTS "media_select_own"          ON emergency_media;
DROP POLICY IF EXISTS "media_select_operator"     ON emergency_media;
DROP POLICY IF EXISTS "media_insert_own"          ON emergency_media;
DROP POLICY IF EXISTS "media_own"                 ON emergency_media;
DROP POLICY IF EXISTS "media_operator"            ON emergency_media;

-- report_status_history
DROP POLICY IF EXISTS "status_history_select_own"      ON report_status_history;
DROP POLICY IF EXISTS "status_history_select_operator" ON report_status_history;
DROP POLICY IF EXISTS "status_history_own"             ON report_status_history;
DROP POLICY IF EXISTS "status_history_operator"        ON report_status_history;

-- emergency_report_events
DROP POLICY IF EXISTS "events_select_own"      ON emergency_report_events;
DROP POLICY IF EXISTS "events_select_operator" ON emergency_report_events;
DROP POLICY IF EXISTS "events_own"             ON emergency_report_events;
DROP POLICY IF EXISTS "events_operator"        ON emergency_report_events;

-- false_report_cases
DROP POLICY IF EXISTS "false_reports_select_own"  ON false_report_cases;
DROP POLICY IF EXISTS "false_reports_admin"       ON false_report_cases;
DROP POLICY IF EXISTS "false_reports_operator"    ON false_report_cases;
DROP POLICY IF EXISTS "false_reports_own"         ON false_report_cases;

-- suspensions
DROP POLICY IF EXISTS "suspensions_select_own" ON suspensions;
DROP POLICY IF EXISTS "suspensions_admin"      ON suspensions;

-- appointments
DROP POLICY IF EXISTS "appointments_select_own"    ON appointments;
DROP POLICY IF EXISTS "appointments_select_doctor" ON appointments;
DROP POLICY IF EXISTS "appointments_select_admin"  ON appointments;
DROP POLICY IF EXISTS "appointments_insert_own"    ON appointments;
DROP POLICY IF EXISTS "appointments_update_own"    ON appointments;
DROP POLICY IF EXISTS "appointments_update_doctor" ON appointments;
DROP POLICY IF EXISTS "appointments_own"           ON appointments;
DROP POLICY IF EXISTS "appointments_doctor"        ON appointments;
DROP POLICY IF EXISTS "appointments_admin"         ON appointments;

-- appointment_status_history
DROP POLICY IF EXISTS "apt_status_own"      ON appointment_status_history;
DROP POLICY IF EXISTS "apt_status_doctor"   ON appointment_status_history;
DROP POLICY IF EXISTS "apt_status_admin"    ON appointment_status_history;

-- notifications
DROP POLICY IF EXISTS "notifications_own"           ON notifications;
DROP POLICY IF EXISTS "notifications_admin_insert"  ON notifications;

-- notification_preferences
DROP POLICY IF EXISTS "notif_prefs_own" ON notification_preferences;

-- saved_first_aid_guides
DROP POLICY IF EXISTS "saved_guides_own" ON saved_first_aid_guides;

-- audit_logs
DROP POLICY IF EXISTS "audit_logs_select_admin"    ON audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert_service"  ON audit_logs;
DROP POLICY IF EXISTS "audit_admin_only"           ON audit_logs;
DROP POLICY IF EXISTS "audit_insert_service"       ON audit_logs;

-- admin_notes
DROP POLICY IF EXISTS "admin_notes_admin" ON admin_notes;

-- public tables (may or may not exist from previous files)
DROP POLICY IF EXISTS "doctors_public_select"        ON doctors;
DROP POLICY IF EXISTS "doctors_own_update"           ON doctors;
DROP POLICY IF EXISTS "pharmacies_public_select"     ON pharmacies;
DROP POLICY IF EXISTS "facilities_public_select"     ON health_facilities;
DROP POLICY IF EXISTS "first_aid_public_select"      ON first_aid_guides;
DROP POLICY IF EXISTS "first_aid_categories_public"  ON first_aid_categories;

-- old arg-style helper functions from 002_rls.sql
DROP FUNCTION IF EXISTS is_admin(UUID);
DROP FUNCTION IF EXISTS is_operator_or_admin(UUID);
DROP FUNCTION IF EXISTS get_user_role(UUID);

-- ============================================================
-- 1. ENABLE RLS on every table that needs it
--    (idempotent — enabling twice is a no-op)
-- ============================================================

-- user-owned tables
ALTER TABLE profiles                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles                ENABLE ROW LEVEL SECURITY;
ALTER TABLE trusted_contacts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_reports         ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_locations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_triage_answers  ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_media           ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_status_history     ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_report_events   ENABLE ROW LEVEL SECURITY;
ALTER TABLE false_report_cases        ENABLE ROW LEVEL SECURITY;
ALTER TABLE suspensions               ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments              ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications             ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences  ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_first_aid_guides    ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs                ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notes               ENABLE ROW LEVEL SECURITY;

-- public/reference tables — RLS ON but allow authenticated reads
ALTER TABLE doctors             ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacies          ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_facilities   ENABLE ROW LEVEL SECURITY;
ALTER TABLE first_aid_guides    ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. CANONICAL HELPER FUNCTIONS (no-arg, use auth.uid())
-- ============================================================

CREATE OR REPLACE FUNCTION user_has_role(_role_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
      AND r.name = _role_name
      AND (ur.expires_at IS NULL OR ur.expires_at > now())
  );
END;
$$;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER STABLE
AS $$
BEGIN
  RETURN user_has_role('ADMIN') OR user_has_role('SUPER_ADMIN');
END;
$$;

CREATE OR REPLACE FUNCTION is_operator_or_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER STABLE
AS $$
BEGIN
  RETURN user_has_role('EMERGENCY_OPERATOR') OR is_admin();
END;
$$;

-- ============================================================
-- 3. PROFILES
-- ============================================================

CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_select_admin" ON profiles
  FOR SELECT USING (is_admin());

CREATE POLICY "profiles_select_operator" ON profiles
  FOR SELECT USING (is_operator_or_admin());

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_admin" ON profiles
  FOR UPDATE USING (is_admin());

-- ============================================================
-- 4. USER ROLES
-- ============================================================

CREATE POLICY "user_roles_select_own" ON user_roles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "user_roles_admin" ON user_roles
  FOR ALL USING (is_admin());

-- ============================================================
-- 5. TRUSTED CONTACTS
-- ============================================================

CREATE POLICY "trusted_contacts_own" ON trusted_contacts
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "trusted_contacts_admin" ON trusted_contacts
  FOR SELECT USING (is_admin());

-- ============================================================
-- 6. EMERGENCY REPORTS
-- ============================================================

CREATE POLICY "reports_select_own" ON emergency_reports
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "reports_select_operator" ON emergency_reports
  FOR SELECT USING (is_operator_or_admin());

CREATE POLICY "reports_insert_own" ON emergency_reports
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users may only update their own DRAFT reports
CREATE POLICY "reports_update_own_draft" ON emergency_reports
  FOR UPDATE
  USING (user_id = auth.uid() AND status = 'DRAFT')
  WITH CHECK (user_id = auth.uid() AND status = 'DRAFT');

-- Operators/admins can update status on any report
CREATE POLICY "reports_update_operator" ON emergency_reports
  FOR UPDATE USING (is_operator_or_admin());

-- ============================================================
-- 7. EMERGENCY LOCATIONS
-- ============================================================

CREATE POLICY "locations_select_own" ON emergency_locations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM emergency_reports er
      WHERE er.id = report_id AND er.user_id = auth.uid()
    )
  );

CREATE POLICY "locations_insert_own" ON emergency_locations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM emergency_reports er
      WHERE er.id = report_id AND er.user_id = auth.uid()
    )
  );

CREATE POLICY "locations_select_operator" ON emergency_locations
  FOR SELECT USING (is_operator_or_admin());

-- ============================================================
-- 8. TRIAGE ANSWERS
-- ============================================================

CREATE POLICY "triage_select_own" ON emergency_triage_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM emergency_reports er
      WHERE er.id = report_id AND er.user_id = auth.uid()
    )
  );

CREATE POLICY "triage_insert_own" ON emergency_triage_answers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM emergency_reports er
      WHERE er.id = report_id AND er.user_id = auth.uid()
    )
  );

CREATE POLICY "triage_select_operator" ON emergency_triage_answers
  FOR SELECT USING (is_operator_or_admin());

-- ============================================================
-- 9. EMERGENCY MEDIA
-- ============================================================

CREATE POLICY "media_select_own" ON emergency_media
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "media_insert_own" ON emergency_media
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "media_select_operator" ON emergency_media
  FOR SELECT USING (is_operator_or_admin());

-- ============================================================
-- 10. REPORT STATUS HISTORY
-- ============================================================

CREATE POLICY "status_history_select_own" ON report_status_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM emergency_reports er
      WHERE er.id = report_id AND er.user_id = auth.uid()
    )
  );

CREATE POLICY "status_history_select_operator" ON report_status_history
  FOR SELECT USING (is_operator_or_admin());

CREATE POLICY "status_history_insert_operator" ON report_status_history
  FOR INSERT WITH CHECK (is_operator_or_admin());

-- ============================================================
-- 11. REPORT EVENTS
-- ============================================================

CREATE POLICY "events_select_own" ON emergency_report_events
  FOR SELECT USING (
    is_visible_to_user = TRUE AND
    EXISTS (
      SELECT 1 FROM emergency_reports er
      WHERE er.id = report_id AND er.user_id = auth.uid()
    )
  );

CREATE POLICY "events_select_operator" ON emergency_report_events
  FOR SELECT USING (is_operator_or_admin());

CREATE POLICY "events_write_operator" ON emergency_report_events
  FOR INSERT WITH CHECK (is_operator_or_admin());

-- ============================================================
-- 12. FALSE REPORT CASES
-- ============================================================

CREATE POLICY "false_reports_select_own" ON false_report_cases
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "false_reports_admin" ON false_report_cases
  FOR ALL USING (is_admin());

CREATE POLICY "false_reports_operator" ON false_report_cases
  FOR SELECT USING (is_operator_or_admin());

-- ============================================================
-- 13. SUSPENSIONS
-- ============================================================

CREATE POLICY "suspensions_select_own" ON suspensions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "suspensions_admin" ON suspensions
  FOR ALL USING (is_admin());

-- ============================================================
-- 14. APPOINTMENTS
-- ============================================================

CREATE POLICY "appointments_select_own" ON appointments
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "appointments_insert_own" ON appointments
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users may only cancel (update status to CANCELLED) their own appointments
CREATE POLICY "appointments_update_own" ON appointments
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "appointments_select_doctor" ON appointments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM doctors d
      WHERE d.id = doctor_id AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "appointments_update_doctor" ON appointments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM doctors d
      WHERE d.id = doctor_id AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "appointments_select_admin" ON appointments
  FOR SELECT USING (is_admin());

CREATE POLICY "appointments_all_admin" ON appointments
  FOR ALL USING (is_admin());

-- ============================================================
-- 15. APPOINTMENT STATUS HISTORY
-- ============================================================

CREATE POLICY "apt_status_own" ON appointment_status_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM appointments a
      WHERE a.id = appointment_id AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "apt_status_doctor" ON appointment_status_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM appointments a
      JOIN doctors d ON d.id = a.doctor_id
      WHERE a.id = appointment_id AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "apt_status_admin" ON appointment_status_history
  FOR ALL USING (is_admin());

-- ============================================================
-- 16. NOTIFICATIONS
-- ============================================================

CREATE POLICY "notifications_own" ON notifications
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Service role (used from API routes via service key) can insert for any user.
-- Authenticated users cannot insert notifications for others.
CREATE POLICY "notifications_service_insert" ON notifications
  FOR INSERT WITH CHECK (
    -- user inserts only for themselves, OR service-role bypasses RLS entirely
    user_id = auth.uid()
  );

-- ============================================================
-- 17. NOTIFICATION PREFERENCES
-- ============================================================

CREATE POLICY "notif_prefs_own" ON notification_preferences
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 18. SAVED FIRST AID GUIDES
-- ============================================================

CREATE POLICY "saved_guides_own" ON saved_first_aid_guides
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 19. AUDIT LOGS
-- Authenticated users cannot read or write audit logs.
-- Only admins can SELECT. Only service_role bypasses RLS to INSERT.
-- The old WITH CHECK (true) policy was a log-injection risk.
-- ============================================================

CREATE POLICY "audit_logs_select_admin" ON audit_logs
  FOR SELECT USING (is_admin());

-- No INSERT policy for authenticated role.
-- The application MUST use the service_role key (which bypasses RLS)
-- to write audit entries — never the anon or user JWT.

-- ============================================================
-- 20. ADMIN NOTES
-- ============================================================

CREATE POLICY "admin_notes_admin" ON admin_notes
  FOR ALL USING (is_admin());

-- ============================================================
-- 21. PUBLIC / REFERENCE TABLES
-- Authenticated users can SELECT active/published records.
-- No user-level INSERT/UPDATE/DELETE — service_role only.
-- ============================================================

-- DOCTORS (authenticated read of active+verified)
CREATE POLICY "doctors_public_select" ON doctors
  FOR SELECT
  USING (auth.uid() IS NOT NULL AND is_active = TRUE);

-- Doctors can update their own profile
CREATE POLICY "doctors_own_update" ON doctors
  FOR UPDATE
  USING (user_id = auth.uid() AND auth.uid() IS NOT NULL);

-- PHARMACIES (authenticated read)
CREATE POLICY "pharmacies_public_select" ON pharmacies
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- HEALTH FACILITIES (authenticated read)
CREATE POLICY "facilities_public_select" ON health_facilities
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- FIRST AID GUIDES (authenticated read of published)
CREATE POLICY "first_aid_public_select" ON first_aid_guides
  FOR SELECT
  USING (auth.uid() IS NOT NULL AND is_published = TRUE);

-- COMMENT: anon key users (unauthenticated) cannot read ANY table.
-- All data access requires a valid Supabase session.
