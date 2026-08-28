-- ============================================================
-- SIHALINK Row Level Security Policies
-- ============================================================

-- Helper function: get current user's role(s)
CREATE OR REPLACE FUNCTION public.get_user_roles(user_uuid UUID)
RETURNS TEXT[] AS $$
  SELECT ARRAY_AGG(role_name)
  FROM public.user_roles
  WHERE user_id = user_uuid;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper: is user admin or super admin
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = user_uuid
    AND role_name IN ('ADMIN', 'SUPER_ADMIN')
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper: is user emergency operator
CREATE OR REPLACE FUNCTION public.is_operator(user_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = user_uuid
    AND role_name = 'EMERGENCY_OPERATOR'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper: is user doctor
CREATE OR REPLACE FUNCTION public.is_doctor(user_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = user_uuid
    AND role_name = 'DOCTOR'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================
-- PROFILES
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin(auth.uid()));

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id OR public.is_admin(auth.uid()));

CREATE POLICY "profiles_delete_admin" ON public.profiles
  FOR DELETE USING (public.is_admin(auth.uid()));

-- ============================================================
-- USER ROLES
-- ============================================================
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_roles_select" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "user_roles_insert_admin" ON public.user_roles
  FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "user_roles_delete_admin" ON public.user_roles
  FOR DELETE USING (public.is_admin(auth.uid()));

-- ============================================================
-- TRUSTED CONTACTS
-- ============================================================
ALTER TABLE public.trusted_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trusted_contacts_own" ON public.trusted_contacts
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- NOTIFICATION PREFERENCES
-- ============================================================
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notif_prefs_own" ON public.notification_preferences
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- EMERGENCY REPORTS
-- ============================================================
ALTER TABLE public.emergency_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reports_select_own" ON public.emergency_reports
  FOR SELECT USING (
    auth.uid() = user_id
    OR public.is_admin(auth.uid())
    OR public.is_operator(auth.uid())
  );

CREATE POLICY "reports_insert_own" ON public.emergency_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reports_update_own_or_operator" ON public.emergency_reports
  FOR UPDATE USING (
    auth.uid() = user_id
    OR public.is_admin(auth.uid())
    OR public.is_operator(auth.uid())
  );

-- ============================================================
-- EMERGENCY TRIAGE
-- ============================================================
ALTER TABLE public.emergency_triage_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "triage_via_report" ON public.emergency_triage_answers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.emergency_reports r
      WHERE r.id = report_id
      AND (
        r.user_id = auth.uid()
        OR public.is_admin(auth.uid())
        OR public.is_operator(auth.uid())
      )
    )
  );

-- ============================================================
-- EMERGENCY LOCATIONS
-- ============================================================
ALTER TABLE public.emergency_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "locations_via_report" ON public.emergency_locations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.emergency_reports r
      WHERE r.id = report_id
      AND (
        r.user_id = auth.uid()
        OR public.is_admin(auth.uid())
        OR public.is_operator(auth.uid())
      )
    )
  );

-- ============================================================
-- EMERGENCY MEDIA
-- ============================================================
ALTER TABLE public.emergency_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "media_via_report" ON public.emergency_media
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.emergency_reports r
      WHERE r.id = report_id
      AND (
        r.user_id = auth.uid()
        OR public.is_admin(auth.uid())
        OR public.is_operator(auth.uid())
      )
    )
  );

-- ============================================================
-- REPORT STATUS HISTORY / EVENTS
-- ============================================================
ALTER TABLE public.report_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "report_status_history_via_report" ON public.report_status_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.emergency_reports r
      WHERE r.id = report_id
      AND (
        r.user_id = auth.uid()
        OR public.is_admin(auth.uid())
        OR public.is_operator(auth.uid())
      )
    )
  );

CREATE POLICY "report_status_history_insert_operator" ON public.report_status_history
  FOR INSERT WITH CHECK (
    public.is_admin(auth.uid())
    OR public.is_operator(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.emergency_reports r
      WHERE r.id = report_id AND r.user_id = auth.uid()
    )
  );

ALTER TABLE public.emergency_report_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "report_events_via_report" ON public.emergency_report_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.emergency_reports r
      WHERE r.id = report_id
      AND (
        r.user_id = auth.uid()
        OR public.is_admin(auth.uid())
        OR public.is_operator(auth.uid())
      )
    )
  );

CREATE POLICY "report_events_insert" ON public.emergency_report_events
  FOR INSERT WITH CHECK (TRUE);

-- ============================================================
-- APPOINTMENTS
-- ============================================================
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "appointments_patient" ON public.appointments
  FOR SELECT USING (
    auth.uid() = patient_id
    OR public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.doctors d
      WHERE d.id = doctor_id AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "appointments_insert_patient" ON public.appointments
  FOR INSERT WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "appointments_update" ON public.appointments
  FOR UPDATE USING (
    auth.uid() = patient_id
    OR public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.doctors d
      WHERE d.id = doctor_id AND d.user_id = auth.uid()
    )
  );

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_own" ON public.notifications
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- PUBLIC READ TABLES (doctors, facilities, etc.)
-- ============================================================
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "doctors_public_read" ON public.doctors
  FOR SELECT USING (is_active = TRUE OR public.is_admin(auth.uid()));

CREATE POLICY "doctors_admin_write" ON public.doctors
  FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "doctors_admin_update" ON public.doctors
  FOR UPDATE USING (public.is_admin(auth.uid()));

ALTER TABLE public.specialties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "specialties_public_read" ON public.specialties FOR SELECT USING (TRUE);
CREATE POLICY "specialties_admin_write" ON public.specialties FOR INSERT WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "specialties_admin_update" ON public.specialties FOR UPDATE USING (public.is_admin(auth.uid()));

ALTER TABLE public.doctor_specialties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "doctor_specialties_public_read" ON public.doctor_specialties FOR SELECT USING (TRUE);

ALTER TABLE public.doctor_availability ENABLE ROW LEVEL SECURITY;
CREATE POLICY "doctor_availability_public_read" ON public.doctor_availability FOR SELECT USING (TRUE);

ALTER TABLE public.healthcare_facilities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "facilities_public_read" ON public.healthcare_facilities FOR SELECT USING (is_active = TRUE OR public.is_admin(auth.uid()));
CREATE POLICY "facilities_admin_write" ON public.healthcare_facilities FOR INSERT WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "facilities_admin_update" ON public.healthcare_facilities FOR UPDATE USING (public.is_admin(auth.uid()));

ALTER TABLE public.facility_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "facility_services_public_read" ON public.facility_services FOR SELECT USING (TRUE);

ALTER TABLE public.pharmacies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pharmacies_public_read" ON public.pharmacies FOR SELECT USING (is_active = TRUE OR public.is_admin(auth.uid()));
CREATE POLICY "pharmacies_admin_write" ON public.pharmacies FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

ALTER TABLE public.laboratories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "labs_public_read" ON public.laboratories FOR SELECT USING (is_active = TRUE OR public.is_admin(auth.uid()));
CREATE POLICY "labs_admin_write" ON public.laboratories FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

ALTER TABLE public.first_aid_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "first_aid_cat_public_read" ON public.first_aid_categories FOR SELECT USING (is_active = TRUE);
CREATE POLICY "first_aid_cat_admin_write" ON public.first_aid_categories FOR ALL USING (public.is_admin(auth.uid()));

ALTER TABLE public.first_aid_guides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "first_aid_guides_public_read" ON public.first_aid_guides FOR SELECT USING (review_status = 'published' OR public.is_admin(auth.uid()));
CREATE POLICY "first_aid_guides_admin_write" ON public.first_aid_guides FOR ALL USING (public.is_admin(auth.uid()));

ALTER TABLE public.first_aid_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "first_aid_steps_public_read" ON public.first_aid_steps FOR SELECT USING (TRUE);
CREATE POLICY "first_aid_steps_admin_write" ON public.first_aid_steps FOR ALL USING (public.is_admin(auth.uid()));

ALTER TABLE public.saved_first_aid_guides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "saved_guides_own" ON public.saved_first_aid_guides FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_logs_admin_read" ON public.audit_logs FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "audit_logs_insert" ON public.audit_logs FOR INSERT WITH CHECK (TRUE);

ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_notes_admin" ON public.admin_notes FOR ALL USING (public.is_admin(auth.uid()));

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "system_settings_admin_read" ON public.system_settings FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "system_settings_superadmin_write" ON public.system_settings FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role_name = 'SUPER_ADMIN')
);

ALTER TABLE public.false_report_cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "false_reports_admin" ON public.false_report_cases FOR SELECT USING (public.is_admin(auth.uid()) OR public.is_operator(auth.uid()));
CREATE POLICY "false_reports_insert" ON public.false_report_cases FOR INSERT WITH CHECK (public.is_admin(auth.uid()) OR public.is_operator(auth.uid()));

ALTER TABLE public.suspensions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "suspensions_admin" ON public.suspensions FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "suspensions_own_read" ON public.suspensions FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "roles_public_read" ON public.roles FOR SELECT USING (TRUE);
