-- Migration 032 — UUIDv7 default for high-write / time-ordered tables.
--
-- Why: UUIDv4 (gen_random_uuid) is purely random, so each INSERT lands at
-- a random index leaf — bad for B-tree locality, write-amplifies WAL, and
-- fragments indexes at scale. UUIDv7 puts a 48-bit Unix-ms timestamp at
-- the front and 74 random bits after, so new rows land near each other in
-- the index. Same uniqueness guarantee, plus implicit creation-time sort.
--
-- Trade-off: a v7 ID leaks its creation time (48-bit ms). Fine for public
-- content, follows, comments, audit/analytics events. NOT fine for
-- payments, KYC, password reset, DPDPA submissions — those stay v4 to
-- avoid leaking transaction/PII timestamps via the URL or header.
--
-- Scope of this migration:
--   - Adds a `gen_uuid_v7()` plpgsql function (no extension required;
--     uses pgcrypto's gen_random_bytes which we already have from migration
--     001).
--   - Switches the column DEFAULT on the v7-eligible tables. Existing
--     rows keep their v4 IDs — switching the default is non-rewriting,
--     metadata-only, and runs in milliseconds.
--   - Foreign keys that reference these tables continue to work without
--     change (uuid is uuid; v4 and v7 are interchangeable types).
--
-- Reversal: re-run with `ALTER COLUMN id SET DEFAULT gen_random_uuid()`
-- and DROP FUNCTION gen_uuid_v7(). Existing v7 rows remain valid uuids.

-- ─────────────────────────────────────────────────────────────────────
-- 1. UUIDv7 generator function (RFC 9562)
-- ─────────────────────────────────────────────────────────────────────
--
-- Layout:
--   bytes 0-5  = unix epoch milliseconds, big-endian (48 bits)
--   byte 6     = version nibble (0x7) | 4 random bits
--   byte 7     = 8 random bits
--   byte 8     = variant (top 2 bits = 10, RFC 4122) | 6 random bits
--   bytes 9-15 = 56 random bits
--
-- 74 bits of randomness total — collision probability remains negligible
-- (2^-37 chance after a billion IDs in a single ms; we'd need to issue
-- ~134 million IDs in one millisecond on one node before the birthday
-- bound becomes a concern).

CREATE OR REPLACE FUNCTION gen_uuid_v7()
RETURNS uuid
LANGUAGE plpgsql
VOLATILE PARALLEL SAFE
AS $$
DECLARE
  unix_ts_ms bytea;
  rand_bytes bytea;
  uuid_bytes bytea;
BEGIN
  -- Top 6 bytes of `int8send(<ms-since-epoch>)`. int8send produces 8 BE
  -- bytes; we drop the top 2 (always zero until year 10889) and keep 6.
  unix_ts_ms := substring(
    int8send(floor(extract(epoch FROM clock_timestamp()) * 1000)::bigint)
    FROM 3
  );
  -- 10 random bytes — together with the 6-byte timestamp = 16 bytes.
  rand_bytes := gen_random_bytes(10);
  uuid_bytes := unix_ts_ms || rand_bytes;

  -- Force version = 7 in byte 6 (high nibble).
  uuid_bytes := set_byte(uuid_bytes, 6, (get_byte(uuid_bytes, 6) & 15) | 112);
  -- Force variant = 10 (RFC 4122) in byte 8 (top 2 bits).
  uuid_bytes := set_byte(uuid_bytes, 8, (get_byte(uuid_bytes, 8) & 63) | 128);

  RETURN encode(uuid_bytes, 'hex')::uuid;
END;
$$;

COMMENT ON FUNCTION gen_uuid_v7() IS
  'UUIDv7 (RFC 9562) — 48-bit ms timestamp prefix + 74 random bits. Use as DEFAULT on high-write, time-ordered tables. NOT for tables where creation time is sensitive (payments, KYC, password reset).';

-- ─────────────────────────────────────────────────────────────────────
-- 2. Switch DEFAULT on v7-eligible tables
-- ─────────────────────────────────────────────────────────────────────
--
-- Each ALTER is metadata-only — it changes how future INSERTs without an
-- explicit `id` resolve. Existing rows are not touched. Foreign keys are
-- unaffected (still uuid → uuid).

-- Content domain (high write volume, public, time-ordered listings)
ALTER TABLE content        ALTER COLUMN id SET DEFAULT gen_uuid_v7();
ALTER TABLE content_media  ALTER COLUMN id SET DEFAULT gen_uuid_v7();
ALTER TABLE itinerary_days ALTER COLUMN id SET DEFAULT gen_uuid_v7();
ALTER TABLE itinerary_spots ALTER COLUMN id SET DEFAULT gen_uuid_v7();

-- Social (high write volume, time-ordered)
ALTER TABLE comments     ALTER COLUMN id SET DEFAULT gen_uuid_v7();
ALTER TABLE saved_lists  ALTER COLUMN id SET DEFAULT gen_uuid_v7();
ALTER TABLE shares       ALTER COLUMN id SET DEFAULT gen_uuid_v7();
ALTER TABLE studio_alerts ALTER COLUMN id SET DEFAULT gen_uuid_v7();

-- Audit / analytics / notifications (textbook append-only + time-ordered)
ALTER TABLE audit_events     ALTER COLUMN id SET DEFAULT gen_uuid_v7();
ALTER TABLE analytics_events ALTER COLUMN id SET DEFAULT gen_uuid_v7();
ALTER TABLE notifications    ALTER COLUMN id SET DEFAULT gen_uuid_v7();
ALTER TABLE search_queries   ALTER COLUMN id SET DEFAULT gen_uuid_v7();
ALTER TABLE admin_audit_log  ALTER COLUMN id SET DEFAULT gen_uuid_v7();

-- Webhook event log (append-only, time-ordered)
ALTER TABLE razorpay_webhook_events ALTER COLUMN id SET DEFAULT gen_uuid_v7();

-- Event occurrences (one row per scheduled instance — moderate volume)
ALTER TABLE event_occurrences ALTER COLUMN id SET DEFAULT gen_uuid_v7();

-- Waitlist (time-ordered FIFO; position correlates with timestamp anyway)
ALTER TABLE waitlist_entries ALTER COLUMN id SET DEFAULT gen_uuid_v7();

-- ─────────────────────────────────────────────────────────────────────
-- 3. Tables intentionally LEFT on gen_random_uuid() (UUIDv4)
-- ─────────────────────────────────────────────────────────────────────
--
-- Listed here so future migrations don't accidentally migrate them.
-- Rationale: timing-of-row is a side-channel for these. v4 keeps creation
-- time unguessable from the ID alone.
--
--   users                       — account-creation timing leaks profile
--   user_devices                — device-registration sequence
--   bookings, booking_intents   — payment/transaction timing (fraud signal)
--   booking_financials, payments, payouts, refunds, disputes
--                               — financial records
--   razorpay_linked_accounts    — payout-account onboarding sequence
--   kyc_submissions             — PII; submission timing is a privacy issue
--   dpdpa_consents              — DPDPA evidence; tamper-evident IDs preferred random
--   dpdpa_data_requests
--   grievances                  — DPDPA-aligned, sensitive
--   tnc_consents, tnc_versions, cancellation_policy_versions
--                               — legal records (low volume; v4 fine)
--   admin_users                 — admin PII
--   reports                     — T&S; reporter privacy
--   scheduled_dates             — low volume; v4 fine
--   meeting_points              — same
--   feature_flags, platform_settings, search_placeholder_defaults,
--   user_active_verticals, user_notification_preferences,
--   user_social_accounts        — config/lookup tables, not appropriate for v7
