-- Base D1 de Fundación VNE.
-- En un proyecto nuevo:
--   npx wrangler d1 execute vne --file=schema.sql
-- Si la tabla ya existe sin la columna fecha:
--   ALTER TABLE voluntarios ADD COLUMN fecha TEXT;

CREATE TABLE IF NOT EXISTS voluntarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  correo TEXT NOT NULL,
  telefono TEXT NOT NULL,
  fecha TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_voluntarios_fecha ON voluntarios (id DESC);
