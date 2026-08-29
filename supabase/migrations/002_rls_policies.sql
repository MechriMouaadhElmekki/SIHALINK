-- ============================================================
-- SIHALINK - Row Level Security Policies
-- Migration 002: RLS
-- ============================================================

-- Enable RLS on all user-facing tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
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

-- Helper function: check if current user has a role
CREATE OR REPLACE FUNCTION user_has_role(role_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name = role_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Helper function: check if user is admin or super_admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN user_has_role('ADMIN') OR user_has_role('SUPER_ADMIN');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Helper function: check if user is operator or admin
CREATE OR REPLACE FUNCTION is_operator_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN user_has_role('EMERGENCY_OPERATOR') OR is_admin();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================
-- PROFILES
-- ============================================================

-- Users can read their own profile
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Admins can read all profiles
CREATE POLICY "profiles_select_admin" ON profiles
  FOR SELECT USING (is_admin());

-- Operators can read profiles for report lookup
CREATE POLICY "profiles_select_operator" ON profiles
  FOR SELECT USING (is_operator_or_admin());

-- Users can update their own profile
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can update any profile
CREATE POLICY "profiles_update_admin" ON profiles
  FOR UPDATE USING (is_admin());

-- Insert own profile (on registration)
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================================
-- USER ROLES
-- ============================================================

-- Users can read their own roles
CREATE POLICY "user_roles_select_own" ON user_roles
  FOR SELECT USING (user_id = auth.uid());

-- Admins can manage all roles
CREATE POLICY "user_roles_admin" ON user_roles
  FOR ALL USING (is_admin());

-- ============================================================
-- TRUSTED CONTACTS
-- ============================================================

CREATE POLICY "trusted_contacts_own" ON trusted_contacts
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "trusted_contacts_admin" ON trusted_contacts
  FOR SELECT USING (is_admin());

-- ============================================================
-- EMERGENCY REPORTS
-- ============================================================

-- Users can read their own reports
CREATE POLICY "reports_select_own" ON emergency_reports
  FOR SELECT USING (user_id = auth.uid());

-- Operators and admins can read all reports
CREATE POLICY "reports_select_operator" ON emergency_reports
  FOR SELECT USING (is_operator_or_admin());

-- Users can create reports
CREATE POLICY "reports_insert_own" ON emergency_reports
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own DRAFT reports
CREATE POLICY "reports_update_own_draft" ON emergency_reports
  FOR UPDATE USING (
    user_id = auth.uid() AND status = 'DRAFT'
  );

-- Operators and admins can update report status
CREATE POLICY "reports_update_operator" ON emergency_reports
  FOR UPDATE USING (is_operator_or_admin());

-- ============================================================
-- EMERGENCY LOCATIONS
-- ============================================================

CREATE POLICY "locations_select_own" ON emergency_locations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM emergency_reports er
      WHERE er.id = report_id AND er.user_id = auth.uid()
    )
  );

CREATE POLICY "locations_select_operator" ON emergency_locations
  FOR SELECT USING (is_operator_or_admin());

CREATE POLICY "locations_insert_own" ON emergency_locations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM emergency_reports er
      WHERE er.id = report_id AND er.user_id = auth.uid()
    )
  );

-- ============================================================
-- TRIAGE ANSWERS
-- ============================================================

CREATE POLICY "triage_select_own" ON emergency_triage_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM emergency_reports er
      WHERE er.id = report_id AND er.user_id = auth.uid()
    )
  );

CREATE POLICY "triage_select_operator" ON emergency_triage_answers
  FOR SELECT USING (is_operator_or_admin());

CREATE POLICY "triage_insert_own" ON emergency_triage_answers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM emergency_reports er
      WHERE er.id = report_id AND er.user_id = auth.uid()
    )
  );

-- ============================================================
-- EMERGENCY MEDIA
-- ============================================================

CREATE POLICY "media_select_own" ON emergency_media
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "media_select_operator" ON emergency_media
  FOR SELECT USING (is_operator_or_admin());

CREATE POLICY "media_insert_own" ON emergency_media
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- ============================================================
-- REPORT STATUS HISTORY
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

-- ============================================================
-- REPORT EVENTS
-- ============================================================

CREATE POLICY "events_select_own" ON emergency_report_events
  FOR SELECT USING (
    is_visible_to_user = true AND
    EXISTS (
      SELECT 1 FROM emergency_reports er
      WHERE er.id = report_id AND er.user_id = auth.uid()
    )
  );

CREATE POLICY "events_select_operator" ON emergency_report_events
  FOR SELECT USING (is_operator_or_admin());

-- ============================================================
-- APPOINTMENTS
-- ============================================================

-- Users can see their own appointments
CREATE POLICY "appointments_select_own" ON appointments
  FOR SELECT USING (user_id = auth.uid());

-- Doctors can see appointments for their doctor profile
CREATE POLICY "appointments_select_doctor" ON appointments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM doctors d
      WHERE d.id = doctor_id AND d.user_id = auth.uid()
    )
  );

-- Admins can see all
CREATE POLICY "appointments_select_admin" ON appointments
  FOR SELECT USING (is_admin());

-- Users can create appointments
CREATE POLICY "appointments_insert_own" ON appointments
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can cancel their own appointments
CREATE POLICY "appointments_update_own" ON appointments
  FOR UPDATE USING (user_id = auth.uid());

-- Doctors can update their appointments
CREATE POLICY "appointments_update_doctor" ON appointments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM doctors d
      WHERE d.id = doctor_id AND d.user_id = auth.uid()
    )
  );

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE POLICY "notifications_own" ON notifications
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "notifications_admin_insert" ON notifications
  FOR INSERT WITH CHECK (is_admin());

-- ============================================================
-- NOTIFICATION PREFERENCES
-- ============================================================

CREATE POLICY "notif_prefs_own" ON notification_preferences
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- SAVED GUIDES
-- ============================================================

CREATE POLICY "saved_guides_own" ON saved_first_aid_guides
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- FALSE REPORT CASES
-- ============================================================

CREATE POLICY "false_reports_select_own" ON false_report_cases
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "false_reports_admin" ON false_report_cases
  FOR ALL USING (is_admin());

-- ============================================================
-- SUSPENSIONS
-- ============================================================

CREATE POLICY "suspensions_select_own" ON suspensions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "suspensions_admin" ON suspensions
  FOR ALL USING (is_admin());

-- ============================================================
-- AUDIT LOGS (append-only for admins)
-- ============================================================

CREATE POLICY "audit_logs_select_admin" ON audit_logs
  FOR SELECT USING (is_admin());

-- Service role can insert audit logs
CREATE POLICY "audit_logs_insert_service" ON audit_logs
  FOR INSERT WITH CHECK (true);

-- ============================================================
-- ADMIN NOTES
-- ============================================================

CREATE POLICY "admin_notes_admin" ON admin_notes
  FOR ALL USING (is_admin());

-- ============================================================
-- Public read tables (no RLS needed for public data)
-- ============================================================
-- specialties, doctors (active/verified), healthcare_facilities (active),
-- pharmacies (active), laboratories (active), first_aid_guides (published),
-- first_aid_categories, first_aid_steps, roles are readable by anyone
-- but modifications are admin-only via service role.
