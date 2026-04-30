-- Migration 034 — covering indexes for 3 hot-path queries.
--
-- Source: EXPLAIN ANALYZE audit (TRACKING.md → E5.0/PERF-002).
-- Each index targets a specific query whose plan today either does a
-- Sort after filtering, or removes most rows via a non-index Filter step.
-- All three are partial indexes scoped to "published, not deleted" content
-- so they stay small (only the rows actually served on hot paths).
--
-- Reversal: `DROP INDEX <name>;` for each. No data risk; indexes are
-- additive and rebuildable.

-- ─────────────────────────────────────────────────────────────────────
-- Q1 — Feed: getPopularAcrossIndia
--   WHERE status='published' AND visibility='public' AND deleted_at IS NULL
--     AND published_at >= NOW() - INTERVAL '30 days'
--   ORDER BY like_count DESC LIMIT 20
-- ─────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS content_popular_30d_idx
  ON content (like_count DESC, published_at DESC)
  WHERE status = 'published'
    AND visibility = 'public'
    AND deleted_at IS NULL;

-- ─────────────────────────────────────────────────────────────────────
-- Q2 / Q3 — Feed near-you city match + Discover city-creators
--   WHERE status='published' AND deleted_at IS NULL AND starting_city_id = $1
--   ORDER BY published_at DESC LIMIT 20
-- ─────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS content_city_published_idx
  ON content (starting_city_id, published_at DESC)
  WHERE status = 'published'
    AND deleted_at IS NULL;

-- ─────────────────────────────────────────────────────────────────────
-- Q4 — Saved: list user's saved-lists
--   WHERE user_id = $1 ORDER BY updated_at DESC
-- ─────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS saved_lists_user_updated_idx
  ON saved_lists (user_id, updated_at DESC);

-- Refresh planner statistics so the new indexes get picked on the next
-- query without waiting for autovacuum to ANALYZE.
ANALYZE content;
ANALYZE saved_lists;
