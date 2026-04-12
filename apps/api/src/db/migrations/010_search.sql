-- ═══════════════════════════════════════════════════════════════════
-- Migration 010: Search & Analytics Tables
-- SRS: DD-015, DD-007
-- ═══════════════════════════════════════════════════════════════════

-- ── Search Queries (DD-015) ─────────────────────────────────────
CREATE TABLE search_queries (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid REFERENCES users(id) ON DELETE SET NULL,
  query               text NOT NULL,
  normalized_query    text NOT NULL,                     -- lowercased, trimmed for aggregation
  result_count        int,
  clicked_result_id   uuid,
  clicked_result_type text,
  clicked_at          timestamptz,
  session_id          uuid,                              -- for guest searches
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX search_queries_user_idx ON search_queries (user_id, created_at DESC)
  WHERE user_id IS NOT NULL;
CREATE INDEX search_queries_normalized_idx ON search_queries (normalized_query, created_at DESC);

-- ── Search Placeholder Defaults (DD-015) ────────────────────────
CREATE TABLE search_placeholder_defaults (
  id                serial PRIMARY KEY,
  placeholder_text  text NOT NULL,
  priority          int NOT NULL DEFAULT 0,
  is_active         boolean NOT NULL DEFAULT true
);

-- ── Top Searches (materialized view, DD-015) ────────────────────
-- Refreshed periodically via pg_cron or application code
CREATE MATERIALIZED VIEW top_searches_7d AS
SELECT
  normalized_query,
  COUNT(*) AS search_count,
  COUNT(DISTINCT user_id) AS unique_users
FROM search_queries
WHERE created_at > now() - interval '7 days'
  AND char_length(normalized_query) >= 3
  AND normalized_query !~ '@|\+91|\d{6,}'               -- filter spam/phone numbers
GROUP BY normalized_query
HAVING COUNT(*) >= 3
ORDER BY search_count DESC
LIMIT 50;

CREATE UNIQUE INDEX top_searches_7d_query_idx ON top_searches_7d (normalized_query);

-- ── User Content Progress (DD-007) ──────────────────────────────
-- Tracks how far a user has progressed through an itinerary
CREATE TABLE user_content_progress (
  user_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_id    uuid NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  progress_pct  int NOT NULL DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),
  last_spot_id  uuid,                                    -- for itineraries: last visited spot
  updated_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, content_id)
);

-- ── DPDPA Consent Records ───────────────────────────────────────
CREATE TABLE dpdpa_consents (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose       text NOT NULL,                           -- 'location_tracking', 'analytics', 'marketing'
  granted       boolean NOT NULL,
  granted_at    timestamptz NOT NULL DEFAULT now(),
  revoked_at    timestamptz,
  ip_address    inet,
  user_agent    text
);

CREATE INDEX dpdpa_consents_user_idx ON dpdpa_consents (user_id, purpose);

-- ── DPDPA Data Requests ─────────────────────────────────────────
CREATE TABLE dpdpa_data_requests (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  request_type  text NOT NULL CHECK (request_type IN ('export', 'deletion')),
  status        text NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  download_url  text,                                    -- for export: signed URL
  completed_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX dpdpa_data_requests_user_idx ON dpdpa_data_requests (user_id, created_at DESC);

-- ── Grievances ──────────────────────────────────────────────────
CREATE TABLE grievances (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category      text NOT NULL,
  description   text NOT NULL,
  status        text NOT NULL DEFAULT 'open'
                CHECK (status IN ('open', 'acknowledged', 'in_progress', 'resolved', 'closed')),
  resolution    text,
  resolved_at   timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX grievances_user_idx ON grievances (user_id, created_at DESC);
CREATE INDEX grievances_status_idx ON grievances (status)
  WHERE status IN ('open', 'acknowledged', 'in_progress');

CREATE TRIGGER grievances_updated_at
  BEFORE UPDATE ON grievances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Feature Flags ───────────────────────────────────────────────
CREATE TABLE feature_flags (
  key           text PRIMARY KEY,
  enabled       boolean NOT NULL DEFAULT false,
  description   text,
  percentage    int DEFAULT 100 CHECK (percentage BETWEEN 0 AND 100), -- gradual rollout
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER feature_flags_updated_at
  BEFORE UPDATE ON feature_flags
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Platform Settings ───────────────────────────────────────────
CREATE TABLE platform_settings (
  key           text PRIMARY KEY,
  value         jsonb NOT NULL,
  description   text,
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER platform_settings_updated_at
  BEFORE UPDATE ON platform_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
