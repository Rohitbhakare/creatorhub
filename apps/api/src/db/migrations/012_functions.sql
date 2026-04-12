-- ═══════════════════════════════════════════════════════════════════
-- Migration 012: Database Utility Functions
-- SRS: DD-009 (geo), §5 (search)
-- ═══════════════════════════════════════════════════════════════════

-- ── nearby_content(lat, lng, radius_km) ─────────────────────────
-- Returns published content within radius_km of a given point.
-- Uses ST_DWithin for index-backed spatial queries.
-- Note: ST_DWithin uses meters for geography type, so we convert km → m.
CREATE OR REPLACE FUNCTION nearby_content(
  p_lat double precision,
  p_lng double precision,
  p_radius_km double precision DEFAULT 50,
  p_limit int DEFAULT 20,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  type content_type,
  title text,
  vertical vertical_type,
  starting_city_id text,
  user_id uuid,
  price_paisa bigint,
  like_count int,
  distance_meters double precision
)
LANGUAGE sql STABLE
AS $$
  SELECT
    c.id,
    c.type,
    c.title,
    c.vertical,
    c.starting_city_id,
    c.user_id,
    c.price_paisa,
    c.like_count,
    ST_Distance(
      c.starting_city_point,
      ST_MakePoint(p_lng, p_lat)::geography
    ) AS distance_meters
  FROM content c
  WHERE c.status = 'published'
    AND c.visibility = 'public'
    AND c.deleted_at IS NULL
    AND c.starting_city_point IS NOT NULL
    AND ST_DWithin(
      c.starting_city_point,
      ST_MakePoint(p_lng, p_lat)::geography,
      p_radius_km * 1000                                -- km → meters
    )
  ORDER BY distance_meters ASC
  LIMIT p_limit
  OFFSET p_offset;
$$;

-- ── search_content(query) ───────────────────────────────────────
-- Full-text search using tsvector with ranking.
-- Returns empty set for empty/null queries.
CREATE OR REPLACE FUNCTION search_content(
  p_query text,
  p_vertical vertical_type DEFAULT NULL,
  p_type content_type DEFAULT NULL,
  p_limit int DEFAULT 20,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  type content_type,
  title text,
  vertical vertical_type,
  starting_city_id text,
  user_id uuid,
  price_paisa bigint,
  like_count int,
  rank real
)
LANGUAGE sql STABLE
AS $$
  SELECT
    c.id,
    c.type,
    c.title,
    c.vertical,
    c.starting_city_id,
    c.user_id,
    c.price_paisa,
    c.like_count,
    ts_rank(c.search_vector, websearch_to_tsquery('english', p_query)) AS rank
  FROM content c
  WHERE c.status = 'published'
    AND c.visibility = 'public'
    AND c.deleted_at IS NULL
    AND p_query IS NOT NULL
    AND char_length(trim(p_query)) > 0
    AND c.search_vector @@ websearch_to_tsquery('english', p_query)
    AND (p_vertical IS NULL OR c.vertical = p_vertical)
    AND (p_type IS NULL OR c.type = p_type)
  ORDER BY rank DESC, c.published_at DESC
  LIMIT p_limit
  OFFSET p_offset;
$$;

-- ── get_vertical_creator_counts() ───────────────────────────────
-- Returns count of creators per vertical (for onboarding/discovery).
CREATE OR REPLACE FUNCTION get_vertical_creator_counts()
RETURNS TABLE (
  vertical vertical_type,
  creator_count bigint
)
LANGUAGE sql STABLE
AS $$
  SELECT
    uav.vertical,
    COUNT(DISTINCT uav.user_id) AS creator_count
  FROM user_active_verticals uav
  JOIN users u ON u.id = uav.user_id
  WHERE u.is_creator = true
  GROUP BY uav.vertical
  ORDER BY creator_count DESC;
$$;

-- ── nearby_cities(lat, lng, radius_km) ──────────────────────────
-- Returns cities within radius, ordered by distance.
CREATE OR REPLACE FUNCTION nearby_cities(
  p_lat double precision,
  p_lng double precision,
  p_radius_km double precision DEFAULT 100,
  p_limit int DEFAULT 10
)
RETURNS TABLE (
  id text,
  name text,
  state text,
  distance_meters double precision
)
LANGUAGE sql STABLE
AS $$
  SELECT
    c.id,
    c.name,
    c.state,
    ST_Distance(
      c.point,
      ST_MakePoint(p_lng, p_lat)::geography
    ) AS distance_meters
  FROM cities c
  WHERE c.active = true
    AND ST_DWithin(
      c.point,
      ST_MakePoint(p_lng, p_lat)::geography,
      p_radius_km * 1000
    )
  ORDER BY distance_meters ASC
  LIMIT p_limit;
$$;

-- ── increment_count() ───────────────────────────────────────────
-- Generic helper to atomically increment denormalized counters.
-- Usage: SELECT increment_count('content', id, 'like_count', 1);
CREATE OR REPLACE FUNCTION increment_count(
  p_table text,
  p_id uuid,
  p_column text,
  p_delta int DEFAULT 1
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  EXECUTE format(
    'UPDATE %I SET %I = GREATEST(%I + $1, 0) WHERE id = $2',
    p_table, p_column, p_column
  )
  USING p_delta, p_id;
END;
$$;

-- ── refresh_top_searches() ──────────────────────────────────────
-- Refreshes the materialized view. Call via pg_cron or application.
CREATE OR REPLACE FUNCTION refresh_top_searches()
RETURNS void
LANGUAGE sql
AS $$
  REFRESH MATERIALIZED VIEW CONCURRENTLY top_searches_7d;
$$;
