-- ============================================================
-- SIHALINK RLS Policies - Migration 002
-- Row Level Security for all tables
-- ============================================================

-- Helper function: get current user role
CREATE OR REPLACE FUNCTION get_user_role(uid UUID)
RETURNS user_role AS $$
  SELECT role FROM user_roles WHERE user_id = uid ORDER BY
    CASE role
      WHEN 'SUPER_ADMIN' THEN 1
      WHEN 'ADMIN' THEN 2
      WHEN 'EMERGENCY_OPERATOR' THEN 3
      WHEN 'HEALTHCARE_PROVIDER' THEN 4
      WHEN 'DOCTOR' THEN 5
      ELSE 6
    END
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_admin(uid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = uid AND role IN ('ADMIN', 'SUPER_ADMIN')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_operator_or_above(uid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = uid AND role IN ('EMERGENCY_OPERATOR', 'ADMIN', 'SUPER_ADMIN')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- ENABLE RLS
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trusted_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_triage_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_report_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_media ENABLE ROW LEVEL SECURITY;
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
CREATE POLICY "profiles_own_read" ON profiles FOR SELECT USING (auth.uid() = id OR is_admin(auth.uid()));
CREATE POLICY "profiles_own_update" ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_admin_all" ON profiles FOR ALL USING (is_admin(auth.uid()));
-- Operators can see basic profile info for reports they handle
CREATE POLICY "profiles_operator_read" ON profiles FOR SELECT USING (is_operator_or_above(auth.uid()));

-- ============================================================
-- USER ROLES
-- ============================================================
CREATE POLICY "user_roles_own_read" ON user_roles FOR SELECT USING (auth.uid() = user_id OR is_admin(auth.uid()));
CREATE POLICY "user_roles_admin_manage" ON user_roles FOR ALL USING (is_admin(auth.uid()));

-- ============================================================
-- TRUSTED CONTACTS
-- ============================================================
CREATE POLICY "trusted_contacts_own" ON trusted_contacts FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- EMERGENCY REPORTS
-- ============================================================
CREATE POLICY "reports_own_read" ON emergency_reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "reports_own_insert" ON emergency_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reports_own_update_draft" ON emergency_reports FOR UPDATE USING (
  auth.uid() = user_id AND status = 'DRAFT'
) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reports_operator_read" ON emergency_reports FOR SELECT USING (is_operator_or_above(auth.uid()));
CREATE POLICY "reports_operator_update" ON emergency_reports FOR UPDATE USING (is_operator_or_above(auth.uid()));
CREATE POLICY "reports_admin_all" ON emergency_reports FOR ALL USING (is_admin(auth.uid()));

-- ============================================================
-- EMERGENCY LOCATIONS
-- ============================================================
CREATE POLICY "locations_own" ON emergency_locations FOR ALL USING (
  EXISTS (SELECT 1 FROM emergency_reports WHERE id = report_id AND user_id = auth.uid())
);
CREATE POLICY "locations_operator" ON emergency_locations FOR SELECT USING (is_operator_or_above(auth.uid()));

-- ============================================================
-- EMERGENCY TRIAGE ANSWERS
-- ============================================================
CREATE POLICY "triage_own" ON emergency_triage_answers FOR ALL USING (
  EXISTS (SELECT 1 FROM emergency_reports WHERE id = report_id AND user_id = auth.uid())
);
CREATE POLICY "triage_operator" ON emergency_triage_answers FOR SELECT USING (is_operator_or_above(auth.uid()));

-- ============================================================
-- EMERGENCY REPORT EVENTS
-- ============================================================
CREATE POLICY "events_own" ON emergency_report_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM emergency_reports WHERE id = report_id AND user_id = auth.uid())
);
CREATE POLICY "events_operator" ON emergency_report_events FOR ALL USING (is_operator_or_above(auth.uid()));
CREATE POLICY "events_insert_any_auth" ON emergency_report_events FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- REPORT STATUS HISTORY
-- ============================================================
CREATE POLICY "status_history_own" ON report_status_history FOR SELECT USING (
  EXISTS (SELECT 1 FROM emergency_reports WHERE id = report_id AND user_id = auth.uid())
);
CREATE POLICY "status_history_operator" ON report_status_history FOR ALL USING (is_operator_or_above(auth.uid()));

-- ============================================================
-- EMERGENCY MEDIA
-- ============================================================
CREATE POLICY "media_own" ON emergency_media FOR ALL USING (
  uploaded_by = auth.uid() OR
  EXISTS (SELECT 1 FROM emergency_reports WHERE id = report_id AND user_id = auth.uid())
);
CREATE POLICY "media_operator" ON emergency_media FOR SELECT USING (is_operator_or_above(auth.uid()));

-- ============================================================
-- FALSE REPORT CASES
-- ============================================================
CREATE POLICY "false_reports_admin" ON false_report_cases FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "false_reports_own_read" ON false_report_cases FOR SELECT USING (
  EXISTS (SELECT 1 FROM emergency_reports WHERE id = report_id AND user_id = auth.uid())
);

-- ============================================================
-- SUSPENSIONS
-- ============================================================
CREATE POLICY "suspensions_own_read" ON suspensions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "suspensions_admin" ON suspensions FOR ALL USING (is_admin(auth.uid()));

-- ============================================================
-- DOCTORS (public read for published/verified)
-- ============================================================
CREATE POLICY "doctors_public_read" ON doctors FOR SELECT USING (
  verification_status IN ('VERIFIED', 'DEMO') OR is_admin(auth.uid())
);
CREATE POLICY "doctors_own_update" ON doctors FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "doctors_admin" ON doctors FOR ALL USING (is_admin(auth.uid()));

-- ============================================================
-- DOCTOR SPECIALTIES, AVAILABILITY
-- ============================================================
CREATE POLICY "doctor_specialties_public" ON doctor_specialties FOR SELECT USING (true);
CREATE POLICY "doctor_specialties_admin" ON doctor_specialties FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "doctor_availability_public" ON doctor_availability FOR SELECT USING (true);
CREATE POLICY "doctor_availability_admin" ON doctor_availability FOR ALL USING (is_admin(auth.uid()));

-- ============================================================
-- APPOINTMENTS
-- ============================================================
CREATE POLICY "appointments_patient" ON appointments FOR ALL USING (auth.uid() = patient_id);
CREATE POLICY "appointments_doctor" ON appointments FOR SELECT USING (
  EXISTS (SELECT 1 FROM doctors WHERE id = doctor_id AND user_id = auth.uid())
);
CREATE POLICY "appointments_doctor_update" ON appointments FOR UPDATE USING (
  EXISTS (SELECT 1 FROM doctors WHERE id = doctor_id AND user_id = auth.uid())
);
CREATE POLICY "appointments_admin" ON appointments FOR ALL USING (is_admin(auth.uid()));

-- ============================================================
-- HEALTHCARE FACILITIES, PHARMACIES, LABS (public read)
-- ============================================================
CREATE POLICY "facilities_public_read" ON healthcare_facilities FOR SELECT USING (true);
CREATE POLICY "facilities_admin" ON healthcare_facilities FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "facility_services_public" ON facility_services FOR SELECT USING (true);
CREATE POLICY "facility_services_admin" ON facility_services FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "pharmacies_public" ON pharmacies FOR SELECT USING (true);
CREATE POLICY "pharmacies_admin" ON pharmacies FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "laboratories_public" ON laboratories FOR SELECT USING (true);
CREATE POLICY "laboratories_admin" ON laboratories FOR ALL USING (is_admin(auth.uid()));

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE POLICY "notifications_own" ON notifications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "notifications_admin_insert" ON notifications FOR INSERT WITH CHECK (is_admin(auth.uid()) OR auth.uid() IS NOT NULL);

-- ============================================================
-- NOTIFICATION PREFERENCES
-- ============================================================
CREATE POLICY "notif_prefs_own" ON notification_preferences FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- FIRST AID (public read for published)
-- ============================================================
CREATE POLICY "first_aid_categories_public" ON first_aid_categories FOR SELECT USING (true);
CREATE POLICY "first_aid_categories_admin" ON first_aid_categories FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "first_aid_guides_public" ON first_aid_guides FOR SELECT USING (is_published = true OR is_admin(auth.uid()));
CREATE POLICY "first_aid_guides_admin" ON first_aid_guides FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "first_aid_steps_public" ON first_aid_steps FOR SELECT USING (
  EXISTS (SELECT 1 FROM first_aid_guides WHERE id = guide_id AND is_published = true) OR is_admin(auth.uid())
);
CREATE POLICY "first_aid_steps_admin" ON first_aid_steps FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "saved_guides_own" ON saved_first_aid_guides FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- AUDIT LOGS (admin read only, append via service role)
-- ============================================================
CREATE POLICY "audit_logs_admin_read" ON audit_logs FOR SELECT USING (is_admin(auth.uid()));

-- ============================================================
-- ADMIN NOTES
-- ============================================================
CREATE POLICY "admin_notes_admin" ON admin_notes FOR ALL USING (is_admin(auth.uid()));

-- ============================================================
-- SYSTEM SETTINGS
-- ============================================================
CREATE POLICY "system_settings_public_read" ON system_settings FOR SELECT USING (is_public = true OR is_admin(auth.uid()));
CREATE POLICY "system_settings_admin" ON system_settings FOR ALL USING (is_admin(auth.uid()));

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, preferred_language)
  VALUES (NEW.id, NEW.email, 'ar')
  ON CONFLICT (id) DO NOTHING;

  -- Assign default USER role
  INSERT INTO user_roles (user_id, role)
  VALUES (NEW.id, 'USER')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Create default notification preferences
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
