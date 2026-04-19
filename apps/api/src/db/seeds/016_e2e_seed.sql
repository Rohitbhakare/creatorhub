-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: 016_e2e_seed.sql
-- Purpose:   Insert deterministic test accounts, content, and bookings
--            required by the Patrol E2E test suite (E3.1).
--
-- Apply to staging before running E2E tests:
--   supabase db query --linked --file apps/api/src/db/seeds/016_e2e_seed.sql
--
-- SAFE to re-run (fully idempotent via ON CONFLICT DO NOTHING / DO UPDATE).
--
-- UUID NOTE: All seed UUIDs use valid hex digits only (0-9, a-f).
--   Post:           e2e0000a-0000-0000-0000-000000000001
--   Experience:     e2e0000b-0000-0000-0000-000000000001
--   Sched date (f): e2e0000c-0000-0000-0000-000000000001  (future, open)
--   Sched date (p): e2e0000c-0000-0000-0000-000000000002  (past, closed)
--   Booking 1:      e2e0000d-0000-0000-0000-000000000001  (confirmed, future)
--   Booking 2:      e2e0000d-0000-0000-0000-000000000002  (completed, past)
--   Saved List:     e2e11570-0000-0000-0000-e2e115700001
--
-- SCHEMA NOTES (derived from actual migrations):
--   - No experience_occurrences table → use scheduled_dates (006_itineraries_events.sql)
--   - scheduled_dates.start_date/end_date are DATE (not timestamptz)
--   - Price fields live in booking_financials (1:1 with bookings)
--   - bookings requires creator_id (the seller)
--   - bookings.status is booking_status enum: pending_payment, paid, confirmed,
--     in_progress, completed, reviewed, cancelled_by_user, cancelled_by_creator,
--     refunded, disputed
--   - follows table uses (follower_id, following_id) — not followee_id
--   - vertical column in user_active_verticals is vertical_type enum (must cast)
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1a. E2E Test Users ────────────────────────────────────────────────────
--
-- These two phones are registered in Firebase emulator as test phones.
-- ON CONFLICT (phone) DO UPDATE keeps the existing row and updates profile fields.
-- All downstream FKs use phone-based SELECT subqueries to resolve the actual UUID
-- at insert time (stable even when users were created via OTP before seed was applied).

INSERT INTO users (
  id, phone, display_name, username, bio,
  is_creator, kyc_status,
  onboarding_completed_at, current_city_id, created_at, updated_at
)
VALUES
  (
    'e2e00000-0000-0000-0000-000000000001',
    '+919090909090',
    'E2E Traveler',
    'e2e_traveler',
    'Test account for E2E automation. Do not follow.',
    false,
    'not_started',
    now() - interval '30 days',
    (SELECT id FROM cities WHERE name = 'Mumbai' LIMIT 1),
    now() - interval '30 days',
    now()
  ),
  (
    'e2e00000-0000-0000-0000-000000000002',
    '+917588005893',
    'E2E Creator',
    'e2e_creator',
    'Test creator account for E2E automation.',
    true,
    'verified',
    now() - interval '30 days',
    (SELECT id FROM cities WHERE name = 'Jaipur' LIMIT 1),
    now() - interval '30 days',
    now()
  )
ON CONFLICT (phone) DO UPDATE SET
  display_name            = EXCLUDED.display_name,
  username                = COALESCE(users.username, EXCLUDED.username),
  bio                     = COALESCE(users.bio, EXCLUDED.bio),
  is_creator              = EXCLUDED.is_creator,
  kyc_status              = EXCLUDED.kyc_status,
  onboarding_completed_at = EXCLUDED.onboarding_completed_at,
  current_city_id         = COALESCE(users.current_city_id, EXCLUDED.current_city_id),
  updated_at              = now();

-- ── 1b. Vikram Singh (seed content creator) ───────────────────────────────
--
-- a6666666 may already exist from seed_content.sql with phone '9800000006'
-- (no +91 prefix). ON CONFLICT (id) normalises his phone to +91 E.164 format
-- so follow-relationship queries can find him by canonical phone.

INSERT INTO users (
  id, phone, display_name, username, bio,
  is_creator, kyc_status,
  onboarding_completed_at, current_city_id, created_at, updated_at
)
VALUES (
  'a6666666-6666-6666-6666-666666666666',
  '+919800000099',
  'Vikram Singh',
  'vikramsingh',
  'Photographer and travel guide based in Jaipur.',
  true,
  'verified',
  now() - interval '60 days',
  (SELECT id FROM cities WHERE name = 'Jaipur' LIMIT 1),
  now() - interval '60 days',
  now()
)
ON CONFLICT (id) DO UPDATE SET
  phone      = '+919800000099',
  is_creator = true,
  kyc_status = 'verified',
  updated_at = now();

-- ── Verticals for traveler and creator ───────────────────────────────────
-- Phone-based subquery; cast to vertical_type enum required.
INSERT INTO user_active_verticals (user_id, vertical)
SELECT u.id, v.vertical::vertical_type
FROM users u
CROSS JOIN (VALUES ('travel'), ('stories')) AS v(vertical)
WHERE u.phone IN ('+919090909090', '+917588005893')
ON CONFLICT DO NOTHING;

-- ── Traveler follows Vikram Singh ─────────────────────────────────────────
-- follows table: (follower_id, following_id) — not followee_id.
INSERT INTO follows (follower_id, following_id, created_at)
SELECT u.id, 'a6666666-6666-6666-6666-666666666666'::uuid, now()
FROM users u WHERE u.phone = '+919090909090' LIMIT 1
ON CONFLICT DO NOTHING;

-- ── Traveler default saved list ───────────────────────────────────────────
INSERT INTO saved_lists (id, user_id, name, created_at)
SELECT 'e2e11570-0000-0000-0000-e2e115700001', u.id, 'Favourites', now()
FROM users u WHERE u.phone = '+919090909090' LIMIT 1
ON CONFLICT (id) DO NOTHING;


-- ── 2. Seed Post (free) ───────────────────────────────────────────────────
--
-- "Dawn at Pangong Lake" by E2E Creator (phone +917588005893).
-- Primary seed post for F04-S01 (post detail + engagement bar test).
-- SELECT subquery resolves creator UUID by phone at insert time.

INSERT INTO content (
  id, user_id, type, vertical,
  title, description, body,
  status, visibility, pricing_model, price_paisa,
  published_at, like_count, comment_count, save_count, view_count,
  starting_city_id
)
SELECT
  'e2e0000a-0000-0000-0000-000000000001',
  u.id,
  'post',
  'travel',
  'Dawn at Pangong Lake',
  'The lake turns gold before the crowds arrive. Here is how to make it happen.',
  'We left Leh at 3am. By the time the sun crested the mountains, we had the entire eastern shore to ourselves. Pangong at dawn is unlike anything else in India — the silence, the altitude, the colour of the water.',
  'published', 'public', 'free', 0,
  now() - interval '7 days', 87, 12, 34, 910,
  (SELECT id FROM cities WHERE name = 'Leh' LIMIT 1)
FROM users u WHERE u.phone = '+917588005893' LIMIT 1
ON CONFLICT (id) DO NOTHING;

INSERT INTO content_media (content_id, media_type, url, display_order)
VALUES (
  'e2e0000a-0000-0000-0000-000000000001',
  'image',
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800',
  0
)
ON CONFLICT DO NOTHING;


-- ── 3. Seed Scheduled Experience (paid) ──────────────────────────────────
--
-- "Sunrise Photography Walk — Jaipur" hosted by Vikram Singh (a6666666).
-- Capacity = 2 per slot (for Sold Out test scenario).
-- Price = ₹1,500 (150000 paisa).

INSERT INTO content (
  id, user_id, type, vertical,
  title, description,
  status, visibility, pricing_model, price_paisa,
  published_at, like_count, save_count, view_count,
  starting_city_id
)
VALUES (
  'e2e0000b-0000-0000-0000-000000000001',
  'a6666666-6666-6666-6666-666666666666',
  'scheduled_experience',
  'travel',
  'Sunrise Photography Walk — Jaipur',
  'Capture Jaipur at its most magical: golden hour on the city walls, the Hawa Mahal before the crowds, and the flower market at dawn. Camera or phone — all levels welcome. Limited to 6 people.',
  'published', 'public', 'paid', 150000,
  now() - interval '20 days', 45, 28, 620,
  (SELECT id FROM cities WHERE name = 'Jaipur' LIMIT 1)
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO content_media (content_id, media_type, url, display_order)
VALUES (
  'e2e0000b-0000-0000-0000-000000000001',
  'image',
  'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800',
  0
)
ON CONFLICT DO NOTHING;

-- Scheduled date slots (table: scheduled_dates, not experience_occurrences)
-- start_date / end_date are DATE type — use CURRENT_DATE arithmetic (not now()).
INSERT INTO scheduled_dates (
  id, content_id, start_date, end_date, capacity, spots_booked, is_active
)
VALUES
  (
    -- Future open slot (booking 1 is against this)
    'e2e0000c-0000-0000-0000-000000000001',
    'e2e0000b-0000-0000-0000-000000000001',
    CURRENT_DATE + 30,      -- 30 days from now
    CURRENT_DATE + 30,
    2,
    1,                      -- 1 spot booked (traveler's booking)
    true
  ),
  (
    -- Past completed slot (booking 2 is against this)
    'e2e0000c-0000-0000-0000-000000000002',
    'e2e0000b-0000-0000-0000-000000000001',
    CURRENT_DATE - 10,      -- 10 days ago
    CURRENT_DATE - 10,
    2,
    1,
    false
  )
ON CONFLICT (id) DO NOTHING;


-- ── 4. Seed Bookings ──────────────────────────────────────────────────────
--
-- Booking 1 (seedBookingId):         confirmed, future date → cancellable
-- Booking 2 (seedCompletedBookingId): completed, past date → write-review scenario
--
-- bookings requires creator_id (seller) — use Vikram Singh's canonical UUID.
-- Financial fields are in booking_financials (separate 1:1 table).

INSERT INTO bookings (
  id, content_id, scheduled_date_id, user_id, creator_id,
  status, confirmed_at, created_at, updated_at
)
SELECT
  'e2e0000d-0000-0000-0000-000000000001',
  'e2e0000b-0000-0000-0000-000000000001',
  'e2e0000c-0000-0000-0000-000000000001',
  u.id,
  'a6666666-6666-6666-6666-666666666666',
  'confirmed',
  now() - interval '5 days',
  now() - interval '5 days',
  now() - interval '5 days'
FROM users u WHERE u.phone = '+919090909090' LIMIT 1
ON CONFLICT (id) DO NOTHING;

INSERT INTO booking_financials (
  booking_id,
  base_price_paisa, gst_paisa, platform_fee_paisa,
  total_paisa, creator_payout_paisa, tds_paisa
)
VALUES (
  'e2e0000d-0000-0000-0000-000000000001',
  150000,   -- ₹1,500 base
  27000,    -- ₹270 GST (18% of base)
  25500,    -- ₹255 platform fee (17% of base)
  177000,   -- ₹1,770 total (base + GST, buyer pays)
  123000,   -- ₹1,230 creator payout (base - platform_fee - tds)
  1500      -- ₹15 TDS (1% of base per Sec 194-O)
)
ON CONFLICT (booking_id) DO NOTHING;

INSERT INTO bookings (
  id, content_id, scheduled_date_id, user_id, creator_id,
  status, confirmed_at, completed_at, created_at, updated_at
)
SELECT
  'e2e0000d-0000-0000-0000-000000000002',
  'e2e0000b-0000-0000-0000-000000000001',
  'e2e0000c-0000-0000-0000-000000000002',
  u.id,
  'a6666666-6666-6666-6666-666666666666',
  'completed',
  now() - interval '15 days',
  now() - interval '9 days',
  now() - interval '15 days',
  now() - interval '9 days'
FROM users u WHERE u.phone = '+919090909090' LIMIT 1
ON CONFLICT (id) DO NOTHING;

INSERT INTO booking_financials (
  booking_id,
  base_price_paisa, gst_paisa, platform_fee_paisa,
  total_paisa, creator_payout_paisa, tds_paisa
)
VALUES (
  'e2e0000d-0000-0000-0000-000000000002',
  150000,
  27000,
  25500,
  177000,
  123000,
  1500
)
ON CONFLICT (booking_id) DO NOTHING;

COMMIT;

-- ── Quick verification query ─────────────────────────────────────────────
-- Run this after applying to confirm seed is in place:
--
-- SELECT phone, display_name, is_creator, kyc_status
-- FROM users
-- WHERE phone IN ('+919090909090', '+917588005893', '+919800000099');
--
-- SELECT id, status FROM bookings
-- WHERE id IN (
--   'e2e0000d-0000-0000-0000-000000000001',
--   'e2e0000d-0000-0000-0000-000000000002'
-- );
--
-- SELECT id, title FROM content
-- WHERE id IN (
--   'e2e0000a-0000-0000-0000-000000000001',
--   'e2e0000b-0000-0000-0000-000000000001'
-- );
