-- ═══════════════════════════════════════════════════════════════════
-- Migration 014: event_occurrences — nullable columns for draft support
-- SRS: CRT-FR-013, DD-025
-- ═══════════════════════════════════════════════════════════════════
--
-- Events are created as drafts before all fields are known.
-- This migration makes event-specific columns nullable so the
-- event_occurrences row can be inserted at wizard start (content_id
-- only) and populated step-by-step as the creator fills in the wizard.
--
-- Application layer validates all fields are non-null before publish.
-- The CHECK (end_at > start_at) passes for NULL values (result = UNKNOWN).

-- ── Drop NOT NULL on event-specific columns ──────────────────────────────────
ALTER TABLE event_occurrences
  ALTER COLUMN start_at      DROP NOT NULL,
  ALTER COLUMN end_at        DROP NOT NULL,
  ALTER COLUMN venue_name    DROP NOT NULL,
  ALTER COLUMN venue_address DROP NOT NULL,
  ALTER COLUMN venue_point   DROP NOT NULL,
  ALTER COLUMN city_id       DROP NOT NULL,
  ALTER COLUMN capacity      DROP NOT NULL;

-- ── Drop and re-add capacity check as null-safe ──────────────────────────────
-- Original: CHECK (capacity > 0)
-- New: capacity IS NULL (draft) OR capacity > 0 (populated)
ALTER TABLE event_occurrences
  DROP CONSTRAINT IF EXISTS event_occurrences_capacity_check;

ALTER TABLE event_occurrences
  ADD CONSTRAINT event_occurrences_capacity_check
    CHECK (capacity IS NULL OR capacity > 0);

-- ── Drop and re-add spots_booked <= capacity check as null-safe ──────────────
ALTER TABLE event_occurrences
  DROP CONSTRAINT IF EXISTS event_occurrences_spots_booked_check;

ALTER TABLE event_occurrences
  ADD CONSTRAINT event_occurrences_spots_booked_check
    CHECK (
      spots_booked >= 0
      AND (capacity IS NULL OR spots_booked <= capacity)
    );

-- ── Add what_to_bring column ─────────────────────────────────────────────────
-- Stores creator-selected items (predefined suggestions + custom free text).
-- Populated via the "What to bring" drawer in the creation wizard.
ALTER TABLE event_occurrences
  ADD COLUMN IF NOT EXISTS what_to_bring TEXT[] NOT NULL DEFAULT '{}';

-- ── Drop city_id foreign key constraint to allow NULL ────────────────────────
-- Need to re-add as deferrable to allow NULL during draft
-- (PostgreSQL FK constraints are skipped for NULL values by default, so
--  the existing constraint already works — just keeping it as is.)
