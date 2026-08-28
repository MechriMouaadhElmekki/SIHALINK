-- ============================================================
-- SIHALINK - Complete Database Schema
-- Migration 001: Initial Schema
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM ('USER','DOCTOR','HEALTHCARE_PROVIDER','EMERGENCY_OPERATOR','ADMIN','SUPER_ADMIN');
CREATE TYPE emergency_type AS ENUM ('MEDICAL','ACCIDENT','FIRE','PREGNANCY','CHILD_EMERGENCY','ELDERLY','UNCONSCIOUS','BREATHING_DIFFICULTY','CHEST_PAIN','SEVERE_BLEEDING','OTHER');
CREATE TYPE emergency_priority AS ENUM ('CRITICAL','HIGH','MEDIUM','LOW');
CREATE TYPE report_status AS ENUM ('DRAFT','SUBMITTED','RECEIVED','UNDER_REVIEW','ASSIGNED','ACKNOWLEDGED','IN_PROGRESS','RESOLVED','CANCELLED','REJECTED','FALSE_REPORT_REVIEW','CLOSED');
CREATE TYPE appointment_status AS ENUM ('REQUESTED','CONFIRMED','RESCHEDULED','CANCELLED_BY_USER','CANCELLED_BY_DOCTOR','COMPLETED','NO_SHOW');
CREATE TYPE facility_type AS ENUM ('HOSPITAL','CLINIC','MEDICAL_CENTER','EMERGENCY_DEPARTMENT','PHARMACY','LABORATORY','IMAGING_CENTER');
CREATE TYPE account_status AS ENUM ('ACTIVE','SUSPENDED','RESTRICTED','DELETED');
CREATE TYPE gender_type AS ENUM ('MALE','FEMALE','OTHER','PREFER_NOT_TO_SAY');
CREATE TYPE blood_type AS ENUM ('A+','A-','B+','B-','AB+','AB-','O+','O-');
CREATE TYPE consultation_type AS ENUM ('IN_PERSON','VIDEO','PHONE','HOME_VISIT');
CREATE TYPE notification_type AS ENUM ('EMERGENCY_UPDATE','APPOINTMENT_UPDATE','SECURITY_ALERT','SYSTEM_ANNOUNCEMENT','ACCOUNT_NOTIFICATION');
CREATE TYPE suspension_type AS ENUM ('WARNING','TEMPORARY','EXTENDED','RESTRICTED');
CREATE TYPE review_status AS ENUM ('DRAFT','UNDER_REVIEW','REVIEWED');

-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ language 'plpgsql';

-- ============================================================
-- PROFILES
-- ============================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20) UNIQUE,
  email VARCHAR(255) NOT NULL,
  date_of_birth DATE,
  gender gender_type,
  blood_type blood_type,
  address TEXT,
  city VARCHAR(100),
  wilaya VARCHAR(100),
  profile_photo TEXT,
  preferred_language VARCHAR(5) DEFAULT 'ar' CHECK (preferred_language IN ('ar','fr','en')),
  emergency_notes TEXT,
  account_status account_status DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_profiles_wilaya ON profiles(wilaya);
CREATE INDEX idx_profiles_account_status ON profiles(account_status);

-- ============================================================
-- ROLES
-- ============================================================

CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name user_role UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO roles (name, description) VALUES
  ('USER', 'Standard platform user'),
  ('DOCTOR', 'Verified medical doctor'),
  ('HEALTHCARE_PROVIDER', 'Healthcare facility administrator'),
  ('EMERGENCY_OPERATOR', 'Emergency response operator'),
  ('ADMIN', 'Platform administrator'),
  ('SUPER_ADMIN', 'Super administrator with full access');

CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  granted_by UUID REFERENCES profiles(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
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
  name VARCHAR(200) NOT NULL,
  relationship VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 10),
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trusted_contacts_updated_at BEFORE UPDATE ON trusted_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_trusted_contacts_user_id ON trusted_contacts(user_id);

-- ============================================================
-- EMERGENCY REPORTS
-- ============================================================

CREATE TABLE emergency_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_number VARCHAR(20) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id),
  emergency_type emergency_type NOT NULL,
  priority emergency_priority NOT NULL DEFAULT 'MEDIUM',
  status report_status NOT NULL DEFAULT 'DRAFT',
  description TEXT,
  people_affected INTEGER DEFAULT 1 CHECK (people_affected >= 1),
  operator_id UUID REFERENCES profiles(id),
  submitted_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER emergency_reports_updated_at BEFORE UPDATE ON emergency_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_emergency_reports_user_id ON emergency_reports(user_id);
CREATE INDEX idx_emergency_reports_status ON emergency_reports(status);
CREATE INDEX idx_emergency_reports_priority ON emergency_reports(priority);
CREATE INDEX idx_emergency_reports_created_at ON emergency_reports(created_at DESC);

-- Generate unique report number function
CREATE OR REPLACE FUNCTION generate_report_number()
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  seq_num INTEGER;
  report_num TEXT;
BEGIN
  year_part := EXTRACT(YEAR FROM NOW())::TEXT;
  SELECT COUNT(*) + 1 INTO seq_num FROM emergency_reports
    WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());
  report_num := 'SH-' || year_part || '-' || LPAD(seq_num::TEXT, 6, '0');
  WHILE EXISTS (SELECT 1 FROM emergency_reports WHERE report_number = report_num) LOOP
    seq_num := seq_num + 1;
    report_num := 'SH-' || year_part || '-' || LPAD(seq_num::TEXT, 6, '0');
  END LOOP;
  RETURN report_num;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- EMERGENCY REPORT EVENTS
-- ============================================================

CREATE TABLE emergency_report_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES emergency_reports(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  actor_id UUID REFERENCES profiles(id),
  actor_role user_role,
  description TEXT,
  metadata JSONB,
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
  question_key VARCHAR(100) NOT NULL,
  answer_value TEXT NOT NULL,
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
  accuracy REAL,
  address TEXT,
  city VARCHAR(100),
  wilaya VARCHAR(100),
  commune VARCHAR(100),
  captured_at TIMESTAMPTZ DEFAULT NOW(),
  is_simulated BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_emergency_locations_report_id ON emergency_locations(report_id);

-- ============================================================
-- EMERGENCY MEDIA
-- ============================================================

CREATE TABLE emergency_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES emergency_reports(id) ON DELETE CASCADE,
  uploader_id UUID NOT NULL REFERENCES profiles(id),
  file_name VARCHAR(500) NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  file_size INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_emergency_media_report_id ON emergency_media(report_id);

-- ============================================================
-- FALSE REPORT CASES
-- ============================================================

CREATE TABLE false_report_cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES emergency_reports(id),
  reported_user_id UUID NOT NULL REFERENCES profiles(id),
  reviewer_id UUID REFERENCES profiles(id),
  reason TEXT,
  evidence TEXT,
  decision VARCHAR(50),
  decision_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- ============================================================
-- SUSPENSIONS
-- ============================================================

CREATE TABLE suspensions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  admin_id UUID REFERENCES profiles(id),
  suspension_type suspension_type NOT NULL,
  reason TEXT NOT NULL,
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_suspensions_user_id ON suspensions(user_id);
CREATE INDEX idx_suspensions_is_active ON suspensions(is_active);

-- ============================================================
-- SPECIALTIES
-- ============================================================

CREATE TABLE specialties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_ar VARCHAR(200) NOT NULL,
  name_fr VARCHAR(200) NOT NULL,
  name_en VARCHAR(200) NOT NULL,
  icon VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- HEALTHCARE FACILITIES
-- ============================================================

CREATE TABLE healthcare_facilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(300) NOT NULL,
  type facility_type NOT NULL,
  description TEXT,
  phone VARCHAR(20),
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  wilaya VARCHAR(100) NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  opening_hours JSONB,
  has_emergency BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  is_demo BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER facilities_updated_at BEFORE UPDATE ON healthcare_facilities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_facilities_wilaya ON healthcare_facilities(wilaya);
CREATE INDEX idx_facilities_type ON healthcare_facilities(type);
CREATE INDEX idx_facilities_city ON healthcare_facilities(city);

-- ============================================================
-- DOCTORS
-- ============================================================

CREATE TABLE doctors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  full_name VARCHAR(300) NOT NULL,
  photo_url TEXT,
  bio TEXT,
  languages TEXT[] DEFAULT ARRAY['ar'],
  gender gender_type,
  years_experience INTEGER CHECK (years_experience >= 0),
  facility_id UUID REFERENCES healthcare_facilities(id),
  city VARCHAR(100),
  wilaya VARCHAR(100),
  consultation_types consultation_type[] DEFAULT ARRAY['IN_PERSON'::consultation_type],
  is_verified BOOLEAN DEFAULT FALSE,
  is_demo BOOLEAN DEFAULT FALSE,
  rating DECIMAL(3,2) CHECK (rating >= 0 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER doctors_updated_at BEFORE UPDATE ON doctors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_doctors_wilaya ON doctors(wilaya);
CREATE INDEX idx_doctors_city ON doctors(city);
CREATE INDEX idx_doctors_is_verified ON doctors(is_verified);

CREATE TABLE doctor_specialties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  specialty_id UUID NOT NULL REFERENCES specialties(id),
  is_primary BOOLEAN DEFAULT FALSE,
  UNIQUE(doctor_id, specialty_id)
);

CREATE TABLE doctor_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  consultation_type consultation_type DEFAULT 'IN_PERSON',
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(doctor_id, day_of_week, start_time, consultation_type)
);

CREATE INDEX idx_doctor_availability_doctor_id ON doctor_availability(doctor_id);

-- ============================================================
-- APPOINTMENTS
-- ============================================================

CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  doctor_id UUID NOT NULL REFERENCES doctors(id),
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  consultation_type consultation_type NOT NULL DEFAULT 'IN_PERSON',
  reason TEXT,
  status appointment_status NOT NULL DEFAULT 'REQUESTED',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(doctor_id, appointment_date, appointment_time)
);

CREATE TRIGGER appointments_updated_at BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_appointments_user_id ON appointments(user_id);
CREATE INDEX idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);

CREATE TABLE appointment_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  old_status appointment_status,
  new_status appointment_status NOT NULL,
  changed_by UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FACILITY SERVICES & LOCATIONS
-- ============================================================

CREATE TABLE facility_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id UUID NOT NULL REFERENCES healthcare_facilities(id) ON DELETE CASCADE,
  service_name_ar VARCHAR(300) NOT NULL,
  service_name_fr VARCHAR(300),
  service_name_en VARCHAR(300)
);

-- ============================================================
-- PHARMACIES
-- ============================================================

CREATE TABLE pharmacies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(300) NOT NULL,
  phone VARCHAR(20),
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  wilaya VARCHAR(100) NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  opening_hours JSONB,
  is_24h BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  is_demo BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pharmacies_wilaya ON pharmacies(wilaya);
CREATE INDEX idx_pharmacies_city ON pharmacies(city);
CREATE INDEX idx_pharmacies_is_24h ON pharmacies(is_24h);

-- ============================================================
-- LABORATORIES
-- ============================================================

CREATE TABLE laboratories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(300) NOT NULL,
  phone VARCHAR(20),
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  wilaya VARCHAR(100) NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  services TEXT[] DEFAULT ARRAY[]::TEXT[],
  opening_hours JSONB,
  requires_appointment BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  is_demo BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_laboratories_wilaya ON laboratories(wilaya);
CREATE INDEX idx_laboratories_city ON laboratories(city);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title_ar VARCHAR(500) NOT NULL,
  title_fr VARCHAR(500),
  title_en VARCHAR(500),
  body_ar TEXT NOT NULL,
  body_fr TEXT,
  body_en TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  entity_type VARCHAR(100),
  entity_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  emergency_updates_inapp BOOLEAN DEFAULT TRUE,
  emergency_updates_email BOOLEAN DEFAULT TRUE,
  emergency_updates_sms BOOLEAN DEFAULT TRUE,
  appointment_updates_inapp BOOLEAN DEFAULT TRUE,
  appointment_updates_email BOOLEAN DEFAULT TRUE,
  security_alerts_inapp BOOLEAN DEFAULT TRUE,
  security_alerts_email BOOLEAN DEFAULT TRUE,
  system_announcements_inapp BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FIRST AID
-- ============================================================

CREATE TABLE first_aid_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_ar VARCHAR(200) NOT NULL,
  name_fr VARCHAR(200) NOT NULL,
  name_en VARCHAR(200) NOT NULL,
  icon VARCHAR(50) NOT NULL,
  color VARCHAR(50) NOT NULL DEFAULT 'red',
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE first_aid_guides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES first_aid_categories(id),
  title_ar VARCHAR(500) NOT NULL,
  title_fr VARCHAR(500) NOT NULL,
  title_en VARCHAR(500) NOT NULL,
  warning_ar TEXT,
  warning_fr TEXT,
  warning_en TEXT,
  call_emergency_when_ar TEXT,
  call_emergency_when_fr TEXT,
  call_emergency_when_en TEXT,
  do_not_do_ar TEXT,
  do_not_do_fr TEXT,
  do_not_do_en TEXT,
  source VARCHAR(500),
  review_status review_status DEFAULT 'DRAFT',
  reviewed_by VARCHAR(200),
  review_date DATE,
  version INTEGER DEFAULT 1,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE first_aid_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guide_id UUID NOT NULL REFERENCES first_aid_guides(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  instruction_ar TEXT NOT NULL,
  instruction_fr TEXT,
  instruction_en TEXT,
  image_url TEXT,
  UNIQUE(guide_id, step_number)
);

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
  action VARCHAR(200) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID,
  metadata JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- ============================================================
-- ADMIN NOTES
-- ============================================================

CREATE TABLE admin_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES profiles(id),
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID NOT NULL,
  note TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SYSTEM SETTINGS
-- ============================================================

CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(200) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO system_settings (key, value, description, is_public) VALUES
  ('demo_mode', 'true', 'Enable demo/simulation mode', true),
  ('max_false_reports_before_warning', '2', 'Number of false reports before warning', false),
  ('max_false_reports_before_suspension', '3', 'Number of false reports before suspension', false),
  ('default_language', '"ar"', 'Default application language', true),
  ('emergency_dispatch_provider', '"mock"', 'Emergency dispatch provider (mock/real)', false);
