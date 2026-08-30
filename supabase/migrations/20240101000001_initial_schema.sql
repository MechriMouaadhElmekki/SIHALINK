-- ============================================================
-- SIHALINK - Complete Database Schema
-- Migration 001: Initial Schema
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- UTILITY: updated_at trigger function
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================================
-- ROLES
-- ============================================================
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO roles (name, description) VALUES
  ('USER', 'Standard user - can report emergencies and book appointments'),
  ('DOCTOR', 'Medical professional - can manage availability and appointments'),
  ('HEALTHCARE_PROVIDER', 'Healthcare facility manager'),
  ('EMERGENCY_OPERATOR', 'Emergency operations center staff'),
  ('ADMIN', 'Platform administrator'),
  ('SUPER_ADMIN', 'Super administrator with full system access')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  email TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
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

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_profiles_wilaya ON profiles(wilaya);
CREATE INDEX idx_profiles_city ON profiles(city);
CREATE INDEX idx_profiles_account_status ON profiles(account_status);

-- ============================================================
-- USER ROLES
-- ============================================================
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES profiles(id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role_id)
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);

-- ============================================================
-- TRUSTED CONTACTS
-- ============================================================
CREATE TABLE IF NOT EXISTS trusted_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relationship TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  priority INTEGER NOT NULL DEFAULT 1 CHECK (priority >= 1 AND priority <= 10),
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_trusted_contacts_updated_at
  BEFORE UPDATE ON trusted_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_trusted_contacts_user_id ON trusted_contacts(user_id);

-- ============================================================
-- EMERGENCY REPORTS
-- ============================================================
CREATE TABLE IF NOT EXISTS emergency_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_number TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  emergency_type TEXT NOT NULL CHECK (emergency_type IN (
    'medical_emergency','accident','fire','pregnancy_emergency',
    'child_emergency','elderly_emergency','unconscious_person',
    'breathing_difficulty','chest_pain','severe_bleeding','other'
  )),
  priority TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('CRITICAL','HIGH','MEDIUM','LOW')),
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN (
    'DRAFT','SUBMITTED','RECEIVED','UNDER_REVIEW','ASSIGNED',
    'ACKNOWLEDGED','IN_PROGRESS','RESOLVED','CANCELLED',
    'REJECTED','FALSE_REPORT_REVIEW','CLOSED'
  )),
  description TEXT,
  additional_info TEXT,
  affected_count INTEGER DEFAULT 1 CHECK (affected_count >= 1),
  assigned_operator_id UUID REFERENCES profiles(id),
  false_report_flag BOOLEAN NOT NULL DEFAULT FALSE,
  cancellation_reason TEXT,
  cancelled_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_emergency_reports_updated_at
  BEFORE UPDATE ON emergency_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_emergency_reports_user_id ON emergency_reports(user_id);
CREATE INDEX idx_emergency_reports_status ON emergency_reports(status);
CREATE INDEX idx_emergency_reports_priority ON emergency_reports(priority);
CREATE INDEX idx_emergency_reports_type ON emergency_reports(emergency_type);
CREATE INDEX idx_emergency_reports_created_at ON emergency_reports(created_at DESC);

-- ============================================================
-- REPORT NUMBER SEQUENCE
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS report_number_seq START 1;

CREATE OR REPLACE FUNCTION generate_report_number()
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  seq_part TEXT;
BEGIN
  year_part := EXTRACT(YEAR FROM NOW())::TEXT;
  seq_part := LPAD(nextval('report_number_seq')::TEXT, 6, '0');
  RETURN 'SH-' || year_part || '-' || seq_part;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- EMERGENCY LOCATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS emergency_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES emergency_reports(id) ON DELETE CASCADE,
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  accuracy DECIMAL(10,2),
  altitude DECIMAL(10,2),
  address TEXT,
  city TEXT,
  wilaya TEXT,
  commune TEXT,
  is_manual BOOLEAN NOT NULL DEFAULT FALSE,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_emergency_locations_report_id ON emergency_locations(report_id);

-- ============================================================
-- EMERGENCY TRIAGE ANSWERS
-- ============================================================
CREATE TABLE IF NOT EXISTS emergency_triage_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES emergency_reports(id) ON DELETE CASCADE,
  question_key TEXT NOT NULL,
  question_text_ar TEXT NOT NULL,
  question_text_fr TEXT,
  question_text_en TEXT,
  answer TEXT NOT NULL,
  answer_display_ar TEXT,
  weight INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_triage_answers_report_id ON emergency_triage_answers(report_id);

-- ============================================================
-- EMERGENCY MEDIA
-- ============================================================
CREATE TABLE IF NOT EXISTS emergency_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES emergency_reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  is_private BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_emergency_media_report_id ON emergency_media(report_id);

-- ============================================================
-- REPORT STATUS HISTORY
-- ============================================================
CREATE TABLE IF NOT EXISTS report_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES emergency_reports(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by UUID REFERENCES profiles(id),
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_report_status_history_report_id ON report_status_history(report_id);
CREATE INDEX idx_report_status_history_created_at ON report_status_history(created_at DESC);

-- ============================================================
-- EMERGENCY REPORT EVENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS emergency_report_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES emergency_reports(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  actor_id UUID REFERENCES profiles(id),
  actor_role TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  is_visible_to_user BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_report_events_report_id ON emergency_report_events(report_id);
CREATE INDEX idx_report_events_created_at ON emergency_report_events(created_at DESC);

-- ============================================================
-- FALSE REPORT CASES
-- ============================================================
CREATE TABLE IF NOT EXISTS false_report_cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES emergency_reports(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  case_type TEXT NOT NULL CHECK (case_type IN ('accidental','intentional','under_review')),
  reason TEXT,
  evidence TEXT,
  reviewer_id UUID REFERENCES profiles(id),
  decision TEXT CHECK (decision IN ('dismissed','warning_issued','suspension_applied','case_closed')),
  decision_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_false_report_cases_updated_at
  BEFORE UPDATE ON false_report_cases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_false_report_cases_user_id ON false_report_cases(user_id);
CREATE INDEX idx_false_report_cases_report_id ON false_report_cases(report_id);

-- ============================================================
-- SUSPENSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS suspensions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  suspended_by UUID REFERENCES profiles(id),
  reason TEXT NOT NULL,
  suspension_type TEXT NOT NULL CHECK (suspension_type IN ('warning','temporary','extended','restricted')),
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_suspensions_updated_at
  BEFORE UPDATE ON suspensions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_suspensions_user_id ON suspensions(user_id);
CREATE INDEX idx_suspensions_is_active ON suspensions(is_active);

-- ============================================================
-- SPECIALTIES
-- ============================================================
CREATE TABLE IF NOT EXISTS specialties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_ar TEXT NOT NULL,
  name_fr TEXT NOT NULL,
  name_en TEXT NOT NULL,
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- DOCTORS
-- ============================================================
CREATE TABLE IF NOT EXISTS doctors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  photo_url TEXT,
  bio_ar TEXT,
  bio_fr TEXT,
  bio_en TEXT,
  phone TEXT,
  email TEXT,
  languages TEXT[] DEFAULT ARRAY['ar'],
  gender TEXT CHECK (gender IN ('male','female')),
  years_experience INTEGER DEFAULT 0,
  city TEXT,
  wilaya TEXT,
  address TEXT,
  consultation_type TEXT[] DEFAULT ARRAY['in_person'] CHECK (
    consultation_type <@ ARRAY['in_person','video','home_visit']
  ),
  consultation_fee DECIMAL(10,2),
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  rating DECIMAL(3,2) CHECK (rating >= 0 AND rating <= 5),
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_doctors_updated_at
  BEFORE UPDATE ON doctors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_doctors_city ON doctors(city);
CREATE INDEX idx_doctors_wilaya ON doctors(wilaya);
CREATE INDEX idx_doctors_is_verified ON doctors(is_verified);
CREATE INDEX idx_doctors_is_active ON doctors(is_active);

-- ============================================================
-- DOCTOR SPECIALTIES (junction)
-- ============================================================
CREATE TABLE IF NOT EXISTS doctor_specialties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  specialty_id UUID NOT NULL REFERENCES specialties(id) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE(doctor_id, specialty_id)
);

CREATE INDEX idx_doctor_specialties_doctor_id ON doctor_specialties(doctor_id);
CREATE INDEX idx_doctor_specialties_specialty_id ON doctor_specialties(specialty_id);

-- ============================================================
-- DOCTOR AVAILABILITY
-- ============================================================
CREATE TABLE IF NOT EXISTS doctor_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_duration_minutes INTEGER NOT NULL DEFAULT 30,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_doctor_availability_doctor_id ON doctor_availability(doctor_id);

-- ============================================================
-- HEALTHCARE FACILITIES
-- ============================================================
CREATE TABLE IF NOT EXISTS healthcare_facilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  name_ar TEXT,
  facility_type TEXT NOT NULL CHECK (facility_type IN (
    'hospital','clinic','medical_center','emergency_department',
    'imaging_center','specialized_center'
  )),
  description TEXT,
  description_ar TEXT,
  phone TEXT,
  phone_emergency TEXT,
  email TEXT,
  website TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  wilaya TEXT NOT NULL,
  commune TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  has_emergency BOOLEAN NOT NULL DEFAULT FALSE,
  is_24h BOOLEAN NOT NULL DEFAULT FALSE,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  opening_hours JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_facilities_updated_at
  BEFORE UPDATE ON healthcare_facilities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_facilities_wilaya ON healthcare_facilities(wilaya);
CREATE INDEX idx_facilities_city ON healthcare_facilities(city);
CREATE INDEX idx_facilities_type ON healthcare_facilities(facility_type);
CREATE INDEX idx_facilities_has_emergency ON healthcare_facilities(has_emergency);

-- ============================================================
-- FACILITY SERVICES
-- ============================================================
CREATE TABLE IF NOT EXISTS facility_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id UUID NOT NULL REFERENCES healthcare_facilities(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  service_name_ar TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_facility_services_facility_id ON facility_services(facility_id);

-- ============================================================
-- PHARMACIES
-- ============================================================
CREATE TABLE IF NOT EXISTS pharmacies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  name_ar TEXT,
  phone TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  wilaya TEXT NOT NULL,
  commune TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  is_24h BOOLEAN NOT NULL DEFAULT FALSE,
  is_duty BOOLEAN NOT NULL DEFAULT FALSE,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  opening_hours JSONB DEFAULT '{}',
  services TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_pharmacies_updated_at
  BEFORE UPDATE ON pharmacies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_pharmacies_wilaya ON pharmacies(wilaya);
CREATE INDEX idx_pharmacies_city ON pharmacies(city);
CREATE INDEX idx_pharmacies_is_24h ON pharmacies(is_24h);

-- ============================================================
-- LABORATORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS laboratories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  name_ar TEXT,
  phone TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  wilaya TEXT NOT NULL,
  commune TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  opening_hours JSONB DEFAULT '{}',
  services TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_laboratories_updated_at
  BEFORE UPDATE ON laboratories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_laboratories_wilaya ON laboratories(wilaya);
CREATE INDEX idx_laboratories_city ON laboratories(city);

-- ============================================================
-- APPOINTMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
  facility_id UUID REFERENCES healthcare_facilities(id),
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  consultation_type TEXT NOT NULL CHECK (consultation_type IN ('in_person','video','home_visit')),
  status TEXT NOT NULL DEFAULT 'REQUESTED' CHECK (status IN (
    'REQUESTED','CONFIRMED','RESCHEDULED','CANCELLED_BY_USER',
    'CANCELLED_BY_DOCTOR','COMPLETED','NO_SHOW'
  )),
  reason TEXT,
  notes TEXT,
  doctor_notes TEXT,
  cancellation_reason TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Prevent double booking: same doctor, same date+time
  UNIQUE(doctor_id, appointment_date, appointment_time)
);

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_appointments_user_id ON appointments(user_id);
CREATE INDEX idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);

-- ============================================================
-- APPOINTMENT STATUS HISTORY
-- ============================================================
CREATE TABLE IF NOT EXISTS appointment_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by UUID REFERENCES profiles(id),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_appt_status_history_appt_id ON appointment_status_history(appointment_id);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'emergency_update','appointment_update','security_alert',
    'system_announcement','account_notification'
  )),
  title_ar TEXT NOT NULL,
  title_fr TEXT,
  title_en TEXT,
  body_ar TEXT NOT NULL,
  body_fr TEXT,
  body_en TEXT,
  related_entity_type TEXT,
  related_entity_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================================
-- NOTIFICATION PREFERENCES
-- ============================================================
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  in_app_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  sms_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  push_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  emergency_updates BOOLEAN NOT NULL DEFAULT TRUE,
  appointment_updates BOOLEAN NOT NULL DEFAULT TRUE,
  security_alerts BOOLEAN NOT NULL DEFAULT TRUE,
  system_announcements BOOLEAN NOT NULL DEFAULT TRUE,
  account_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_notif_prefs_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- FIRST AID CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS first_aid_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_ar TEXT NOT NULL,
  name_fr TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_ar TEXT,
  icon TEXT,
  color TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- FIRST AID GUIDES
-- ============================================================
CREATE TABLE IF NOT EXISTS first_aid_guides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES first_aid_categories(id),
  title_ar TEXT NOT NULL,
  title_fr TEXT NOT NULL,
  title_en TEXT NOT NULL,
  warning_ar TEXT,
  warning_fr TEXT,
  warning_en TEXT,
  when_to_call_ar TEXT,
  when_to_call_fr TEXT,
  when_to_call_en TEXT,
  do_not_do_ar TEXT,
  do_not_do_fr TEXT,
  do_not_do_en TEXT,
  source TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  review_status TEXT NOT NULL DEFAULT 'pending_review' CHECK (review_status IN ('pending_review','reviewed','approved','outdated')),
  reviewed_by TEXT,
  review_date DATE,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_first_aid_guides_updated_at
  BEFORE UPDATE ON first_aid_guides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_first_aid_guides_category ON first_aid_guides(category_id);
CREATE INDEX idx_first_aid_guides_published ON first_aid_guides(is_published);

-- ============================================================
-- FIRST AID STEPS
-- ============================================================
CREATE TABLE IF NOT EXISTS first_aid_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guide_id UUID NOT NULL REFERENCES first_aid_guides(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  instruction_ar TEXT NOT NULL,
  instruction_fr TEXT,
  instruction_en TEXT,
  image_url TEXT,
  is_critical BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_first_aid_steps_guide_id ON first_aid_steps(guide_id);

-- ============================================================
-- SAVED FIRST AID GUIDES
-- ============================================================
CREATE TABLE IF NOT EXISTS saved_first_aid_guides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  guide_id UUID NOT NULL REFERENCES first_aid_guides(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, guide_id)
);

CREATE INDEX idx_saved_guides_user_id ON saved_first_aid_guides(user_id);

-- ============================================================
-- AUDIT LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES profiles(id),
  actor_role TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ============================================================
-- ADMIN NOTES
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  admin_id UUID NOT NULL REFERENCES profiles(id),
  note TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_admin_notes_entity ON admin_notes(entity_type, entity_id);

-- ============================================================
-- SYSTEM SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  value_json JSONB,
  description TEXT,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  updated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO system_settings (key, value, description, is_public) VALUES
  ('demo_mode', 'true', 'Enable demo mode with simulated data', true),
  ('app_version', '1.0.0', 'Current application version', true),
  ('emergency_dispatch_provider', 'mock', 'Emergency dispatch provider: mock | civil_protection', false),
  ('max_reports_per_day', '5', 'Maximum emergency reports per user per day', false),
  ('max_false_reports_before_review', '2', 'Number of false reports before account review', false)
ON CONFLICT (key) DO NOTHING;
