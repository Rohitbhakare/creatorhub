-- ═══════════════════════════════════════════════════════════════════
-- Migration 008: Booking, Payment & Financial Tables
-- SRS: BOOK-FR-001–007, TAX-FR-001–006
-- All amounts in BIGINT paisa (§5.4)
-- ═══════════════════════════════════════════════════════════════════

-- ── T&C Versions (CRT-FR-021) ───────────────────────────────────
-- Consent record: each row = one creator accepting T&Cs at publish time
CREATE TABLE tnc_versions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES users(id),
  content_id    uuid REFERENCES content(id),
  tnc_version   text NOT NULL,                           -- e.g. '2026-04-10-v1'
  consented_at  timestamptz NOT NULL DEFAULT now(),
  ip_address    inet,
  user_agent    text
);

CREATE INDEX tnc_versions_user_idx ON tnc_versions (user_id);

-- ── Cancellation Policy Versions (CRT-FR-025) ──────────────────
CREATE TABLE cancellation_policy_versions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_name     text NOT NULL CHECK (policy_name IN ('flexible', 'moderate', 'strict')),
  policy_text     text NOT NULL,
  effective_from  timestamptz NOT NULL,
  effective_to    timestamptz                            -- NULL = currently active version
);

CREATE INDEX cancellation_policy_active_idx ON cancellation_policy_versions (policy_name)
  WHERE effective_to IS NULL;

-- ── Bookings (BOOK-FR-001–007) ──────────────────────────────────
CREATE TABLE bookings (
  id                              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id                      uuid NOT NULL REFERENCES content(id),
  scheduled_date_id               uuid REFERENCES scheduled_dates(id),  -- for scheduled experiences
  user_id                         uuid NOT NULL REFERENCES users(id),   -- buyer
  creator_id                      uuid NOT NULL REFERENCES users(id),   -- seller

  -- State machine (validated in application layer)
  status                          booking_status NOT NULL DEFAULT 'pending_payment',

  -- Participant info
  participant_count               int NOT NULL DEFAULT 1 CHECK (participant_count >= 1),
  participant_details             jsonb,                  -- [{name, phone, age}]

  -- T&C and cancellation policy snapshots
  tnc_version_id                  uuid REFERENCES tnc_versions(id),
  cancellation_policy_version_id  uuid REFERENCES cancellation_policy_versions(id),

  -- Timestamps for state transitions
  paid_at                         timestamptz,
  confirmed_at                    timestamptz,
  started_at                      timestamptz,
  completed_at                    timestamptz,
  cancelled_at                    timestamptz,
  cancelled_by                    text CHECK (cancelled_by IN ('user', 'creator', 'system')),
  cancellation_reason             text,

  -- Timestamps
  created_at                      timestamptz NOT NULL DEFAULT now(),
  updated_at                      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX bookings_user_idx ON bookings (user_id, created_at DESC);
CREATE INDEX bookings_creator_idx ON bookings (creator_id, created_at DESC);
CREATE INDEX bookings_content_idx ON bookings (content_id);
CREATE INDEX bookings_status_idx ON bookings (status)
  WHERE status NOT IN ('completed', 'reviewed', 'refunded');
CREATE INDEX bookings_scheduled_date_idx ON bookings (scheduled_date_id)
  WHERE scheduled_date_id IS NOT NULL;

CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Add FK from reviews → bookings (deferred from 007)
ALTER TABLE reviews
  ADD CONSTRAINT reviews_booking_fk
  FOREIGN KEY (booking_id) REFERENCES bookings(id);

-- ── Booking Financials (1:1 with bookings) ──────────────────────
-- Separated for clarity — all amounts in paisa
CREATE TABLE booking_financials (
  booking_id          uuid PRIMARY KEY REFERENCES bookings(id) ON DELETE CASCADE,

  -- Amounts (all BIGINT paisa — never float)
  base_price_paisa    bigint NOT NULL CHECK (base_price_paisa >= 0),
  gst_paisa           bigint NOT NULL CHECK (gst_paisa >= 0),       -- 18% of base
  platform_fee_paisa  bigint NOT NULL CHECK (platform_fee_paisa >= 0), -- 17% of base
  total_paisa         bigint NOT NULL CHECK (total_paisa >= 0),     -- base + gst (buyer pays)
  creator_payout_paisa bigint NOT NULL CHECK (creator_payout_paisa >= 0), -- base - platform_fee - tds
  tds_paisa           bigint NOT NULL CHECK (tds_paisa >= 0),       -- 1% of payout (Sec 194-O)

  -- Currency
  currency            text NOT NULL DEFAULT 'INR',

  created_at          timestamptz NOT NULL DEFAULT now()
);

-- ── Payments (BOOK-FR-003) ──────────────────────────────────────
CREATE TABLE payments (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id          uuid NOT NULL REFERENCES bookings(id),
  amount_paisa        bigint NOT NULL CHECK (amount_paisa > 0),
  currency            text NOT NULL DEFAULT 'INR',
  status              payment_status NOT NULL DEFAULT 'initiated',
  payment_method      text,                              -- 'upi', 'card', 'netbanking', 'wallet'

  -- Razorpay integration
  razorpay_order_id   text UNIQUE,
  razorpay_payment_id text UNIQUE,
  razorpay_signature  text,

  -- Metadata
  gateway_response    jsonb,                             -- sanitized gateway response (no secrets)
  failure_reason      text,

  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX payments_booking_idx ON payments (booking_id);
CREATE INDEX payments_status_idx ON payments (status)
  WHERE status = 'initiated';

CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Payouts (TAX-FR-005) ────────────────────────────────────────
CREATE TABLE payouts (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id          uuid NOT NULL REFERENCES bookings(id),
  creator_id          uuid NOT NULL REFERENCES users(id),
  amount_paisa        bigint NOT NULL CHECK (amount_paisa > 0),
  tds_paisa           bigint NOT NULL DEFAULT 0 CHECK (tds_paisa >= 0),
  currency            text NOT NULL DEFAULT 'INR',
  status              text NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'scheduled', 'processing', 'completed', 'failed')),

  -- Razorpay Route
  razorpay_transfer_id text UNIQUE,
  razorpay_payout_id   text UNIQUE,

  scheduled_at        timestamptz NOT NULL,              -- completion + 48h
  processed_at        timestamptz,
  failure_reason      text,

  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX payouts_creator_idx ON payouts (creator_id, created_at DESC);
CREATE INDEX payouts_status_idx ON payouts (status)
  WHERE status IN ('pending', 'scheduled', 'processing');

CREATE TRIGGER payouts_updated_at
  BEFORE UPDATE ON payouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Refunds (BOOK-FR-006) ───────────────────────────────────────
CREATE TABLE refunds (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id          uuid NOT NULL REFERENCES bookings(id),
  payment_id          uuid NOT NULL REFERENCES payments(id),
  amount_paisa        bigint NOT NULL CHECK (amount_paisa > 0),
  reason              text NOT NULL,
  policy_applied      text CHECK (policy_applied IN ('flexible', 'moderate', 'strict')),
  refund_percentage   int CHECK (refund_percentage BETWEEN 0 AND 100),
  status              text NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'processing', 'completed', 'failed')),

  -- Razorpay
  razorpay_refund_id  text UNIQUE,

  initiated_by        text NOT NULL CHECK (initiated_by IN ('user', 'creator', 'system')),
  processed_at        timestamptz,
  failure_reason      text,

  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX refunds_booking_idx ON refunds (booking_id);

CREATE TRIGGER refunds_updated_at
  BEFORE UPDATE ON refunds
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Disputes ────────────────────────────────────────────────────
CREATE TABLE disputes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id      uuid NOT NULL REFERENCES bookings(id),
  raised_by       uuid NOT NULL REFERENCES users(id),
  reason          text NOT NULL,
  description     text,
  status          text NOT NULL DEFAULT 'open'
                  CHECK (status IN ('open', 'under_review', 'resolved', 'escalated')),
  resolution      text,
  resolved_by     uuid REFERENCES users(id),
  resolved_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX disputes_booking_idx ON disputes (booking_id);
CREATE INDEX disputes_status_idx ON disputes (status)
  WHERE status IN ('open', 'under_review');

CREATE TRIGGER disputes_updated_at
  BEFORE UPDATE ON disputes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Razorpay Linked Accounts ────────────────────────────────────
-- For Route (escrow) — links creator's bank account to Razorpay
CREATE TABLE razorpay_linked_accounts (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  razorpay_account_id     text UNIQUE NOT NULL,
  status                  text NOT NULL DEFAULT 'created'
                          CHECK (status IN ('created', 'activated', 'suspended', 'deactivated')),
  business_type           text,
  activated_at            timestamptz,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX razorpay_linked_accounts_user_idx ON razorpay_linked_accounts (user_id);

-- ── Razorpay Webhook Events ─────────────────────────────────────
-- Idempotency: store webhook event IDs to prevent duplicate processing
CREATE TABLE razorpay_webhook_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        text UNIQUE NOT NULL,                  -- Razorpay event ID
  event_type      text NOT NULL,                         -- payment.captured, refund.processed, etc.
  payload         jsonb NOT NULL,                        -- sanitized webhook payload
  processed       boolean NOT NULL DEFAULT false,
  processed_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX razorpay_webhook_events_type_idx ON razorpay_webhook_events (event_type, created_at DESC);
