-- ═══════════════════════════════════════════════════════════════════
-- Seed: Realistic test creators & content for M1 testing
-- ═══════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Creator Users ─────────────────────────────────────────────

INSERT INTO users (id, phone, display_name, username, bio, is_creator, onboarding_completed_at, created_at)
VALUES
  ('a1111111-1111-1111-1111-111111111111', '9800000001', 'Priya Sharma', 'priyasharma',
   'Travel photographer & storyteller. Exploring India one chai at a time.', true, now(), now()),
  ('a2222222-2222-2222-2222-222222222222', '9800000002', 'Arjun Mehta', 'arjunmehta',
   'Adventure junkie. Trekking guide in Himachal. 200+ treks completed.', true, now(), now()),
  ('a3333333-3333-3333-3333-333333333333', '9800000003', 'Sneha Reddy', 'snehareddy',
   'Food & culture writer from Hyderabad. Exploring street food across India.', true, now(), now()),
  ('a4444444-4444-4444-4444-444444444444', '9800000004', 'Rohan Kapoor', 'rohankapoor',
   'Solo traveler. Budget travel expert. 28 states, 4 UTs covered.', true, now(), now()),
  ('a5555555-5555-5555-5555-555555555555', '9800000005', 'Meera Nair', 'meeranair',
   'Kerala backwaters to Ladakh passes. Full-time creator & experience host.', true, now(), now()),
  ('a6666666-6666-6666-6666-666666666666', '9800000006', 'Vikram Singh', 'vikramsingh',
   'Rajasthan heritage walks curator. History nerd. Published author.', true, now(), now())
ON CONFLICT (id) DO NOTHING;

-- ── 2. Creator Verticals ─────────────────────────────────────────

INSERT INTO user_active_verticals (user_id, vertical)
VALUES
  ('a1111111-1111-1111-1111-111111111111', 'travel'),
  ('a1111111-1111-1111-1111-111111111111', 'stories'),
  ('a2222222-2222-2222-2222-222222222222', 'travel'),
  ('a3333333-3333-3333-3333-333333333333', 'stories'),
  ('a3333333-3333-3333-3333-333333333333', 'food'),
  ('a4444444-4444-4444-4444-444444444444', 'travel'),
  ('a5555555-5555-5555-5555-555555555555', 'travel'),
  ('a5555555-5555-5555-5555-555555555555', 'stories'),
  ('a6666666-6666-6666-6666-666666666666', 'stories')
ON CONFLICT DO NOTHING;

-- ── 3. Published Content — Travel Vertical ───────────────────────

-- Posts (travel)
INSERT INTO content (id, user_id, type, vertical, title, description, body, status, visibility, pricing_model, price_paisa, published_at, like_count, comment_count, save_count, view_count, starting_city_id)
VALUES
  ('c0000001-0001-0001-0001-000000000001', 'a1111111-1111-1111-1111-111111111111',
   'post', 'travel',
   'Golden hour at Pangong Lake',
   'That moment when the sun dips behind the mountains and the entire lake turns gold.',
   'We reached Pangong at 4pm after a brutal 5-hour drive from Leh. Everyone was exhausted, altitude headaches kicking in. But then the light changed. The lake went from deep blue to turquoise to liquid gold in 20 minutes. Nobody spoke. That silence at 14,000 feet — you hear your own heartbeat. This is why we travel.',
   'published', 'public', 'free', 0, now() - interval '3 days', 142, 23, 67, 1840,
   (SELECT id FROM cities WHERE name = 'Leh' LIMIT 1)),

  ('c0000001-0001-0001-0001-000000000002', 'a2222222-2222-2222-2222-222222222222',
   'post', 'travel',
   'Why Hampi deserves more than a day trip',
   'Most people rush through Hampi in 6 hours. Here''s why you need at least 3 days.',
   'I''ve been to Hampi 11 times. Yes, eleven. And I still discover something new every visit. Last week I found a tiny Hanuman shrine hidden behind the elephant stables that nobody talks about. The watchman told me it''s 600 years old. Three days minimum: Day 1 for the royal enclosure and bazaar, Day 2 for the riverside temples at sunrise, Day 3 for the bouldering areas and Anegundi across the river.',
   'published', 'public', 'free', 0, now() - interval '5 days', 89, 14, 45, 920,
   (SELECT id FROM cities WHERE name = 'Hospet' LIMIT 1)),

  ('c0000001-0001-0001-0001-000000000003', 'a4444444-4444-4444-4444-444444444444',
   'post', 'travel',
   'Mumbai to Goa on ₹2,500 — a complete breakdown',
   'Bus, food, stay, everything. Yes, it''s possible. No, you won''t suffer.',
   'Sleeper bus from Mumbai Central: ₹800 (book 2 weeks ahead on RedBus). Hostel in Arambol: ₹400/night x 2 = ₹800. Food: ₹300/day x 2 = ₹600. Scooter rental: ₹300. Total: ₹2,500. The trick? Travel on a Tuesday or Wednesday. Avoid December-January peak season. Arambol > Baga for budget travelers — better vibes, cheaper food, actual beach without the crowds.',
   'published', 'public', 'free', 0, now() - interval '1 day', 234, 41, 112, 3200,
   (SELECT id FROM cities WHERE name = 'Mumbai' LIMIT 1)),

  ('c0000001-0001-0001-0001-000000000004', 'a5555555-5555-5555-5555-555555555555',
   'post', 'travel',
   'Alleppey houseboat — honest review after 3 trips',
   'The good, the bad, and the mosquitoes. An unfiltered guide.',
   'First trip: magical. Backwaters at sunset, home-cooked fish curry, total peace. Second trip: realized the "luxury" houseboat was the same boat with a different paint job. Third trip: skipped the houseboat entirely and stayed at a homestay in Kumarakom — 10x better experience at half the price. The secret? Ask for Shaji''s homestay near Vembanad Lake. No tourist markup, real Kerala food, and a canoe ride through the canals at 6am.',
   'published', 'public', 'free', 0, now() - interval '7 days', 178, 32, 89, 2100,
   (SELECT id FROM cities WHERE name = 'Alappuzha' LIMIT 1)),

  ('c0000001-0001-0001-0001-000000000005', 'a1111111-1111-1111-1111-111111111111',
   'post', 'travel',
   'First timer''s guide to Varanasi — skip the ghats walk',
   'Controversial take: the organized ghat walks are a tourist trap.',
   'Every blog says "book a morning ghat walk." I did. It was ₹1,500 for a guide who read from a script while rushing past 15 ghats in 90 minutes. Instead: wake up at 4:30am, walk to Assi Ghat yourself, sit on the steps, watch the city wake up. The chai wallah at step 23 (yes I counted) makes the best masala chai in Varanasi. Then walk north at your own pace. You''ll talk to priests, sadhus, and locals who''ll tell you stories no guide knows.',
   'published', 'public', 'free', 0, now() - interval '2 days', 312, 56, 145, 4500,
   (SELECT id FROM cities WHERE name = 'Varanasi' LIMIT 1));

-- Itineraries (travel)
INSERT INTO content (id, user_id, type, vertical, title, description, status, visibility, pricing_model, price_paisa, published_at, like_count, save_count, view_count, starting_city_id, duration_minutes)
VALUES
  ('c0000002-0002-0002-0002-000000000001', 'a2222222-2222-2222-2222-222222222222',
   'self_paced_itinerary', 'travel',
   'Manali to Spiti Valley — 7 Day Road Trip',
   'The complete route with stops, stays, and permits. Tested in June 2025.',
   'published', 'public', 'free', 0, now() - interval '10 days', 267, 198, 3400,
   (SELECT id FROM cities WHERE name = 'Manali' LIMIT 1), 10080),

  ('c0000002-0002-0002-0002-000000000002', 'a4444444-4444-4444-4444-444444444444',
   'self_paced_itinerary', 'travel',
   'Rajasthan Circuit — Jaipur → Jodhpur → Jaisalmer → Udaipur',
   '12 days through the golden triangle extended. Budget-friendly route with hidden gems.',
   'published', 'public', 'free', 0, now() - interval '14 days', 189, 156, 2800,
   (SELECT id FROM cities WHERE name = 'Jaipur' LIMIT 1), 17280),

  ('c0000002-0002-0002-0002-000000000003', 'a5555555-5555-5555-5555-555555555555',
   'self_paced_itinerary', 'travel',
   'Kerala in 5 Days — Kochi → Munnar → Thekkady → Alleppey',
   'Tea plantations, spice gardens, wildlife, and backwaters. The perfect Kerala loop.',
   'published', 'public', 'free', 0, now() - interval '6 days', 145, 112, 1900,
   (SELECT id FROM cities WHERE name = 'Kochi' LIMIT 1), 7200);

-- Events (travel)
INSERT INTO content (id, user_id, type, vertical, title, description, status, visibility, pricing_model, price_paisa, published_at, like_count, view_count, starting_city_id)
VALUES
  ('c0000003-0003-0003-0003-000000000001', 'a6666666-6666-6666-6666-666666666666',
   'event', 'travel',
   'Heritage Walk: Hidden Temples of Old Delhi',
   'A 3-hour walk through lanes that most Delhiites have never seen. Limited to 15 people.',
   'published', 'public', 'free', 0, now() - interval '4 days', 98, 780,
   (SELECT id FROM cities WHERE name = 'Delhi' LIMIT 1)),

  ('c0000003-0003-0003-0003-000000000002', 'a2222222-2222-2222-2222-222222222222',
   'event', 'travel',
   'Sunrise Trek to Triund — Beginner Friendly',
   'Night trek starting 2am from McLeodganj. Chai at the top as the sun rises over the Dhauladhar range.',
   'published', 'public', 'free', 0, now() - interval '8 days', 156, 1200,
   (SELECT id FROM cities WHERE name = 'Dharamshala' LIMIT 1));

-- ── 4. Published Content — Stories Vertical ──────────────────────

INSERT INTO content (id, user_id, type, vertical, title, description, body, status, visibility, pricing_model, price_paisa, published_at, like_count, comment_count, save_count, view_count, starting_city_id)
VALUES
  ('c0000004-0004-0004-0004-000000000001', 'a3333333-3333-3333-3333-333333333333',
   'post', 'stories',
   'The last Irani chai café in Hyderabad',
   'Nimrah Café is 90 years old. The owner showed me his grandfather''s recipe book.',
   'There used to be 300 Irani cafés in Hyderabad. Now there are maybe 20. Nimrah, right opposite Charminar, opens at 5am. The Osmania biscuit here costs ₹8 — the same price since 2015. Aziz bhai, 74, showed me the leather-bound ledger from 1934. His grandfather started the café. "We don''t change the recipe because the recipe is the memory," he said. The chai is milky, sweet, made in a massive brass degh. Some things should never be optimized.',
   'published', 'public', 'free', 0, now() - interval '2 days', 445, 67, 213, 5600,
   (SELECT id FROM cities WHERE name = 'Hyderabad' LIMIT 1)),

  ('c0000004-0004-0004-0004-000000000002', 'a1111111-1111-1111-1111-111111111111',
   'post', 'stories',
   'My 47 failed attempts at photographing the Milky Way in Ladakh',
   'Spoiler: attempt 48 worked. Here''s everything I learned.',
   'Equipment: Canon R6 Mark II, Sigma 14mm f/1.8, tripod that cost more than my flight. Location: Hanle, Ladakh — one of the best dark sky sites in Asia. Altitude: 14,764 feet. Temperature: minus 8°C. The first 20 attempts failed because I didn''t know about the "500 rule" for avoiding star trails. The next 15 failed because clouds. Then 12 more because my battery died in the cold (pro tip: keep it in your jacket pocket until the last second). Attempt 48: 25 seconds, f/1.8, ISO 3200. The Milky Way arced across the frame like someone had spilled cream across a black tablecloth.',
   'published', 'public', 'free', 0, now() - interval '9 days', 523, 78, 267, 6800,
   (SELECT id FROM cities WHERE name = 'Leh' LIMIT 1)),

  ('c0000004-0004-0004-0004-000000000003', 'a6666666-6666-6666-6666-666666666666',
   'post', 'stories',
   'The stepwell nobody visits in Jaipur',
   'Panna Meena ka Kund is on every Instagram feed. But there''s a better one 800m away.',
   'Everyone goes to Panna Meena ka Kund in Amer. Beautiful, sure. Also: 200 tourists at any given time, selfie sticks, someone always blocking the symmetry shot. Walk 800 meters east towards the old village and you''ll find Chand Baori''s forgotten cousin — a stepwell with no name board, no entry fee, no tourists. An old man sitting at the top told me it was built by the same artisan family. The geometry is identical but the moss and wild plants growing through the steps make it look like a Miyazaki set.',
   'published', 'public', 'free', 0, now() - interval '11 days', 334, 45, 178, 4200,
   (SELECT id FROM cities WHERE name = 'Jaipur' LIMIT 1)),

  ('c0000004-0004-0004-0004-000000000004', 'a5555555-5555-5555-5555-555555555555',
   'post', 'stories',
   'What nobody tells you about living on a houseboat for a month',
   'I spent February 2025 on a kettuvallam in Kumarakom. The romance wears off on Day 3.',
   'Day 1-2: Paradise. Waking up to kingfishers, coconut trees reflected in still water, the gentle rocking puts you to sleep in seconds. Day 3: The generator breaks. No fan. 32°C. Day 5: You realize the toilet empties directly into the lake. Day 7: You befriend the boat owner''s family and they invite you for a Sadhya feast. Day 14: You learn to fish with a handline. Day 21: You can navigate the canals blindfolded. Day 30: You don''t want to leave. The discomfort becomes the adventure.',
   'published', 'public', 'free', 0, now() - interval '4 days', 267, 38, 134, 3100,
   (SELECT id FROM cities WHERE name = 'Kottayam' LIMIT 1));

-- ── 5. Content Media (cover images using Unsplash) ───────────────

INSERT INTO content_media (content_id, media_type, url, display_order)
VALUES
  -- Travel posts
  ('c0000001-0001-0001-0001-000000000001', 'image', 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800', 0),
  ('c0000001-0001-0001-0001-000000000002', 'image', 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=800', 0),
  ('c0000001-0001-0001-0001-000000000003', 'image', 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800', 0),
  ('c0000001-0001-0001-0001-000000000004', 'image', 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800', 0),
  ('c0000001-0001-0001-0001-000000000005', 'image', 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=800', 0),
  -- Travel itineraries
  ('c0000002-0002-0002-0002-000000000001', 'image', 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800', 0),
  ('c0000002-0002-0002-0002-000000000002', 'image', 'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=800', 0),
  ('c0000002-0002-0002-0002-000000000003', 'image', 'https://images.unsplash.com/photo-1602158123057-2e1a7c3e8192?w=800', 0),
  -- Travel events
  ('c0000003-0003-0003-0003-000000000001', 'image', 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800', 0),
  ('c0000003-0003-0003-0003-000000000002', 'image', 'https://images.unsplash.com/photo-1585116938581-bdb0e9d40db0?w=800', 0),
  -- Stories posts
  ('c0000004-0004-0004-0004-000000000001', 'image', 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800', 0),
  ('c0000004-0004-0004-0004-000000000002', 'image', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800', 0),
  ('c0000004-0004-0004-0004-000000000003', 'image', 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800', 0),
  ('c0000004-0004-0004-0004-000000000004', 'image', 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?w=800', 0)
ON CONFLICT DO NOTHING;

COMMIT;
