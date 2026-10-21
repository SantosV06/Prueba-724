-- Datos persistentes de Proyecto Génesis (Neon / PGLite local).
CREATE TABLE IF NOT EXISTS volunteer_requests (
  id TEXT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  correo VARCHAR(254) NOT NULL,
  telefono VARCHAR(40) NOT NULL,
  mensaje TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS volunteer_requests_created_at_idx
  ON volunteer_requests (created_at DESC);

-- Límite de intentos, compartido entre instancias serverless.
-- Las claves son HMAC de IP; nunca se almacena la dirección sin cifrar.
CREATE TABLE IF NOT EXISTS request_limits (
  scope TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  hits INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (scope, key_hash)
);
