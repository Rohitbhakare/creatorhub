# E0.2 — Tasks

## T1: Create Enums & Extension Setup
**Files:** `apps/api/src/db/migrations/001_extensions_enums.sql`
**SRS:** §5 DDL (enums)
**Acceptance:** PostGIS, pgcrypto, pg_trgm extensions enabled. All enums created: `content_type`, `content_status`, `visibility`, `pricing_model`, `vertical`, `spot_stop_type`, `booking_status`, `kyc_status`.
**Edge cases:**
- Extensions must use `CREATE EXTENSION IF NOT EXISTS` (idempotent)
- Enum values must match SRS exactly — no extra, no missing

## T2: Users & Auth Tables
**Files:** `apps/api/src/db/migrations/002_users.sql`
**SRS:** §5 users DDL, DD-035, DD-039, IAM-FR-001
**Acceptance:** `users` table with all columns (id, phone, display_name, username, bio, email, avatar_url, is_creator, kyc_status, current_city_id, current_location_point, location_source, location_last_updated, username_changed_at, dnd_enabled, featured, onboarding_completed_at, last_login_at, created_at, updated_at). `audit_events` table for login/security events. `user_devices` table for multi-device tracking.
**Edge cases:**
- `phone` must have UNIQUE constraint
- `username` must be UNIQUE and nullable (not set until creator)
- `username_changed_at` nullable (first set doesn't count as change)
- `id` uses `gen_random_uuid()` default
- Location columns nullable (set during onboarding)

## T3: Cities Table & Seed Data
**Files:** `apps/api/src/db/migrations/003_cities.sql`, `apps/api/src/db/seeds/cities.sql`
**SRS:** DD-009
**Acceptance:** `cities` table with ~4000 Indian cities. GIST index on `point` column. Seed file loads all cities with correct PostGIS points.
**Edge cases:**
- City IDs must be stable slugs (`in.mh.pune` format)
- UNIQUE constraint on `(name, state, country)` prevents duplicates
- Seed must handle re-runs idempotently (`INSERT ... ON CONFLICT DO NOTHING`)
- All ~4000 cities equally valid — no tier filtering

## T4: Vertical Sub-categories & Seed Data
**Files:** `apps/api/src/db/migrations/004_verticals.sql`, `apps/api/src/db/seeds/verticals.sql`
**SRS:** DD-006, DD-002
**Acceptance:** `vertical_sub_categories` table created. 12 travel sub-categories seeded. `user_active_verticals` and `user_waitlisted_verticals` tables created.
**Edge cases:**
- Sub-category IDs use dot notation (`travel.trekking`)
- `leaf_types` is a text array — must contain valid values
- `display_order` determines UI order
- Seed is idempotent

## T5: Content & Media Tables
**Files:** `apps/api/src/db/migrations/005_content.sql`
**SRS:** §5 content DDL, DD-009 (location columns), DD-039 (featured)
**Acceptance:** `content` table with all columns. `content_media` table for images/videos. Indexes on `user_id`, `type`, `status`, `vertical`, `starting_city_point` (GIST), `tsvector` for search.
**Edge cases:**
- `content_status` defaults to `draft`
- `visibility` defaults to `public`
- `pricing_model` defaults to `free`
- `vertical_data` JSONB can be null for posts
- Soft-delete: `deleted_at` column (nullable timestamp)
- Media ordering: `display_order` int on `content_media`

## T6: Itinerary & Event Tables
**Files:** `apps/api/src/db/migrations/006_itineraries_events.sql`
**SRS:** DD-021, DD-023, DD-025
**Acceptance:** `itinerary_days`, `itinerary_spots`, `scheduled_dates`, `meeting_points`, `event_occurrences` tables created with all constraints, foreign keys, and indexes.
**Edge cases:**
- `itinerary_spots.spot_order` must be unique per day (composite unique constraint)
- `scheduled_dates.spots_booked <= capacity` check constraint
- `event_occurrences.end_at > start_at` check constraint
- `meeting_points.exact_shared_hours_before` restricted to 12, 24, 48
- Cascading deletes: spots → days → content

## T7: Social & Engagement Tables
**Files:** `apps/api/src/db/migrations/007_social.sql`
**SRS:** SOC-FR-001–011, DD-030
**Acceptance:** `follows`, `likes`, `comments`, `saved_lists`, `saved_list_items` tables created. Proper indexes for feed queries. Unique constraints preventing duplicate follows/likes.
**Edge cases:**
- `follows`: UNIQUE on `(follower_id, following_id)`, self-follow prevented by CHECK constraint
- `likes`: UNIQUE on `(user_id, content_id)` — idempotent
- `comments`: `parent_id` for threading (self-referencing FK)
- `saved_lists`: user can have multiple lists, cover_content_id is optional
- Denormalized counts: `follower_count`, `following_count`, `like_count` on parent tables (updated via triggers or application logic)

## T8: Booking & Payment Tables
**Files:** `apps/api/src/db/migrations/008_bookings.sql`
**SRS:** BOOK-FR-001–007, TAX-FR-001–006
**Acceptance:** `bookings`, `payments`, `payouts`, `refunds` tables created. Booking state machine constraint. All amounts in BIGINT (paisa).
**Edge cases:**
- `bookings.status` must follow state machine transitions (validated in application layer, not DB)
- All money columns are BIGINT — never NUMERIC or FLOAT
- `payments.razorpay_order_id` UNIQUE (idempotent webhook handling)
- `payouts.scheduled_at` calculated as completion + 48h
- `refunds.amount_paisa` must be ≤ original payment

## T9: KYC & Notification Tables
**Files:** `apps/api/src/db/migrations/009_kyc_notifications.sql`
**SRS:** DD-049–DD-056, NOT-FR-001
**Acceptance:** `kyc_submissions` table with encrypted fields. `user_notification_preferences` table with category/channel matrix. `notifications` table for notification log.
**Edge cases:**
- `pan_number_hash`: SHA-256 (not reversible)
- `bank_account_number_encrypted`: AES-256 (reversible for payout)
- `kyc_status` enum: not_started, pending, verified, rejected, expired
- Notification categories: 6 categories × 3 channels = 18 preference rows per user
- Default preferences inserted on user creation

## T10: Search & Analytics Tables
**Files:** `apps/api/src/db/migrations/010_search.sql`
**SRS:** DD-015
**Acceptance:** `search_queries` table. `user_content_progress` table. Indexes for aggregation queries.
**Edge cases:**
- `search_queries.user_id` nullable (guest searches may be logged with session_id only)
- 90-day retention enforced by pg_cron job (not this epic — just create table)
- `normalized_query` is lowercased, trimmed for aggregation
- `user_content_progress.progress_pct` CHECK 0–100

## T11: RLS Policies
**Files:** `apps/api/src/db/migrations/011_rls.sql`
**SRS:** §5 RLS section
**Acceptance:** RLS enabled on all tables. Policies cover: users (self-read), content (public-read for published), bookings (owner/creator-read), saved_lists (own-only), notifications (own-only).
**Edge cases:**
- Service role key bypasses RLS for admin operations
- `content` public read: only `status='published' AND visibility='public'`
- Guest users (anon key) can read public content but not write
- RLS must not break API queries that use service role

## T12: Database Utility Functions
**Files:** `apps/api/src/db/migrations/012_functions.sql`
**SRS:** DD-009 (geo), §5 (search)
**Acceptance:** `nearby_content(lat, lng, radius_km)` function. `search_content(query)` function using tsvector. `get_vertical_creator_counts()` function.
**Edge cases:**
- `nearby_content`: radius must be in meters for `ST_DWithin` (convert km → m)
- `search_content`: handle empty query gracefully (return empty set)
- Functions use `SECURITY DEFINER` only when necessary; prefer `SECURITY INVOKER`
