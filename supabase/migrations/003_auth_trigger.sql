-- ============================================================
-- Auto-create profile on user signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, preferred_language)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'ar')
  );

  -- Assign default USER role
  INSERT INTO public.user_roles (user_id, role_name)
  VALUES (NEW.id, 'USER');

  -- Create default notification preferences
  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- Validate emergency report status transitions
-- ============================================================
CREATE OR REPLACE FUNCTION public.validate_report_status_transition()
RETURNS TRIGGER AS $$
DECLARE
  valid_transitions JSONB := '{
    "DRAFT": ["SUBMITTED", "CANCELLED"],
    "SUBMITTED": ["RECEIVED", "CANCELLED", "REJECTED"],
    "RECEIVED": ["UNDER_REVIEW", "ASSIGNED"],
    "UNDER_REVIEW": ["ASSIGNED", "REJECTED", "FALSE_REPORT_REVIEW"],
    "ASSIGNED": ["ACKNOWLEDGED", "IN_PROGRESS"],
    "ACKNOWLEDGED": ["IN_PROGRESS"],
    "IN_PROGRESS": ["RESOLVED"],
    "RESOLVED": ["CLOSED"],
    "CANCELLED": [],
    "REJECTED": ["CLOSED"],
    "FALSE_REPORT_REVIEW": ["REJECTED", "UNDER_REVIEW"],
    "CLOSED": []
  }'::JSONB;
  allowed TEXT[];
BEGIN
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  SELECT ARRAY(
    SELECT jsonb_array_elements_text(valid_transitions->OLD.status)
  ) INTO allowed;

  IF NOT (NEW.status = ANY(allowed)) THEN
    RAISE EXCEPTION 'Invalid status transition from % to %', OLD.status, NEW.status;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_report_status
  BEFORE UPDATE OF status ON public.emergency_reports
  FOR EACH ROW EXECUTE FUNCTION public.validate_report_status_transition();

-- ============================================================
-- Auto log report status changes
-- ============================================================
CREATE OR REPLACE FUNCTION public.log_report_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status <> NEW.status THEN
    INSERT INTO public.report_status_history (report_id, from_status, to_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());

    INSERT INTO public.emergency_report_events (report_id, event_type, description, actor_id)
    VALUES (NEW.id, 'STATUS_CHANGED', 'Status changed from ' || OLD.status || ' to ' || NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER log_report_status_changes
  AFTER UPDATE OF status ON public.emergency_reports
  FOR EACH ROW EXECUTE FUNCTION public.log_report_status_change();
