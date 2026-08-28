-- ============================================================
-- SIHALINK - Complete Database Schema Migration
-- Migration: 001_initial_schema
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM ('USER', 'DOCTOR', 'HEALTHCARE_PROVIDER', 'EMERGENCY_OPERATOR', 'ADMIN', 'SUPER_ADMIN');
CREATE TYPE account_status AS ENUM ('ACTIVE', 'SUSPENDED', 'RESTRICTED', 'DELETED');
CREATE TYPE gender_type AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');
CREATE TYPE blood_type AS ENUM ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'UNKNOWN');

CREATE TYPE emergency_type AS ENUM (
  'MEDICAL_EMERGENCY', 'ACCIDENT', 'FIRE', 'PREGNANCY', 'CHILD_EMERGENCY',
  'ELDERLY_EMERGENCY', 'UNCONSCIOUS_PERSON', 'BREATHING_DIFFICULTY',
  'CHEST_PAIN', 'SEVERE_BLEEDING', 'OTHER'
);
CREATE TYPE emergency_priority AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');
CREATE TYPE report_status AS ENUM (
  'DRAFT', 'SUBMITTED', 'RECEIVED', 'UNDER_REVIEW', 'ASSIGNED',
  'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED',
  'REJECTED', 'FALSE_REPORT_REVIEW', 'CLOSED'
);
CREATE TYPE report_event_type AS ENUM (
  'REPORT_CREATED', 'TRIAGE_COMPLETED', 'LOCATION_CONFIRMED', 'REPORT_SUBMITTED',
  'REPORT_RECEIVED', 'UNDER_REVIEW_STARTED', 'REPORT_ASSIGNED', 'REPORT_ACKNOWLEDGED',
  'RESPONSE_IN_PROGRESS', 'REPORT_RESOLVED', 'REPORT_CANCELLED', 'REPORT_REJECTED',
  'FALSE_REPORT_FLAGGED', 'REPORT_CLOSED', 'OPERATOR_NOTE_ADDED', 'STATUS_UPDATED'
);

CREATE TYPE appointment_status AS ENUM (
  'REQUESTED', 'CONFIRMED', 'RESCHEDULED', 'CANCELLED_BY_USER',
  'CANCELLED_BY_DOCTOR', 'COMPLETED', 'NO_SHOW'
);
CREATE TYPE consultation_type AS ENUM ('IN_PERSON', 'VIDEO', 'PHONE', 'HOME_VISIT');

CREATE TYPE facility_type AS ENUM (
  'HOSPITAL', 'CLINIC', 'MEDICAL_CENTER', 'EMERGENCY_DEPARTMENT',
  'PHARMACY', 'LABORATORY', 'IMAGING_CENTER', 'HEALTH_CENTER'
);

CREATE TYPE notification_type AS ENUM (
  'EMERGENCY_UPDATE', 'APPOINTMENT_UPDATE', 'SECURITY_ALERT',
  'SYSTEM_ANNOUNCEMENT', 'ACCOUNT_NOTIFICATION'
);

CREATE TYPE false_report_severity AS ENUM ('ACCIDENTAL', 'INTENTIONAL');
CREATE TYPE suspension_type AS ENUM ('WARNING', 'TEMPORARY', 'RESTRICTED');
CREATE TYPE verification_status AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'DEMO');

-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
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
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  email TEXT,
  date_of_birth DATE,
  gender gender_type,
  blood_type blood_type DEFAULT 'UNKNOWN',
  address TEXT,
  city TEXT,
  wilaya TEXT,
  profile_photo_url TEXT,
  preferred_language TEXT DEFAULT 'ar' CHECK (preferred_language IN ('ar', 'fr', 'en')),
  emergency_notes TEXT,
  account_status account_status DEFAULT 'ACTIVE',
  role user_role DEFAULT 'USER',
  is_demo BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_wilaya ON profiles(wilaya);
CREATE INDEX idx_profiles_account_status ON profiles(account_status);

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- NOTIFICATION PREFERENCES
-- ============================================================

CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  in_app_emergency BOOLEAN DEFAULT TRUE,
  in_app_appointment BOOLEAN DEFAULT TRUE,
  in_app_system BOOLEAN DEFAULT TRUE,
  email_emergency BOOLEAN DEFAULT TRUE,
  email_appointment BOOLEAN DEFAULT TRUE,
  email_system BOOLEAN DEFAULT FALSE,
  sms_emergency BOOLEAN DEFAULT FALSE,
  sms_appointment BOOLEAN DEFAULT FALSE,
  push_emergency BOOLEAN DEFAULT FALSE,
  push_appointment BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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
  priority INTEGER DEFAULT 1,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_trusted_contacts_user_id ON trusted_contacts(user_id);

CREATE TRIGGER update_trusted_contacts_updated_at
  BEFORE UPDATE ON trusted_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- EMERGENCY REPORTS
-- ============================================================

CREATE SEQUENCE emergency_report_seq START 1;

CREATE TABLE emergency_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_number TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  emergency_type emergency_type NOT NULL,
  priority emergency_priority DEFAULT 'MEDIUM',
  status report_status DEFAULT 'DRAFT',
  description TEXT,
  additional_info TEXT,
  people_count INTEGER DEFAULT 1 CHECK (people_count >= 1),
  operator_id UUID REFERENCES profiles(id),
  operator_notes TEXT,
  is_demo BOOLEAN DEFAULT FALSE,
  submitted_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_emergency_reports_user_id ON emergency_reports(user_id);
CREATE INDEX idx_emergency_reports_status ON emergency_reports(status);
CREATE INDEX idx_emergency_reports_priority ON emergency_reports(priority);
CREATE INDEX idx_emergency_reports_operator_id ON emergency_reports(operator_id);
CREATE INDEX idx_emergency_reports_created_at ON emergency_reports(created_at DESC);

CREATE TRIGGER update_emergency_reports_updated_at
  BEFORE UPDATE ON emergency_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate unique report numbers
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
-- EMERGENCY TRIAGE ANSWERS
-- ============================================================

CREATE TABLE emergency_triage_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES emergency_reports(id) ON DELETE CASCADE,
  question_key TEXT NOT NULL,
  question_text TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_triage_answers_report_id ON emergency_triage_answers(report_id);

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
  is_manual BOOLEAN DEFAULT FALSE,
  captured_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(report_id)
);

CREATE INDEX idx_emergency_locations_report_id ON emergency_locations(report_id);

-- ============================================================
-- EMERGENCY MEDIA
-- ============================================================

CREATE TABLE emergency_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES emergency_reports(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  storage_path TEXT NOT NULL,
  signed_url TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_emergency_media_report_id ON emergency_media(report_id);

-- ============================================================
-- REPORT STATUS HISTORY
-- ============================================================

CREATE TABLE report_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES emergency_reports(id) ON DELETE CASCADE,
  previous_status report_status,
  new_status report_status NOT NULL,
  changed_by UUID REFERENCES profiles(id),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_report_status_history_report_id ON report_status_history(report_id);

-- ============================================================
-- EMERGENCY REPORT EVENTS (TIMELINE)
-- ============================================================

CREATE TABLE emergency_report_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES emergency_reports(id) ON DELETE CASCADE,
  event_type report_event_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  actor_id UUID REFERENCES profiles(id),
  actor_label TEXT,
  is_visible_to_user BOOLEAN DEFAULT TRUE,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_report_events_report_id ON emergency_report_events(report_id);
CREATE INDEX idx_report_events_created_at ON emergency_report_events(created_at);

-- ============================================================
-- FALSE REPORT CASES
-- ============================================================

CREATE TABLE false_report_cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES emergency_reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  severity false_report_severity,
  reason TEXT,
  evidence TEXT,
  reviewer_id UUID REFERENCES profiles(id),
  decision TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_false_report_cases_user_id ON false_report_cases(user_id);

CREATE TRIGGER update_false_report_cases_updated_at
  BEFORE UPDATE ON false_report_cases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- SUSPENSIONS
-- ============================================================

CREATE TABLE suspensions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  suspension_type suspension_type NOT NULL,
  reason TEXT NOT NULL,
  issued_by UUID REFERENCES profiles(id),
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_suspensions_user_id ON suspensions(user_id);
CREATE INDEX idx_suspensions_is_active ON suspensions(is_active);

CREATE TRIGGER update_suspensions_updated_at
  BEFORE UPDATE ON suspensions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- SPECIALTIES
-- ============================================================

CREATE TABLE specialties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_ar TEXT NOT NULL,
  name_fr TEXT NOT NULL,
  name_en TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_specialties_slug ON specialties(slug);

-- ============================================================
-- HEALTHCARE FACILITIES
-- ============================================================

CREATE TABLE healthcare_facilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type facility_type NOT NULL,
  description TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  address TEXT,
  city TEXT,
  wilaya TEXT NOT NULL,
  commune TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  opening_hours JSONB,
  has_emergency BOOLEAN DEFAULT FALSE,
  is_24h BOOLEAN DEFAULT FALSE,
  verification_status verification_status DEFAULT 'PENDING',
  is_demo BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_facilities_type ON healthcare_facilities(type);
CREATE INDEX idx_facilities_wilaya ON healthcare_facilities(wilaya);
CREATE INDEX idx_facilities_city ON healthcare_facilities(city);
CREATE INDEX idx_facilities_active ON healthcare_facilities(is_active);
CREATE INDEX idx_facilities_name_trgm ON healthcare_facilities USING GIN (name gin_trgm_ops);

CREATE TRIGGER update_facilities_updated_at
  BEFORE UPDATE ON healthcare_facilities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- FACILITY SERVICES
-- ============================================================

CREATE TABLE facility_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id UUID NOT NULL REFERENCES healthcare_facilities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_facility_services_facility_id ON facility_services(facility_id);

-- ============================================================
-- PHARMACIES
-- ============================================================

CREATE TABLE pharmacies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT,
  wilaya TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  opening_hours JSONB,
  is_24h BOOLEAN DEFAULT FALSE,
  has_delivery BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  is_demo BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pharmacies_wilaya ON pharmacies(wilaya);
CREATE INDEX idx_pharmacies_city ON pharmacies(city);
CREATE INDEX idx_pharmacies_name_trgm ON pharmacies USING GIN (name gin_trgm_ops);

CREATE TRIGGER update_pharmacies_updated_at
  BEFORE UPDATE ON pharmacies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- LABORATORIES
-- ============================================================

CREATE TABLE laboratories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT,
  wilaya TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  opening_hours JSONB,
  services TEXT[],
  requires_appointment BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  is_demo BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_laboratories_wilaya ON laboratories(wilaya);
CREATE INDEX idx_laboratories_city ON laboratories(city);

CREATE TRIGGER update_laboratories_updated_at
  BEFORE UPDATE ON laboratories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- DOCTORS
-- ============================================================

CREATE TABLE doctors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  photo_url TEXT,
  bio TEXT,
  bio_ar TEXT,
  experience_years INTEGER DEFAULT 0,
  gender gender_type,
  languages TEXT[] DEFAULT ARRAY['ar'],
  phone TEXT,
  email TEXT,
  facility_id UUID REFERENCES healthcare_facilities(id) ON DELETE SET NULL,
  city TEXT,
  wilaya TEXT,
  consultation_types consultation_type[] DEFAULT ARRAY['IN_PERSON']::consultation_type[],
  consultation_fee_dzd INTEGER,
  verification_status verification_status DEFAULT 'PENDING',
  is_active BOOLEAN DEFAULT TRUE,
  is_demo BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_doctors_wilaya ON doctors(wilaya);
CREATE INDEX idx_doctors_city ON doctors(city);
CREATE INDEX idx_doctors_is_active ON doctors(is_active);
CREATE INDEX idx_doctors_name_trgm ON doctors USING GIN ((first_name || ' ' || last_name) gin_trgm_ops);

CREATE TRIGGER update_doctors_updated_at
  BEFORE UPDATE ON doctors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- DOCTOR SPECIALTIES
-- ============================================================

CREATE TABLE doctor_specialties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  specialty_id UUID NOT NULL REFERENCES specialties(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT FALSE,
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
  slot_duration_minutes INTEGER DEFAULT 30,
  max_appointments INTEGER DEFAULT 10,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (end_time > start_time)
);

CREATE INDEX idx_doctor_availability_doctor_id ON doctor_availability(doctor_id);

CREATE TRIGGER update_doctor_availability_updated_at
  BEFORE UPDATE ON doctor_availability
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- APPOINTMENTS
-- ============================================================

CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  consultation_type consultation_type NOT NULL DEFAULT 'IN_PERSON',
  reason TEXT,
  status appointment_status DEFAULT 'REQUESTED',
  notes TEXT,
  cancellation_reason TEXT,
  is_demo BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(doctor_id, appointment_date, appointment_time)
);

CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- APPOINTMENT STATUS HISTORY
-- ============================================================

CREATE TABLE appointment_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  previous_status appointment_status,
  new_status appointment_status NOT NULL,
  changed_by UUID REFERENCES profiles(id),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_appt_status_history_appt_id ON appointment_status_history(appointment_id);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  title_ar TEXT,
  body TEXT NOT NULL,
  body_ar TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  related_entity_type TEXT,
  related_entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================================
-- FIRST AID CATEGORIES
-- ============================================================

CREATE TABLE first_aid_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name_ar TEXT NOT NULL,
  name_fr TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_ar TEXT,
  description_fr TEXT,
  description_en TEXT,
  icon TEXT,
  color TEXT DEFAULT '#3B82F6',
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_first_aid_categories_updated_at
  BEFORE UPDATE ON first_aid_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- FIRST AID GUIDES
-- ============================================================

CREATE TABLE first_aid_guides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES first_aid_categories(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
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
  version TEXT DEFAULT '1.0',
  review_status TEXT DEFAULT 'PENDING_REVIEW',
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  is_published BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_first_aid_guides_category_id ON first_aid_guides(category_id);
CREATE INDEX idx_first_aid_guides_slug ON first_aid_guides(slug);

CREATE TRIGGER update_first_aid_guides_updated_at
  BEFORE UPDATE ON first_aid_guides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- FIRST AID STEPS
-- ============================================================

CREATE TABLE first_aid_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guide_id UUID NOT NULL REFERENCES first_aid_guides(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  title_ar TEXT,
  title_fr TEXT,
  title_en TEXT,
  description_ar TEXT NOT NULL,
  description_fr TEXT NOT NULL,
  description_en TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_first_aid_steps_guide_id ON first_aid_steps(guide_id);

-- ============================================================
-- SAVED FIRST AID GUIDES
-- ============================================================

CREATE TABLE saved_first_aid_guides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  guide_id UUID NOT NULL REFERENCES first_aid_guides(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, guide_id)
);

CREATE INDEX idx_saved_guides_user_id ON saved_first_aid_guides(user_id);

-- ============================================================
-- AUDIT LOGS
-- ============================================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
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
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  note TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_admin_notes_entity ON admin_notes(entity_type, entity_id);

-- ============================================================
-- SYSTEM SETTINGS
-- ============================================================

CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- HANDLE NEW USER TRIGGER
-- (Creates profile automatically on Supabase Auth signup)
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, account_status)
  VALUES (NEW.id, NEW.email, 'USER', 'ACTIVE');

  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- DEFAULT SYSTEM SETTINGS
-- ============================================================

INSERT INTO system_settings (key, value, description, is_public) VALUES
  ('app_name', '"SIHALINK"', 'Application name', true),
  ('demo_mode', 'true', 'Whether the application is in demo mode', true),
  ('emergency_dispatch_provider', '"mock"', 'Emergency dispatch provider', false),
  ('max_false_reports_before_warning', '2', 'False reports before warning', false),
  ('max_false_reports_before_suspension', '5', 'False reports before suspension', false),
  ('appointment_cancellation_hours', '24', 'Hours before appointment to allow free cancellation', false);
