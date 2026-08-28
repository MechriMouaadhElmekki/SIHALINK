-- SIHALINK RLS Policies
-- Migration 002: Row Level Security

-- ============================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trusted_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_report_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_triage_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE false_report_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE suspensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE specialties ENABLE ROW LEVEL SECURITY;
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
-- HELPER FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT role IN ('ADMIN', 'SUPER_ADMIN') FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_operator()
RETURNS BOOLEAN AS $$
  SELECT role IN ('EMERGENCY_OPERATOR', 'ADMIN', 'SUPER_ADMIN') FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- PROFILES
-- ============================================================

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can update profiles"
  ON profiles FOR UPDATE
  USING (is_admin());

-- ============================================================
-- TRUSTED CONTACTS
-- ============================================================

CREATE POLICY "Users manage own trusted contacts"
  ON trusted_contacts FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view trusted contacts"
  ON trusted_contacts FOR SELECT
  USING (is_admin());

-- ============================================================
-- EMERGENCY REPORTS
-- ============================================================

CREATE POLICY "Users can view own reports"
  ON emergency_reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create reports"
  ON emergency_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own draft reports"
  ON emergency_reports FOR UPDATE
  USING (auth.uid() = user_id AND status = 'DRAFT');

CREATE POLICY "Operators can view all reports"
  ON emergency_reports FOR SELECT
  USING (is_operator());

CREATE POLICY "Operators can update reports"
  ON emergency_reports FOR UPDATE
  USING (is_operator());

CREATE POLICY "Admins have full report access"
  ON emergency_reports FOR ALL
  USING (is_admin());

-- ============================================================
-- EMERGENCY REPORT EVENTS
-- ============================================================

CREATE POLICY "Users view events of own reports"
  ON emergency_report_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM emergency_reports
      WHERE id = report_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Operators view all events"
  ON emergency_report_events FOR SELECT
  USING (is_operator());

CREATE POLICY "Operators insert events"
  ON emergency_report_events FOR INSERT
  WITH CHECK (is_operator() OR (
    EXISTS (
      SELECT 1 FROM emergency_reports
      WHERE id = report_id AND user_id = auth.uid()
    )
  ));

-- ============================================================
-- TRIAGE ANSWERS
-- ============================================================

CREATE POLICY "Users manage own triage answers"
  ON emergency_triage_answers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM emergency_reports
      WHERE id = report_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Operators view triage answers"
  ON emergency_triage_answers FOR SELECT
  USING (is_operator());

-- ============================================================
-- EMERGENCY LOCATIONS
-- ============================================================

CREATE POLICY "Users view own locations"
  ON emergency_locations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM emergency_reports
      WHERE id = report_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users insert locations for own reports"
  ON emergency_locations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM emergency_reports
      WHERE id = report_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Operators view all locations"
  ON emergency_locations FOR SELECT
  USING (is_operator());

-- ============================================================
-- EMERGENCY MEDIA
-- ============================================================

CREATE POLICY "Users manage own media"
  ON emergency_media FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Operators view media"
  ON emergency_media FOR SELECT
  USING (is_operator());

-- ============================================================
-- APPOINTMENTS
-- ============================================================

CREATE POLICY "Users view own appointments"
  ON appointments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users create appointments"
  ON appointments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own appointments"
  ON appointments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Doctors view their appointments"
  ON appointments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM doctors
      WHERE id = doctor_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins view all appointments"
  ON appointments FOR ALL
  USING (is_admin());

-- ============================================================
-- DOCTORS (public read)
-- ============================================================

CREATE POLICY "Anyone can view active doctors"
  ON doctors FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Admins manage doctors"
  ON doctors FOR ALL
  USING (is_admin());

-- ============================================================
-- SPECIALTIES (public read)
-- ============================================================

CREATE POLICY "Anyone can view specialties"
  ON specialties FOR SELECT
  USING (TRUE);

CREATE POLICY "Admins manage specialties"
  ON specialties FOR ALL
  USING (is_admin());

-- ============================================================
-- DOCTOR SPECIALTIES (public read)
-- ============================================================

CREATE POLICY "Anyone can view doctor specialties"
  ON doctor_specialties FOR SELECT
  USING (TRUE);

CREATE POLICY "Admins manage doctor specialties"
  ON doctor_specialties FOR ALL
  USING (is_admin());

-- ============================================================
-- DOCTOR AVAILABILITY (public read)
-- ============================================================

CREATE POLICY "Anyone can view doctor availability"
  ON doctor_availability FOR SELECT
  USING (TRUE);

CREATE POLICY "Admins manage availability"
  ON doctor_availability FOR ALL
  USING (is_admin());

-- ============================================================
-- HEALTHCARE FACILITIES (public read)
-- ============================================================

CREATE POLICY "Anyone can view active facilities"
  ON healthcare_facilities FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Admins manage facilities"
  ON healthcare_facilities FOR ALL
  USING (is_admin());

CREATE POLICY "Anyone can view facility services"
  ON facility_services FOR SELECT
  USING (TRUE);

-- ============================================================
-- PHARMACIES (public read)
-- ============================================================

CREATE POLICY "Anyone can view active pharmacies"
  ON pharmacies FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Admins manage pharmacies"
  ON pharmacies FOR ALL
  USING (is_admin());

-- ============================================================
-- LABORATORIES (public read)
-- ============================================================

CREATE POLICY "Anyone can view active labs"
  ON laboratories FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Admins manage labs"
  ON laboratories FOR ALL
  USING (is_admin());

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE POLICY "Users view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (TRUE);

-- ============================================================
-- NOTIFICATION PREFERENCES
-- ============================================================

CREATE POLICY "Users manage own notification preferences"
  ON notification_preferences FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================
-- FIRST AID (public read for published)
-- ============================================================

CREATE POLICY "Anyone can view active first aid categories"
  ON first_aid_categories FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Anyone can view published guides"
  ON first_aid_guides FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Anyone can view guide steps"
  ON first_aid_steps FOR SELECT
  USING (TRUE);

CREATE POLICY "Admins manage first aid content"
  ON first_aid_categories FOR ALL
  USING (is_admin());

CREATE POLICY "Admins manage first aid guides"
  ON first_aid_guides FOR ALL
  USING (is_admin());

-- ============================================================
-- SAVED GUIDES
-- ============================================================

CREATE POLICY "Users manage saved guides"
  ON saved_first_aid_guides FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================
-- AUDIT LOGS
-- ============================================================

CREATE POLICY "Admins view audit logs"
  ON audit_logs FOR SELECT
  USING (is_admin());

CREATE POLICY "System inserts audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (TRUE);

-- ============================================================
-- ADMIN NOTES
-- ============================================================

CREATE POLICY "Admins manage admin notes"
  ON admin_notes FOR ALL
  USING (is_admin());

-- ============================================================
-- SYSTEM SETTINGS
-- ============================================================

CREATE POLICY "Admins view system settings"
  ON system_settings FOR SELECT
  USING (is_admin());

CREATE POLICY "Super admins update settings"
  ON system_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
    )
  );

-- ============================================================
-- FALSE REPORTS
-- ============================================================

CREATE POLICY "Users view own false report cases"
  ON false_report_cases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins manage false report cases"
  ON false_report_cases FOR ALL
  USING (is_admin());

-- ============================================================
-- SUSPENSIONS
-- ============================================================

CREATE POLICY "Users view own suspensions"
  ON suspensions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins manage suspensions"
  ON suspensions FOR ALL
  USING (is_admin());
