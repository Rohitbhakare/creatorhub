-- ═══════════════════════════════════════════════════════════════════
-- Migration 025: users.travel_sub_categories
-- Onboarding now writes the chosen 4 sub-cats (road_trips, biking,
-- trekking, food_trails) here instead of writing verticals on the
-- legacy onboarding picker. Used for personalized ranking on home feed.
-- Idempotent.
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS travel_sub_categories text[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_users_travel_subcategories
  ON users USING GIN (travel_sub_categories);
