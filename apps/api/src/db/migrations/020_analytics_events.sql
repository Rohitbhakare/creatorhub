-- ═══════════════════════════════════════════════════════════════════
-- Migration 020: Analytics events table (ANL-FR-001)
-- Events land here + are forwarded to PostHog server-side.
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS analytics_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES users(id) ON DELETE SET NULL,
  session_id    text,
  event_name    text NOT NULL,
  properties    jsonb NOT NULL DEFAULT '{}',
  platform      text NOT NULL DEFAULT 'mobile',  -- 'mobile' | 'web'
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX analytics_events_user_event_idx
  ON analytics_events (user_id, event_name, created_at DESC)
  WHERE user_id IS NOT NULL;

CREATE INDEX analytics_events_name_time_idx
  ON analytics_events (event_name, created_at DESC);

-- Rolling 90-day retention (matches search_queries policy).
-- Enforced by the existing Supabase cron job that prunes old analytics rows.
