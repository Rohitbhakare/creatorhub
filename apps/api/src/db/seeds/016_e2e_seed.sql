-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: 016_e2e_seed.sql
-- Purpose:   Insert deterministic test accounts, experience, and bookings
--            required by the Patrol E2E test suite (E3.1).
--
-- Apply to staging before running E2E tests:
--   psql $DATABASE_URL -f apps/api/src/db/seeds/016_e2e_seed.sql
--
-- SAFE to re-run — all inserts use ON CONFLICT DO NOTHING.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Test Users ─────────────────────────────────────────────────────────
--
-- Phone 9090909090 → Traveler / Booker persona
--   - onboarding completed
--   - is_creator = false (no content, no KYC)
--   - Used in: auth, feed, social, discovery, profile, booking scenarios
--
-- Phone 7588005893 → Creator persona
--   - is_creator = true
--   - kyc_status = 'approved' (so they can publish paid content)
--   - Used in: creation, studio, KYC scenarios
--   - For the "unkyc" scenario: we use this same phone but the test step
--     logs in as a user whose kyc_status is 'not_started' (handled by
--     registering a second account in the unkyc persona IF needed; for now
--     both map to this user ID)

INSERT INTO users (
  id, phone, display_name, username, bio,
  is_creator, kyc_status,
  onboarding_completed_at, city_id, created_at, updated_at
)
VALUES
  (
    'e2e00000-0000-0000-0000-000000000001',
    '9090909090',
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
    '7588005893',
    'E2E Creator',
    'e2e_creator',
    'Test creator account for E2E automation.',
    true,
    'approved',
    now() - interval '30 days',
    (SELECT id FROM cities WHERE name = 'Jaipur' LIMIT 1),
    now() - interval '30 days',
    now()
  )
ON CONFLICT (id) DO NOTHING;

-- Verticals for traveler (follows Travel + Stories)
INSERT INTO user_active_verticals (user_id, vertical)
VALUES
  ('e2e00000-0000-0000-0000-000000000001', 'travel'),
  ('e2e00000-0000-0000-0000-000000000001', 'stories'),
  ('e2e00000-0000-0000-0000-000000000002', 'travel'),
  ('e2e00000-0000-0000-0000-000000000002', 'stories')
ON CONFLICT DO NOTHING;

-- The traveler follows the seed creator (Vikram Singh) so their content
-- shows up in the traveler's home feed.
INSERT INTO follows (follower_id, followee_id, created_at)
VALUES
  ('e2e00000-0000-0000-0000-000000000001', 'a6666666-6666-6666-6666-666666666666', now())
ON CONFLICT DO NOTHING;

-- The traveler also has a default saved list (for save-to-list scenarios)
INSERT INTO saved_lists (id, user_id, name, created_at)
VALUES
  ('e2elist0-0000-0000-0000-e2elist0001', 'e2e00000-0000-0000-0000-000000000001', 'Favourites', now())
ON CONFLICT (id) DO NOTHING;


-- ── 2. Seed Scheduled Experience (paid) ──────────────────────────────────
--
-- "Sunrise Photography Walk — Jaipur"
-- Hosted by Vikram Singh (a6666666), capacity = 2 (for Sold Out test)
-- Price = ₹1,500 (150000 paisa)

INSERT INTO content (
  id, user_id, type, vertical,
  title, description,
  status, visibility, pricing_model, price_paisa,
  published_at, like_count, save_count, view_count,
  starting_city_id
)
VALUES (
  'e2eexp00-e2e0-e2e0-e2e0-e2eexp000001',
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
  'e2eexp00-e2e0-e2e0-e2e0-e2eexp000001',
  'image',
  'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800',
  0
)
ON CONFLICT DO NOTHING;

-- Experience occurrence: a future date for the main booking test
INSERT INTO experience_occurrences (
  id, content_id, starts_at, ends_at, capacity, booked_count, status
)
VALUES
  (
    'e2eocc00-0000-0000-0000-e2eoccur0001',
    'e2eexp00-e2e0-e2e0-e2e0-e2eexp000001',
    now() + interval '30 days',
    now() + interval '30 days' + interval '3 hours',
    2,
    0,
    'open'
  ),
  -- A past occurrence for the "completed booking" scenario
  (
    'e2eocc00-0000-0000-0000-e2eoccur0002',
    'e2eexp00-e2e0-e2e0-e2e0-e2eexp000001',
    now() - interval '10 days',
    now() - interval '10 days' + interval '3 hours',
    2,
    1,
    'completed'
  )
ON CONFLICT (id) DO NOTHING;


-- ── 3. Seed Bookings ──────────────────────────────────────────────────────
--
-- seedBookingId    → confirmed future booking for the traveler (cancellable)
-- seedCompletedBookingId → past completed booking (for write-review scenario)

INSERT INTO bookings (
  id, user_id, content_id, occurrence_id,
  status, base_price_paisa, platform_fee_paisa, gst_paisa, total_paisa,
  payment_id, created_at, updated_at
)
VALUES
  (
    'e2ebk000-0000-0000-0000-e2ebooking01',
    'e2e00000-0000-0000-0000-000000000001',
    'e2eexp00-e2e0-e2e0-e2e0-e2eexp000001',
    'e2eocc00-0000-0000-0000-e2eoccur0001',
    'confirmed',
    150000,      -- ₹1,500 base
    25500,       -- ₹255 platform fee (17%)
    27000,       -- ₹270 GST (18% on base)
    202500,      -- ₹2,025 total
    'pay_e2etest_booking_01',
    now() - interval '5 days',
    now() - interval '5 days'
  ),
  (
    'e2ebk000-0000-0000-0000-e2ebooking02',
    'e2e00000-0000-0000-0000-000000000001',
    'e2eexp00-e2e0-e2e0-e2e0-e2eexp000001',
    'e2eocc00-0000-0000-0000-e2eoccur0002',
    'completed',
    150000,
    25500,
    27000,
    202500,
    'pay_e2etest_booking_02',
    now() - interval '15 days',
    now() - interval '9 days'   -- updated when occurrence completed
  )
ON CONFLICT (id) DO NOTHING;

-- Update occurrence booked_count for the future occurrence
UPDATE experience_occurrences
SET booked_count = 1
WHERE id = 'e2eocc00-0000-0000-0000-e2eoccur0001';


-- ── 4. KYC record for the creator account ────────────────────────────────
--
-- The "unkyc" test scenario needs a creator with kyc_status = 'not_started'.
-- We use the same phone (7588005893) but the scenario logs in and checks
-- the studio for an incomplete KYC state.
--
-- For the "approved" creator scenarios, kyc_status is set on the user row.
-- For the "unkyc" scenario: temporarily update via test setup or use a
-- separate Firebase test number (register 7588005893 as unkyc by default —
-- the "creator" scenarios will need the DB to show approved status, which
-- requires a kyc_records row).

INSERT INTO kyc_records (
  id, user_id, status, pan_number,
  aadhaar_last4, bank_account_last4, ifsc_code,
  submitted_at, reviewed_at, created_at, updated_at
)
VALUES (
  'e2ekyc00-0000-0000-0000-e2ekyc00001',
  'e2e00000-0000-0000-0000-000000000002',
  'approved',
  'ABCDE1234F',
  '9012',
  '7890',
  'HDFC0001234',
  now() - interval '20 days',
  now() - interval '18 days',
  now() - interval '20 days',
  now() - interval '18 days'
)
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- ── Quick verification query ─────────────────────────────────────────────
-- Run this after applying to confirm seed is in place:
--
-- SELECT id, phone, display_name, is_creator, kyc_status
-- FROM users
-- WHERE id IN (
--   'e2e00000-0000-0000-0000-000000000001',
--   'e2e00000-0000-0000-0000-000000000002'
-- );
--
-- SELECT id, status FROM bookings
-- WHERE id IN (
--   'e2ebk000-0000-0000-0000-e2ebooking01',
--   'e2ebk000-0000-0000-0000-e2ebooking02'
-- );
