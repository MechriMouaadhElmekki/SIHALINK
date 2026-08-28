-- SIHALINK Complete Database Schema
-- Migration 001: Initial Schema

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM (
  'USER', 'DOCTOR', 'HEALTHCARE_PROVIDER',
  'EMERGENCY_OPERATOR', 'ADMIN', 'SUPER_ADMIN'
);

CREATE TYPE account_status AS ENUM (
  'ACTIVE', 'SUSPENDED', 'RESTRICTED', 'PENDING_VERIFICATION', 'DELETED'
);

CREATE TYPE gender_type AS ENUM ('MALE', 'FEMALE', 'NOT_SPECIFIED');

CREATE TYPE blood_type AS ENUM (
  'A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE',
  'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE', 'UNKNOWN'
);

CREATE TYPE emergency_type AS ENUM (
  'MEDICAL', 'ACCIDENT', 'FIRE', 'MATERNITY',
  'CHILD_EMERGENCY', 'ELDERLY_EMERGENCY', 'UNCONSCIOUS',
  'BREATHING_DIFFICULTY', 'CHEST_PAIN', 'SEVERE_BLEEDING', 'OTHER'
);

CREATE TYPE emergency_priority AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

CREATE TYPE report_status AS ENUM (
  'DRAFT', 'SUBMITTED', 'RECEIVED', 'UNDER_REVIEW',
  'ASSIGNED', 'ACKNOWLEDGED', 'IN_PROGRESS',
  'RESOLVED', 'CANCELLED', 'REJECTED',
  'FALSE_REPORT_REVIEW', 'CLOSED'
);

CREATE TYPE appointment_status AS ENUM (
  'REQUESTED', 'CONFIRMED', 'RESCHEDULED',
  'CANCELLED_BY_USER', 'CANCELLED_BY_DOCTOR',
  'COMPLETED', 'NO_SHOW'
);

CREATE TYPE facility_type AS ENUM (
  'HOSPITAL', 'CLINIC', 'MEDICAL_CENTER',
  'EMERGENCY_DEPARTMENT', 'PHARMACY', 'LABORATORY',
  'IMAGING_CENTER', 'REHABILITATION_CENTER'
);

CREATE TYPE consultation_type AS ENUM ('IN_PERSON', 'TELECONSULTATION', 'BOTH');

CREATE TYPE notification_type AS ENUM (
  'EMERGENCY_UPDATE', 'APPOINTMENT_UPDATE', 'SECURITY_ALERT',
  'SYSTEM_ANNOUNCEMENT', 'ACCOUNT_NOTIFICATION'
);

CREATE TYPE false_report_type AS ENUM (
  'ACCIDENTAL', 'INTENTIONAL', 'UNDER_INVESTIGATION'
);

CREATE TYPE suspension_type AS ENUM (
  'WARNING', 'TEMPORARY', 'EXTENDED', 'RESTRICTED'
);

CREATE TYPE first_aid_review_status AS ENUM (
  'DRAFT', 'PENDING_REVIEW', 'REVIEWED', 'PUBLISHED', 'ARCHIVED'
);

-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================================
-- PROFILES
-- ============================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  date_of_birth DATE,
  gender gender_type DEFAULT 'NOT_SPECIFIED',
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

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_wilaya ON profiles(wilaya);
CREATE INDEX idx_profiles_account_status ON profiles(account_status);

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
  priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 10),
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_trusted_contacts_updated_at
  BEFORE UPDATE ON trusted_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_trusted_contacts_user_id ON trusted_contacts(user_id);

-- ============================================================
-- EMERGENCY REPORTS
-- ============================================================

CREATE SEQUENCE emergency_report_seq START 1;

CREATE TABLE emergency_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_number TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  emergency_type emergency_type NOT NULL,
  priority emergency_priority NOT NULL DEFAULT 'MEDIUM',
  status report_status NOT NULL DEFAULT 'DRAFT',
  title TEXT,
  description TEXT,
  affected_count INTEGER DEFAULT 1 CHECK (affected_count >= 1),
  assigned_operator_id UUID REFERENCES profiles(id),
  is_demo BOOLEAN DEFAULT FALSE,
  cancelled_at TIMESTAMPTZ,
  cancelled_reason TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_emergency_reports_updated_at
  BEFORE UPDATE ON emergency_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_emergency_reports_user_id ON emergency_reports(user_id);
CREATE INDEX idx_emergency_reports_status ON emergency_reports(status);
CREATE INDEX idx_emergency_reports_priority ON emergency_reports(priority);
CREATE INDEX idx_emergency_reports_created_at ON emergency_reports(created_at DESC);
CREATE INDEX idx_emergency_reports_operator ON emergency_reports(assigned_operator_id);

-- Function to generate report number
CREATE OR REPLACE FUNCTION generate_report_number()
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  seq_num INTEGER;
  report_num TEXT;
BEGIN
  year_part := EXTRACT(YEAR FROM NOW())::TEXT;
  seq_num := nextval('emergency_report_seq');
  report_num := 'SH-' || year_part || '-' || LPAD(seq_num::TEXT, 6, '0');
  RETURN report_num;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- EMERGENCY REPORT EVENTS
-- ============================================================

CREATE TABLE emergency_report_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES emergency_reports(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  from_status report_status,
  to_status report_status,
  actor_id UUID REFERENCES profiles(id),
  actor_role user_role,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_report_events_report_id ON emergency_report_events(report_id);
CREATE INDEX idx_report_events_created_at ON emergency_report_events(created_at DESC);

-- ============================================================
-- EMERGENCY TRIAGE ANSWERS
-- ============================================================

CREATE TABLE emergency_triage_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES emergency_reports(id) ON DELETE CASCADE,
  question_key TEXT NOT NULL,
  question_text TEXT,
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
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(10, 2),
  altitude DECIMAL(10, 2),
  address TEXT,
  city TEXT,
  wilaya TEXT,
  commune TEXT,
  postal_code TEXT,
  is_manual BOOLEAN DEFAULT FALSE,
  is_demo BOOLEAN DEFAULT FALSE,
  captured_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_emergency_locations_report_id ON emergency_locations(report_id);

-- ============================================================
-- EMERGENCY MEDIA
-- ============================================================

CREATE TABLE emergency_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES emergency_reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  is_private BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_emergency_media_report_id ON emergency_media(report_id);

-- ============================================================
-- FALSE REPORT CASES
-- ============================================================

CREATE TABLE false_report_cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES emergency_reports(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  false_report_type false_report_type DEFAULT 'UNDER_INVESTIGATION',
  reason TEXT,
  evidence JSONB DEFAULT '{}',
  reviewer_id UUID REFERENCES profiles(id),
  decision TEXT,
  decision_notes TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_false_report_cases_updated_at
  BEFORE UPDATE ON false_report_cases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_false_reports_user_id ON false_report_cases(user_id);
CREATE INDEX idx_false_reports_report_id ON false_report_cases(report_id);

-- ============================================================
-- SUSPENSIONS
-- ============================================================

CREATE TABLE suspensions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  suspension_type suspension_type NOT NULL,
  reason TEXT NOT NULL,
  admin_id UUID REFERENCES profiles(id),
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_suspensions_updated_at
  BEFORE UPDATE ON suspensions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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
  slug TEXT UNIQUE NOT NULL,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DOCTORS
-- ============================================================

CREATE TABLE doctors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  photo_url TEXT,
  bio_ar TEXT,
  bio_fr TEXT,
  bio_en TEXT,
  phone TEXT,
  email TEXT,
  languages TEXT[] DEFAULT ARRAY['ar'],
  gender gender_type DEFAULT 'NOT_SPECIFIED',
  experience_years INTEGER DEFAULT 0,
  consultation_type consultation_type DEFAULT 'IN_PERSON',
  consultation_fee DECIMAL(10, 2),
  city TEXT,
  wilaya TEXT,
  address TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  is_demo BOOLEAN DEFAULT FALSE,
  rating_average DECIMAL(3, 2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_doctors_updated_at
  BEFORE UPDATE ON doctors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_doctors_wilaya ON doctors(wilaya);
CREATE INDEX idx_doctors_city ON doctors(city);
CREATE INDEX idx_doctors_is_active ON doctors(is_active);
CREATE INDEX idx_doctors_is_verified ON doctors(is_verified);

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
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_duration_minutes INTEGER DEFAULT 30,
  max_appointments INTEGER DEFAULT 10,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_doctor_availability_doctor_id ON doctor_availability(doctor_id);

-- ============================================================
-- APPOINTMENTS
-- ============================================================

CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  doctor_id UUID NOT NULL REFERENCES doctors(id),
  status appointment_status DEFAULT 'REQUESTED',
  consultation_type consultation_type DEFAULT 'IN_PERSON',
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  reason TEXT,
  notes TEXT,
  doctor_notes TEXT,
  cancelled_by TEXT,
  cancelled_reason TEXT,
  cancelled_at TIMESTAMPTZ,
  is_demo BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
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

CREATE TABLE appointment_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  from_status appointment_status,
  to_status appointment_status NOT NULL,
  actor_id UUID REFERENCES profiles(id),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_appt_status_history_appt_id ON appointment_status_history(appointment_id);

-- ============================================================
-- HEALTHCARE FACILITIES
-- ============================================================

CREATE TABLE healthcare_facilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type facility_type NOT NULL,
  description_ar TEXT,
  description_fr TEXT,
  description_en TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  address TEXT,
  city TEXT NOT NULL,
  wilaya TEXT NOT NULL,
  commune TEXT,
  postal_code TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  opening_hours JSONB DEFAULT '{}',
  has_emergency BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  is_demo BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_healthcare_facilities_updated_at
  BEFORE UPDATE ON healthcare_facilities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_facilities_type ON healthcare_facilities(type);
CREATE INDEX idx_facilities_wilaya ON healthcare_facilities(wilaya);
CREATE INDEX idx_facilities_city ON healthcare_facilities(city);
CREATE INDEX idx_facilities_has_emergency ON healthcare_facilities(has_emergency);

-- ============================================================
-- FACILITY SERVICES
-- ============================================================

CREATE TABLE facility_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id UUID NOT NULL REFERENCES healthcare_facilities(id) ON DELETE CASCADE,
  service_name_ar TEXT NOT NULL,
  service_name_fr TEXT,
  service_name_en TEXT,
  is_active BOOLEAN DEFAULT TRUE,
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
  city TEXT NOT NULL,
  wilaya TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  opening_hours JSONB DEFAULT '{}',
  is_24h BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  is_demo BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_pharmacies_updated_at
  BEFORE UPDATE ON pharmacies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_pharmacies_wilaya ON pharmacies(wilaya);
CREATE INDEX idx_pharmacies_city ON pharmacies(city);

-- ============================================================
-- LABORATORIES
-- ============================================================

CREATE TABLE laboratories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT NOT NULL,
  wilaya TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  opening_hours JSONB DEFAULT '{}',
  services TEXT[] DEFAULT ARRAY[]::TEXT[],
  requires_appointment BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  is_demo BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_laboratories_updated_at
  BEFORE UPDATE ON laboratories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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
  title_fr TEXT,
  title_en TEXT,
  body_ar TEXT NOT NULL,
  body_fr TEXT,
  body_en TEXT,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  related_entity_type TEXT,
  related_entity_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================================
-- NOTIFICATION PREFERENCES
-- ============================================================

CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  in_app_enabled BOOLEAN DEFAULT TRUE,
  email_enabled BOOLEAN DEFAULT TRUE,
  sms_enabled BOOLEAN DEFAULT FALSE,
  push_enabled BOOLEAN DEFAULT FALSE,
  emergency_updates BOOLEAN DEFAULT TRUE,
  appointment_updates BOOLEAN DEFAULT TRUE,
  security_alerts BOOLEAN DEFAULT TRUE,
  system_announcements BOOLEAN DEFAULT TRUE,
  account_notifications BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- FIRST AID CATEGORIES
-- ============================================================

CREATE TABLE first_aid_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name_ar TEXT NOT NULL,
  name_fr TEXT NOT NULL,
  name_en TEXT NOT NULL,
  icon TEXT,
  color TEXT DEFAULT '#EF4444',
  sort_order INTEGER DEFAULT 0,
  is_emergency BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FIRST AID GUIDES
-- ============================================================

CREATE TABLE first_aid_guides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES first_aid_categories(id),
  slug TEXT UNIQUE NOT NULL,
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
  version INTEGER DEFAULT 1,
  review_status first_aid_review_status DEFAULT 'DRAFT',
  reviewed_by TEXT,
  reviewed_at DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_first_aid_guides_updated_at
  BEFORE UPDATE ON first_aid_guides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_first_aid_guides_category ON first_aid_guides(category_id);

-- ============================================================
-- FIRST AID STEPS
-- ============================================================

CREATE TABLE first_aid_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guide_id UUID NOT NULL REFERENCES first_aid_guides(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  title_ar TEXT NOT NULL,
  title_fr TEXT,
  title_en TEXT,
  description_ar TEXT NOT NULL,
  description_fr TEXT,
  description_en TEXT,
  is_critical BOOLEAN DEFAULT FALSE,
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

-- ============================================================
-- AUDIT LOGS
-- ============================================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES profiles(id),
  actor_role user_role,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
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
  entity_id TEXT NOT NULL,
  admin_id UUID NOT NULL REFERENCES profiles(id),
  note TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_admin_notes_updated_at
  BEFORE UPDATE ON admin_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- SYSTEM SETTINGS
-- ============================================================

CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- FUNCTION: Handle new user signup
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, first_name, last_name, preferred_language)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'ar')
  );

  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- FUNCTION: Validate report status transitions
-- ============================================================

CREATE OR REPLACE FUNCTION validate_report_transition(from_status report_status, to_status report_status)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN CASE
    WHEN from_status = 'DRAFT' THEN to_status IN ('SUBMITTED', 'CANCELLED')
    WHEN from_status = 'SUBMITTED' THEN to_status IN ('RECEIVED', 'CANCELLED', 'REJECTED')
    WHEN from_status = 'RECEIVED' THEN to_status IN ('UNDER_REVIEW', 'REJECTED')
    WHEN from_status = 'UNDER_REVIEW' THEN to_status IN ('ASSIGNED', 'REJECTED', 'FALSE_REPORT_REVIEW')
    WHEN from_status = 'ASSIGNED' THEN to_status IN ('ACKNOWLEDGED', 'REJECTED')
    WHEN from_status = 'ACKNOWLEDGED' THEN to_status IN ('IN_PROGRESS', 'REJECTED')
    WHEN from_status = 'IN_PROGRESS' THEN to_status IN ('RESOLVED', 'REJECTED')
    WHEN from_status = 'RESOLVED' THEN to_status IN ('CLOSED')
    WHEN from_status = 'FALSE_REPORT_REVIEW' THEN to_status IN ('CLOSED', 'REJECTED')
    WHEN from_status = 'CANCELLED' THEN FALSE
    WHEN from_status = 'REJECTED' THEN FALSE
    WHEN from_status = 'CLOSED' THEN FALSE
    ELSE FALSE
  END;
END;
$$ LANGUAGE plpgsql;
