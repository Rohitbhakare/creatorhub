-- ─── Booking Intents (BOOK-FR-007 — 10-min hold) ────────────────────────────
--
-- Scarcity-protecting hold so a user reviewing the pay screen doesn't lose the
-- last seat to a parallel buyer mid-Razorpay-launch. Each intent reserves N
-- spots for at most 10 minutes; on consume → state='consumed' (and the
-- corresponding scheduled_dates.spots_booked / event_occurrences.spots_booked
-- increments via createBooking). On user back/exit → state='released'. A 60s
-- sweeper marks 'expired' once expires_at is in the past.
--
-- Capacity check: held + confirmed seats must be ≤ capacity. Itinerary
-- (digital good) intents skip the capacity check entirely.

CREATE TABLE booking_intents (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_id           uuid NOT NULL REFERENCES content(id) ON DELETE CASCADE,

  -- Exactly one of these is non-null (itinerary intents leave both null).
  scheduled_date_id    uuid REFERENCES scheduled_dates(id) ON DELETE CASCADE,
  event_occurrence_id  uuid REFERENCES event_occurrences(content_id) ON DELETE CASCADE,

  travellers           smallint NOT NULL DEFAULT 1,
  state                text NOT NULL DEFAULT 'held'
                          CHECK (state IN ('held','consumed','expired','released')),
  expires_at           timestamptz NOT NULL,
  created_at           timestamptz NOT NULL DEFAULT now(),

  CHECK (travellers > 0 AND travellers <= 20),
  CHECK (
    (scheduled_date_id IS NOT NULL AND event_occurrence_id IS NULL) OR
    (scheduled_date_id IS NULL AND event_occurrence_id IS NOT NULL) OR
    (scheduled_date_id IS NULL AND event_occurrence_id IS NULL)
  )
);

-- Held-only partial indexes — we only ever scan held rows for capacity.
CREATE INDEX booking_intents_scheduled_date_held_idx
  ON booking_intents (scheduled_date_id) WHERE state = 'held';

CREATE INDEX booking_intents_event_occurrence_held_idx
  ON booking_intents (event_occurrence_id) WHERE state = 'held';

CREATE INDEX booking_intents_expires_held_idx
  ON booking_intents (expires_at) WHERE state = 'held';

CREATE INDEX booking_intents_user_idx
  ON booking_intents (user_id);
