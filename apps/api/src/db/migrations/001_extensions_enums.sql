-- ═══════════════════════════════════════════════════════════════════
-- Migration 001: Extensions & Enums
-- CreatorHub — E0.2 Database Schema
-- ═══════════════════════════════════════════════════════════════════

-- ── Extensions ───────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";       -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "postgis";        -- geography, ST_DWithin, etc.
CREATE EXTENSION IF NOT EXISTS "pg_trgm";        -- fuzzy text search (city names)

-- ── Enums ────────────────────────────────────────────────────────

CREATE TYPE content_type AS ENUM (
  'post',
  'event',
  'scheduled_experience',
  'self_paced_itinerary'
);

CREATE TYPE vertical_type AS ENUM (
  'travel',
  'stories',
  'food',
  'fitness',
  'education',
  'photography',
  'music',
  'wellness'
);

CREATE TYPE content_status AS ENUM (
  'draft',
  'under_review',
  'published',
  'unpublished',
  'archived',
  'rejected',
  'taken_down'
);

CREATE TYPE visibility_type AS ENUM (
  'public',
  'unlisted',
  'private'
);

CREATE TYPE pricing_model AS ENUM (
  'free',
  'paid'
);

CREATE TYPE spot_stop_type AS ENUM (
  'regular',
  'overnight',
  'meal',
  'viewpoint',
  'activity'
);

CREATE TYPE booking_status AS ENUM (
  'pending_payment',
  'paid',
  'confirmed',
  'in_progress',
  'completed',
  'reviewed',
  'cancelled_by_user',
  'cancelled_by_creator',
  'refunded',
  'disputed'
);

CREATE TYPE payment_status AS ENUM (
  'initiated',
  'success',
  'failed',
  'refunded'
);

CREATE TYPE report_status AS ENUM (
  'open',
  'in_review',
  'actioned',
  'dismissed'
);
