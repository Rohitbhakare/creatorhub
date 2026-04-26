-- ═══════════════════════════════════════════════════════════════════
-- Migration 030: Custom spot cover override (DD-032)
-- Adds itinerary_spots.cover_url for creator-uploaded covers and
-- extends insert_itinerary_spot RPC to accept p_cover_url so the
-- override is persisted on INSERT (not just on a follow-up UPDATE).
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE itinerary_spots
  ADD COLUMN IF NOT EXISTS cover_url text;

CREATE OR REPLACE FUNCTION insert_itinerary_spot(
  p_itinerary_day_id uuid,
  p_spot_order       int,
  p_google_place_id  text,
  p_name             text,
  p_category         text,
  p_lng              double precision,
  p_lat              double precision,
  p_thumbnail_url    text,
  p_creator_note     text,
  p_duration_minutes int,
  p_stop_type        spot_stop_type,
  p_is_free_preview  boolean,
  p_cover_url        text DEFAULT NULL
)
RETURNS SETOF itinerary_spots
LANGUAGE sql
AS $$
  INSERT INTO itinerary_spots (
    itinerary_day_id, spot_order, google_place_id, name, category,
    point, thumbnail_url, cover_url, creator_note, duration_minutes,
    stop_type, is_free_preview
  ) VALUES (
    p_itinerary_day_id, p_spot_order, p_google_place_id, p_name, p_category,
    ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
    p_thumbnail_url, p_cover_url, p_creator_note, p_duration_minutes,
    p_stop_type, p_is_free_preview
  )
  RETURNING *;
$$;
