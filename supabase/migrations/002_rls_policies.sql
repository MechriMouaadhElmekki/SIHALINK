-- ============================================================
-- SIHALINK - Row Level Security Policies
-- Migration: 002_rls_policies
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE trusted_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_triage_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_report_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE false_report_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE suspensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE healthcare_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE facility_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacies ENABLE ROW LEVEL SECURITY;
ALTER TABLE laboratories ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE first_aid_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE first_aid_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE first_aid_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_first_aid_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function to check if user is admin or higher
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT role IN ('ADMIN', 'SUPER_ADMIN') FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function to check if user is operator or higher
CREATE OR REPLACE FUNCTION is_operator_or_admin()
RETURNS BOOLEAN AS $$
  SELECT role IN ('EMERGENCY_OPERATOR', 'ADMIN', 'SUPER_ADMIN') FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- PROFILES POLICIES
-- ============================================================

CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_admin_all" ON profiles
  FOR ALL USING (is_admin());

CREATE POLICY "profiles_operator_select" ON profiles
  FOR SELECT USING (is_operator_or_admin());

-- ============================================================
-- NOTIFICATION PREFERENCES POLICIES
-- ============================================================

CREATE POLICY "notif_prefs_own" ON notification_preferences
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- TRUSTED CONTACTS POLICIES
-- ============================================================

CREATE POLICY "trusted_contacts_own" ON trusted_contacts
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- EMERGENCY REPORTS POLICIES
-- ============================================================

CREATE POLICY "reports_user_own" ON emergency_reports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "reports_user_insert" ON emergency_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reports_user_update_own" ON emergency_reports
  FOR UPDATE USING (
    auth.uid() = user_id
    AND status IN ('DRAFT', 'SUBMITTED')
  );

CREATE POLICY "reports_operator_select" ON emergency_reports
  FOR SELECT USING (is_operator_or_admin());

CREATE POLICY "reports_operator_update" ON emergency_reports
  FOR UPDATE USING (is_operator_or_admin());

-- ============================================================
-- TRIAGE ANSWERS POLICIES
-- ============================================================

CREATE POLICY "triage_user_own" ON emergency_triage_answers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM emergency_reports WHERE id = report_id AND user_id = auth.uid())
  );

CREATE POLICY "triage_operator" ON emergency_triage_answers
  FOR SELECT USING (is_operator_or_admin());

-- ============================================================
-- EMERGENCY LOCATIONS POLICIES
-- ============================================================

CREATE POLICY "locations_user_own" ON emergency_locations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM emergency_reports WHERE id = report_id AND user_id = auth.uid())
  );

CREATE POLICY "locations_operator" ON emergency_locations
  FOR SELECT USING (is_operator_or_admin());

-- ============================================================
-- EMERGENCY MEDIA POLICIES
-- ============================================================

CREATE POLICY "media_user_own" ON emergency_media
  FOR ALL USING (
    EXISTS (SELECT 1 FROM emergency_reports WHERE id = report_id AND user_id = auth.uid())
  );

CREATE POLICY "media_operator" ON emergency_media
  FOR SELECT USING (is_operator_or_admin());

-- ============================================================
-- REPORT STATUS HISTORY POLICIES
-- ============================================================

CREATE POLICY "status_history_user_own" ON report_status_history
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM emergency_reports WHERE id = report_id AND user_id = auth.uid())
  );

CREATE POLICY "status_history_operator" ON report_status_history
  FOR ALL USING (is_operator_or_admin());

-- ============================================================
-- REPORT EVENTS POLICIES
-- ============================================================

CREATE POLICY "events_user_own" ON emergency_report_events
  FOR SELECT USING (
    is_visible_to_user = TRUE AND
    EXISTS (SELECT 1 FROM emergency_reports WHERE id = report_id AND user_id = auth.uid())
  );

CREATE POLICY "events_operator" ON emergency_report_events
  FOR ALL USING (is_operator_or_admin());

-- ============================================================
-- FALSE REPORT CASES POLICIES
-- ============================================================

CREATE POLICY "false_reports_admin" ON false_report_cases
  FOR ALL USING (is_admin());

CREATE POLICY "false_reports_user_view_own" ON false_report_cases
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================================
-- SUSPENSIONS POLICIES
-- ============================================================

CREATE POLICY "suspensions_admin" ON suspensions
  FOR ALL USING (is_admin());

CREATE POLICY "suspensions_user_view_own" ON suspensions
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================================
-- SPECIALTIES - PUBLIC READ
-- ============================================================

CREATE POLICY "specialties_public_read" ON specialties
  FOR SELECT USING (TRUE);

CREATE POLICY "specialties_admin_write" ON specialties
  FOR ALL USING (is_admin());

-- ============================================================
-- HEALTHCARE FACILITIES - PUBLIC READ
-- ============================================================

CREATE POLICY "facilities_public_read" ON healthcare_facilities
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "facilities_admin_all" ON healthcare_facilities
  FOR ALL USING (is_admin());

CREATE POLICY "facility_services_public_read" ON facility_services
  FOR SELECT USING (TRUE);

CREATE POLICY "facility_services_admin" ON facility_services
  FOR ALL USING (is_admin());

-- ============================================================
-- PHARMACIES - PUBLIC READ
-- ============================================================

CREATE POLICY "pharmacies_public_read" ON pharmacies
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "pharmacies_admin" ON pharmacies
  FOR ALL USING (is_admin());

-- ============================================================
-- LABORATORIES - PUBLIC READ
-- ============================================================

CREATE POLICY "laboratories_public_read" ON laboratories
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "laboratories_admin" ON laboratories
  FOR ALL USING (is_admin());

-- ============================================================
-- DOCTORS POLICIES
-- ============================================================

CREATE POLICY "doctors_public_read" ON doctors
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "doctors_admin_all" ON doctors
  FOR ALL USING (is_admin());

CREATE POLICY "doctor_specialties_public_read" ON doctor_specialties
  FOR SELECT USING (TRUE);

CREATE POLICY "doctor_specialties_admin" ON doctor_specialties
  FOR ALL USING (is_admin());

CREATE POLICY "doctor_availability_public_read" ON doctor_availability
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "doctor_availability_admin" ON doctor_availability
  FOR ALL USING (is_admin());

-- ============================================================
-- APPOINTMENTS POLICIES
-- ============================================================

CREATE POLICY "appointments_patient_own" ON appointments
  FOR SELECT USING (auth.uid() = patient_id);

CREATE POLICY "appointments_patient_insert" ON appointments
  FOR INSERT WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "appointments_patient_cancel" ON appointments
  FOR UPDATE USING (
    auth.uid() = patient_id
    AND status IN ('REQUESTED', 'CONFIRMED')
  );

CREATE POLICY "appointments_admin_all" ON appointments
  FOR ALL USING (is_admin());

CREATE POLICY "appt_history_patient_own" ON appointment_status_history
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM appointments WHERE id = appointment_id AND patient_id = auth.uid())
  );

CREATE POLICY "appt_history_admin" ON appointment_status_history
  FOR ALL USING (is_admin());

-- ============================================================
-- NOTIFICATIONS POLICIES
-- ============================================================

CREATE POLICY "notifications_own" ON notifications
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- FIRST AID - PUBLIC READ
-- ============================================================

CREATE POLICY "first_aid_categories_public" ON first_aid_categories
  FOR SELECT USING (is_published = TRUE);

CREATE POLICY "first_aid_categories_admin" ON first_aid_categories
  FOR ALL USING (is_admin());

CREATE POLICY "first_aid_guides_public" ON first_aid_guides
  FOR SELECT USING (is_published = TRUE);

CREATE POLICY "first_aid_guides_admin" ON first_aid_guides
  FOR ALL USING (is_admin());

CREATE POLICY "first_aid_steps_public" ON first_aid_steps
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM first_aid_guides WHERE id = guide_id AND is_published = TRUE)
  );

CREATE POLICY "first_aid_steps_admin" ON first_aid_steps
  FOR ALL USING (is_admin());

CREATE POLICY "saved_guides_own" ON saved_first_aid_guides
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- AUDIT LOGS - ADMIN ONLY
-- ============================================================

CREATE POLICY "audit_logs_admin" ON audit_logs
  FOR SELECT USING (is_admin());

CREATE POLICY "audit_logs_insert_service" ON audit_logs
  FOR INSERT WITH CHECK (TRUE);

-- ============================================================
-- ADMIN NOTES
-- ============================================================

CREATE POLICY "admin_notes_admin" ON admin_notes
  FOR ALL USING (is_admin());

-- ============================================================
-- SYSTEM SETTINGS
-- ============================================================

CREATE POLICY "system_settings_public_read" ON system_settings
  FOR SELECT USING (is_public = TRUE OR is_admin());

CREATE POLICY "system_settings_admin_write" ON system_settings
  FOR ALL USING (is_admin());
