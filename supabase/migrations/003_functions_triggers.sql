-- ============================================================
-- SIHALINK Functions and Triggers
-- Migration 003
-- ============================================================

-- ============================================================
-- Auto-create profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, preferred_language)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'ar')
  );

  -- Create default notification preferences
  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- Generate unique report number
-- ============================================================
CREATE OR REPLACE FUNCTION generate_report_number()
RETURNS TRIGGER AS $$
DECLARE
  seq_val BIGINT;
BEGIN
  seq_val := nextval('emergency_report_seq');
  NEW.report_number := 'SH-' || TO_CHAR(NOW(),'YYYY') || '-' || LPAD(seq_val::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop default and use trigger instead
ALTER TABLE emergency_reports ALTER COLUMN report_number DROP DEFAULT;

CREATE TRIGGER set_report_number
  BEFORE INSERT ON emergency_reports
  FOR EACH ROW EXECUTE FUNCTION generate_report_number();

-- ============================================================
-- Log status changes to history
-- ============================================================
CREATE OR REPLACE FUNCTION log_report_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO report_status_history (report_id, from_status, to_status)
    VALUES (NEW.id, OLD.status, NEW.status);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_report_status_change
  AFTER UPDATE ON emergency_reports
  FOR EACH ROW EXECUTE FUNCTION log_report_status_change();

-- ============================================================
-- Log appointment status changes
-- ============================================================
CREATE OR REPLACE FUNCTION log_appointment_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO appointment_status_history (appointment_id, from_status, to_status)
    VALUES (NEW.id, OLD.status, NEW.status);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_appointment_status_change
  AFTER UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION log_appointment_status_change();

-- ============================================================
-- Validate report status transitions
-- ============================================================
CREATE OR REPLACE FUNCTION validate_report_status_transition()
RETURNS TRIGGER AS $$
DECLARE
  valid_transitions JSONB := '{
    "DRAFT": ["SUBMITTED","CANCELLED"],
    "SUBMITTED": ["RECEIVED","CANCELLED","REJECTED"],
    "RECEIVED": ["UNDER_REVIEW","ASSIGNED"],
    "UNDER_REVIEW": ["ASSIGNED","REJECTED","FALSE_REPORT_REVIEW"],
    "ASSIGNED": ["ACKNOWLEDGED","UNDER_REVIEW"],
    "ACKNOWLEDGED": ["IN_PROGRESS","ASSIGNED"],
    "IN_PROGRESS": ["RESOLVED","ACKNOWLEDGED"],
    "RESOLVED": ["CLOSED","IN_PROGRESS"],
    "CANCELLED": ["CLOSED"],
    "REJECTED": ["CLOSED","UNDER_REVIEW"],
    "FALSE_REPORT_REVIEW": ["REJECTED","UNDER_REVIEW","CLOSED"],
    "CLOSED": []
  }'::JSONB;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    IF NOT (valid_transitions->OLD.status::TEXT) @> to_jsonb(NEW.status::TEXT) THEN
      RAISE EXCEPTION 'Invalid status transition from % to %', OLD.status, NEW.status;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_report_status_transition
  BEFORE UPDATE ON emergency_reports
  FOR EACH ROW EXECUTE FUNCTION validate_report_status_transition();

-- ============================================================
-- Prevent double appointment booking
-- ============================================================
CREATE OR REPLACE FUNCTION check_appointment_conflict()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM appointments
    WHERE doctor_id = NEW.doctor_id
      AND appointment_date = NEW.appointment_date
      AND id != COALESCE(NEW.id, uuid_generate_v4())
      AND status NOT IN ('CANCELLED_BY_USER','CANCELLED_BY_DOCTOR','NO_SHOW')
      AND (
        (NEW.start_time >= start_time AND NEW.start_time < end_time) OR
        (NEW.end_time > start_time AND NEW.end_time <= end_time) OR
        (NEW.start_time <= start_time AND NEW.end_time >= end_time)
      )
  ) THEN
    RAISE EXCEPTION 'Appointment time conflicts with existing booking';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_double_booking
  BEFORE INSERT OR UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION check_appointment_conflict();
