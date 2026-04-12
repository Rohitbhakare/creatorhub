-- ═══════════════════════════════════════════════════════════════════
-- Migration 003: Cities
-- SRS: DD-009
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE cities (
  id          text PRIMARY KEY,                       -- stable slug: 'in.mh.pune'
  name        text NOT NULL,                          -- 'Pune'
  state       text NOT NULL,                          -- 'Maharashtra'
  country     text NOT NULL DEFAULT 'IN',
  point       geography(POINT, 4326) NOT NULL,        -- PostGIS
  population  int,
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (name, state, country)
);

CREATE INDEX cities_point_idx ON cities USING GIST (point);
CREATE INDEX cities_name_trgm_idx ON cities USING GIN (name gin_trgm_ops);

-- FK from users → cities (deferred from 002_users.sql)
ALTER TABLE users
  ADD CONSTRAINT users_current_city_fk
  FOREIGN KEY (current_city_id) REFERENCES cities(id);
