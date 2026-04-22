-- ═══════════════════════════════════════════════════════════════════
-- Migration 019: Search Analytics RPCs (E4.1, T10 · ADM-FR-010)
-- Adds parameterized aggregates over `search_queries` for the admin
-- analytics dashboard. Windows are caller-supplied (7 / 30 days) so
-- the admin app can flip between ranges without a materialized view
-- per window.
-- ═══════════════════════════════════════════════════════════════════

-- ── search_top_queries(days, max_rows) ──────────────────────────
-- Top normalized queries by search volume within the window.
-- Filters out noise (<3 chars, phone-number-shaped queries) so the
-- dashboard doesn't fill with single-letter garbage.
CREATE OR REPLACE FUNCTION search_top_queries(
  p_days int DEFAULT 7,
  p_limit int DEFAULT 50
)
RETURNS TABLE (
  query text,
  search_count bigint,
  unique_users bigint,
  zero_result_count bigint
)
LANGUAGE sql STABLE
AS $$
  SELECT
    normalized_query AS query,
    COUNT(*)                                   AS search_count,
    COUNT(DISTINCT user_id)                    AS unique_users,
    COUNT(*) FILTER (WHERE result_count = 0)   AS zero_result_count
  FROM search_queries
  WHERE created_at > now() - make_interval(days => p_days)
    AND char_length(normalized_query) >= 3
    AND normalized_query !~ '@|\+91|\d{6,}'
  GROUP BY normalized_query
  ORDER BY search_count DESC
  LIMIT p_limit;
$$;

-- ── search_zero_results(days, max_rows) ─────────────────────────
-- Queries that returned no hits — prioritized by frequency so the
-- operations team can spot content gaps or synonym needs.
CREATE OR REPLACE FUNCTION search_zero_results(
  p_days int DEFAULT 7,
  p_limit int DEFAULT 50
)
RETURNS TABLE (
  query text,
  hits bigint,
  last_seen timestamptz
)
LANGUAGE sql STABLE
AS $$
  SELECT
    normalized_query AS query,
    COUNT(*)         AS hits,
    MAX(created_at)  AS last_seen
  FROM search_queries
  WHERE created_at > now() - make_interval(days => p_days)
    AND result_count = 0
    AND char_length(normalized_query) >= 3
    AND normalized_query !~ '@|\+91|\d{6,}'
  GROUP BY normalized_query
  ORDER BY hits DESC
  LIMIT p_limit;
$$;

-- ── search_click_through(days, max_rows) ────────────────────────
-- Click-through rate by query. Clicks are counted by non-null
-- clicked_at. CTR is expressed as an integer percentage (0–100) so
-- the admin UI can render it directly.
CREATE OR REPLACE FUNCTION search_click_through(
  p_days int DEFAULT 7,
  p_limit int DEFAULT 50
)
RETURNS TABLE (
  query text,
  searches bigint,
  clicks bigint,
  ctr_pct int
)
LANGUAGE sql STABLE
AS $$
  SELECT
    normalized_query                                                    AS query,
    COUNT(*)                                                            AS searches,
    COUNT(*) FILTER (WHERE clicked_at IS NOT NULL)                      AS clicks,
    CASE
      WHEN COUNT(*) = 0 THEN 0
      ELSE ROUND(
        100.0 * COUNT(*) FILTER (WHERE clicked_at IS NOT NULL) / COUNT(*)
      )::int
    END                                                                 AS ctr_pct
  FROM search_queries
  WHERE created_at > now() - make_interval(days => p_days)
    AND char_length(normalized_query) >= 3
    AND normalized_query !~ '@|\+91|\d{6,}'
  GROUP BY normalized_query
  HAVING COUNT(*) >= 3                 -- hide single-search noise
  ORDER BY searches DESC
  LIMIT p_limit;
$$;
