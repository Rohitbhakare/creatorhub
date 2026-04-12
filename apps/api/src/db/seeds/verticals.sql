-- ═══════════════════════════════════════════════════════════════════
-- Seed: Vertical Sub-categories (DD-006)
-- 12 travel sub-categories + stories sub-categories
-- Idempotent: INSERT ... ON CONFLICT DO NOTHING
-- ═══════════════════════════════════════════════════════════════════

-- ── Travel sub-categories (12 per DD-006) ───────────────────────
INSERT INTO vertical_sub_categories (id, vertical, slug, name, display_order, leaf_types) VALUES
('travel.road_trips_biking', 'travel', 'road_trips_biking', 'Road Trips & Biking', 1,
  '{solo_ride,group_ride,road_trip,bike_tour}'),
('travel.trekking_hiking', 'travel', 'trekking_hiking', 'Trekking & Hiking', 2,
  '{day_hike,multi_day,expedition,trail_run}'),
('travel.adventure_sports', 'travel', 'adventure_sports', 'Adventure Sports', 3,
  '{paragliding,rafting,bungee,scuba,skiing,rock_climbing,zip_lining}'),
('travel.heritage_culture', 'travel', 'heritage_culture', 'Heritage & Culture', 4,
  '{monument,museum,festival,historical_walk,art_gallery}'),
('travel.food_trails', 'travel', 'food_trails', 'Food Trails', 5,
  '{street_food,restaurant_hop,cooking_class,food_walk,cafe_crawl}'),
('travel.wildlife_nature', 'travel', 'wildlife_nature', 'Wildlife & Nature', 6,
  '{safari,bird_watching,nature_walk,camping,stargazing}'),
('travel.photo_walks', 'travel', 'photo_walks', 'Photo Walks', 7,
  '{sunrise,sunset,street,landscape,architectural,night}'),
('travel.wellness_retreats', 'travel', 'wellness_retreats', 'Wellness Retreats', 8,
  '{yoga,meditation,ayurveda,spa,detox}'),
('travel.family_kids', 'travel', 'family_kids', 'Family & Kids', 9,
  '{theme_park,zoo,beach,resort,educational}'),
('travel.luxury_curated', 'travel', 'luxury_curated', 'Luxury & Curated', 10,
  '{boutique_hotel,fine_dining,private_tour,yacht,helicopter}'),
('travel.offbeat_hidden', 'travel', 'offbeat_hidden', 'Offbeat & Hidden Gems', 11,
  '{village,remote,unexplored,local_secret,hidden_waterfall}'),
('travel.nightlife_events', 'travel', 'nightlife_events', 'Nightlife & Events', 12,
  '{club,bar,live_music,pub_crawl,festival,concert}')
ON CONFLICT DO NOTHING;

-- ── Stories sub-categories (MVP vertical alongside travel) ──────
INSERT INTO vertical_sub_categories (id, vertical, slug, name, display_order, leaf_types) VALUES
('stories.personal', 'stories', 'personal', 'Personal Stories', 1,
  '{journey,reflection,diary,memoir}'),
('stories.guides', 'stories', 'guides', 'Guides & Tips', 2,
  '{how_to,budget,packing,safety,planning}'),
('stories.photo_essays', 'stories', 'photo_essays', 'Photo Essays', 3,
  '{documentary,portrait,landscape,street,abstract}'),
('stories.reviews', 'stories', 'reviews', 'Reviews', 4,
  '{hotel,restaurant,gear,app,destination}'),
('stories.lists', 'stories', 'lists', 'Lists & Rankings', 5,
  '{top_places,bucket_list,comparison,seasonal,themed}')
ON CONFLICT DO NOTHING;
