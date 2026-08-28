-- ============================================================
-- SIHALINK RLS Policies - Migration 002
-- Row Level Security for all sensitive tables
-- ============================================================

-- Enable RLS on all user-data tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trusted_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_report_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_triage_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE false_report_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE suspensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_first_aid_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_specialties ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION auth_user_id()
RETURNS UUID AS $$
  SELECT auth.uid();
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION user_has_role(role_name TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
    AND r.name = role_name
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION user_is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
    AND r.name IN ('ADMIN', 'SUPER_ADMIN')
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION user_is_operator()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
    AND r.name IN ('EMERGENCY_OPERATOR', 'ADMIN', 'SUPER_ADMIN')
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- ============================================================
-- PROFILES POLICIES
-- ============================================================

CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (id = auth.uid() OR user_is_admin());

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_admin_select_all"
  ON profiles FOR SELECT
  USING (user_is_admin());

-- ============================================================
-- USER ROLES POLICIES
-- ============================================================

CREATE POLICY "user_roles_select_own"
  ON user_roles FOR SELECT
  USING (user_id = auth.uid() OR user_is_admin());

CREATE POLICY "user_roles_admin_manage"
  ON user_roles FOR ALL
  USING (user_is_admin());

-- ============================================================
-- TRUSTED CONTACTS POLICIES
-- ============================================================

CREATE POLICY "trusted_contacts_own"
  ON trusted_contacts FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- EMERGENCY REPORTS POLICIES
-- ============================================================

CREATE POLICY "reports_select_own"
  ON emergency_reports FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "reports_insert_own"
  ON emergency_reports FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "reports_update_own_draft"
  ON emergency_reports FOR UPDATE
  USING (user_id = auth.uid() AND status = 'DRAFT')
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "reports_operator_select"
  ON emergency_reports FOR SELECT
  USING (user_is_operator());

CREATE POLICY "reports_operator_update"
  ON emergency_reports FOR UPDATE
  USING (user_is_operator());

-- ============================================================
-- EMERGENCY REPORT EVENTS POLICIES
-- ============================================================

CREATE POLICY "report_events_select"
  ON emergency_report_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM emergency_reports r
      WHERE r.id = report_id
      AND (r.user_id = auth.uid() OR user_is_operator())
    )
  );

CREATE POLICY "report_events_insert"
  ON emergency_report_events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM emergency_reports r
      WHERE r.id = report_id
      AND (r.user_id = auth.uid() OR user_is_operator())
    )
  );

-- ============================================================
-- TRIAGE ANSWERS POLICIES
-- ============================================================

CREATE POLICY "triage_answers_own"
  ON emergency_triage_answers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM emergency_reports r
      WHERE r.id = report_id
      AND (r.user_id = auth.uid() OR user_is_operator())
    )
  );

-- ============================================================
-- EMERGENCY LOCATIONS POLICIES
-- ============================================================

CREATE POLICY "locations_own"
  ON emergency_locations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM emergency_reports r
      WHERE r.id = report_id
      AND (r.user_id = auth.uid() OR user_is_operator())
    )
  );

-- ============================================================
-- EMERGENCY MEDIA POLICIES
-- ============================================================

CREATE POLICY "media_own"
  ON emergency_media FOR ALL
  USING (
    uploaded_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM emergency_reports r
      WHERE r.id = report_id AND user_is_operator()
    )
  );

-- ============================================================
-- APPOINTMENTS POLICIES
-- ============================================================

CREATE POLICY "appointments_patient_select"
  ON appointments FOR SELECT
  USING (patient_id = auth.uid());

CREATE POLICY "appointments_patient_insert"
  ON appointments FOR INSERT
  WITH CHECK (patient_id = auth.uid());

CREATE POLICY "appointments_patient_cancel"
  ON appointments FOR UPDATE
  USING (patient_id = auth.uid())
  WITH CHECK (patient_id = auth.uid());

CREATE POLICY "appointments_doctor_manage"
  ON appointments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM doctors d
      WHERE d.id = doctor_id AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "appointments_admin_select"
  ON appointments FOR SELECT
  USING (user_is_admin());

-- ============================================================
-- NOTIFICATIONS POLICIES
-- ============================================================

CREATE POLICY "notifications_own"
  ON notifications FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- NOTIFICATION PREFERENCES POLICIES
-- ============================================================

CREATE POLICY "notification_prefs_own"
  ON notification_preferences FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- DOCTORS POLICIES
-- ============================================================

CREATE POLICY "doctors_public_read"
  ON doctors FOR SELECT
  USING (is_active = TRUE AND verification_status = 'verified');

CREATE POLICY "doctors_own_manage"
  ON doctors FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "doctors_admin_all"
  ON doctors FOR ALL
  USING (user_is_admin());

-- ============================================================
-- AUDIT LOGS POLICIES
-- ============================================================

CREATE POLICY "audit_logs_admin_select"
  ON audit_logs FOR SELECT
  USING (user_is_admin());

CREATE POLICY "audit_logs_insert_authenticated"
  ON audit_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- SAVED FIRST AID GUIDES POLICIES
-- ============================================================

CREATE POLICY "saved_guides_own"
  ON saved_first_aid_guides FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- Public read policies for directories
-- ============================================================

ALTER TABLE healthcare_facilities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "facilities_public_read"
  ON healthcare_facilities FOR SELECT
  USING (is_active = TRUE);
CREATE POLICY "facilities_admin_all"
  ON healthcare_facilities FOR ALL
  USING (user_is_admin());

ALTER TABLE pharmacies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pharmacies_public_read"
  ON pharmacies FOR SELECT USING (is_active = TRUE);
CREATE POLICY "pharmacies_admin_all"
  ON pharmacies FOR ALL USING (user_is_admin());

ALTER TABLE laboratories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "laboratories_public_read"
  ON laboratories FOR SELECT USING (is_active = TRUE);
CREATE POLICY "laboratories_admin_all"
  ON laboratories FOR ALL USING (user_is_admin());

ALTER TABLE specialties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "specialties_public_read"
  ON specialties FOR SELECT USING (TRUE);
CREATE POLICY "specialties_admin_manage"
  ON specialties FOR ALL USING (user_is_admin());

ALTER TABLE first_aid_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fac_public_read"
  ON first_aid_categories FOR SELECT USING (is_active = TRUE);
CREATE POLICY "fac_admin_all"
  ON first_aid_categories FOR ALL USING (user_is_admin());

ALTER TABLE first_aid_guides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fag_public_read"
  ON first_aid_guides FOR SELECT USING (is_active = TRUE AND review_status = 'published');
CREATE POLICY "fag_admin_all"
  ON first_aid_guides FOR ALL USING (user_is_admin());

ALTER TABLE first_aid_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fas_public_read"
  ON first_aid_steps FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM first_aid_guides g
      WHERE g.id = guide_id AND g.is_active = TRUE AND g.review_status = 'published'
    )
  );
CREATE POLICY "fas_admin_all"
  ON first_aid_steps FOR ALL USING (user_is_admin());
