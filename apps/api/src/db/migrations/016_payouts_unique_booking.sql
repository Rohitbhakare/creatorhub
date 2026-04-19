-- ═══════════════════════════════════════════════════════════════════
-- Migration 016: Unique constraint on payouts.booking_id (E2.12)
-- Ensures a single payout row per booking — guards against webhook
-- duplicates and races between cron + webhook release paths.
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE payouts
  ADD CONSTRAINT payouts_booking_unique UNIQUE (booking_id);
