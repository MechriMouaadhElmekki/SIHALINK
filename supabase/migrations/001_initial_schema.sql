-- ============================================================
-- SIHALINK Database Migration 001: Initial Schema
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM ('USER','DOCTOR','HEALTHCARE_PROVIDER','EMERGENCY_OPERATOR','ADMIN','SUPER_ADMIN');
CREATE TYPE account_status AS ENUM ('ACTIVE','SUSPENDED','RESTRICTED','DELETED');
CREATE TYPE gender_type AS ENUM ('MALE','FEMALE','OTHER','PREFER_NOT_TO_SAY');
CREATE TYPE blood_type AS ENUM ('A+','A-','B+','B-','AB+','AB-','O+','O-','UNKNOWN');
CREATE TYPE emergency_type AS ENUM ('MEDICAL','ACCIDENT','FIRE','PREGNANCY','CHILD_EMERGENCY','ELDERLY_EMERGENCY','UNCONSCIOUS','BREATHING_DIFFICULTY','CHEST_PAIN','SEVERE_BLEEDING','OTHER');
CREATE TYPE emergency_priority AS ENUM ('CRITICAL','HIGH','MEDIUM','LOW');
CREATE TYPE report_status AS ENUM ('DRAFT','SUBMITTED','RECEIVED','UNDER_REVIEW','ASSIGNED','ACKNOWLEDGED','IN_PROGRESS','RESOLVED','CANCELLED','REJECTED','FALSE_REPORT_REVIEW','CLOSED');
CREATE TYPE appointment_status AS ENUM ('REQUESTED','CONFIRMED','RESCHEDULED','CANCELLED_BY_USER','CANCELLED_BY_DOCTOR','COMPLETED','NO_SHOW');
CREATE TYPE consultation_type AS ENUM ('IN_PERSON','TELECONSULTATION','HOME_VISIT');
CREATE TYPE facility_type AS ENUM ('HOSPITAL','CLINIC','MEDICAL_CENTER','EMERGENCY_DEPARTMENT','PHARMACY','LABORATORY','IMAGING_CENTER','HEALTH_CENTER');
CREATE TYPE false_report_type AS ENUM ('NORMAL','UNDER_REVIEW','ACCIDENTAL','INTENTIONAL');
CREATE TYPE suspension_type AS ENUM ('WARNING','TEMPORARY','EXTENDED','RESTRICTION');
CREATE TYPE notification_type AS ENUM ('EMERGENCY_UPDATE','APPOINTMENT_UPDATE','SECURITY_ALERT','SYSTEM_ANNOUNCEMENT','ACCOUNT_NOTIFICATION');
CREATE TYPE guide_review_status AS ENUM ('PENDING_REVIEW','REVIEWED','PUBLISHED','ARCHIVED');
CREATE TYPE verification_status AS ENUM ('PENDING','VERIFIED','REJECTED','SUSPENDED');

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
  first_name TEXT NOT NULL CHECK (char_length(first_name) <= 100),
  last_name TEXT NOT NULL CHECK (char_length(last_name) <= 100),
  phone TEXT CHECK (char_length(phone) <= 30),
  date_of_birth DATE,
  gender gender_type,
  blood_type blood_type DEFAULT 'UNKNOWN',
  address TEXT CHECK (char_length(address) <= 500),
  city TEXT CHECK (char_length(city) <= 100),
  wilaya TEXT CHECK (char_length(wilaya) <= 100),
  profile_photo_url TEXT,
  preferred_language TEXT DEFAULT 'ar' CHECK (preferred_language IN ('ar','fr','en')),
  emergency_notes TEXT CHECK (char_length(emergency_notes) <= 1000),
  account_status account_status DEFAULT 'ACTIVE',
  role user_role DEFAULT 'USER',
  is_demo BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_wilaya ON profiles(wilaya);
CREATE INDEX idx_profiles_status ON profiles(account_status);

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TRUSTED CONTACTS
-- ============================================================

CREATE TABLE trusted_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) <= 200),
  relationship TEXT CHECK (char_length(relationship) <= 100),
  phone TEXT NOT NULL CHECK (char_length(phone) <= 30),
  email TEXT CHECK (char_length(email) <= 255),
  priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 10),
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_trusted_contacts_user ON trusted_contacts(user_id);

CREATE TRIGGER trg_trusted_contacts_updated_at
  BEFORE UPDATE ON trusted_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- NOTIFICATION PREFERENCES
-- ============================================================

CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
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

CREATE TRIGGER trg_notif_prefs_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- EMERGENCY LOCATIONS
-- ============================================================

CREATE TABLE emergency_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  accuracy DOUBLE PRECISION,
  altitude DOUBLE PRECISION,
  address TEXT,
  city TEXT,
  wilaya TEXT,
  commune TEXT,
  captured_at TIMESTAMPTZ DEFAULT NOW(),
  is_manual BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- EMERGENCY REPORTS
-- ============================================================

CREATE TABLE emergency_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_number TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id),
  emergency_type emergency_type NOT NULL,
  priority emergency_priority NOT NULL DEFAULT 'MEDIUM',
  status report_status NOT NULL DEFAULT 'DRAFT',
  description TEXT CHECK (char_length(description) <= 2000),
  location_id UUID REFERENCES emergency_locations(id),
  assigned_operator_id UUID REFERENCES profiles(id),
  is_demo BOOLEAN DEFAULT FALSE,
  false_report_type false_report_type DEFAULT 'NORMAL',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_emergency_reports_user ON emergency_reports(user_id);
CREATE INDEX idx_emergency_reports_status ON emergency_reports(status);
CREATE INDEX idx_emergency_reports_priority ON emergency_reports(priority);
CREATE INDEX idx_emergency_reports_type ON emergency_reports(emergency_type);
CREATE INDEX idx_emergency_reports_created ON emergency_reports(created_at DESC);
CREATE INDEX idx_emergency_reports_number ON emergency_reports(report_number);

CREATE TRIGGER trg_emergency_reports_updated_at
  BEFORE UPDATE ON emergency_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- REPORT NUMBER SEQUENCE
-- ============================================================

CREATE SEQUENCE report_number_seq START 1;

CREATE OR REPLACE FUNCTION generate_report_number()
RETURNS TEXT AS $$
DECLARE
  seq_val BIGINT;
  year_val TEXT;
BEGIN
  seq_val := nextval('report_number_seq');
  year_val := EXTRACT(YEAR FROM NOW())::TEXT;
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

CREATE INDEX idx_triage_report ON emergency_triage_answers(report_id);

-- ============================================================
-- EMERGENCY REPORT EVENTS
-- ============================================================

CREATE TABLE emergency_report_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES emergency_reports(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  actor_id UUID REFERENCES profiles(id),
  actor_role user_role,
  description TEXT,
  metadata JSONB,
  is_visible_to_user BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_report_events_report ON emergency_report_events(report_id);
CREATE INDEX idx_report_events_created ON emergency_report_events(created_at);

-- ============================================================
-- REPORT STATUS HISTORY
-- ============================================================

CREATE TABLE report_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES emergency_reports(id) ON DELETE CASCADE,
  from_status report_status,
  to_status report_status NOT NULL,
  actor_id UUID REFERENCES profiles(id),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_status_history_report ON report_status_history(report_id);

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
  mime_type TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_media_report ON emergency_media(report_id);

-- ============================================================
-- FALSE REPORT CASES
-- ============================================================

CREATE TABLE false_report_cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES emergency_reports(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  false_report_type false_report_type NOT NULL DEFAULT 'UNDER_REVIEW',
  reason TEXT,
  evidence TEXT,
  reviewer_id UUID REFERENCES profiles(id),
  decision TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_false_reports_user ON false_report_cases(user_id);
CREATE INDEX idx_false_reports_report ON false_report_cases(report_id);

CREATE TRIGGER trg_false_reports_updated_at
  BEFORE UPDATE ON false_report_cases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_suspensions_user ON suspensions(user_id);
CREATE INDEX idx_suspensions_active ON suspensions(is_active);

CREATE TRIGGER trg_suspensions_updated_at
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
  wilaya TEXT,
  commune TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  opening_hours JSONB,
  emergency_available BOOLEAN DEFAULT FALSE,
  verification_status verification_status DEFAULT 'PENDING',
  is_demo BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_facilities_type ON healthcare_facilities(type);
CREATE INDEX idx_facilities_wilaya ON healthcare_facilities(wilaya);
CREATE INDEX idx_facilities_city ON healthcare_facilities(city);
CREATE INDEX idx_facilities_verification ON healthcare_facilities(verification_status);
CREATE INDEX idx_facilities_name_trgm ON healthcare_facilities USING GIN(name gin_trgm_ops);

CREATE TRIGGER trg_facilities_updated_at
  BEFORE UPDATE ON healthcare_facilities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- FACILITY SERVICES
-- ============================================================

CREATE TABLE facility_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id UUID NOT NULL REFERENCES healthcare_facilities(id) ON DELETE CASCADE,
  name_ar TEXT NOT NULL,
  name_fr TEXT NOT NULL,
  name_en TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_facility_services_facility ON facility_services(facility_id);

-- ============================================================
-- PHARMACIES
-- ============================================================

CREATE TABLE pharmacies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT,
  wilaya TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  opening_hours JSONB,
  is_24h BOOLEAN DEFAULT FALSE,
  is_demo BOOLEAN DEFAULT FALSE,
  verification_status verification_status DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pharmacies_wilaya ON pharmacies(wilaya);
CREATE INDEX idx_pharmacies_city ON pharmacies(city);
CREATE INDEX idx_pharmacies_24h ON pharmacies(is_24h);

CREATE TRIGGER trg_pharmacies_updated_at
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
  wilaya TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  opening_hours JSONB,
  services JSONB,
  is_demo BOOLEAN DEFAULT FALSE,
  verification_status verification_status DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_laboratories_wilaya ON laboratories(wilaya);
CREATE INDEX idx_laboratories_city ON laboratories(city);

CREATE TRIGGER trg_laboratories_updated_at
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
  specialty_id UUID REFERENCES specialties(id),
  bio TEXT,
  languages TEXT[] DEFAULT ARRAY['ar'],
  gender gender_type,
  years_experience INTEGER CHECK (years_experience >= 0),
  facility_id UUID REFERENCES healthcare_facilities(id),
  city TEXT,
  wilaya TEXT,
  consultation_types consultation_type[] DEFAULT ARRAY['IN_PERSON'],
  consultation_fee NUMERIC(10,2),
  photo_url TEXT,
  verification_status verification_status DEFAULT 'PENDING',
  is_demo BOOLEAN DEFAULT FALSE,
  is_accepting_patients BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_doctors_specialty ON doctors(specialty_id);
CREATE INDEX idx_doctors_wilaya ON doctors(wilaya);
CREATE INDEX idx_doctors_city ON doctors(city);
CREATE INDEX idx_doctors_facility ON doctors(facility_id);
CREATE INDEX idx_doctors_verification ON doctors(verification_status);
CREATE INDEX idx_doctors_accepting ON doctors(is_accepting_patients);
CREATE INDEX idx_doctors_name_trgm ON doctors USING GIN((first_name || ' ' || last_name) gin_trgm_ops);

CREATE TRIGGER trg_doctors_updated_at
  BEFORE UPDATE ON doctors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- DOCTOR AVAILABILITY
-- ============================================================

CREATE TABLE doctor_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_duration_minutes INTEGER DEFAULT 30 CHECK (slot_duration_minutes > 0),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(doctor_id, day_of_week, start_time)
);

CREATE INDEX idx_availability_doctor ON doctor_availability(doctor_id);
CREATE INDEX idx_availability_day ON doctor_availability(day_of_week);

-- ============================================================
-- APPOINTMENTS
-- ============================================================

CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES profiles(id),
  doctor_id UUID NOT NULL REFERENCES doctors(id),
  facility_id UUID REFERENCES healthcare_facilities(id),
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  consultation_type consultation_type NOT NULL DEFAULT 'IN_PERSON',
  status appointment_status NOT NULL DEFAULT 'REQUESTED',
  reason TEXT CHECK (char_length(reason) <= 1000),
  notes TEXT CHECK (char_length(notes) <= 2000),
  is_demo BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(doctor_id, appointment_date, appointment_time)
);

CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);

CREATE TRIGGER trg_appointments_updated_at
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
  actor_id UUID REFERENCES profiles(id),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_apt_status_history_apt ON appointment_status_history(appointment_id);

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
  data JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

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
  color TEXT,
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_first_aid_cats_updated_at
  BEFORE UPDATE ON first_aid_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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
  call_emergency_when_ar TEXT,
  call_emergency_when_fr TEXT,
  call_emergency_when_en TEXT,
  do_not_do_ar TEXT,
  do_not_do_fr TEXT,
  do_not_do_en TEXT,
  source TEXT,
  version INTEGER DEFAULT 1,
  review_status guide_review_status DEFAULT 'PENDING_REVIEW',
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  is_published BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_first_aid_guides_category ON first_aid_guides(category_id);
CREATE INDEX idx_first_aid_guides_slug ON first_aid_guides(slug);
CREATE INDEX idx_first_aid_guides_published ON first_aid_guides(is_published);

CREATE TRIGGER trg_first_aid_guides_updated_at
  BEFORE UPDATE ON first_aid_guides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- FIRST AID STEPS
-- ============================================================

CREATE TABLE first_aid_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guide_id UUID NOT NULL REFERENCES first_aid_guides(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  text_ar TEXT NOT NULL,
  text_fr TEXT,
  text_en TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(guide_id, step_number)
);

CREATE INDEX idx_first_aid_steps_guide ON first_aid_steps(guide_id);

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

CREATE INDEX idx_saved_guides_user ON saved_first_aid_guides(user_id);

-- ============================================================
-- AUDIT LOGS
-- ============================================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES profiles(id),
  actor_role user_role,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- ============================================================
-- ADMIN NOTES
-- ============================================================

CREATE TABLE admin_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity TEXT NOT NULL,
  entity_id UUID NOT NULL,
  note TEXT NOT NULL,
  admin_id UUID NOT NULL REFERENCES profiles(id),
  is_internal BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_admin_notes_entity ON admin_notes(entity, entity_id);

-- ============================================================
-- SYSTEM SETTINGS
-- ============================================================

CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  updated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_system_settings_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- DEFAULT SYSTEM SETTINGS
-- ============================================================

INSERT INTO system_settings (key, value, description, is_public) VALUES
  ('demo_mode_enabled', 'true', 'Enable demo/simulation mode', true),
  ('emergency_dispatch_provider', 'mock', 'Active emergency dispatch provider', false),
  ('email_provider', 'log', 'Active email provider', false),
  ('sms_provider', 'log', 'Active SMS provider', false),
  ('push_provider', 'log', 'Active push provider', false),
  ('max_reports_per_day', '5', 'Max emergency reports per user per day', false),
  ('max_media_size_mb', '10', 'Max file size for media uploads in MB', true),
  ('app_version', '1.0.0', 'Current application version', true);
