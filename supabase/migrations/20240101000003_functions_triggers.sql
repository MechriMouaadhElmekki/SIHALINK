-- ============================================================
-- SIHALINK - Functions and Triggers
-- Migration 003
-- ============================================================

-- ============================================================
-- Auto-create profile on auth.users insert
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, preferred_language)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'ar')
  )
  ON CONFLICT (id) DO NOTHING;

  -- Assign default USER role
  INSERT INTO public.user_roles (user_id, role_id)
  SELECT NEW.id, r.id FROM public.roles r WHERE r.name = 'USER'
  ON CONFLICT (user_id, role_id) DO NOTHING;

  -- Create default notification preferences
  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- Report number auto-generation trigger
-- ============================================================
CREATE OR REPLACE FUNCTION set_report_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.report_number IS NULL OR NEW.report_number = '' THEN
    NEW.report_number := generate_report_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_report_number_trigger
  BEFORE INSERT ON emergency_reports
  FOR EACH ROW EXECUTE FUNCTION set_report_number();

-- ============================================================
-- Audit log helper function
-- ============================================================
CREATE OR REPLACE FUNCTION create_audit_log(
  p_actor_id UUID,
  p_actor_role TEXT,
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS void AS $$
BEGIN
  INSERT INTO audit_logs (
    actor_id, actor_role, action, entity_type, entity_id,
    old_values, new_values, metadata
  ) VALUES (
    p_actor_id, p_actor_role, p_action, p_entity_type, p_entity_id,
    p_old_values, p_new_values, p_metadata
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Emergency report state machine validator
-- ============================================================
CREATE OR REPLACE FUNCTION validate_status_transition(
  from_status TEXT,
  to_status TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Define valid transitions
  RETURN CASE
    WHEN from_status = 'DRAFT' AND to_status IN ('SUBMITTED', 'CANCELLED') THEN TRUE
    WHEN from_status = 'SUBMITTED' AND to_status IN ('RECEIVED', 'CANCELLED', 'REJECTED') THEN TRUE
    WHEN from_status = 'RECEIVED' AND to_status IN ('UNDER_REVIEW', 'ASSIGNED', 'REJECTED') THEN TRUE
    WHEN from_status = 'UNDER_REVIEW' AND to_status IN ('ASSIGNED', 'REJECTED', 'FALSE_REPORT_REVIEW') THEN TRUE
    WHEN from_status = 'ASSIGNED' AND to_status IN ('ACKNOWLEDGED', 'REASSIGNED', 'CANCELLED') THEN TRUE
    WHEN from_status = 'ACKNOWLEDGED' AND to_status IN ('IN_PROGRESS', 'CANCELLED') THEN TRUE
    WHEN from_status = 'IN_PROGRESS' AND to_status IN ('RESOLVED', 'FALSE_REPORT_REVIEW') THEN TRUE
    WHEN from_status = 'RESOLVED' AND to_status IN ('CLOSED', 'FALSE_REPORT_REVIEW') THEN TRUE
    WHEN from_status = 'FALSE_REPORT_REVIEW' AND to_status IN ('CLOSED', 'REJECTED') THEN TRUE
    WHEN from_status = 'CANCELLED' AND to_status IN ('CLOSED') THEN TRUE
    WHEN from_status = 'REJECTED' AND to_status IN ('CLOSED') THEN TRUE
    ELSE FALSE
  END;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Auto-create report event on status change
-- ============================================================
CREATE OR REPLACE FUNCTION record_report_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status != NEW.status THEN
    INSERT INTO report_status_history (report_id, from_status, to_status)
    VALUES (NEW.id, OLD.status, NEW.status);

    INSERT INTO emergency_report_events (report_id, event_type, description, is_visible_to_user)
    VALUES (
      NEW.id,
      'STATUS_CHANGED',
      'Status changed from ' || OLD.status || ' to ' || NEW.status,
      CASE WHEN NEW.status IN ('SUBMITTED','RECEIVED','IN_PROGRESS','RESOLVED','CANCELLED','CLOSED')
           THEN TRUE ELSE FALSE END
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER record_report_status_change_trigger
  AFTER UPDATE ON emergency_reports
  FOR EACH ROW EXECUTE FUNCTION record_report_status_change();

-- ============================================================
-- Get user roles as array
-- ============================================================
CREATE OR REPLACE FUNCTION get_user_roles(p_user_id UUID)
RETURNS TEXT[] AS $$
BEGIN
  RETURN ARRAY(
    SELECT r.name FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================
-- Analytics: reports per day
-- ============================================================
CREATE OR REPLACE FUNCTION get_reports_stats(
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  date DATE,
  total BIGINT,
  critical BIGINT,
  high BIGINT,
  medium BIGINT,
  low_count BIGINT,
  resolved BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE(created_at) as date,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE priority = 'CRITICAL') as critical,
    COUNT(*) FILTER (WHERE priority = 'HIGH') as high,
    COUNT(*) FILTER (WHERE priority = 'MEDIUM') as medium,
    COUNT(*) FILTER (WHERE priority = 'LOW') as low_count,
    COUNT(*) FILTER (WHERE status = 'RESOLVED') as resolved
  FROM emergency_reports
  WHERE created_at >= NOW() - INTERVAL '1 day' * p_days
    AND is_demo = FALSE
  GROUP BY DATE(created_at)
  ORDER BY date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
