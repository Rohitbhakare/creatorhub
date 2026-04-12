-- ═══════════════════════════════════════════════════════════════════
-- Migration 005: Content & Media Tables
-- SRS: §5 content DDL, DD-009, DD-006, DD-039
-- ═══════════════════════════════════════════════════════════════════

-- ── Content (master table for all 4 content types) ──────────────
CREATE TABLE content (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type                  content_type NOT NULL,
  vertical              vertical_type NOT NULL,

  -- Core fields
  title                 text,
  description           text,
  body                  text,                           -- rich text body for posts

  -- Status & visibility
  status                content_status NOT NULL DEFAULT 'draft',
  visibility            visibility_type NOT NULL DEFAULT 'public',
  published_at          timestamptz,
  unpublished_at        timestamptz,

  -- Pricing (DD-022)
  pricing_model         pricing_model NOT NULL DEFAULT 'free',
  price_paisa           bigint DEFAULT 0 CHECK (price_paisa >= 0),

  -- Taxonomy (DD-006)
  sub_category_id       text REFERENCES vertical_sub_categories(id),
  leaf_type             text,
  tags                  text[] DEFAULT '{}',
  facets                jsonb DEFAULT '{}'::jsonb,       -- {group_size, budget, difficulty, duration, season}

  -- Vertical-specific data (ADR-009)
  vertical_data         jsonb,                           -- schema enforced at API layer via Zod

  -- Location (DD-009)
  starting_city_id      text REFERENCES cities(id),
  starting_city_point   geography(POINT, 4326),
  destination_city_ids  text[] DEFAULT '{}',

  -- Moderation & featuring (DD-039)
  featured              boolean NOT NULL DEFAULT false,
  moderation_status     text CHECK (moderation_status IN ('clean', 'flagged', 'reviewed')),
  moderation_score      numeric(4,3),                    -- Perspective API score

  -- Duration (for itineraries, experiences)
  duration_minutes      int,

  -- Denormalized counts (updated by application logic)
  like_count            int NOT NULL DEFAULT 0,
  comment_count         int NOT NULL DEFAULT 0,
  save_count            int NOT NULL DEFAULT 0,
  share_count           int NOT NULL DEFAULT 0,
  view_count            int NOT NULL DEFAULT 0,
  booking_count         int NOT NULL DEFAULT 0,

  -- Soft delete
  deleted_at            timestamptz,

  -- Timestamps
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- Performance indexes
CREATE INDEX content_user_idx ON content (user_id, created_at DESC);
CREATE INDEX content_type_status_idx ON content (type, status, published_at DESC)
  WHERE deleted_at IS NULL;
CREATE INDEX content_vertical_idx ON content (vertical, status, published_at DESC)
  WHERE deleted_at IS NULL;
CREATE INDEX content_starting_point_idx ON content USING GIST (starting_city_point);
CREATE INDEX content_sub_category_idx ON content (sub_category_id)
  WHERE sub_category_id IS NOT NULL;
CREATE INDEX content_featured_idx ON content (featured, published_at DESC)
  WHERE featured = true AND deleted_at IS NULL;
CREATE INDEX content_published_idx ON content (published_at DESC)
  WHERE status = 'published' AND deleted_at IS NULL;

-- Full-text search
ALTER TABLE content ADD COLUMN search_vector tsvector;
CREATE INDEX content_search_idx ON content USING GIN (search_vector);

-- Auto-update search_vector on INSERT/UPDATE
CREATE OR REPLACE FUNCTION content_search_vector_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.body, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER content_search_vector_trigger
  BEFORE INSERT OR UPDATE OF title, description, body, tags ON content
  FOR EACH ROW EXECUTE FUNCTION content_search_vector_update();

-- Auto-update updated_at
CREATE TRIGGER content_updated_at
  BEFORE UPDATE ON content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Content Media ───────────────────────────────────────────────
CREATE TABLE content_media (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id      uuid NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  media_type      text NOT NULL CHECK (media_type IN ('image', 'video', 'audio')),
  url             text NOT NULL,
  thumbnail_url   text,
  alt_text        text,
  width           int,
  height          int,
  duration_seconds int,                                 -- for video/audio
  file_size_bytes  bigint,
  display_order   int NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX content_media_content_idx ON content_media (content_id, display_order);
