-- ═══════════════════════════════════════════════════════════════════
-- Migration 004: Vertical Sub-categories & User Waitlisted Verticals
-- SRS: DD-006, DD-002
-- ═══════════════════════════════════════════════════════════════════

-- ── Vertical sub-categories (DD-006) ────────────────────────────
CREATE TABLE vertical_sub_categories (
  id              text PRIMARY KEY,                   -- 'travel.trekking'
  vertical        vertical_type NOT NULL,
  slug            text NOT NULL,                      -- 'trekking'
  name            text NOT NULL,                      -- 'Trekking & Hiking'
  display_order   int NOT NULL,
  leaf_types      text[] NOT NULL,                    -- e.g. '{day_hike,multi_day,expedition}'
  active          boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (vertical, slug)
);

-- ── User waitlisted verticals (DD-002) ──────────────────────────
-- Verticals not yet launched — users express interest → notified on launch
CREATE TABLE user_waitlisted_verticals (
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vertical    text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  notified_at timestamptz,                            -- null = not yet notified
  PRIMARY KEY (user_id, vertical)
);

CREATE INDEX user_waitlisted_verticals_vertical_idx ON user_waitlisted_verticals (vertical);
