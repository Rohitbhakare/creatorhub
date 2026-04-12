-- ═══════════════════════════════════════════════════════════════════
-- Migration 002: Users & Auth Tables
-- SRS: §5 users, DD-035, DD-039, IAM-FR-001, IAM-FR-002
-- ═══════════════════════════════════════════════════════════════════

-- ── Users ────────────────────────────────────────────────────────
CREATE TABLE users (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone                   text NOT NULL UNIQUE,
  display_name            text,
  username                text UNIQUE,
  bio                     text,
  email                   text,
  avatar_url              text,
  is_creator              boolean NOT NULL DEFAULT false,

  -- Location (DD-009, ONB-FR-002)
  current_city_id         text,                             -- FK added after cities table
  current_location_point  geography(POINT, 4326),
  location_last_updated   timestamptz,
  location_source         text CHECK (location_source IN ('gps', 'manual')),

  -- Profile (DD-035, DD-039)
  username_changed_at     timestamptz,                      -- null = never changed (first set doesn't count)
  featured                boolean NOT NULL DEFAULT false,    -- DD-039
  dnd_enabled             boolean NOT NULL DEFAULT false,    -- NOT-FR-003

  -- KYC
  kyc_status              varchar(20) NOT NULL DEFAULT 'not_started'
                          CHECK (kyc_status IN ('not_started', 'pending', 'verified', 'rejected', 'expired')),
  kyc_approved_at         timestamptz,

  -- Onboarding
  onboarding_completed_at timestamptz,

  -- Auth
  last_login_at           timestamptz,
  firebase_uid            text UNIQUE,

  -- Denormalized counts (updated by application logic)
  follower_count          int NOT NULL DEFAULT 0,
  following_count         int NOT NULL DEFAULT 0,
  content_count           int NOT NULL DEFAULT 0,

  -- Timestamps
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX users_location_idx ON users USING GIST (current_location_point);
CREATE INDEX users_username_idx ON users (username) WHERE username IS NOT NULL;
CREATE INDEX users_phone_idx ON users (phone);
CREATE INDEX users_firebase_uid_idx ON users (firebase_uid) WHERE firebase_uid IS NOT NULL;

-- ── User Active Verticals (ONB-FR-003) ──────────────────────────
CREATE TABLE user_active_verticals (
  user_id   uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vertical  vertical_type NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, vertical)
);

-- ── User Devices (IAM-FR-002) ───────────────────────────────────
CREATE TABLE user_devices (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id       text,
  platform        text CHECK (platform IN ('ios', 'android', 'web')),
  app_version     text,
  fcm_token       text,
  refresh_token_hash text,            -- SHA-256 hash of refresh token
  last_active_at  timestamptz NOT NULL DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX user_devices_user_idx ON user_devices (user_id);

-- ── Audit Events (IAM-FR-002, PROF-FR-009) ──────────────────────
CREATE TABLE audit_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES users(id) ON DELETE SET NULL,
  event_type  text NOT NULL,             -- sign_in, sign_out, sign_up, token_refresh, phone_changed, device_added
  ip_address  inet,
  user_agent  text,
  metadata    jsonb DEFAULT '{}',        -- never store tokens, OTP codes, or PII here
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX audit_events_user_idx ON audit_events (user_id, created_at DESC);

-- ── Updated_at trigger function ─────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
