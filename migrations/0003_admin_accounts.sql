-- Preserve volunteer data; invalidate legacy shared-password sessions once.
CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE CHECK (username = lower(username)),
  display_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin')),
  enabled BOOLEAN NOT NULL DEFAULT true,
  bootstrap_key BOOLEAN UNIQUE CHECK (bootstrap_key IS NULL OR bootstrap_key = true),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
DELETE FROM admin_sessions;
ALTER TABLE admin_sessions ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES admin_users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS admin_sessions_user_idx ON admin_sessions(user_id);
ALTER TABLE admin_events ADD COLUMN IF NOT EXISTS actor_id TEXT;
ALTER TABLE admin_events ADD COLUMN IF NOT EXISTS actor_username TEXT;
ALTER TABLE admin_events ADD COLUMN IF NOT EXISTS before_value JSONB;
ALTER TABLE admin_events ADD COLUMN IF NOT EXISTS after_value JSONB;
CREATE INDEX IF NOT EXISTS volunteer_requests_trash_idx ON volunteer_requests(created_at DESC, id DESC) WHERE deleted_at IS NOT NULL;
