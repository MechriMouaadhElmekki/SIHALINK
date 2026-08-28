-- ============================================================
-- SIHALINK Complete Database Schema
-- Migration 001 - Core Schema
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
CREATE TYPE user_role AS ENUM (
  'USER', 'DOCTOR', 'HEALTHCARE_PROVIDER',
  'EMERGENCY_OPERATOR', 'ADMIN', 'SUPER_ADMIN'
);

CREATE TYPE account_status AS ENUM (
  'ACTIVE', 'SUSPENDED', 'RESTRICTED', 'DELETED'
);

CREATE TYPE gender_type AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');

CREATE TYPE blood_type AS ENUM (
  'A_POS', 'A_NEG', 'B_POS', 'B_NEG',
  'AB_POS', 'AB_NEG', 'O_POS', 'O_NEG', 'UNKNOWN'
);

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  date_of_birth DATE,
  gender gender_type,
  blood_type blood_type DEFAULT 'UNKNOWN',
  address TEXT,
  city TEXT,
  wilaya TEXT,
  profile_photo_url TEXT,
  preferred_language TEXT DEFAULT 'ar' CHECK (preferred_language IN ('ar','fr','en')),
  emergency_notes TEXT,
  account_status account_status DEFAULT 'ACTIVE',
  role user_role DEFAULT 'USER',
  is_demo BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_wilaya ON profiles(wilaya);
CREATE INDEX idx_profiles_status ON profiles(account_status);

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
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
  priority INTEGER DEFAULT 1 CHECK (priority > 0),
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_trusted_contacts_user ON trusted_contacts(user_id);

CREATE TRIGGER update_trusted_contacts_updated_at
  BEFORE UPDATE ON trusted_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- EMERGENCY REPORTS
-- ============================================================
CREATE TYPE emergency_type AS ENUM (
  'MEDICAL', 'ACCIDENT', 'FIRE', 'MATERNITY',
  'CHILD_EMERGENCY', 'ELDERLY_EMERGENCY', 'UNCONSCIOUS',
  'BREATHING_DIFFICULTY', 'CHEST_PAIN', 'SEVERE_BLEEDING', 'OTHER'
);

CREATE TYPE emergency_priority AS ENUM ('CRITICAL','HIGH','MEDIUM','LOW');

CREATE TYPE report_status AS ENUM (
  'DRAFT','SUBMITTED','RECEIVED','UNDER_REVIEW',
  'ASSIGNED','ACKNOWLEDGED','IN_PROGRESS',
  'RESOLVED','CANCELLED','REJECTED',
  'FALSE_REPORT_REVIEW','CLOSED'
);

CREATE SEQUENCE emergency_report_seq START 1;

CREATE TABLE emergency_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_number TEXT UNIQUE NOT NULL DEFAULT
    'SH-' || TO_CHAR(NOW(),'YYYY') || '-' || LPAD(nextval('emergency_report_seq')::TEXT,6,'0'),
  user_id UUID NOT NULL REFERENCES profiles(id),
  emergency_type emergency_type NOT NULL,
  priority emergency_priority DEFAULT 'MEDIUM',
  status report_status DEFAULT 'DRAFT',
  description TEXT,
  affected_count INTEGER DEFAULT 1 CHECK (affected_count > 0),
  additional_info TEXT,
  assigned_operator_id UUID REFERENCES profiles(id),
  is_demo BOOLEAN DEFAULT FALSE,
  cancelled_at TIMESTAMPTZ,
  cancelled_reason TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reports_user ON emergency_reports(user_id);
CREATE INDEX idx_reports_status ON emergency_reports(status);
CREATE INDEX idx_reports_priority ON emergency_reports(priority);
CREATE INDEX idx_reports_created ON emergency_reports(created_at DESC);
CREATE INDEX idx_reports_operator ON emergency_reports(assigned_operator_id);

CREATE TRIGGER update_emergency_reports_updated_at
  BEFORE UPDATE ON emergency_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- EMERGENCY LOCATIONS
-- ============================================================
CREATE TABLE emergency_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES emergency_reports(id) ON DELETE CASCADE,
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  accuracy DECIMAL(8,2),
  address TEXT,
  city TEXT,
  wilaya TEXT,
  commune TEXT,
  is_manual BOOLEAN DEFAULT FALSE,
  captured_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_locations_report ON emergency_locations(report_id);

-- ============================================================
-- EMERGENCY TRIAGE
-- ============================================================
CREATE TABLE emergency_triage_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES emergency_reports(id) ON DELETE CASCADE,
  question_key TEXT NOT NULL,
  question_text_ar TEXT,
  question_text_fr TEXT,
  answer TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_triage_report ON emergency_triage_answers(report_id);

-- ============================================================
-- EMERGENCY MEDIA
-- ============================================================
CREATE TABLE emergency_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES emergency_reports(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_media_report ON emergency_media(report_id);

-- ============================================================
-- REPORT STATUS HISTORY
-- ============================================================
CREATE TABLE report_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES emergency_reports(id) ON DELETE CASCADE,
  from_status report_status,
  to_status report_status NOT NULL,
  changed_by UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_status_history_report ON report_status_history(report_id);

-- ============================================================
-- EMERGENCY REPORT EVENTS
-- ============================================================
CREATE TYPE report_event_type AS ENUM (
  'REPORT_CREATED','TRIAGE_COMPLETED','LOCATION_CONFIRMED',
  'REPORT_SUBMITTED','REPORT_RECEIVED','REVIEW_STARTED',
  'OPERATOR_ASSIGNED','OPERATOR_ACKNOWLEDGED','RESPONSE_STARTED',
  'STATUS_UPDATE','OPERATOR_NOTE','REPORT_RESOLVED',
  'REPORT_CANCELLED','REPORT_REJECTED','FALSE_REPORT_FLAGGED',
  'FALSE_REPORT_RESOLVED','MEDIA_ATTACHED'
);

CREATE TABLE emergency_report_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES emergency_reports(id) ON DELETE CASCADE,
  event_type report_event_type NOT NULL,
  actor_id UUID REFERENCES profiles(id),
  actor_role user_role,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  is_visible_to_user BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_report ON emergency_report_events(report_id);
CREATE INDEX idx_events_created ON emergency_report_events(created_at DESC);

-- ============================================================
-- FALSE REPORT CASES
-- ============================================================
CREATE TYPE false_report_type AS ENUM (
  'ACCIDENTAL','INTENTIONAL','UNDER_REVIEW'
);

CREATE TABLE false_report_cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES emergency_reports(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  flagged_by UUID REFERENCES profiles(id),
  false_report_type false_report_type DEFAULT 'UNDER_REVIEW',
  reason TEXT,
  evidence TEXT,
  reviewed_by UUID REFERENCES profiles(id),
  decision TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SUSPENSIONS
-- ============================================================
CREATE TYPE suspension_type AS ENUM (
  'WARNING','TEMPORARY','RESTRICTION','PERMANENT_REVIEW'
);

CREATE TABLE suspensions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  suspension_type suspension_type NOT NULL,
  reason TEXT NOT NULL,
  imposed_by UUID REFERENCES profiles(id),
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_suspensions_user ON suspensions(user_id);
CREATE INDEX idx_suspensions_active ON suspensions(is_active);

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
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DOCTORS
-- ============================================================
CREATE TYPE verification_status AS ENUM (
  'PENDING','VERIFIED','REJECTED','DEMO'
);

CREATE TYPE consultation_type AS ENUM (
  'IN_PERSON','ONLINE','BOTH'
);

CREATE TABLE doctors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  photo_url TEXT,
  bio TEXT,
  languages TEXT[] DEFAULT '{"ar"}',
  gender gender_type,
  years_experience INTEGER,
  consultation_type consultation_type DEFAULT 'IN_PERSON',
  consultation_fee DECIMAL(10,2),
  city TEXT,
  wilaya TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  verification_status verification_status DEFAULT 'PENDING',
  is_active BOOLEAN DEFAULT TRUE,
  is_demo BOOLEAN DEFAULT FALSE,
  facility_id UUID,
  rating DECIMAL(3,2) CHECK (rating >= 0 AND rating <= 5),
  rating_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_doctors_wilaya ON doctors(wilaya);
CREATE INDEX idx_doctors_city ON doctors(city);
CREATE INDEX idx_doctors_status ON doctors(verification_status);
CREATE INDEX idx_doctors_active ON doctors(is_active);

CREATE TRIGGER update_doctors_updated_at
  BEFORE UPDATE ON doctors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- DOCTOR SPECIALTIES (junction)
-- ============================================================
CREATE TABLE doctor_specialties (
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  specialty_id UUID NOT NULL REFERENCES specialties(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (doctor_id, specialty_id)
);

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
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

CREATE INDEX idx_availability_doctor ON doctor_availability(doctor_id);

-- ============================================================
-- HEALTHCARE FACILITIES
-- ============================================================
CREATE TYPE facility_type AS ENUM (
  'HOSPITAL','CLINIC','MEDICAL_CENTER','EMERGENCY_DEPT',
  'IMAGING_CENTER','REHABILITATION','OTHER'
);

CREATE TABLE healthcare_facilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_ar TEXT NOT NULL,
  name_fr TEXT,
  name_en TEXT,
  facility_type facility_type NOT NULL,
  description TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  wilaya TEXT NOT NULL,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  opening_hours JSONB DEFAULT '{}',
  has_emergency BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  verification_status verification_status DEFAULT 'PENDING',
  is_demo BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_facilities_wilaya ON healthcare_facilities(wilaya);
CREATE INDEX idx_facilities_type ON healthcare_facilities(facility_type);
CREATE INDEX idx_facilities_emergency ON healthcare_facilities(has_emergency);

CREATE TRIGGER update_facilities_updated_at
  BEFORE UPDATE ON healthcare_facilities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add FK from doctors to facilities
ALTER TABLE doctors ADD CONSTRAINT fk_doctor_facility
  FOREIGN KEY (facility_id) REFERENCES healthcare_facilities(id) ON DELETE SET NULL;

-- ============================================================
-- FACILITY SERVICES
-- ============================================================
CREATE TABLE facility_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id UUID NOT NULL REFERENCES healthcare_facilities(id) ON DELETE CASCADE,
  name_ar TEXT NOT NULL,
  name_fr TEXT,
  name_en TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PHARMACIES
-- ============================================================
CREATE TABLE pharmacies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_ar TEXT NOT NULL,
  name_fr TEXT,
  phone TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  wilaya TEXT NOT NULL,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  opening_hours JSONB DEFAULT '{}',
  is_24h BOOLEAN DEFAULT FALSE,
  is_duty BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  is_demo BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pharmacies_wilaya ON pharmacies(wilaya);
CREATE INDEX idx_pharmacies_duty ON pharmacies(is_duty);

-- ============================================================
-- LABORATORIES
-- ============================================================
CREATE TABLE laboratories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_ar TEXT NOT NULL,
  name_fr TEXT,
  phone TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  wilaya TEXT NOT NULL,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  opening_hours JSONB DEFAULT '{}',
  services TEXT[] DEFAULT '{}',
  requires_appointment BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  is_demo BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_labs_wilaya ON laboratories(wilaya);

-- ============================================================
-- APPOINTMENTS
-- ============================================================
CREATE TYPE appointment_status AS ENUM (
  'REQUESTED','CONFIRMED','RESCHEDULED',
  'CANCELLED_BY_USER','CANCELLED_BY_DOCTOR',
  'COMPLETED','NO_SHOW'
);

CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  doctor_id UUID NOT NULL REFERENCES doctors(id),
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  consultation_type consultation_type NOT NULL,
  status appointment_status DEFAULT 'REQUESTED',
  reason TEXT,
  notes TEXT,
  is_demo BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Prevent double booking at DB level
  CONSTRAINT no_double_booking UNIQUE (doctor_id, appointment_date, start_time)
);

CREATE INDEX idx_appointments_user ON appointments(user_id);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);
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
  from_status appointment_status,
  to_status appointment_status NOT NULL,
  changed_by UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TYPE notification_type AS ENUM (
  'EMERGENCY_UPDATE','APPOINTMENT_UPDATE','SECURITY_ALERT',
  'SYSTEM_ANNOUNCEMENT','ACCOUNT_NOTIFICATION'
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  notification_type notification_type NOT NULL,
  title_ar TEXT NOT NULL,
  title_fr TEXT,
  title_en TEXT,
  body_ar TEXT NOT NULL,
  body_fr TEXT,
  body_en TEXT,
  entity_type TEXT,
  entity_id UUID,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FIRST AID
-- ============================================================
CREATE TABLE first_aid_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_ar TEXT NOT NULL,
  name_fr TEXT NOT NULL,
  name_en TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT,
  description_ar TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TYPE review_status AS ENUM ('DRAFT','PENDING_REVIEW','REVIEWED','PUBLISHED');

CREATE TABLE first_aid_guides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES first_aid_categories(id),
  title_ar TEXT NOT NULL,
  title_fr TEXT,
  title_en TEXT,
  warning_ar TEXT,
  warning_fr TEXT,
  when_to_call_ar TEXT,
  when_to_call_fr TEXT,
  do_not_do_ar TEXT,
  do_not_do_fr TEXT,
  source TEXT,
  review_status review_status DEFAULT 'DRAFT',
  reviewed_by TEXT,
  reviewed_at DATE,
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_guide_step UNIQUE (guide_id, step_number)
);

CREATE TABLE saved_first_aid_guides (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  guide_id UUID NOT NULL REFERENCES first_aid_guides(id) ON DELETE CASCADE,
  saved_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, guide_id)
);

-- ============================================================
-- AUDIT LOGS
-- ============================================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES profiles(id),
  actor_role user_role,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

-- ============================================================
-- ADMIN NOTES
-- ============================================================
CREATE TABLE admin_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES profiles(id),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  note TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SYSTEM SETTINGS
-- ============================================================
CREATE TABLE system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default system settings
INSERT INTO system_settings (key, value, description) VALUES
  ('demo_mode', 'true', 'Enable demo/simulation mode'),
  ('emergency_dispatch_provider', '"mock"', 'Emergency dispatch provider: mock|civil_protection'),
  ('max_false_reports_before_warning', '2', 'Number of false reports before warning'),
  ('max_false_reports_before_suspension', '3', 'Number of false reports before suspension'),
  ('default_language', '"ar"', 'Default application language'),
  ('registration_enabled', 'true', 'Allow new user registrations'),
  ('appointment_advance_days', '30', 'How many days in advance appointments can be booked');
