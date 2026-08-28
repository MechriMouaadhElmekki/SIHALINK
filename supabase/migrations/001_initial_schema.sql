-- ============================================================
-- SIHALINK - Complete Database Schema
-- Migration 001: Initial Schema
-- ============================================================

-- Enable extensions
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
$$ LANGUAGE plpgsql;

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
  ('USER', 'Standard platform user'),
  ('DOCTOR', 'Verified medical doctor'),
  ('HEALTHCARE_PROVIDER', 'Healthcare facility administrator'),
  ('EMERGENCY_OPERATOR', 'Emergency operations center operator'),
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
  gender TEXT CHECK (gender IN ('male', 'female', 'prefer_not_to_say')),
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

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_profiles_wilaya ON profiles(wilaya);
CREATE INDEX idx_profiles_account_status ON profiles(account_status);

-- ============================================================
-- USER ROLES
-- ============================================================
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role_id)
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);

-- ============================================================
-- NOTIFICATION PREFERENCES
-- ============================================================
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  emergency_updates_inapp BOOLEAN NOT NULL DEFAULT TRUE,
  emergency_updates_email BOOLEAN NOT NULL DEFAULT TRUE,
  emergency_updates_sms BOOLEAN NOT NULL DEFAULT FALSE,
  appointment_updates_inapp BOOLEAN NOT NULL DEFAULT TRUE,
  appointment_updates_email BOOLEAN NOT NULL DEFAULT TRUE,
  security_alerts_inapp BOOLEAN NOT NULL DEFAULT TRUE,
  security_alerts_email BOOLEAN NOT NULL DEFAULT TRUE,
  system_announcements_inapp BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER notification_preferences_updated_at BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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
  priority INTEGER NOT NULL DEFAULT 1 CHECK (priority >= 1),
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trusted_contacts_updated_at BEFORE UPDATE ON trusted_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_trusted_contacts_user_id ON trusted_contacts(user_id);

-- ============================================================
-- EMERGENCY REPORTS
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS emergency_report_seq START 1;

CREATE TABLE IF NOT EXISTS emergency_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_number TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  emergency_type TEXT NOT NULL CHECK (emergency_type IN (
    'medical','accident','fire','pregnancy','child_emergency',
    'elderly_emergency','unconscious','breathing_difficulty',
    'chest_pain','severe_bleeding','other'
  )),
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN (
    'DRAFT','SUBMITTED','RECEIVED','UNDER_REVIEW','ASSIGNED',
    'ACKNOWLEDGED','IN_PROGRESS','RESOLVED','CANCELLED',
    'REJECTED','FALSE_REPORT_REVIEW','CLOSED'
  )),
  priority TEXT CHECK (priority IN ('CRITICAL','HIGH','MEDIUM','LOW')),
  additional_info TEXT,
  operator_id UUID REFERENCES profiles(id),
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER emergency_reports_updated_at BEFORE UPDATE ON emergency_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_emergency_reports_user_id ON emergency_reports(user_id);
CREATE INDEX idx_emergency_reports_status ON emergency_reports(status);
CREATE INDEX idx_emergency_reports_priority ON emergency_reports(priority);
CREATE INDEX idx_emergency_reports_created_at ON emergency_reports(created_at);

-- Function to generate report number: SH-YYYY-NNNNNN
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
-- EMERGENCY REPORT EVENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS emergency_report_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES emergency_reports(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  actor_id UUID REFERENCES profiles(id),
  actor_role TEXT,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_report_events_report_id ON emergency_report_events(report_id);

-- ============================================================
-- EMERGENCY TRIAGE ANSWERS
-- ============================================================
CREATE TABLE IF NOT EXISTS emergency_triage_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES emergency_reports(id) ON DELETE CASCADE,
  question_key TEXT NOT NULL,
  question_text TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_triage_answers_report_id ON emergency_triage_answers(report_id);

-- ============================================================
-- EMERGENCY LOCATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS emergency_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES emergency_reports(id) ON DELETE CASCADE UNIQUE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  accuracy DOUBLE PRECISION,
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
-- EMERGENCY MEDIA
-- ============================================================
CREATE TABLE IF NOT EXISTS emergency_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES emergency_reports(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('photo','video','document')),
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_report_status_history_report_id ON report_status_history(report_id);

-- ============================================================
-- FALSE REPORT CASES
-- ============================================================
CREATE TABLE IF NOT EXISTS false_report_cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES emergency_reports(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  classification TEXT NOT NULL CHECK (classification IN ('under_review','accidental','intentional')),
  reason TEXT,
  evidence TEXT,
  reviewer_id UUID REFERENCES profiles(id),
  decision TEXT CHECK (decision IN ('warning','no_action','suspend','restrict')),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_false_report_cases_user_id ON false_report_cases(user_id);

-- ============================================================
-- SUSPENSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS suspensions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  type TEXT NOT NULL CHECK (type IN ('warning','temporary_suspension','restriction')),
  reason TEXT NOT NULL,
  issued_by UUID NOT NULL REFERENCES profiles(id),
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_suspensions_user_id ON suspensions(user_id);

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
-- HEALTHCARE FACILITIES
-- ============================================================
CREATE TABLE IF NOT EXISTS healthcare_facilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('hospital','clinic','medical_center','emergency_department','imaging_center','health_center')),
  description TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  wilaya TEXT NOT NULL,
  commune TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  opening_hours JSONB,
  has_emergency BOOLEAN NOT NULL DEFAULT FALSE,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending','verified','rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER healthcare_facilities_updated_at BEFORE UPDATE ON healthcare_facilities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_facilities_wilaya ON healthcare_facilities(wilaya);
CREATE INDEX idx_facilities_type ON healthcare_facilities(type);

-- ============================================================
-- FACILITY SERVICES
-- ============================================================
CREATE TABLE IF NOT EXISTS facility_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id UUID NOT NULL REFERENCES healthcare_facilities(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- DOCTORS
-- ============================================================
CREATE TABLE IF NOT EXISTS doctors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  photo_url TEXT,
  bio TEXT,
  gender TEXT CHECK (gender IN ('male','female')),
  languages TEXT[] DEFAULT ARRAY['ar'],
  experience_years INTEGER,
  facility_id UUID REFERENCES healthcare_facilities(id),
  city TEXT,
  wilaya TEXT,
  consultation_types TEXT[] DEFAULT ARRAY['in_person'],
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending','verified','rejected')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER doctors_updated_at BEFORE UPDATE ON doctors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_doctors_wilaya ON doctors(wilaya);
CREATE INDEX idx_doctors_verified ON doctors(is_verified);

-- ============================================================
-- DOCTOR SPECIALTIES (junction)
-- ============================================================
CREATE TABLE IF NOT EXISTS doctor_specialties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  specialty_id UUID NOT NULL REFERENCES specialties(id),
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE(doctor_id, specialty_id)
);

-- ============================================================
-- DOCTOR AVAILABILITY
-- ============================================================
CREATE TABLE IF NOT EXISTS doctor_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_duration_minutes INTEGER NOT NULL DEFAULT 30,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_doctor_availability_doctor_id ON doctor_availability(doctor_id);

-- ============================================================
-- APPOINTMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES profiles(id),
  doctor_id UUID NOT NULL REFERENCES doctors(id),
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  consultation_type TEXT NOT NULL CHECK (consultation_type IN ('in_person','teleconsultation')),
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'REQUESTED' CHECK (status IN (
    'REQUESTED','CONFIRMED','RESCHEDULED','CANCELLED_BY_USER',
    'CANCELLED_BY_DOCTOR','COMPLETED','NO_SHOW'
  )),
  doctor_notes TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Prevent double booking at DB level
  UNIQUE(doctor_id, appointment_date, appointment_time)
);

CREATE TRIGGER appointments_updated_at BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);

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

-- ============================================================
-- PHARMACIES
-- ============================================================
CREATE TABLE IF NOT EXISTS pharmacies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  wilaya TEXT NOT NULL,
  phone TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  opening_hours JSONB,
  has_24h_service BOOLEAN NOT NULL DEFAULT FALSE,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER pharmacies_updated_at BEFORE UPDATE ON pharmacies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_pharmacies_wilaya ON pharmacies(wilaya);

-- ============================================================
-- LABORATORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS laboratories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  wilaya TEXT NOT NULL,
  phone TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  services TEXT[],
  opening_hours JSONB,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER laboratories_updated_at BEFORE UPDATE ON laboratories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_laboratories_wilaya ON laboratories(wilaya);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('emergency_update','appointment_update','security','system','account')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(user_id, is_read);

-- ============================================================
-- FIRST AID CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS first_aid_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  name_ar TEXT NOT NULL,
  name_fr TEXT NOT NULL,
  name_en TEXT NOT NULL,
  icon TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- FIRST AID GUIDES
-- ============================================================
CREATE TABLE IF NOT EXISTS first_aid_guides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES first_aid_categories(id),
  slug TEXT NOT NULL UNIQUE,
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
  review_status TEXT NOT NULL DEFAULT 'draft' CHECK (review_status IN ('draft','under_review','approved','published')),
  reviewed_by TEXT,
  reviewed_at DATE,
  version INTEGER NOT NULL DEFAULT 1,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER first_aid_guides_updated_at BEFORE UPDATE ON first_aid_guides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- FIRST AID STEPS
-- ============================================================
CREATE TABLE IF NOT EXISTS first_aid_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guide_id UUID NOT NULL REFERENCES first_aid_guides(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  instruction_ar TEXT NOT NULL,
  instruction_fr TEXT NOT NULL,
  instruction_en TEXT NOT NULL,
  image_url TEXT,
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

-- ============================================================
-- AUDIT LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES profiles(id),
  actor_role TEXT,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================================
-- ADMIN NOTES
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  note TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SYSTEM SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO system_settings (key, value, description) VALUES
  ('demo_mode', 'true', 'Enable demo mode for development/presentations'),
  ('emergency_dispatch_provider', 'mock', 'Emergency dispatch provider: mock | civil_protection'),
  ('max_report_media_files', '5', 'Maximum media files per emergency report'),
  ('max_media_file_size_mb', '10', 'Maximum file size in MB for uploads'),
  ('false_report_warning_threshold', '2', 'Reports before warning'),
  ('false_report_suspension_threshold', '3', 'Reports before temporary suspension')
ON CONFLICT (key) DO NOTHING;
