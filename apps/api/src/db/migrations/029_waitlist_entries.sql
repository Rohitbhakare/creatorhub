-- ─── Waitlist Entries (BOOK-FR-009) ─────────────────────────────────────────
--
-- When a scheduled_dates row or event_occurrences row hits capacity, the
-- date / RSVP card switches to "Join waitlist". On cancel/refund we surface
-- a single FIFO entry per opening with a 24h WhatsApp + push nudge. There
-- is no auto-rebooking — the buyer must come back and pay.

CREATE TABLE IF NOT EXISTS waitlist_entries (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_id           uuid NOT NULL REFERENCES content(id) ON DELETE CASCADE,

  -- Exactly one of these is non-null.
  scheduled_date_id    uuid REFERENCES scheduled_dates(id) ON DELETE CASCADE,
  event_occurrence_id  uuid REFERENCES event_occurrences(content_id) ON DELETE CASCADE,

  notified_at          timestamptz,
  created_at           timestamptz NOT NULL DEFAULT now(),

  CHECK (
    (scheduled_date_id IS NOT NULL AND event_occurrence_id IS NULL) OR
    (scheduled_date_id IS NULL AND event_occurrence_id IS NOT NULL)
  )
);

-- Idempotency: same user joins each opening at most once.
CREATE UNIQUE INDEX IF NOT EXISTS waitlist_unique_user_scheduled_date
  ON waitlist_entries (user_id, scheduled_date_id)
  WHERE scheduled_date_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS waitlist_unique_user_event_occurrence
  ON waitlist_entries (user_id, event_occurrence_id)
  WHERE event_occurrence_id IS NOT NULL;

-- Active waitlist lookups by opening (FIFO ordering by created_at).
CREATE INDEX IF NOT EXISTS waitlist_scheduled_date_active_idx
  ON waitlist_entries (scheduled_date_id, created_at)
  WHERE notified_at IS NULL AND scheduled_date_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS waitlist_event_occurrence_active_idx
  ON waitlist_entries (event_occurrence_id, created_at)
  WHERE notified_at IS NULL AND event_occurrence_id IS NOT NULL;

-- "My waitlist" lookups.
CREATE INDEX IF NOT EXISTS waitlist_user_idx ON waitlist_entries (user_id);
