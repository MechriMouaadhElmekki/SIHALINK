-- ============================================================
-- SIHALINK - Row Level Security Policies
-- Migration 002: RLS Policies
-- ============================================================

-- Enable RLS on all user-facing tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trusted_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_report_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_triage_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE false_report_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE suspensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_first_aid_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID)
RETURNS user_role AS $$
  SELECT role FROM user_roles WHERE user_id = user_uuid
  ORDER BY CASE role
    WHEN 'SUPER_ADMIN' THEN 1 WHEN 'ADMIN' THEN 2
    WHEN 'EMERGENCY_OPERATOR' THEN 3 WHEN 'HEALTHCARE_PROVIDER' THEN 4
    WHEN 'DOCTOR' THEN 5 WHEN 'USER' THEN 6
  END LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = user_uuid
    AND role IN ('ADMIN', 'SUPER_ADMIN')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_operator(user_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = user_uuid
    AND role IN ('EMERGENCY_OPERATOR', 'ADMIN', 'SUPER_ADMIN')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- PROFILES RLS
-- ============================================================

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE USING (is_admin(auth.uid()));

CREATE POLICY "Allow profile creation on signup"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================================
-- USER ROLES RLS
-- ============================================================

CREATE POLICY "Users can view their own roles"
  ON user_roles FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON user_roles FOR ALL USING (is_admin(auth.uid()));

-- ============================================================
-- TRUSTED CONTACTS RLS
-- ============================================================

CREATE POLICY "Users manage their own trusted contacts"
  ON trusted_contacts FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins view all trusted contacts"
  ON trusted_contacts FOR SELECT USING (is_admin(auth.uid()));

-- ============================================================
-- EMERGENCY REPORTS RLS
-- ============================================================

CREATE POLICY "Users can create reports"
  ON emergency_reports FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own reports"
  ON emergency_reports FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can cancel their own draft/submitted reports"
  ON emergency_reports FOR UPDATE
  USING (auth.uid() = user_id AND status IN ('DRAFT', 'SUBMITTED'))
  WITH CHECK (status = 'CANCELLED');

CREATE POLICY "Operators can view all reports"
  ON emergency_reports FOR SELECT USING (is_operator(auth.uid()));

CREATE POLICY "Operators can update report status"
  ON emergency_reports FOR UPDATE USING (is_operator(auth.uid()));

CREATE POLICY "Admins have full report access"
  ON emergency_reports FOR ALL USING (is_admin(auth.uid()));

-- ============================================================
-- EMERGENCY REPORT EVENTS RLS
-- ============================================================

CREATE POLICY "Users can view events for their reports"
  ON emergency_report_events FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM emergency_reports
    WHERE id = report_id AND user_id = auth.uid()
  ));

CREATE POLICY "Operators can view and create events"
  ON emergency_report_events FOR ALL USING (is_operator(auth.uid()));

CREATE POLICY "System can create events"
  ON emergency_report_events FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- TRIAGE ANSWERS RLS
-- ============================================================

CREATE POLICY "Users can manage triage for their reports"
  ON emergency_triage_answers FOR ALL
  USING (EXISTS (
    SELECT 1 FROM emergency_reports
    WHERE id = report_id AND user_id = auth.uid()
  ));

CREATE POLICY "Operators can view triage answers"
  ON emergency_triage_answers FOR SELECT USING (is_operator(auth.uid()));

-- ============================================================
-- EMERGENCY LOCATIONS RLS
-- ============================================================

CREATE POLICY "Users can manage locations for their reports"
  ON emergency_locations FOR ALL
  USING (EXISTS (
    SELECT 1 FROM emergency_reports
    WHERE id = report_id AND user_id = auth.uid()
  ));

CREATE POLICY "Operators can view locations"
  ON emergency_locations FOR SELECT USING (is_operator(auth.uid()));

-- ============================================================
-- EMERGENCY MEDIA RLS
-- ============================================================

CREATE POLICY "Users can manage media for their reports"
  ON emergency_media FOR ALL USING (auth.uid() = uploader_id);

CREATE POLICY "Operators can view media"
  ON emergency_media FOR SELECT USING (is_operator(auth.uid()));

-- ============================================================
-- APPOINTMENTS RLS
-- ============================================================

CREATE POLICY "Users can manage their own appointments"
  ON appointments FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Doctors can view appointments assigned to them"
  ON appointments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM doctors WHERE id = doctor_id AND user_id = auth.uid()
  ));

CREATE POLICY "Doctors can update appointments assigned to them"
  ON appointments FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM doctors WHERE id = doctor_id AND user_id = auth.uid()
  ));

CREATE POLICY "Admins can view all appointments"
  ON appointments FOR SELECT USING (is_admin(auth.uid()));

-- ============================================================
-- NOTIFICATIONS RLS
-- ============================================================

CREATE POLICY "Users can manage their own notifications"
  ON notifications FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- NOTIFICATION PREFERENCES RLS
-- ============================================================

CREATE POLICY "Users can manage their notification preferences"
  ON notification_preferences FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- SAVED FIRST AID GUIDES RLS
-- ============================================================

CREATE POLICY "Users can manage their saved guides"
  ON saved_first_aid_guides FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- AUDIT LOGS RLS
-- ============================================================

CREATE POLICY "Admins can view audit logs"
  ON audit_logs FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT WITH CHECK (TRUE);

-- ============================================================
-- ADMIN NOTES RLS
-- ============================================================

CREATE POLICY "Admins can manage notes"
  ON admin_notes FOR ALL USING (is_admin(auth.uid()));

-- ============================================================
-- SYSTEM SETTINGS RLS
-- ============================================================

CREATE POLICY "Anyone can view public settings"
  ON system_settings FOR SELECT USING (is_public = TRUE);

CREATE POLICY "Admins can manage all settings"
  ON system_settings FOR ALL USING (is_admin(auth.uid()));

-- ============================================================
-- PUBLIC READ TABLES (no auth required)
-- ============================================================
-- These tables contain public/demo directory data
ALTER TABLE healthcare_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacies ENABLE ROW LEVEL SECURITY;
ALTER TABLE laboratories ENABLE ROW LEVEL SECURITY;
ALTER TABLE first_aid_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE first_aid_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE first_aid_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE facility_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view facilities" ON healthcare_facilities FOR SELECT USING (TRUE);
CREATE POLICY "Admins can manage facilities" ON healthcare_facilities FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Public can view doctors" ON doctors FOR SELECT USING (TRUE);
CREATE POLICY "Admins can manage doctors" ON doctors FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Public can view doctor specialties" ON doctor_specialties FOR SELECT USING (TRUE);
CREATE POLICY "Public can view doctor availability" ON doctor_availability FOR SELECT USING (TRUE);
CREATE POLICY "Public can view specialties" ON specialties FOR SELECT USING (TRUE);
CREATE POLICY "Admins can manage specialties" ON specialties FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Public can view pharmacies" ON pharmacies FOR SELECT USING (TRUE);
CREATE POLICY "Admins can manage pharmacies" ON pharmacies FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Public can view laboratories" ON laboratories FOR SELECT USING (TRUE);
CREATE POLICY "Admins can manage laboratories" ON laboratories FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Public can view first aid categories" ON first_aid_categories FOR SELECT USING (TRUE);
CREATE POLICY "Public can view published guides" ON first_aid_guides FOR SELECT USING (is_published = TRUE);
CREATE POLICY "Admins can manage first aid" ON first_aid_guides FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Public can view first aid steps" ON first_aid_steps FOR SELECT USING (TRUE);
CREATE POLICY "Public can view facility services" ON facility_services FOR SELECT USING (TRUE);
