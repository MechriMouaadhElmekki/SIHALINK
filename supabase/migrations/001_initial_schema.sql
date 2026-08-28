-- ============================================================
-- SIHALINK Database Schema - Migration 001
-- Full production schema with RLS, indexes, triggers
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE user_role AS ENUM ('USER','DOCTOR','HEALTHCARE_PROVIDER','EMERGENCY_OPERATOR','ADMIN','SUPER_ADMIN');
CREATE TYPE emergency_type AS ENUM ('MEDICAL','ACCIDENT','FIRE','PREGNANCY','CHILD','ELDERLY','UNCONSCIOUS','BREATHING','CHEST_PAIN','BLEEDING','OTHER');
CREATE TYPE emergency_priority AS ENUM ('CRITICAL','HIGH','MEDIUM','LOW');
CREATE TYPE report_status AS ENUM ('DRAFT','SUBMITTED','RECEIVED','UNDER_REVIEW','ASSIGNED','ACKNOWLEDGED','IN_PROGRESS','RESOLVED','CANCELLED','REJECTED','FALSE_REPORT_REVIEW','CLOSED');
CREATE TYPE appointment_status AS ENUM ('REQUESTED','CONFIRMED','RESCHEDULED','CANCELLED_BY_USER','CANCELLED_BY_DOCTOR','COMPLETED','NO_SHOW');
CREATE TYPE facility_type AS ENUM ('HOSPITAL','CLINIC','MEDICAL_CENTER','EMERGENCY_DEPARTMENT','PHARMACY','LABORATORY','IMAGING_CENTER');
CREATE TYPE gender_type AS ENUM ('MALE','FEMALE','OTHER','PREFER_NOT_TO_SAY');
CREATE TYPE blood_type AS ENUM ('A+','A-','B+','B-','AB+','AB-','O+','O-');
CREATE TYPE notification_type AS ENUM ('EMERGENCY_UPDATE','APPOINTMENT_UPDATE','SECURITY_ALERT','SYSTEM_ANNOUNCEMENT','ACCOUNT_NOTIFICATION');
CREATE TYPE suspension_type AS ENUM ('WARNING','TEMPORARY','LONG_TERM','RESTRICTED');
CREATE TYPE consultation_type AS ENUM ('IN_PERSON','VIDEO','PHONE');
CREATE TYPE verification_status AS ENUM ('PENDING','VERIFIED','REJECTED','DEMO');
CREATE TYPE review_status AS ENUM ('DRAFT','PENDING_REVIEW','REVIEWED','PUBLISHED');
CREATE TYPE account_status AS ENUM ('ACTIVE','SUSPENDED','RESTRICTED','DELETED');
CREATE TYPE false_report_case_type AS ENUM ('ACCIDENTAL','INTENTIONAL','UNDER_REVIEW');

-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT UNIQUE,
  email TEXT NOT NULL,
  date_of_birth DATE,
  gender gender_type,
  blood_type blood_type,
  address TEXT,
  city TEXT,
  wilaya TEXT,
  profile_photo TEXT,
  preferred_language TEXT NOT NULL DEFAULT 'ar' CHECK (preferred_language IN ('ar','fr','en')),
  emergency_notes TEXT,
  account_status account_status NOT NULL DEFAULT 'ACTIVE',
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE INDEX idx_profiles_wilaya ON profiles(wilaya);
CREATE INDEX idx_profiles_city ON profiles(city);

-- ============================================================
-- ROLES
-- ============================================================
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name user_role NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  granted_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);

-- ============================================================
-- TRUSTED CONTACTS
-- ============================================================
CREATE TABLE trusted_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relationship TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  priority INTEGER NOT NULL DEFAULT 1 CHECK (priority BETWEEN 1 AND 10),
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trusted_contacts_updated_at BEFORE UPDATE ON trusted_contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE INDEX idx_trusted_contacts_user_id ON trusted_contacts(user_id);

-- ============================================================
-- EMERGENCY REPORTS
-- ============================================================
CREATE SEQUENCE emergency_report_seq START 1;

CREATE TABLE emergency_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_number TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  emergency_type emergency_type NOT NULL,
  priority emergency_priority NOT NULL DEFAULT 'MEDIUM',
  status report_status NOT NULL DEFAULT 'DRAFT',
  description TEXT,
  additional_info TEXT,
  operator_id UUID REFERENCES profiles(id),
  operator_notes TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER emergency_reports_updated_at BEFORE UPDATE ON emergency_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE INDEX idx_emergency_reports_user_id ON emergency_reports(user_id);
CREATE INDEX idx_emergency_reports_status ON emergency_reports(status);
CREATE INDEX idx_emergency_reports_priority ON emergency_reports(priority);
CREATE INDEX idx_emergency_reports_created_at ON emergency_reports(created_at DESC);
CREATE INDEX idx_emergency_reports_operator_id ON emergency_reports(operator_id);

-- Report number generator function
CREATE OR REPLACE FUNCTION generate_report_number()
RETURNS TEXT AS $$
DECLARE
  seq_val BIGINT;
  year_val TEXT;
BEGIN
  seq_val := nextval('emergency_report_seq');
  year_val := TO_CHAR(NOW(), 'YYYY');
  RETURN 'SH-' || year_val || '-' || LPAD(seq_val::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- EMERGENCY LOCATIONS
-- ============================================================
CREATE TABLE emergency_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES emergency_reports(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  accuracy DOUBLE PRECISION,
  address TEXT,
  city TEXT,
  wilaya TEXT,
  commune TEXT,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_simulated BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX idx_emergency_locations_report_id ON emergency_locations(report_id);

-- ============================================================
-- EMERGENCY TRIAGE ANSWERS
-- ============================================================
CREATE TABLE emergency_triage_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES emergency_reports(id) ON DELETE CASCADE,
  question_key TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(report_id, question_key)
);
CREATE INDEX idx_triage_answers_report_id ON emergency_triage_answers(report_id);

-- ============================================================
-- EMERGENCY REPORT EVENTS (immutable audit trail)
-- ============================================================
CREATE TABLE emergency_report_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES emergency_reports(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  actor_id UUID REFERENCES profiles(id),
  actor_role user_role,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_report_events_report_id ON emergency_report_events(report_id);
CREATE INDEX idx_report_events_created_at ON emergency_report_events(created_at DESC);

-- ============================================================
-- REPORT STATUS HISTORY
-- ============================================================
CREATE TABLE report_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES emergency_reports(id) ON DELETE CASCADE,
  from_status report_status,
  to_status report_status NOT NULL,
  changed_by UUID REFERENCES profiles(id),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_status_history_report_id ON report_status_history(report_id);

-- ============================================================
-- EMERGENCY MEDIA
-- ============================================================
CREATE TABLE emergency_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES emergency_reports(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL CHECK (file_size > 0),
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_emergency_media_report_id ON emergency_media(report_id);

-- ============================================================
-- FALSE REPORT CASES
-- ============================================================
CREATE TABLE false_report_cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES emergency_reports(id),
  reported_by UUID REFERENCES profiles(id),
  reason TEXT NOT NULL,
  evidence TEXT,
  case_type false_report_case_type NOT NULL DEFAULT 'UNDER_REVIEW',
  reviewer_id UUID REFERENCES profiles(id),
  decision TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER false_report_cases_updated_at BEFORE UPDATE ON false_report_cases FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- SUSPENSIONS
-- ============================================================
CREATE TABLE suspensions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type suspension_type NOT NULL,
  reason TEXT NOT NULL,
  issued_by UUID NOT NULL REFERENCES profiles(id),
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER suspensions_updated_at BEFORE UPDATE ON suspensions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE INDEX idx_suspensions_user_id ON suspensions(user_id);
CREATE INDEX idx_suspensions_is_active ON suspensions(is_active);

-- ============================================================
-- SPECIALTIES
-- ============================================================
CREATE TABLE specialties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_ar TEXT NOT NULL,
  name_fr TEXT NOT NULL,
  name_en TEXT NOT NULL,
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- HEALTHCARE FACILITIES
-- ============================================================
CREATE TABLE healthcare_facilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type facility_type NOT NULL,
  description TEXT,
  phone TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  wilaya TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  opening_hours JSONB,
  emergency_available BOOLEAN NOT NULL DEFAULT FALSE,
  verification_status verification_status NOT NULL DEFAULT 'PENDING',
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER healthcare_facilities_updated_at BEFORE UPDATE ON healthcare_facilities FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE INDEX idx_facilities_wilaya ON healthcare_facilities(wilaya);
CREATE INDEX idx_facilities_city ON healthcare_facilities(city);
CREATE INDEX idx_facilities_type ON healthcare_facilities(type);

-- ============================================================
-- DOCTORS
-- ============================================================
CREATE TABLE doctors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  photo TEXT,
  bio TEXT,
  languages TEXT[] NOT NULL DEFAULT ARRAY['ar'],
  gender gender_type,
  experience_years INTEGER CHECK (experience_years >= 0),
  facility_id UUID REFERENCES healthcare_facilities(id),
  city TEXT,
  wilaya TEXT,
  consultation_types consultation_type[] NOT NULL DEFAULT ARRAY['IN_PERSON']::consultation_type[],
  verification_status verification_status NOT NULL DEFAULT 'PENDING',
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  rating NUMERIC(3,2) CHECK (rating BETWEEN 0 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER doctors_updated_at BEFORE UPDATE ON doctors FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE INDEX idx_doctors_wilaya ON doctors(wilaya);
CREATE INDEX idx_doctors_city ON doctors(city);
CREATE INDEX idx_doctors_is_available ON doctors(is_available);
CREATE INDEX idx_doctors_verification_status ON doctors(verification_status);

-- ============================================================
-- DOCTOR SPECIALTIES
-- ============================================================
CREATE TABLE doctor_specialties (
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
CREATE TABLE doctor_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_duration_minutes INTEGER NOT NULL DEFAULT 30 CHECK (slot_duration_minutes > 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE(doctor_id, day_of_week, start_time)
);
CREATE INDEX idx_doctor_availability_doctor_id ON doctor_availability(doctor_id);

-- ============================================================
-- APPOINTMENTS
-- ============================================================
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES profiles(id),
  doctor_id UUID NOT NULL REFERENCES doctors(id),
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  consultation_type consultation_type NOT NULL DEFAULT 'IN_PERSON',
  status appointment_status NOT NULL DEFAULT 'REQUESTED',
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Prevent double booking: same doctor cannot have two active appointments at same date/time
  UNIQUE(doctor_id, appointment_date, appointment_time)
);
CREATE TRIGGER appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);

-- ============================================================
-- APPOINTMENT STATUS HISTORY
-- ============================================================
CREATE TABLE appointment_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  from_status appointment_status,
  to_status appointment_status NOT NULL,
  changed_by UUID REFERENCES profiles(id),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_appt_status_history_appt_id ON appointment_status_history(appointment_id);

-- ============================================================
-- FACILITY SERVICES
-- ============================================================
CREATE TABLE facility_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id UUID NOT NULL REFERENCES healthcare_facilities(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_facility_services_facility_id ON facility_services(facility_id);

-- ============================================================
-- PHARMACIES
-- ============================================================
CREATE TABLE pharmacies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  wilaya TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  opening_hours JSONB,
  is_24h BOOLEAN NOT NULL DEFAULT FALSE,
  services TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER pharmacies_updated_at BEFORE UPDATE ON pharmacies FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE INDEX idx_pharmacies_wilaya ON pharmacies(wilaya);
CREATE INDEX idx_pharmacies_city ON pharmacies(city);

-- ============================================================
-- LABORATORIES
-- ============================================================
CREATE TABLE laboratories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  wilaya TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  opening_hours JSONB,
  services TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  requires_appointment BOOLEAN NOT NULL DEFAULT FALSE,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER laboratories_updated_at BEFORE UPDATE ON laboratories FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE INDEX idx_laboratories_wilaya ON laboratories(wilaya);
CREATE INDEX idx_laboratories_city ON laboratories(city);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
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
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================================
-- NOTIFICATION PREFERENCES
-- ============================================================
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  emergency_updates_inapp BOOLEAN NOT NULL DEFAULT TRUE,
  emergency_updates_email BOOLEAN NOT NULL DEFAULT TRUE,
  emergency_updates_sms BOOLEAN NOT NULL DEFAULT FALSE,
  appointment_updates_inapp BOOLEAN NOT NULL DEFAULT TRUE,
  appointment_updates_email BOOLEAN NOT NULL DEFAULT TRUE,
  system_announcements_inapp BOOLEAN NOT NULL DEFAULT TRUE,
  security_alerts_inapp BOOLEAN NOT NULL DEFAULT TRUE,
  security_alerts_email BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER notification_preferences_updated_at BEFORE UPDATE ON notification_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- FIRST AID
-- ============================================================
CREATE TABLE first_aid_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_ar TEXT NOT NULL,
  name_fr TEXT NOT NULL,
  name_en TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'heart',
  color TEXT NOT NULL DEFAULT '#3B82F6',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE first_aid_guides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES first_aid_categories(id),
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
  review_status review_status NOT NULL DEFAULT 'DRAFT',
  reviewed_by TEXT,
  review_date DATE,
  version INTEGER NOT NULL DEFAULT 1,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER first_aid_guides_updated_at BEFORE UPDATE ON first_aid_guides FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE INDEX idx_first_aid_guides_category_id ON first_aid_guides(category_id);
CREATE INDEX idx_first_aid_guides_is_published ON first_aid_guides(is_published);

CREATE TABLE first_aid_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guide_id UUID NOT NULL REFERENCES first_aid_guides(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  instruction_ar TEXT NOT NULL,
  instruction_fr TEXT NOT NULL,
  instruction_en TEXT NOT NULL,
  image_url TEXT,
  is_critical BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE(guide_id, step_number)
);
CREATE INDEX idx_first_aid_steps_guide_id ON first_aid_steps(guide_id);

CREATE TABLE saved_first_aid_guides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  guide_id UUID NOT NULL REFERENCES first_aid_guides(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, guide_id)
);

-- ============================================================
-- AUDIT LOGS (append-only)
-- ============================================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES profiles(id),
  actor_email TEXT,
  actor_role user_role,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ============================================================
-- ADMIN NOTES
-- ============================================================
CREATE TABLE admin_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  note TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES profiles(id),
  is_internal BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER admin_notes_updated_at BEFORE UPDATE ON admin_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE INDEX idx_admin_notes_entity ON admin_notes(entity_type, entity_id);

-- ============================================================
-- SYSTEM SETTINGS
-- ============================================================
CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  updated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Default settings
INSERT INTO system_settings (key, value, description, is_public) VALUES
  ('demo_mode', 'true', 'Enable demo mode - shows simulated data and workflows', true),
  ('max_false_reports_before_warning', '2', 'Number of false reports before issuing a warning', false),
  ('max_false_reports_before_suspension', '4', 'Number of false reports before temporary suspension', false),
  ('max_reports_per_hour', '5', 'Rate limit: max emergency reports per user per hour', false),
  ('maintenance_mode', 'false', 'Enable maintenance mode', true),
  ('app_version', '1.0.0', 'Current application version', true);

-- ============================================================
-- ROLES SEED
-- ============================================================
INSERT INTO roles (name, description) VALUES
  ('USER', 'Standard platform user'),
  ('DOCTOR', 'Medical doctor with patient access'),
  ('HEALTHCARE_PROVIDER', 'Healthcare facility administrator'),
  ('EMERGENCY_OPERATOR', 'Emergency response operator'),
  ('ADMIN', 'Platform administrator'),
  ('SUPER_ADMIN', 'Super administrator with full system access');
