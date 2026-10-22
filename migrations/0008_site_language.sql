CREATE TABLE site_language (
  id integer PRIMARY KEY CHECK (id = 1),
  language text NOT NULL DEFAULT 'es' CHECK (language IN ('es', 'en', 'pt')),
  revision integer NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT NOW()
);
INSERT INTO site_language(id) VALUES(1);
