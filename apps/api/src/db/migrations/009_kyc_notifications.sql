-- ═══════════════════════════════════════════════════════════════════
-- Migration 009: KYC & Notification Tables
-- SRS: DD-049–DD-056, NOT-FR-001–005
-- ═══════════════════════════════════════════════════════════════════

-- ── KYC Submissions (DD-049–DD-056) ─────────────────────────────
CREATE TABLE kyc_submissions (
  id                              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id                      uuid NOT NULL REFERENCES users(id),
  status                          varchar(20) NOT NULL DEFAULT 'pending'
                                  CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),

  -- PAN (DD-050)
  pan_number_hash                 varchar(64) NOT NULL,   -- SHA-256 hash (never plaintext)
  pan_name                        varchar(255) NOT NULL,
  pan_photo_url                   text NOT NULL,          -- encrypted, time-limited signed URL

  -- Aadhaar (DD-051)
  aadhaar_number_hash             varchar(64) NOT NULL,   -- SHA-256 hash (never plaintext)
  aadhaar_name                    varchar(255) NOT NULL,
  aadhaar_front_url               text NOT NULL,
  aadhaar_back_url                text NOT NULL,
  aadhaar_method                  varchar(20) DEFAULT 'manual'
                                  CHECK (aadhaar_method IN ('manual', 'digilocker')),

  -- Bank (DD-054)
  bank_account_holder             varchar(255) NOT NULL,
  bank_account_number_encrypted   text NOT NULL,          -- AES-256 encrypted (reversible for payout)
  bank_account_number_last4       varchar(4) NOT NULL,
  bank_ifsc                       varchar(11) NOT NULL,
  bank_name                       varchar(255),           -- auto-filled from RBI IFSC API
  bank_branch                     varchar(255),
  bank_city                       varchar(100),
  bank_account_type               varchar(20)
                                  CHECK (bank_account_type IN ('savings', 'current')),

  -- Selfie (DD-055)
  selfie_url                      text NOT NULL,          -- encrypted, time-limited signed URL

  -- Declaration (DD-056)
  declaration_accepted            boolean NOT NULL DEFAULT false,
  declaration_accepted_at         timestamptz,

  -- Review workflow
  submitted_at                    timestamptz NOT NULL DEFAULT now(),
  reviewed_at                     timestamptz,
  reviewed_by                     uuid REFERENCES users(id), -- must have reviewer role
  rejection_reasons               jsonb,                  -- [{field, reason}] per KYC-FR-028
  resubmission_count              int NOT NULL DEFAULT 0, -- incremented on each fix (KYC-FR-029)

  -- Timestamps
  created_at                      timestamptz NOT NULL DEFAULT now(),
  updated_at                      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX kyc_submissions_creator_idx ON kyc_submissions (creator_id);
CREATE INDEX kyc_submissions_status_idx ON kyc_submissions (status);
CREATE INDEX kyc_submissions_submitted_idx ON kyc_submissions (submitted_at DESC);
CREATE INDEX kyc_submissions_pending_idx ON kyc_submissions (status, submitted_at)
  WHERE status = 'pending';

CREATE TRIGGER kyc_submissions_updated_at
  BEFORE UPDATE ON kyc_submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── User Notification Preferences (NOT-FR-001) ─────────────────
-- 6 categories × 3 channels = 18 preference rows per user
CREATE TABLE user_notification_preferences (
  user_id   uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category  text NOT NULL CHECK (category IN (
    'bookings_trips',
    'messages_creators',
    'new_content_followed',
    'activity_own_content',
    'platform_updates',
    'promotions'
  )),
  channel   text NOT NULL CHECK (channel IN ('push', 'whatsapp', 'email')),
  enabled   boolean NOT NULL DEFAULT false,
  PRIMARY KEY (user_id, category, channel)
);

-- ── Notifications (NOT-FR-002–005) ──────────────────────────────
CREATE TABLE notifications (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category      text NOT NULL CHECK (category IN (
    'bookings_trips',
    'messages_creators',
    'new_content_followed',
    'activity_own_content',
    'platform_updates',
    'promotions'
  )),
  channel       text NOT NULL CHECK (channel IN ('push', 'whatsapp', 'email', 'in_app')),
  title         text NOT NULL,
  body          text NOT NULL,
  data          jsonb DEFAULT '{}',                      -- deep link target, metadata
  image_url     text,
  is_read       boolean NOT NULL DEFAULT false,
  read_at       timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX notifications_user_idx ON notifications (user_id, created_at DESC);
CREATE INDEX notifications_unread_idx ON notifications (user_id, is_read, created_at DESC)
  WHERE is_read = false;
