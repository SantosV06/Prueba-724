-- A committed revision lets multi-page exports reject changes instead of silently mixing states.
CREATE TABLE IF NOT EXISTS volunteer_export_revision (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  revision BIGINT NOT NULL DEFAULT 0
);
INSERT INTO volunteer_export_revision(id) VALUES (1) ON CONFLICT DO NOTHING;
CREATE OR REPLACE FUNCTION bump_volunteer_export_revision() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  UPDATE volunteer_export_revision SET revision = revision + 1 WHERE id = 1;
  RETURN NULL;
END;
$$;
DROP TRIGGER IF EXISTS volunteer_export_revision_changed ON volunteer_requests;
CREATE TRIGGER volunteer_export_revision_changed AFTER INSERT OR UPDATE OR DELETE ON volunteer_requests
FOR EACH STATEMENT EXECUTE FUNCTION bump_volunteer_export_revision();
