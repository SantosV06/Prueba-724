-- Additive migration: existing requests remain intact and pending.
ALTER TABLE volunteer_requests ADD COLUMN IF NOT EXISTS request_key TEXT;
ALTER TABLE volunteer_requests ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pendiente';
ALTER TABLE volunteer_requests ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
CREATE UNIQUE INDEX IF NOT EXISTS volunteer_requests_request_key_idx ON volunteer_requests(request_key);
CREATE INDEX IF NOT EXISTS volunteer_requests_active_idx ON volunteer_requests(created_at DESC, id DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS request_limits_started_at_idx ON request_limits(started_at);
CREATE TABLE IF NOT EXISTS admin_sessions (
  token_hash TEXT PRIMARY KEY,
  credential_version TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS admin_sessions_expires_at_idx ON admin_sessions(expires_at);
CREATE TABLE IF NOT EXISTS admin_events (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  request_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS admin_events_created_at_idx ON admin_events(created_at DESC);
