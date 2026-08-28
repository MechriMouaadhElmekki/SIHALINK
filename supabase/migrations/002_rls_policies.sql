-- ============================================================
-- SIHALINK - Row Level Security Policies
-- Migration 002: RLS
-- ============================================================

-- Helper function: get current user role names
CREATE OR REPLACE FUNCTION get_user_roles(uid UUID)
RETURNS TEXT[] AS $$
  SELECT ARRAY_AGG(r.name)
  FROM user_roles ur
  JOIN roles r ON r.id = ur.role_id
  WHERE ur.user_id = uid;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper: check if user has role
CREATE OR REPLACE FUNCTION has_role(uid UUID, role_name TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = uid AND r.name = role_name
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper: check if user is admin or super_admin
CREATE OR REPLACE FUNCTION is_admin(uid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = uid AND r.name IN ('ADMIN','SUPER_ADMIN')
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_operator(uid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = uid AND r.name IN ('EMERGENCY_OPERATOR','ADMIN','SUPER_ADMIN')
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================================
-- Enable RLS on all tables
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE trusted_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_report_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_triage_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE false_report_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE suspensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE healthcare_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE facility_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacies ENABLE ROW LEVEL SECURITY;
ALTER TABLE laboratories ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE first_aid_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE first_aid_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE first_aid_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_first_aid_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PROFILES
-- ============================================================
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id OR is_admin(auth.uid()));

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id OR is_admin(auth.uid()));

CREATE POLICY "profiles_admin_all" ON profiles
  FOR ALL USING (is_admin(auth.uid()));

-- ============================================================
-- USER ROLES
-- ============================================================
CREATE POLICY "user_roles_select_own" ON user_roles
  FOR SELECT USING (user_id = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "user_roles_admin_manage" ON user_roles
  FOR ALL USING (is_admin(auth.uid()));

-- ============================================================
-- NOTIFICATION PREFERENCES
-- ============================================================
CREATE POLICY "notif_prefs_own" ON notification_preferences
  FOR ALL USING (user_id = auth.uid());

-- ============================================================
-- TRUSTED CONTACTS
-- ============================================================
CREATE POLICY "trusted_contacts_own" ON trusted_contacts
  FOR ALL USING (user_id = auth.uid());

-- ============================================================
-- EMERGENCY REPORTS
-- ============================================================
CREATE POLICY "reports_select_own" ON emergency_reports
  FOR SELECT USING (
    user_id = auth.uid()
    OR is_operator(auth.uid())
    OR is_admin(auth.uid())
  );

CREATE POLICY "reports_insert_own" ON emergency_reports
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "reports_update_own_or_operator" ON emergency_reports
  FOR UPDATE USING (
    user_id = auth.uid()
    OR is_operator(auth.uid())
    OR is_admin(auth.uid())
  );

-- ============================================================
-- EMERGENCY REPORT EVENTS
-- ============================================================
CREATE POLICY "report_events_select" ON emergency_report_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM emergency_reports er
      WHERE er.id = report_id
      AND (er.user_id = auth.uid() OR is_operator(auth.uid()))
    )
  );

CREATE POLICY "report_events_insert" ON emergency_report_events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM emergency_reports er
      WHERE er.id = report_id
      AND (er.user_id = auth.uid() OR is_operator(auth.uid()))
    )
  );

-- ============================================================
-- EMERGENCY TRIAGE ANSWERS
-- ============================================================
CREATE POLICY "triage_own_or_operator" ON emergency_triage_answers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM emergency_reports er
      WHERE er.id = report_id
      AND (er.user_id = auth.uid() OR is_operator(auth.uid()))
    )
  );

-- ============================================================
-- EMERGENCY LOCATIONS
-- ============================================================
CREATE POLICY "locations_own_or_operator" ON emergency_locations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM emergency_reports er
      WHERE er.id = report_id
      AND (er.user_id = auth.uid() OR is_operator(auth.uid()))
    )
  );

-- ============================================================
-- EMERGENCY MEDIA
-- ============================================================
CREATE POLICY "media_own_or_operator" ON emergency_media
  FOR ALL USING (
    uploaded_by = auth.uid()
    OR is_operator(auth.uid())
  );

-- ============================================================
-- APPOINTMENTS
-- ============================================================
CREATE POLICY "appointments_patient_own" ON appointments
  FOR SELECT USING (
    patient_id = auth.uid()
    OR EXISTS (SELECT 1 FROM doctors d WHERE d.id = doctor_id AND d.user_id = auth.uid())
    OR is_admin(auth.uid())
  );

CREATE POLICY "appointments_patient_insert" ON appointments
  FOR INSERT WITH CHECK (patient_id = auth.uid());

CREATE POLICY "appointments_update" ON appointments
  FOR UPDATE USING (
    patient_id = auth.uid()
    OR EXISTS (SELECT 1 FROM doctors d WHERE d.id = doctor_id AND d.user_id = auth.uid())
    OR is_admin(auth.uid())
  );

-- ============================================================
-- DOCTORS (public read for verified)
-- ============================================================
CREATE POLICY "doctors_public_read" ON doctors
  FOR SELECT USING (is_verified = TRUE OR is_admin(auth.uid()));

CREATE POLICY "doctors_admin_manage" ON doctors
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "doctors_own_update" ON doctors
  FOR UPDATE USING (user_id = auth.uid() OR is_admin(auth.uid()));

-- ============================================================
-- DOCTOR SPECIALTIES / AVAILABILITY (public read)
-- ============================================================
CREATE POLICY "doctor_specialties_read" ON doctor_specialties
  FOR SELECT USING (TRUE);

CREATE POLICY "doctor_availability_read" ON doctor_availability
  FOR SELECT USING (TRUE);

CREATE POLICY "doctor_availability_own" ON doctor_availability
  FOR ALL USING (
    EXISTS (SELECT 1 FROM doctors d WHERE d.id = doctor_id AND d.user_id = auth.uid())
    OR is_admin(auth.uid())
  );

-- ============================================================
-- HEALTHCARE FACILITIES (public read)
-- ============================================================
CREATE POLICY "facilities_public_read" ON healthcare_facilities
  FOR SELECT USING (TRUE);

CREATE POLICY "facilities_admin_manage" ON healthcare_facilities
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "facility_services_read" ON facility_services
  FOR SELECT USING (TRUE);

-- ============================================================
-- PHARMACIES / LABS (public read)
-- ============================================================
CREATE POLICY "pharmacies_public_read" ON pharmacies
  FOR SELECT USING (TRUE);

CREATE POLICY "pharmacies_admin_manage" ON pharmacies
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "labs_public_read" ON laboratories
  FOR SELECT USING (TRUE);

CREATE POLICY "labs_admin_manage" ON laboratories
  FOR ALL USING (is_admin(auth.uid()));

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE POLICY "notifications_own" ON notifications
  FOR ALL USING (user_id = auth.uid());

-- ============================================================
-- FIRST AID (public read for published)
-- ============================================================
CREATE POLICY "first_aid_categories_read" ON first_aid_categories
  FOR SELECT USING (TRUE);

CREATE POLICY "first_aid_guides_read" ON first_aid_guides
  FOR SELECT USING (is_published = TRUE OR is_admin(auth.uid()));

CREATE POLICY "first_aid_steps_read" ON first_aid_steps
  FOR SELECT USING (TRUE);

CREATE POLICY "first_aid_guides_admin" ON first_aid_guides
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "first_aid_steps_admin" ON first_aid_steps
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "saved_guides_own" ON saved_first_aid_guides
  FOR ALL USING (user_id = auth.uid());

-- ============================================================
-- AUDIT LOGS (admin read only)
-- ============================================================
CREATE POLICY "audit_logs_admin_read" ON audit_logs
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "audit_logs_insert" ON audit_logs
  FOR INSERT WITH CHECK (TRUE);

-- ============================================================
-- SYSTEM SETTINGS (admin only)
-- ============================================================
CREATE POLICY "system_settings_admin" ON system_settings
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "system_settings_read_auth" ON system_settings
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- ============================================================
-- FALSE REPORTS / SUSPENSIONS (admin/operator)
-- ============================================================
CREATE POLICY "false_reports_admin" ON false_report_cases
  FOR ALL USING (is_admin(auth.uid()) OR is_operator(auth.uid()));

CREATE POLICY "suspensions_admin" ON suspensions
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "admin_notes_admin" ON admin_notes
  FOR ALL USING (is_admin(auth.uid()));
