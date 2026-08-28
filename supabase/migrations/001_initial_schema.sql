-- ============================================================
-- SIHALINK Database Schema v1.0
-- Complete production schema with RLS, triggers, indexes
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- UTILITY: updated_at trigger function
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- ROLES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.roles (name, description) VALUES
  ('USER', 'Standard user - can report emergencies and book appointments'),
  ('DOCTOR', 'Medical professional - can manage appointments'),
  ('HEALTHCARE_PROVIDER', 'Healthcare facility manager'),
  ('EMERGENCY_OPERATOR', 'Emergency response operator'),
  ('ADMIN', 'Platform administrator'),
  ('SUPER_ADMIN', 'Super administrator with full access')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  email TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male','female','other','prefer_not_to_say')),
  blood_type TEXT CHECK (blood_type IN ('A+','A-','B+','B-','AB+','AB-','O+','O-','unknown')),
  address TEXT,
  city TEXT,
  wilaya TEXT,
  profile_photo_url TEXT,
  preferred_language TEXT NOT NULL DEFAULT 'ar' CHECK (preferred_language IN ('ar','fr','en')),
  emergency_notes TEXT,
  account_status TEXT NOT NULL DEFAULT 'active' CHECK (account_status IN ('active','suspended','restricted','deleted')),
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_wilaya ON public.profiles(wilaya);
CREATE INDEX idx_profiles_city ON public.profiles(city);
CREATE INDEX idx_profiles_account_status ON public.profiles(account_status);

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- USER ROLES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_name TEXT NOT NULL REFERENCES public.roles(name) ON DELETE CASCADE,
  granted_by UUID REFERENCES public.profiles(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role_name)
);

CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role_name ON public.user_roles(role_name);

-- ============================================================
-- TRUSTED CONTACTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.trusted_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relationship TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  priority INTEGER NOT NULL DEFAULT 1 CHECK (priority >= 1 AND priority <= 10),
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_trusted_contacts_user_id ON public.trusted_contacts(user_id);

CREATE TRIGGER trusted_contacts_updated_at
  BEFORE UPDATE ON public.trusted_contacts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- NOTIFICATION PREFERENCES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  sms_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  push_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  emergency_updates BOOLEAN NOT NULL DEFAULT TRUE,
  appointment_updates BOOLEAN NOT NULL DEFAULT TRUE,
  security_alerts BOOLEAN NOT NULL DEFAULT TRUE,
  system_announcements BOOLEAN NOT NULL DEFAULT TRUE,
  account_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- EMERGENCY REPORTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.emergency_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_number TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  emergency_type TEXT NOT NULL CHECK (emergency_type IN (
    'MEDICAL','ACCIDENT','FIRE','PREGNANCY','CHILD_EMERGENCY',
    'ELDERLY_EMERGENCY','UNCONSCIOUS','BREATHING_DIFFICULTY',
    'CHEST_PAIN','SEVERE_BLEEDING','OTHER'
  )),
  priority TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('CRITICAL','HIGH','MEDIUM','LOW')),
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN (
    'DRAFT','SUBMITTED','RECEIVED','UNDER_REVIEW','ASSIGNED',
    'ACKNOWLEDGED','IN_PROGRESS','RESOLVED','CANCELLED',
    'REJECTED','FALSE_REPORT_REVIEW','CLOSED'
  )),
  description TEXT,
  additional_info TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  assigned_operator_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_emergency_reports_user_id ON public.emergency_reports(user_id);
CREATE INDEX idx_emergency_reports_status ON public.emergency_reports(status);
CREATE INDEX idx_emergency_reports_priority ON public.emergency_reports(priority);
CREATE INDEX idx_emergency_reports_created_at ON public.emergency_reports(created_at DESC);
CREATE INDEX idx_emergency_reports_report_number ON public.emergency_reports(report_number);

CREATE TRIGGER emergency_reports_updated_at
  BEFORE UPDATE ON public.emergency_reports
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Report number generator
CREATE OR REPLACE FUNCTION public.generate_report_number()
RETURNS TEXT AS $$
DECLARE
  year_part TEXT := TO_CHAR(NOW(), 'YYYY');
  seq_num INTEGER;
  report_num TEXT;
BEGIN
  SELECT COUNT(*) + 1 INTO seq_num
  FROM public.emergency_reports
  WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());
  report_num := 'SH-' || year_part || '-' || LPAD(seq_num::TEXT, 6, '0');
  RETURN report_num;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- EMERGENCY TRIAGE ANSWERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.emergency_triage_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES public.emergency_reports(id) ON DELETE CASCADE,
  question_key TEXT NOT NULL,
  question_text TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_triage_answers_report_id ON public.emergency_triage_answers(report_id);

-- ============================================================
-- EMERGENCY LOCATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.emergency_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL UNIQUE REFERENCES public.emergency_reports(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  accuracy DECIMAL(10, 2),
  address TEXT,
  city TEXT,
  wilaya TEXT,
  commune TEXT,
  manual_override BOOLEAN NOT NULL DEFAULT FALSE,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_emergency_locations_report_id ON public.emergency_locations(report_id);
CREATE INDEX idx_emergency_locations_wilaya ON public.emergency_locations(wilaya);

-- ============================================================
-- EMERGENCY MEDIA
-- ============================================================
CREATE TABLE IF NOT EXISTS public.emergency_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES public.emergency_reports(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_emergency_media_report_id ON public.emergency_media(report_id);

-- ============================================================
-- REPORT STATUS HISTORY
-- ============================================================
CREATE TABLE IF NOT EXISTS public.report_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES public.emergency_reports(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by UUID REFERENCES public.profiles(id),
  reason TEXT,
  operator_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_report_status_history_report_id ON public.report_status_history(report_id);
CREATE INDEX idx_report_status_history_created_at ON public.report_status_history(created_at DESC);

-- ============================================================
-- EMERGENCY REPORT EVENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.emergency_report_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES public.emergency_reports(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  description TEXT,
  actor_id UUID REFERENCES public.profiles(id),
  actor_role TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_report_events_report_id ON public.emergency_report_events(report_id);
CREATE INDEX idx_report_events_created_at ON public.emergency_report_events(created_at DESC);

-- ============================================================
-- FALSE REPORT CASES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.false_report_cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES public.emergency_reports(id),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  case_type TEXT NOT NULL CHECK (case_type IN ('ACCIDENTAL','INTENTIONAL','UNDER_REVIEW')),
  reason TEXT,
  evidence TEXT,
  reviewer_id UUID REFERENCES public.profiles(id),
  decision TEXT CHECK (decision IN ('DISMISSED','WARNING_ISSUED','SUSPENDED','RESTRICTED')),
  decision_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_false_report_cases_user_id ON public.false_report_cases(user_id);
CREATE INDEX idx_false_report_cases_report_id ON public.false_report_cases(report_id);

-- ============================================================
-- SUSPENSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.suspensions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  suspension_type TEXT NOT NULL CHECK (suspension_type IN ('WARNING','TEMPORARY','RESTRICTED')),
  reason TEXT NOT NULL,
  issued_by UUID NOT NULL REFERENCES public.profiles(id),
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_suspensions_user_id ON public.suspensions(user_id);
CREATE INDEX idx_suspensions_is_active ON public.suspensions(is_active);

CREATE TRIGGER suspensions_updated_at
  BEFORE UPDATE ON public.suspensions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- SPECIALTIES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.specialties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_ar TEXT NOT NULL,
  name_fr TEXT NOT NULL,
  name_en TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- DOCTORS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.doctors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  photo_url TEXT,
  bio_ar TEXT,
  bio_fr TEXT,
  bio_en TEXT,
  gender TEXT CHECK (gender IN ('male','female')),
  experience_years INTEGER CHECK (experience_years >= 0),
  languages TEXT[] NOT NULL DEFAULT ARRAY['ar'],
  consultation_types TEXT[] NOT NULL DEFAULT ARRAY['in_person'],
  phone TEXT,
  email TEXT,
  city TEXT,
  wilaya TEXT,
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending','verified','rejected','demo')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  rating DECIMAL(3,2) CHECK (rating >= 0 AND rating <= 5),
  total_reviews INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_doctors_city ON public.doctors(city);
CREATE INDEX idx_doctors_wilaya ON public.doctors(wilaya);
CREATE INDEX idx_doctors_verification_status ON public.doctors(verification_status);
CREATE INDEX idx_doctors_is_active ON public.doctors(is_active);

CREATE TRIGGER doctors_updated_at
  BEFORE UPDATE ON public.doctors
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- DOCTOR SPECIALTIES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.doctor_specialties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  specialty_id UUID NOT NULL REFERENCES public.specialties(id) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE(doctor_id, specialty_id)
);

CREATE INDEX idx_doctor_specialties_doctor_id ON public.doctor_specialties(doctor_id);
CREATE INDEX idx_doctor_specialties_specialty_id ON public.doctor_specialties(specialty_id);

-- ============================================================
-- DOCTOR AVAILABILITY
-- ============================================================
CREATE TABLE IF NOT EXISTS public.doctor_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_duration_minutes INTEGER NOT NULL DEFAULT 30,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(doctor_id, day_of_week, start_time)
);

CREATE INDEX idx_doctor_availability_doctor_id ON public.doctor_availability(doctor_id);

-- ============================================================
-- APPOINTMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES public.profiles(id),
  doctor_id UUID NOT NULL REFERENCES public.doctors(id),
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  consultation_type TEXT NOT NULL CHECK (consultation_type IN ('in_person','teleconsultation')),
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'REQUESTED' CHECK (status IN (
    'REQUESTED','CONFIRMED','RESCHEDULED','CANCELLED_BY_USER',
    'CANCELLED_BY_DOCTOR','COMPLETED','NO_SHOW'
  )),
  patient_notes TEXT,
  doctor_notes TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT no_double_booking UNIQUE(doctor_id, appointment_date, appointment_time)
);

CREATE INDEX idx_appointments_patient_id ON public.appointments(patient_id);
CREATE INDEX idx_appointments_doctor_id ON public.appointments(doctor_id);
CREATE INDEX idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX idx_appointments_status ON public.appointments(status);

CREATE TRIGGER appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- APPOINTMENT STATUS HISTORY
-- ============================================================
CREATE TABLE IF NOT EXISTS public.appointment_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by UUID REFERENCES public.profiles(id),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_appt_status_history_appt_id ON public.appointment_status_history(appointment_id);

-- ============================================================
-- HEALTHCARE FACILITIES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.healthcare_facilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  facility_type TEXT NOT NULL CHECK (facility_type IN (
    'HOSPITAL','CLINIC','MEDICAL_CENTER','EMERGENCY_DEPT',
    'IMAGING_CENTER','PHARMACY','LABORATORY'
  )),
  description_ar TEXT,
  description_fr TEXT,
  description_en TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT NOT NULL,
  wilaya TEXT NOT NULL,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  opening_hours JSONB,
  has_emergency BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  verification_status TEXT NOT NULL DEFAULT 'demo' CHECK (verification_status IN ('pending','verified','demo')),
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_facilities_wilaya ON public.healthcare_facilities(wilaya);
CREATE INDEX idx_facilities_city ON public.healthcare_facilities(city);
CREATE INDEX idx_facilities_type ON public.healthcare_facilities(facility_type);

CREATE TRIGGER facilities_updated_at
  BEFORE UPDATE ON public.healthcare_facilities
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- FACILITY SERVICES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.facility_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id UUID NOT NULL REFERENCES public.healthcare_facilities(id) ON DELETE CASCADE,
  service_name_ar TEXT NOT NULL,
  service_name_fr TEXT NOT NULL,
  service_name_en TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_facility_services_facility_id ON public.facility_services(facility_id);

-- ============================================================
-- PHARMACIES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.pharmacies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  wilaya TEXT NOT NULL,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  opening_hours JSONB,
  is_24h BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pharmacies_wilaya ON public.pharmacies(wilaya);
CREATE INDEX idx_pharmacies_city ON public.pharmacies(city);

CREATE TRIGGER pharmacies_updated_at
  BEFORE UPDATE ON public.pharmacies
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- LABORATORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.laboratories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  wilaya TEXT NOT NULL,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  opening_hours JSONB,
  services TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_labs_wilaya ON public.laboratories(wilaya);
CREATE INDEX idx_labs_city ON public.laboratories(city);

CREATE TRIGGER laboratories_updated_at
  BEFORE UPDATE ON public.laboratories
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'EMERGENCY_UPDATE','APPOINTMENT_UPDATE','SECURITY_ALERT',
    'SYSTEM_ANNOUNCEMENT','ACCOUNT_NOTIFICATION'
  )),
  title_ar TEXT NOT NULL,
  title_fr TEXT NOT NULL,
  title_en TEXT NOT NULL,
  body_ar TEXT NOT NULL,
  body_fr TEXT NOT NULL,
  body_en TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  related_entity_type TEXT,
  related_entity_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(user_id, is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- ============================================================
-- FIRST AID CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.first_aid_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_ar TEXT NOT NULL,
  name_fr TEXT NOT NULL,
  name_en TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  color TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- FIRST AID GUIDES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.first_aid_guides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES public.first_aid_categories(id),
  title_ar TEXT NOT NULL,
  title_fr TEXT NOT NULL,
  title_en TEXT NOT NULL,
  warning_ar TEXT,
  warning_fr TEXT,
  warning_en TEXT,
  call_emergency_when_ar TEXT,
  call_emergency_when_fr TEXT,
  call_emergency_when_en TEXT,
  do_not_do_ar TEXT,
  do_not_do_fr TEXT,
  do_not_do_en TEXT,
  source TEXT,
  review_status TEXT NOT NULL DEFAULT 'draft' CHECK (review_status IN ('draft','under_review','published')),
  reviewed_by TEXT,
  last_reviewed_at DATE,
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_first_aid_guides_category_id ON public.first_aid_guides(category_id);

CREATE TRIGGER first_aid_guides_updated_at
  BEFORE UPDATE ON public.first_aid_guides
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- FIRST AID STEPS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.first_aid_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guide_id UUID NOT NULL REFERENCES public.first_aid_guides(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  instruction_ar TEXT NOT NULL,
  instruction_fr TEXT NOT NULL,
  instruction_en TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(guide_id, step_number)
);

CREATE INDEX idx_first_aid_steps_guide_id ON public.first_aid_steps(guide_id);

-- ============================================================
-- SAVED FIRST AID GUIDES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.saved_first_aid_guides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  guide_id UUID NOT NULL REFERENCES public.first_aid_guides(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, guide_id)
);

CREATE INDEX idx_saved_guides_user_id ON public.saved_first_aid_guides(user_id);

-- ============================================================
-- AUDIT LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES public.profiles(id),
  actor_role TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_actor_id ON public.audit_logs(actor_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_entity_type ON public.audit_logs(entity_type);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- ============================================================
-- ADMIN NOTES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.admin_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  note TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_admin_notes_entity ON public.admin_notes(entity_type, entity_id);

-- ============================================================
-- SYSTEM SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Default system settings
INSERT INTO public.system_settings (key, value, description) VALUES
  ('demo_mode', 'true', 'Enable demo mode for presentations'),
  ('max_reports_per_hour', '3', 'Max emergency reports per user per hour'),
  ('max_media_per_report', '5', 'Max media files per report'),
  ('max_media_size_mb', '10', 'Max single file size in MB'),
  ('emergency_dispatch_provider', '"mock"', 'Active emergency dispatch provider'),
  ('map_provider', '"openstreetmap"', 'Active map provider'),
  ('email_provider', '"development"', 'Active email provider'),
  ('sms_provider', '"development"', 'Active SMS provider'),
  ('platform_name', '{"ar":"سيهالينك","fr":"SIHALINK","en":"SIHALINK"}', 'Platform name translations')
ON CONFLICT (key) DO NOTHING;
