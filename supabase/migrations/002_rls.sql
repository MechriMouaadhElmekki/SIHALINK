-- ============================================================
-- SIHALINK Row Level Security Policies
-- Migration 002 - RLS
-- ============================================================

-- Enable RLS on all sensitive tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trusted_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_triage_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_report_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE false_report_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE suspensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_first_aid_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notes ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user role
CREATE OR REPLACE FUNCTION get_user_role(uid UUID)
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = uid;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: is admin or super_admin
CREATE OR REPLACE FUNCTION is_admin(uid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM profiles
    WHERE id = uid AND role IN ('ADMIN','SUPER_ADMIN')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: is operator or admin
CREATE OR REPLACE FUNCTION is_operator_or_admin(uid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM profiles
    WHERE id = uid AND role IN ('EMERGENCY_OPERATOR','ADMIN','SUPER_ADMIN')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- PROFILES
-- ============================================================
-- Users can read their own profile
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Admins can read all profiles
CREATE POLICY "profiles_select_admin" ON profiles
  FOR SELECT USING (is_admin(auth.uid()));

-- Users can update their own profile
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can update any profile
CREATE POLICY "profiles_update_admin" ON profiles
  FOR UPDATE USING (is_admin(auth.uid()));

-- Service role can insert (used for registration trigger)
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================================
-- TRUSTED CONTACTS
-- ============================================================
CREATE POLICY "trusted_contacts_own" ON trusted_contacts
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "trusted_contacts_admin" ON trusted_contacts
  FOR SELECT USING (is_admin(auth.uid()));

-- ============================================================
-- EMERGENCY REPORTS
-- ============================================================
-- Users see their own reports
CREATE POLICY "reports_select_own" ON emergency_reports
  FOR SELECT USING (user_id = auth.uid());

-- Users can create reports
CREATE POLICY "reports_insert_own" ON emergency_reports
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own DRAFT reports
CREATE POLICY "reports_update_draft" ON emergency_reports
  FOR UPDATE USING (user_id = auth.uid() AND status = 'DRAFT');

-- Operators can select reports in their scope
CREATE POLICY "reports_select_operator" ON emergency_reports
  FOR SELECT USING (is_operator_or_admin(auth.uid()));

-- Operators can update report status
CREATE POLICY "reports_update_operator" ON emergency_reports
  FOR UPDATE USING (is_operator_or_admin(auth.uid()));

-- ============================================================
-- EMERGENCY LOCATIONS
-- ============================================================
CREATE POLICY "locations_own" ON emergency_locations
  FOR ALL USING (
    report_id IN (SELECT id FROM emergency_reports WHERE user_id = auth.uid())
  );

CREATE POLICY "locations_operator" ON emergency_locations
  FOR SELECT USING (is_operator_or_admin(auth.uid()));

-- ============================================================
-- TRIAGE ANSWERS
-- ============================================================
CREATE POLICY "triage_own" ON emergency_triage_answers
  FOR ALL USING (
    report_id IN (SELECT id FROM emergency_reports WHERE user_id = auth.uid())
  );

CREATE POLICY "triage_operator" ON emergency_triage_answers
  FOR SELECT USING (is_operator_or_admin(auth.uid()));

-- ============================================================
-- MEDIA
-- ============================================================
CREATE POLICY "media_own" ON emergency_media
  FOR ALL USING (
    report_id IN (SELECT id FROM emergency_reports WHERE user_id = auth.uid())
  );

CREATE POLICY "media_operator" ON emergency_media
  FOR SELECT USING (is_operator_or_admin(auth.uid()));

-- ============================================================
-- STATUS HISTORY
-- ============================================================
CREATE POLICY "status_history_own" ON report_status_history
  FOR SELECT USING (
    report_id IN (SELECT id FROM emergency_reports WHERE user_id = auth.uid())
  );

CREATE POLICY "status_history_operator" ON report_status_history
  FOR ALL USING (is_operator_or_admin(auth.uid()));

-- ============================================================
-- REPORT EVENTS
-- ============================================================
CREATE POLICY "events_own" ON emergency_report_events
  FOR SELECT USING (
    is_visible_to_user = TRUE AND
    report_id IN (SELECT id FROM emergency_reports WHERE user_id = auth.uid())
  );

CREATE POLICY "events_operator" ON emergency_report_events
  FOR ALL USING (is_operator_or_admin(auth.uid()));

-- ============================================================
-- APPOINTMENTS
-- ============================================================
CREATE POLICY "appointments_own" ON appointments
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "appointments_doctor" ON appointments
  FOR SELECT USING (
    doctor_id IN (
      SELECT id FROM doctors WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "appointments_admin" ON appointments
  FOR ALL USING (is_admin(auth.uid()));

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE POLICY "notifications_own" ON notifications
  FOR ALL USING (user_id = auth.uid());

-- ============================================================
-- NOTIFICATION PREFERENCES
-- ============================================================
CREATE POLICY "notif_prefs_own" ON notification_preferences
  FOR ALL USING (user_id = auth.uid());

-- ============================================================
-- SAVED FIRST AID
-- ============================================================
CREATE POLICY "saved_guides_own" ON saved_first_aid_guides
  FOR ALL USING (user_id = auth.uid());

-- ============================================================
-- AUDIT LOGS
-- ============================================================
-- Only admins can read audit logs
CREATE POLICY "audit_admin_only" ON audit_logs
  FOR SELECT USING (is_admin(auth.uid()));

-- System/service role inserts audit logs
CREATE POLICY "audit_insert_service" ON audit_logs
  FOR INSERT WITH CHECK (TRUE);

-- ============================================================
-- ADMIN NOTES
-- ============================================================
CREATE POLICY "admin_notes_admin" ON admin_notes
  FOR ALL USING (is_admin(auth.uid()));

-- ============================================================
-- FALSE REPORTS
-- ============================================================
CREATE POLICY "false_reports_own" ON false_report_cases
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "false_reports_admin" ON false_report_cases
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "false_reports_operator" ON false_report_cases
  FOR SELECT USING (is_operator_or_admin(auth.uid()));
