-- ═══════════════════════════════════════════════════════════════════
-- Migration 013: Add lat/lng float columns to cities
-- Why: PostgREST cannot call ST_X/ST_Y in select; adding denormalized
--      float columns lets the API read coordinates without raw SQL.
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE cities
  ADD COLUMN IF NOT EXISTS lat double precision,
  ADD COLUMN IF NOT EXISTS lng double precision;

-- Populate from existing PostGIS geography column
UPDATE cities SET
  lat = ST_Y(point::geometry),
  lng = ST_X(point::geometry)
WHERE lat IS NULL OR lng IS NULL;

-- Enforce NOT NULL going forward
ALTER TABLE cities
  ALTER COLUMN lat SET NOT NULL,
  ALTER COLUMN lng SET NOT NULL;

-- ── update_user_city: sync city + location point atomically ─────
CREATE OR REPLACE FUNCTION update_user_city(
  p_user_id uuid,
  p_city_id text,
  p_lat     double precision,
  p_lng     double precision
)
RETURNS void
LANGUAGE sql
AS $$
  UPDATE users SET
    current_city_id        = p_city_id,
    current_location_point = ST_MakePoint(p_lng, p_lat)::geography
  WHERE id = p_user_id;
$$;

-- ── Feed: near-you waterfall function ───────────────────────────
-- Runs the nearest-neighbor cascade (DISC-FR-027) server-side.
-- Returns content rows + the fallback level used:
--   0 = exact city match
--   1 = 200 km radius
--   2 = 500 km radius
--   3 = India-wide popular
CREATE OR REPLACE FUNCTION feed_near_you(
  p_city_id   text,
  p_lat       double precision,
  p_lng       double precision,
  p_limit     int DEFAULT 20
)
RETURNS TABLE (
  id                uuid,
  type              content_type,
  title             text,
  vertical          vertical_type,
  pricing_model     text,
  price_paisa       bigint,
  like_count        int,
  starting_city_id  text,
  user_id           uuid,
  fallback_level    int
)
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  v_count int;
BEGIN
  -- Level 0: exact city match
  RETURN QUERY
    SELECT c.id, c.type, c.title, c.vertical, c.pricing_model,
           c.price_paisa, c.like_count, c.starting_city_id, c.user_id, 0
    FROM content c
    WHERE c.status      = 'published'
      AND c.visibility  = 'public'
      AND c.deleted_at  IS NULL
      AND c.starting_city_id = p_city_id
    ORDER BY c.like_count DESC, c.published_at DESC
    LIMIT p_limit;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count >= 5 THEN RETURN; END IF;

  -- Level 1: 200 km radius
  RETURN QUERY
    SELECT c.id, c.type, c.title, c.vertical, c.pricing_model,
           c.price_paisa, c.like_count, c.starting_city_id, c.user_id, 1
    FROM content c
    WHERE c.status      = 'published'
      AND c.visibility  = 'public'
      AND c.deleted_at  IS NULL
      AND c.starting_city_point IS NOT NULL
      AND ST_DWithin(
            c.starting_city_point,
            ST_MakePoint(p_lng, p_lat)::geography,
            200000   -- 200 km in meters
          )
    ORDER BY c.like_count DESC, c.published_at DESC
    LIMIT p_limit;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count >= 5 THEN RETURN; END IF;

  -- Level 2: 500 km radius
  RETURN QUERY
    SELECT c.id, c.type, c.title, c.vertical, c.pricing_model,
           c.price_paisa, c.like_count, c.starting_city_id, c.user_id, 2
    FROM content c
    WHERE c.status      = 'published'
      AND c.visibility  = 'public'
      AND c.deleted_at  IS NULL
      AND c.starting_city_point IS NOT NULL
      AND ST_DWithin(
            c.starting_city_point,
            ST_MakePoint(p_lng, p_lat)::geography,
            500000   -- 500 km in meters
          )
    ORDER BY c.like_count DESC, c.published_at DESC
    LIMIT p_limit;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count >= 5 THEN RETURN; END IF;

  -- Level 3: India-wide popular
  RETURN QUERY
    SELECT c.id, c.type, c.title, c.vertical, c.pricing_model,
           c.price_paisa, c.like_count, c.starting_city_id, c.user_id, 3
    FROM content c
    WHERE c.status     = 'published'
      AND c.visibility = 'public'
      AND c.deleted_at IS NULL
    ORDER BY c.like_count DESC, c.published_at DESC
    LIMIT p_limit;
END;
$$;
