-- ============================================================
-- SIHALINK Migration 002: Row Level Security Policies
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trusted_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_triage_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_report_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE false_report_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE suspensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_first_aid_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE healthcare_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE facility_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacies ENABLE ROW LEVEL SECURITY;
ALTER TABLE laboratories ENABLE ROW LEVEL SECURITY;
ALTER TABLE specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE first_aid_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE first_aid_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE first_aid_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Helper function: get caller role
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper function: is admin or super admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('ADMIN','SUPER_ADMIN')
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper function: is operator or admin
CREATE OR REPLACE FUNCTION is_operator_or_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('EMERGENCY_OPERATOR','ADMIN','SUPER_ADMIN')
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================
-- PROFILES POLICIES
-- ============================================================

CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM profiles WHERE id = auth.uid()));

CREATE POLICY "profiles_select_admin" ON profiles
  FOR SELECT USING (is_admin());

CREATE POLICY "profiles_update_admin" ON profiles
  FOR UPDATE USING (is_admin());

CREATE POLICY "profiles_select_doctor_public" ON profiles
  FOR SELECT USING (
    role IN ('DOCTOR','HEALTHCARE_PROVIDER') AND account_status = 'ACTIVE'
  );

-- ============================================================
-- TRUSTED CONTACTS POLICIES
-- ============================================================

CREATE POLICY "trusted_contacts_own" ON trusted_contacts
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "trusted_contacts_admin" ON trusted_contacts
  FOR SELECT USING (is_admin());

-- ============================================================
-- NOTIFICATION PREFERENCES POLICIES
-- ============================================================

CREATE POLICY "notif_prefs_own" ON notification_preferences
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- EMERGENCY REPORTS POLICIES
-- ============================================================

CREATE POLICY "reports_select_own" ON emergency_reports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "reports_insert_own" ON emergency_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reports_update_own_draft" ON emergency_reports
  FOR UPDATE USING (
    auth.uid() = user_id AND status = 'DRAFT'
  );

CREATE POLICY "reports_select_operator" ON emergency_reports
  FOR SELECT USING (is_operator_or_admin());

CREATE POLICY "reports_update_operator" ON emergency_reports
  FOR UPDATE USING (is_operator_or_admin());

-- ============================================================
-- EMERGENCY LOCATIONS POLICIES
-- ============================================================

CREATE POLICY "locations_insert_auth" ON emergency_locations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "locations_select_own_report" ON emergency_locations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM emergency_reports
      WHERE location_id = emergency_locations.id
      AND (user_id = auth.uid() OR is_operator_or_admin())
    )
  );

-- ============================================================
-- TRIAGE ANSWERS POLICIES
-- ============================================================

CREATE POLICY "triage_own" ON emergency_triage_answers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM emergency_reports WHERE id = report_id AND user_id = auth.uid())
  );

CREATE POLICY "triage_operator" ON emergency_triage_answers
  FOR SELECT USING (is_operator_or_admin());

-- ============================================================
-- REPORT EVENTS POLICIES
-- ============================================================

CREATE POLICY "events_select_own" ON emergency_report_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM emergency_reports WHERE id = report_id AND user_id = auth.uid())
    AND is_visible_to_user = TRUE
  );

CREATE POLICY "events_select_operator" ON emergency_report_events
  FOR SELECT USING (is_operator_or_admin());

CREATE POLICY "events_insert_operator" ON emergency_report_events
  FOR INSERT WITH CHECK (is_operator_or_admin() OR
    EXISTS (SELECT 1 FROM emergency_reports WHERE id = report_id AND user_id = auth.uid())
  );

-- ============================================================
-- EMERGENCY MEDIA POLICIES
-- ============================================================

CREATE POLICY "media_own" ON emergency_media
  FOR ALL USING (
    uploaded_by = auth.uid() OR
    EXISTS (SELECT 1 FROM emergency_reports WHERE id = report_id AND user_id = auth.uid())
  );

CREATE POLICY "media_operator" ON emergency_media
  FOR SELECT USING (is_operator_or_admin());

-- ============================================================
-- APPOINTMENTS POLICIES
-- ============================================================

CREATE POLICY "appointments_patient" ON appointments
  FOR ALL USING (auth.uid() = patient_id)
  WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "appointments_doctor" ON appointments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM doctors WHERE id = doctor_id AND user_id = auth.uid())
  );

CREATE POLICY "appointments_doctor_update" ON appointments
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM doctors WHERE id = doctor_id AND user_id = auth.uid())
  );

CREATE POLICY "appointments_admin" ON appointments
  FOR ALL USING (is_admin());

-- ============================================================
-- NOTIFICATIONS POLICIES
-- ============================================================

CREATE POLICY "notifications_own" ON notifications
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- DOCTORS POLICIES (public readable for verified)
-- ============================================================

CREATE POLICY "doctors_public_read" ON doctors
  FOR SELECT USING (verification_status = 'VERIFIED' OR is_demo = TRUE);

CREATE POLICY "doctors_admin_all" ON doctors
  FOR ALL USING (is_admin());

CREATE POLICY "doctors_own" ON doctors
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- DOCTOR AVAILABILITY POLICIES
-- ============================================================

CREATE POLICY "availability_public_read" ON doctor_availability
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM doctors WHERE id = doctor_id AND (verification_status = 'VERIFIED' OR is_demo = TRUE))
  );

CREATE POLICY "availability_doctor_own" ON doctor_availability
  FOR ALL USING (
    EXISTS (SELECT 1 FROM doctors WHERE id = doctor_id AND user_id = auth.uid())
  );

CREATE POLICY "availability_admin" ON doctor_availability
  FOR ALL USING (is_admin());

-- ============================================================
-- HEALTHCARE FACILITIES - PUBLIC READ
-- ============================================================

CREATE POLICY "facilities_public_read" ON healthcare_facilities
  FOR SELECT USING (verification_status = 'VERIFIED' OR is_demo = TRUE);

CREATE POLICY "facilities_admin_all" ON healthcare_facilities
  FOR ALL USING (is_admin());

CREATE POLICY "facility_services_public_read" ON facility_services
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM healthcare_facilities WHERE id = facility_id AND (verification_status = 'VERIFIED' OR is_demo = TRUE))
  );

CREATE POLICY "facility_services_admin" ON facility_services
  FOR ALL USING (is_admin());

-- ============================================================
-- PHARMACIES - PUBLIC READ
-- ============================================================

CREATE POLICY "pharmacies_public_read" ON pharmacies
  FOR SELECT USING (verification_status = 'VERIFIED' OR is_demo = TRUE);

CREATE POLICY "pharmacies_admin" ON pharmacies
  FOR ALL USING (is_admin());

-- ============================================================
-- LABORATORIES - PUBLIC READ
-- ============================================================

CREATE POLICY "laboratories_public_read" ON laboratories
  FOR SELECT USING (verification_status = 'VERIFIED' OR is_demo = TRUE);

CREATE POLICY "laboratories_admin" ON laboratories
  FOR ALL USING (is_admin());

-- ============================================================
-- SPECIALTIES - PUBLIC READ
-- ============================================================

CREATE POLICY "specialties_public_read" ON specialties
  FOR SELECT USING (TRUE);

CREATE POLICY "specialties_admin" ON specialties
  FOR ALL USING (is_admin());

-- ============================================================
-- FIRST AID - PUBLIC READ FOR PUBLISHED
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

-- ============================================================
-- SAVED GUIDES
-- ============================================================

CREATE POLICY "saved_guides_own" ON saved_first_aid_guides
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- AUDIT LOGS - ADMIN ONLY READ
-- ============================================================

CREATE POLICY "audit_logs_admin" ON audit_logs
  FOR SELECT USING (is_admin());

CREATE POLICY "audit_logs_insert_any" ON audit_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- ADMIN NOTES
-- ============================================================

CREATE POLICY "admin_notes_admin" ON admin_notes
  FOR ALL USING (is_admin());

-- ============================================================
-- SYSTEM SETTINGS
-- ============================================================

CREATE POLICY "system_settings_public_read" ON system_settings
  FOR SELECT USING (is_public = TRUE);

CREATE POLICY "system_settings_admin" ON system_settings
  FOR ALL USING (is_admin());

-- ============================================================
-- FALSE REPORT CASES
-- ============================================================

CREATE POLICY "false_reports_own" ON false_report_cases
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "false_reports_admin" ON false_report_cases
  FOR ALL USING (is_admin());

-- ============================================================
-- SUSPENSIONS
-- ============================================================

CREATE POLICY "suspensions_own" ON suspensions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "suspensions_admin" ON suspensions
  FOR ALL USING (is_admin());

-- ============================================================
-- PROFILE AUTO-CREATE TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, first_name, last_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    'USER'
  );
  INSERT INTO notification_preferences (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
