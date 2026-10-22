-- Old deployments omit totp_version and would otherwise bypass the new login.
-- Enforce the account epoch in the DB as well as in the current application.
CREATE OR REPLACE FUNCTION vne_guard_admin_session() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE account_version INTEGER; account_enabled BOOLEAN;
BEGIN
  SELECT totp_version, enabled INTO account_version, account_enabled
    FROM admin_users WHERE id = NEW.user_id FOR UPDATE;
  IF NOT FOUND OR NOT account_enabled OR NEW.totp_version <> account_version THEN
    RAISE EXCEPTION 'Administrator session security version is invalid' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER vne_admin_session_version_guard
  BEFORE INSERT OR UPDATE OF user_id, totp_version ON admin_sessions
  FOR EACH ROW EXECUTE FUNCTION vne_guard_admin_session();

CREATE OR REPLACE FUNCTION vne_revoke_factor_sessions() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM admin_sessions WHERE user_id = NEW.id;
  RETURN NEW;
END;
$$;
CREATE TRIGGER vne_admin_factor_revocation
  AFTER UPDATE OF totp_version ON admin_users
  FOR EACH ROW WHEN (OLD.totp_version IS DISTINCT FROM NEW.totp_version)
  EXECUTE FUNCTION vne_revoke_factor_sessions();
