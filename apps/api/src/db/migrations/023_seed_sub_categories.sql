-- ═══════════════════════════════════════════════════════════════════
-- Migration 023: Seed canonical 3-level taxonomy sub-categories
-- SRS: DD-006 — replaces earlier seed data in db/seeds/verticals.sql
-- Idempotent: INSERT … ON CONFLICT DO NOTHING
-- ═══════════════════════════════════════════════════════════════════

-- ── Travel sub-categories (12 total) ────────────────────────────
INSERT INTO vertical_sub_categories (id, vertical, slug, name, display_order, leaf_types) VALUES
('travel.road_trips',  'travel', 'road_trips',  'Road Trips & Biking',   1, ARRAY['city_ride','highway_ride','offroad_ride','mountain_ride','coastal_ride','weekend_drive']),
('travel.trekking',    'travel', 'trekking',    'Trekking & Hiking',     2, ARRAY['day_hike','summit_trek','forest_trail','snow_trek','camping_trek']),
('travel.adventure',   'travel', 'adventure',   'Adventure & Sports',    3, ARRAY['zipline','kayaking','rock_climbing','river_rafting','paragliding','multi_sport']),
('travel.heritage',    'travel', 'heritage',    'Heritage & Culture',    4, ARRAY['fort_walk','museum_tour','old_city_walk','temple_trail','architecture_tour','storytelling_walk']),
('travel.food_trails', 'travel', 'food_trails', 'Food Trails',           5, ARRAY['street_food_trail','market_walk','dessert_crawl','night_food_walk','regional_meal']),
('travel.wildlife',    'travel', 'wildlife',    'Wildlife & Nature',     6, ARRAY['safari','birding_trail','nature_walk','wetland_tour','jungle_drive']),
('travel.photo_walks', 'travel', 'photo_walks', 'Photo Walks',           7, ARRAY['sunrise_walk','street_photography','landscape_shoot','night_photography','wildlife_shoot']),
('travel.wellness',    'travel', 'wellness',    'Wellness Retreats',     8, ARRAY['yoga_retreat','meditation_walk','ayurveda_stay','breathwork_retreat','sound_healing']),
('travel.family',      'travel', 'family',      'Family & Kids',         9, ARRAY['kids_nature_walk','family_picnic','learning_trail','zoo_day','farm_visit']),
('travel.luxury',      'travel', 'luxury',      'Luxury & Curated',     10, ARRAY['private_city_tour','chef_table','yacht_day','curated_stay','concierge_day']),
('travel.offbeat',     'travel', 'offbeat',     'Offbeat & Hidden',     11, ARRAY['hidden_village','remote_trail','local_homestay','tribal_experience','secret_spots']),
('travel.nightlife',   'travel', 'nightlife',   'Nightlife & Events',   12, ARRAY['pub_crawl','live_music_night','club_night','late_food_night','sunset_party','festival_event'])
ON CONFLICT DO NOTHING;

-- ── Stories sub-categories (3 total) ────────────────────────────
INSERT INTO vertical_sub_categories (id, vertical, slug, name, display_order, leaf_types) VALUES
('stories.travel_stories', 'stories', 'travel_stories', 'Travel Stories', 1, ARRAY['trip_diary','destination_guide','creator_journey']),
('stories.photo_essays',   'stories', 'photo_essays',   'Photo Essays',   2, ARRAY['landscape','street','portrait','documentary']),
('stories.tips_guides',    'stories', 'tips_guides',    'Tips & Guides',  3, ARRAY['budget_tips','packing_guide','safety_tips','itinerary_hacks'])
ON CONFLICT DO NOTHING;
