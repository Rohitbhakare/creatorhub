-- ═══════════════════════════════════════════════════════════════════
-- Migration 007: Social & Engagement Tables
-- SRS: SOC-FR-001–011, DD-030, DD-031, DD-034
-- ═══════════════════════════════════════════════════════════════════

-- ── Follows (SOC-FR-001) ────────────────────────────────────────
CREATE TABLE follows (
  follower_id   uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id  uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id != following_id)                    -- prevent self-follow
);

CREATE INDEX follows_following_idx ON follows (following_id, created_at DESC);
CREATE INDEX follows_follower_idx ON follows (follower_id, created_at DESC);

-- ── Likes (SOC-FR-002) ──────────────────────────────────────────
CREATE TABLE likes (
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_id  uuid NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, content_id)
);

CREATE INDEX likes_content_idx ON likes (content_id, created_at DESC);

-- ── Comments (SOC-FR-003) ───────────────────────────────────────
CREATE TABLE comments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id  uuid NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id   uuid REFERENCES comments(id) ON DELETE CASCADE, -- threading
  body        text NOT NULL CHECK (char_length(body) <= 1000),
  is_edited   boolean NOT NULL DEFAULT false,
  deleted_at  timestamptz,                                -- soft delete
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX comments_content_idx ON comments (content_id, created_at)
  WHERE deleted_at IS NULL;
CREATE INDEX comments_user_idx ON comments (user_id, created_at DESC);
CREATE INDEX comments_parent_idx ON comments (parent_id)
  WHERE parent_id IS NOT NULL;

CREATE TRIGGER comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Saved Lists (DD-030, replaces user_saves) ───────────────────
CREATE TABLE saved_lists (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name              text NOT NULL,
  cover_content_id  uuid REFERENCES content(id) ON DELETE SET NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX saved_lists_user_idx ON saved_lists (user_id);

CREATE TRIGGER saved_lists_updated_at
  BEFORE UPDATE ON saved_lists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Saved List Items ────────────────────────────────────────────
CREATE TABLE saved_list_items (
  list_id     uuid NOT NULL REFERENCES saved_lists(id) ON DELETE CASCADE,
  content_id  uuid NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  added_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (list_id, content_id)
);

CREATE INDEX saved_list_items_content_idx ON saved_list_items (content_id);

-- ── Shares (SOC-FR-006) ─────────────────────────────────────────
CREATE TABLE shares (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES users(id) ON DELETE SET NULL, -- nullable for guest shares
  content_id  uuid NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  platform    text NOT NULL CHECK (platform IN ('whatsapp', 'instagram', 'twitter', 'copy_link', 'other')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX shares_content_idx ON shares (content_id, created_at DESC);

-- ── Reports (TS-FR-001) ─────────────────────────────────────────
CREATE TABLE reports (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reported_type   text NOT NULL CHECK (reported_type IN ('content', 'user', 'comment')),
  reported_id     uuid NOT NULL,                         -- polymorphic FK (content.id, users.id, or comments.id)
  reason          text NOT NULL,
  description     text,
  status          report_status NOT NULL DEFAULT 'open',
  reviewed_by     uuid REFERENCES users(id),
  reviewed_at     timestamptz,
  action_taken    text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX reports_status_idx ON reports (status, created_at DESC)
  WHERE status IN ('open', 'in_review');
CREATE INDEX reports_reported_idx ON reports (reported_type, reported_id);

-- ── Connected Social Accounts (DD-031) ──────────────────────────
CREATE TABLE user_social_accounts (
  user_id                     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform                    text NOT NULL CHECK (platform IN ('youtube', 'instagram')),
  platform_user_id            text NOT NULL,
  platform_username           text NOT NULL,
  subscriber_count            int,
  previous_subscriber_count   int,
  previous_fetched_at         timestamptz,
  last_synced_at              timestamptz,
  sync_state                  text NOT NULL DEFAULT 'healthy'
                              CHECK (sync_state IN ('healthy', 'delayed', 'failed', 'rate_limited', 'revoked')),
  access_token_encrypted      bytea,
  refresh_token_encrypted     bytea,
  connected_at                timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, platform)
);

-- ── Studio Alerts (DD-034, STUD-FR-001) ─────────────────────────
CREATE TABLE studio_alerts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  alert_type  text NOT NULL,
  priority    int NOT NULL,
  payload     jsonb NOT NULL,
  cta_target  text,
  expires_at  timestamptz,
  dismissed_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX studio_alerts_active_idx ON studio_alerts (user_id, priority DESC)
  WHERE dismissed_at IS NULL;

-- ── Editorial Collections (DD-014) ──────────────────────────────
CREATE TABLE editorial_collections (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            text UNIQUE NOT NULL,
  title           text NOT NULL,
  subtitle        text,
  cover_image_url text,
  content_ids     uuid[] NOT NULL,
  is_active       boolean NOT NULL DEFAULT true,
  priority        int NOT NULL DEFAULT 0,
  source          text NOT NULL CHECK (source IN ('algorithmic', 'manual')),
  scheduled_start timestamptz,
  scheduled_end   timestamptz,
  created_by      uuid REFERENCES users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  refreshed_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX editorial_collections_active_idx ON editorial_collections (is_active, priority DESC, scheduled_start);

-- ── Reviews (REV-FR-001–002) ────────────────────────────────────
-- Blind reviews: both parties submit before reveal (14-day deadline)
CREATE TABLE reviews (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id      uuid NOT NULL,                         -- FK added after bookings table
  reviewer_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reviewee_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_id      uuid NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  rating          int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body            text CHECK (char_length(body) <= 2000),
  is_revealed     boolean NOT NULL DEFAULT false,        -- true after both submit or 14-day deadline
  revealed_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX reviews_content_idx ON reviews (content_id) WHERE is_revealed = true;
CREATE INDEX reviews_booking_idx ON reviews (booking_id);
CREATE INDEX reviews_reviewee_idx ON reviews (reviewee_id) WHERE is_revealed = true;

CREATE TRIGGER reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
