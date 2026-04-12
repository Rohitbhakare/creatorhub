-- ═══════════════════════════════════════════════════════════════════
-- Migration 013: Place Cache + Itinerary Helper Functions
-- Caches Google Places API responses to reduce external calls.
-- Adds PostGIS helper functions for itinerary spot operations.
-- ═══════════════════════════════════════════════════════════════════

-- ── Place cache ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS place_cache (
  place_id          text PRIMARY KEY,
  name              text NOT NULL,
  formatted_address text,
  lat               double precision NOT NULL,
  lng               double precision NOT NULL,
  rating            numeric(2,1),
  photos            jsonb DEFAULT '[]'::jsonb,
  types             text[] DEFAULT '{}',
  fetched_at        timestamptz NOT NULL DEFAULT now()
);

-- ── Insert itinerary spot with PostGIS point ────────────────────
CREATE OR REPLACE FUNCTION insert_itinerary_spot(
  p_itinerary_day_id uuid,
  p_spot_order       int,
  p_google_place_id  text,
  p_name             text,
  p_category         text,
  p_lng              double precision,
  p_lat              double precision,
  p_thumbnail_url    text,
  p_creator_note     text,
  p_duration_minutes int,
  p_stop_type        spot_stop_type,
  p_is_free_preview  boolean
)
RETURNS SETOF itinerary_spots
LANGUAGE sql
AS $$
  INSERT INTO itinerary_spots (
    itinerary_day_id, spot_order, google_place_id, name, category,
    point, thumbnail_url, creator_note, duration_minutes,
    stop_type, is_free_preview
  ) VALUES (
    p_itinerary_day_id, p_spot_order, p_google_place_id, p_name, p_category,
    ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
    p_thumbnail_url, p_creator_note, p_duration_minutes,
    p_stop_type, p_is_free_preview
  )
  RETURNING *;
$$;

-- ── Extract coordinates from spot geography column ──────────────
CREATE OR REPLACE FUNCTION extract_spot_coords(spot_ids uuid[])
RETURNS TABLE(id uuid, lat double precision, lng double precision)
LANGUAGE sql STABLE
AS $$
  SELECT
    s.id,
    ST_Y(s.point::geometry) AS lat,
    ST_X(s.point::geometry) AS lng
  FROM itinerary_spots s
  WHERE s.id = ANY(spot_ids);
$$;

-- ── Renumber itinerary days after deletion ──────────────────────
CREATE OR REPLACE FUNCTION renumber_itinerary_days(
  p_content_id       uuid,
  p_deleted_day_number int
)
RETURNS void
LANGUAGE sql
AS $$
  UPDATE itinerary_days
  SET day_number = day_number - 1
  WHERE content_id = p_content_id
    AND day_number > p_deleted_day_number;
$$;

-- ── Renumber itinerary spots after deletion ─────────────────────
CREATE OR REPLACE FUNCTION renumber_itinerary_spots(
  p_day_id        uuid,
  p_deleted_order int
)
RETURNS void
LANGUAGE sql
AS $$
  UPDATE itinerary_spots
  SET spot_order = spot_order - 1
  WHERE itinerary_day_id = p_day_id
    AND spot_order > p_deleted_order;
$$;

-- ── Compute day stats (distance + hours) ────────────────────────
-- Uses ST_Distance on consecutive spots to compute total route distance.
-- Sums duration_minutes for estimated hours.
CREATE OR REPLACE FUNCTION compute_day_stats(p_day_id uuid)
RETURNS TABLE(total_distance_km numeric, estimated_hours numeric)
LANGUAGE sql STABLE
AS $$
  WITH ordered_spots AS (
    SELECT
      point,
      duration_minutes,
      spot_order,
      LAG(point) OVER (ORDER BY spot_order) AS prev_point
    FROM itinerary_spots
    WHERE itinerary_day_id = p_day_id
    ORDER BY spot_order
  ),
  distances AS (
    SELECT
      COALESCE(SUM(
        CASE
          WHEN prev_point IS NOT NULL
          THEN ST_Distance(point, prev_point) / 1000.0
          ELSE 0
        END
      ), 0) AS total_km,
      COALESCE(SUM(COALESCE(duration_minutes, 0)), 0) AS total_minutes
    FROM ordered_spots
  )
  SELECT
    ROUND(total_km::numeric, 1) AS total_distance_km,
    ROUND((total_minutes / 60.0)::numeric, 1) AS estimated_hours
  FROM distances;
$$;
