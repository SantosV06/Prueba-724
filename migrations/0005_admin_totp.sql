-- Additive: existing accounts can enroll individually; volunteer data is unchanged.
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS totp_secret TEXT;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS totp_last_step BIGINT;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS totp_version INTEGER NOT NULL DEFAULT 0;
ALTER TABLE admin_sessions ADD COLUMN IF NOT EXISTS totp_version INTEGER NOT NULL DEFAULT 0;
CREATE TABLE IF NOT EXISTS admin_totp_pending (
  user_id TEXT PRIMARY KEY REFERENCES admin_users(id) ON DELETE CASCADE,
  encrypted_secret TEXT NOT NULL,
  credential_version TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);
CREATE TABLE IF NOT EXISTS admin_recovery_codes (
  user_id TEXT NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  PRIMARY KEY (user_id, code_hash)
);
