-- ═══════════════════════════════════════════════════════════════════
-- Migration 024: Split Road Trips → Road Trips + Biking
-- Travel-only launch Phase 1 — 4 active sub-cats: road_trips, biking,
-- trekking, food_trails. Biking is split out from road_trips so cars
-- and motorcycles are separate audiences.
-- Idempotent.
-- ═══════════════════════════════════════════════════════════════════

-- 1. Insert the new biking sub-category
INSERT INTO vertical_sub_categories (id, vertical, slug, name, display_order, leaf_types) VALUES
  ('travel.biking', 'travel', 'biking', 'Biking', 13,
   ARRAY['city_ride','highway_ride','offroad_ride','mountain_ride','coastal_ride'])
ON CONFLICT (id) DO UPDATE SET
  name        = EXCLUDED.name,
  display_order = EXCLUDED.display_order,
  leaf_types  = EXCLUDED.leaf_types;

-- 2. Narrow road_trips to car-only leaf types (was 'Road Trips & Biking')
UPDATE vertical_sub_categories
   SET name       = 'Road Trips',
       leaf_types = ARRAY['weekend_drive','highway_drive','coastal_drive','hill_drive']
 WHERE id = 'travel.road_trips';

-- 3. Move existing biking-leaf content over to the new sub-category
UPDATE content
   SET sub_category_id = 'travel.biking'
 WHERE sub_category_id = 'travel.road_trips'
   AND leaf_type IN ('city_ride','highway_ride','offroad_ride','mountain_ride','coastal_ride');
