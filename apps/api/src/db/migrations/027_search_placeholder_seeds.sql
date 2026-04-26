-- ═══════════════════════════════════════════════════════════════════
-- Migration 027: Search Placeholder Seeds (DD-015)
-- Seeds the existing search_placeholder_defaults table (mig 010) with
-- a small cold-start corpus so the rotating Discover search placeholder
-- has content before top_searches_7d builds enough volume.
-- ═══════════════════════════════════════════════════════════════════

-- Make placeholder_text idempotent so the migration can re-run cleanly.
ALTER TABLE search_placeholder_defaults
  ADD CONSTRAINT search_placeholder_defaults_text_unique UNIQUE (placeholder_text);

INSERT INTO search_placeholder_defaults (placeholder_text, priority, is_active) VALUES
  ('Spiti',                       100, true),
  ('Aarti Gokhale',                95, true),
  ('weekend trips near Pune',      90, true),
  ('Lonavla',                      85, true),
  ('solo trips',                   80, true),
  ('monsoon treks',                75, true),
  ('food trails',                  70, true),
  ('road trips Konkan',            65, true),
  ('Bangalore creators',           60, true),
  ('Coorg coffee trails',          55, true)
ON CONFLICT (placeholder_text) DO NOTHING;
