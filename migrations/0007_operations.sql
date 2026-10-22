-- Additive only: no volunteer data or existing credentials are removed.
CREATE TABLE admin_policy (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  require_two_factor BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO admin_policy(id) VALUES (1);
CREATE INDEX admin_events_cursor_idx ON admin_events(created_at DESC, id DESC);
CREATE INDEX admin_events_actor_idx ON admin_events(actor_username, created_at DESC, id DESC);
CREATE TABLE site_content (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  content JSONB NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
