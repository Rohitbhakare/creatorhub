-- ═══════════════════════════════════════════════════════════════════
-- Migration 006: Itinerary, Scheduled Experience & Event Tables
-- SRS: DD-021, DD-023, DD-025, CRT-FR-022
-- ═══════════════════════════════════════════════════════════════════

-- ── Itinerary days (DD-023) ─────────────────────────────────────
CREATE TABLE itinerary_days (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id        uuid NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  day_number        int NOT NULL,
  title             text,
  description       text,
  total_distance_km numeric(6,1),
  estimated_hours   numeric(4,1),
  UNIQUE (content_id, day_number)
);

-- ── Itinerary spots (DD-023) ────────────────────────────────────
CREATE TABLE itinerary_spots (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_day_id  uuid NOT NULL REFERENCES itinerary_days(id) ON DELETE CASCADE,
  spot_order        int NOT NULL,
  google_place_id   text,
  name              text NOT NULL,
  category          text,
  point             geography(POINT, 4326) NOT NULL,
  thumbnail_url     text,
  creator_note      text,
  duration_minutes  int,
  stop_type         spot_stop_type NOT NULL DEFAULT 'regular',
  is_free_preview   boolean NOT NULL DEFAULT false,      -- visible to non-buyers
  created_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (itinerary_day_id, spot_order)
);

CREATE INDEX itinerary_spots_day_idx ON itinerary_spots (itinerary_day_id, spot_order);
CREATE INDEX itinerary_spots_point_idx ON itinerary_spots USING GIST (point);

-- ── Scheduled dates (DD-021) ────────────────────────────────────
-- For scheduled_experience content type — multiple date slots per experience
CREATE TABLE scheduled_dates (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id    uuid NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  start_date    date NOT NULL,
  end_date      date NOT NULL,
  capacity      int NOT NULL CHECK (capacity > 0),
  spots_booked  int NOT NULL DEFAULT 0,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  CHECK (end_date >= start_date),
  CHECK (spots_booked >= 0 AND spots_booked <= capacity)
);

CREATE INDEX scheduled_dates_content_idx ON scheduled_dates (content_id, start_date);
CREATE INDEX scheduled_dates_active_idx ON scheduled_dates (start_date, is_active)
  WHERE is_active = true;

-- ── Meeting points (CRT-FR-022, supersedes DD-021 version) ──────
-- Two-part privacy model: public area + private exact (shared N hours before)
CREATE TABLE meeting_points (
  content_id                  uuid PRIMARY KEY REFERENCES content(id) ON DELETE CASCADE,
  city_id                     text NOT NULL REFERENCES cities(id),
  location_description        text NOT NULL,              -- public: 'Manali Volvo Stand'
  area_point                  geography(POINT, 4326) NOT NULL, -- public: neighbourhood-level
  exact_location              text NOT NULL,              -- private: shared T-N hours before start
  exact_shared_hours_before   int NOT NULL DEFAULT 24
                              CHECK (exact_shared_hours_before IN (12, 24, 48))
);

-- ── Event occurrences (DD-025) ──────────────────────────────────
-- For event content type — single occurrence per event
CREATE TABLE event_occurrences (
  content_id    uuid PRIMARY KEY REFERENCES content(id) ON DELETE CASCADE,
  start_at      timestamptz NOT NULL,
  end_at        timestamptz NOT NULL,
  timezone      text NOT NULL DEFAULT 'Asia/Kolkata',
  venue_name    text NOT NULL,
  venue_address text NOT NULL,                           -- PUBLIC (unlike meeting_points)
  venue_point   geography(POINT, 4326) NOT NULL,
  city_id       text NOT NULL REFERENCES cities(id),
  capacity      int NOT NULL CHECK (capacity > 0),
  spots_booked  int NOT NULL DEFAULT 0,
  rsvp_count    int NOT NULL DEFAULT 0,
  is_free       boolean NOT NULL DEFAULT false,
  CHECK (end_at > start_at),
  CHECK (spots_booked >= 0 AND spots_booked <= capacity)
);

CREATE INDEX event_occurrences_start_idx ON event_occurrences (start_at);
CREATE INDEX event_occurrences_city_idx ON event_occurrences (city_id);
CREATE INDEX event_occurrences_point_idx ON event_occurrences USING GIST (venue_point);
