-- ═══════════════════════════════════════════════════════════════════
-- Migration 011: Row-Level Security Policies
-- SRS: §5.3
-- NOTE: Service role key bypasses RLS for admin/API operations.
--       These policies protect the anon key (guest) and authenticated
--       key (logged-in user via Supabase client).
-- ═══════════════════════════════════════════════════════════════════

-- ── Users ───────────────────────────────────────────────────────
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read their own full profile
CREATE POLICY users_self_read ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY users_self_update ON users
  FOR UPDATE USING (auth.uid() = id);

-- Public profile fields readable by anyone (implemented via service role queries)
-- No anon-level read policy — public profiles served through API

-- ── User Active Verticals ───────────────────────────────────────
ALTER TABLE user_active_verticals ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_active_verticals_self ON user_active_verticals
  FOR ALL USING (auth.uid() = user_id);

-- ── User Devices ────────────────────────────────────────────────
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_devices_self ON user_devices
  FOR ALL USING (auth.uid() = user_id);

-- ── Audit Events ────────────────────────────────────────────────
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
-- Admin-read only, service-role write — no user-level policies

-- ── Content ─────────────────────────────────────────────────────
ALTER TABLE content ENABLE ROW LEVEL SECURITY;

-- Public read: published + public content visible to everyone (including anon)
CREATE POLICY content_public_read ON content
  FOR SELECT USING (
    status = 'published'
    AND visibility = 'public'
    AND deleted_at IS NULL
  );

-- Author can read all their own content (any status)
CREATE POLICY content_author_read ON content
  FOR SELECT USING (auth.uid() = user_id);

-- Author can insert/update/delete their own content
CREATE POLICY content_author_write ON content
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY content_author_update ON content
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY content_author_delete ON content
  FOR DELETE USING (auth.uid() = user_id);

-- ── Content Media ───────────────────────────────────────────────
ALTER TABLE content_media ENABLE ROW LEVEL SECURITY;

-- Media readable if content is readable (via join in application)
CREATE POLICY content_media_public_read ON content_media
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM content
      WHERE content.id = content_media.content_id
        AND content.status = 'published'
        AND content.visibility = 'public'
        AND content.deleted_at IS NULL
    )
  );

CREATE POLICY content_media_author ON content_media
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM content
      WHERE content.id = content_media.content_id
        AND content.user_id = auth.uid()
    )
  );

-- ── Follows ─────────────────────────────────────────────────────
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Anyone can read follows (public social graph)
CREATE POLICY follows_public_read ON follows
  FOR SELECT USING (true);

-- Users can manage their own follows
CREATE POLICY follows_self_insert ON follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY follows_self_delete ON follows
  FOR DELETE USING (auth.uid() = follower_id);

-- ── Likes ───────────────────────────────────────────────────────
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY likes_public_read ON likes
  FOR SELECT USING (true);

CREATE POLICY likes_self_insert ON likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY likes_self_delete ON likes
  FOR DELETE USING (auth.uid() = user_id);

-- ── Comments ────────────────────────────────────────────────────
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY comments_public_read ON comments
  FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY comments_self_insert ON comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY comments_self_update ON comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY comments_self_delete ON comments
  FOR DELETE USING (auth.uid() = user_id);

-- ── Saved Lists ─────────────────────────────────────────────────
ALTER TABLE saved_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY saved_lists_self ON saved_lists
  FOR ALL USING (auth.uid() = user_id);

-- ── Saved List Items ────────────────────────────────────────────
ALTER TABLE saved_list_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY saved_list_items_self ON saved_list_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM saved_lists
      WHERE saved_lists.id = saved_list_items.list_id
        AND saved_lists.user_id = auth.uid()
    )
  );

-- ── Bookings ────────────────────────────────────────────────────
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Buyer can read their own bookings
CREATE POLICY bookings_buyer_read ON bookings
  FOR SELECT USING (auth.uid() = user_id);

-- Creator can read bookings for their content
CREATE POLICY bookings_creator_read ON bookings
  FOR SELECT USING (auth.uid() = creator_id);

-- ── Booking Financials ──────────────────────────────────────────
ALTER TABLE booking_financials ENABLE ROW LEVEL SECURITY;

CREATE POLICY booking_financials_read ON booking_financials
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_financials.booking_id
        AND (bookings.user_id = auth.uid() OR bookings.creator_id = auth.uid())
    )
  );

-- ── Payments ────────────────────────────────────────────────────
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY payments_read ON payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = payments.booking_id
        AND (bookings.user_id = auth.uid() OR bookings.creator_id = auth.uid())
    )
  );

-- ── Reviews ─────────────────────────────────────────────────────
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Public read for revealed reviews
CREATE POLICY reviews_public_read ON reviews
  FOR SELECT USING (is_revealed = true);

-- Reviewer can read their own (even unrevealed)
CREATE POLICY reviews_self_read ON reviews
  FOR SELECT USING (auth.uid() = reviewer_id);

CREATE POLICY reviews_self_insert ON reviews
  FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- ── KYC Submissions ─────────────────────────────────────────────
ALTER TABLE kyc_submissions ENABLE ROW LEVEL SECURITY;

-- Creator can only read their own submissions
CREATE POLICY kyc_creator_read ON kyc_submissions
  FOR SELECT USING (auth.uid() = creator_id);

-- ── User Notification Preferences ───────────────────────────────
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY notification_prefs_self ON user_notification_preferences
  FOR ALL USING (auth.uid() = user_id);

-- ── Notifications ───────────────────────────────────────────────
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY notifications_self ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY notifications_self_update ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- ── User Social Accounts ────────────────────────────────────────
ALTER TABLE user_social_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY social_accounts_self ON user_social_accounts
  FOR ALL USING (auth.uid() = user_id);

-- ── Studio Alerts ───────────────────────────────────────────────
ALTER TABLE studio_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY studio_alerts_self ON studio_alerts
  FOR ALL USING (auth.uid() = user_id);

-- ── DPDPA Consents ──────────────────────────────────────────────
ALTER TABLE dpdpa_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY dpdpa_consents_self ON dpdpa_consents
  FOR ALL USING (auth.uid() = user_id);

-- ── DPDPA Data Requests ─────────────────────────────────────────
ALTER TABLE dpdpa_data_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY dpdpa_data_requests_self ON dpdpa_data_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY dpdpa_data_requests_insert ON dpdpa_data_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ── Search Queries ──────────────────────────────────────────────
ALTER TABLE search_queries ENABLE ROW LEVEL SECURITY;

-- Users can read/write their own search history
CREATE POLICY search_queries_self ON search_queries
  FOR ALL USING (auth.uid() = user_id);

-- Guest searches (user_id IS NULL) writable via service role only

-- ── TnC Versions ────────────────────────────────────────────────
ALTER TABLE tnc_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY tnc_versions_self_read ON tnc_versions
  FOR SELECT USING (auth.uid() = user_id);
