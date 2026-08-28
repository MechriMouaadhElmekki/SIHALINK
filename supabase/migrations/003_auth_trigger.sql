-- ============================================================
-- SIHALINK Auth Trigger - Migration 003
-- Auto-create profile on user registration
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role_id UUID;
BEGIN
  -- Create profile
  INSERT INTO profiles (
    id,
    email,
    first_name,
    last_name,
    preferred_language,
    account_status
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'ar'),
    'active'
  );

  -- Assign default USER role
  SELECT id INTO user_role_id FROM roles WHERE name = 'USER';
  INSERT INTO user_roles (user_id, role_id)
  VALUES (NEW.id, user_role_id);

  -- Create default notification preferences
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
