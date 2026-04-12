# Wireframe Consolidation &amp; Changelog
## `<AppName>` · Creator Platform · MVP Wireframe Set

**Document version:** 1.0
**Date compiled:** 2026-04-08
**Authors:** Rohit + Claude (wireframing session v1-v3)
**Status:** Complete · ready for handoff to Claude Code for SRS consolidation

---

## Purpose of this document

This document is the single canonical source of truth for every wireframe screen drawn during the creator platform MVP wireframing session. It captures:

1. **All screens drawn** across mobile, web desktop, and web mobile surfaces
2. **All design decisions (DD-029 through DD-040)** locked or pending since the original SRS changelog closed at DD-028
3. **All new functional requirements** introduced by the wireframes that need to be added to SRS v1.2
4. **All schema changes** implied by the wireframes
5. **All security, compliance, and legal considerations** that emerged during wireframing
6. **Open questions** that still need resolution before SRS lock

This document is meant to be handed to Claude Code (or a human engineer) alongside the existing `srs-design-decisions-changelog-final.md` to produce SRS v1.2.

---

## Section 1 · Complete screen inventory

The wireframe set comprises **21 distinct screens** with multi-state variants drawn across 3 surfaces: native mobile, web desktop, and web mobile.

### 1.1 · Mobile native screens

| # | Screen | States drawn | File / Location |
|---|---|---|---|
| 01 | Onboarding | Single flow (welcome → phone OTP → location → complete) | HTML + inline |
| 02 | Home feed | Single state with all sections | HTML + inline |
| 02b | Location picker | PostGIS city autocomplete (empty + active) | HTML + inline |
| 03 | Discover | Grid view with filters | HTML + inline |
| 04 | Experience detail · scheduled | Single state | HTML + inline |
| 04b | Post detail | Single state | HTML + inline |
| 04c | Event detail | Single state | HTML + inline |
| 04d | Itinerary detail (self-paced) | Locked + unlocked states | HTML + inline |
| 04e | Soft auth wall | Bottom sheet over locked content | HTML + inline |
| 05 | Booking flow | 5 states: date picker, travellers, review/pay, confirmation, self-paced variant | Inline |
| 06 | Studio tab | 2 states: new creator (empty) + established creator (active) | Inline |
| 07 | Publishing wizard · self-paced itinerary | Content type picker + 5 steps (basics, overview, days/spot editor, pricing, review) | Inline |
| 07 | Publishing wizard · post | Compose step (other steps collapse) | Inline |
| 07 | Publishing wizard · event | When &amp; where step (other steps collapse) | Inline |
| 07 | Publishing wizard · scheduled experience | 6 steps: basics, overview, days (text segments), departures, meeting point, pricing | Inline |
| 11 | Saved tab | 3 states: grid of lists, inside list, save-to-list bottom sheet | Inline |
| 12 | You tab | 2 states: follower + creator · v1, v2 (with coral), v3 (background fix) | Inline |
| 12a | Notifications preferences | Single state with all categories | `screen-12a-notifications.html` |
| 12b | Edit profile | Creator variant (follower variant is a subset) | `screen-12b-edit-profile.html` |
| 12c | Bookings list | Upcoming + Past + Library sections | `screen-12c-bookings.html` |
| 12d | Connected social account detail | YouTube healthy state | `screen-12d-connected-account.html` |

### 1.2 · Web screens

| # | Screen | Surface | States | File / Location |
|---|---|---|---|---|
| 09 | Creator mini-site | Desktop | Single state with all sections | Inline |
| 09b | Creator mini-site | Mobile responsive | Single state with sticky header preview | `screen-09b-mini-site-mobile.html` |
| 10 | Web home logged-out | Desktop | Full marketing landing page | `screen-10-web-home.html` |

### 1.3 · Screens folded or deferred

| # | Screen | Resolution |
|---|---|---|
| 08 | Experience preview (standalone) | **Folded** · subsumed by Screen 07 Step 5 Review which shows full-page preview of what travellers will see |

### 1.4 · Screens NOT drawn (deferred)

- **Admin panel** · Platform moderation, user management, payouts, content moderation queue · deferred to post-MVP design phase
- **KYC flow** · PAN / Aadhaar / bank verification screens · deferred to separate security flow design
- **Help center** · In-app knowledge base · deferred to post-launch
- **Phone number change flow** · Referenced from Screen 12b but separate multi-step flow not drawn · V1
- **Payment failure / retry flow** · Referenced from Screen 05 but error states not drawn · V1
- **Email inbox UI** · No in-app messaging per DD-003

---

## Section 2 · Design decisions DD-029 through DD-040

All new design decisions locked or proposed since the original `srs-design-decisions-changelog-final.md` closed at DD-028. Each DD has a status (LOCKED / PENDING / DEFERRED).

### DD-029 · Studio as 3rd bottom tab · **LOCKED**

**Decision:** Studio is the 3rd of 5 bottom tabs in the mobile app (Home · Discover · **Studio** · Saved · You). Visible for ALL authenticated users regardless of whether they've published content.

**Rationale:** Middle position signals creator tools are first-class in the product. Burying Studio under a "You" profile tab would signal it's secondary. Stable navigation (same tabs for everyone) is easier to learn than conditional tabs that appear only for creators. New users see the empty state prompting them to create their first piece.

**SRS amendments:**
- STUD-FR-001 amended to clarify empty-state visibility for non-creators
- Design system spec Appendix F amended to document the 5-tab bottom bar structure

**Source:** Screen 06 Studio tab, confirmed in open-questions resolution pass.

---

### DD-030 · Multi-list saved wishlists promoted V1 → M0 · **LOCKED**

**Decision:** Users can create multiple named saved lists (Airbnb wishlist pattern). Items can live in multiple lists simultaneously. First save auto-creates a default list called "My saved trips." Replaces the original single-collection MVP scope.

**Rationale:** Users organize by intent ("Spiti trip," "Weekend ideas"), not by chronology. The discovery loop is meaningfully stronger when lists are named and organized. The feature is shallow enough to ship in MVP (~1 week extra engineering time).

**Schema change:**
```sql
-- Replace:
-- user_saves(user_id, content_id)

-- With:
CREATE TABLE saved_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  cover_content_id uuid REFERENCES content(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE saved_list_items (
  list_id uuid NOT NULL REFERENCES saved_lists(id) ON DELETE CASCADE,
  content_id uuid NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  added_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (list_id, content_id)
);

ALTER TABLE saved_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_list_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY self_access ON saved_lists FOR ALL USING (auth.uid() = user_id);
CREATE POLICY self_access ON saved_list_items FOR ALL USING (
  EXISTS (SELECT 1 FROM saved_lists WHERE id = saved_list_items.list_id AND user_id = auth.uid())
);
```

**Global save state logic:** The bookmark icon fills coral if the content item exists in ANY of the user's lists. Derived via `EXISTS (SELECT 1 FROM saved_list_items sli JOIN saved_lists sl ON sli.list_id = sl.id WHERE sli.content_id = ? AND sl.user_id = ?)`.

**Deferred to V1+:**
- Sharing a wishlist (public URL)
- Collaborative wishlists (multi-user)
- Custom cover upload per list
- Reordering items within a list
- Notes per saved item
- Map view of a list
- Wishlist-to-itinerary conversion

**Source:** Screen 11 Saved tab.

---

### DD-031 · Connected social accounts (YouTube + Instagram) + profile completion nudge · **PENDING · recommended M1**

**Decision:** Users can connect YouTube and Instagram accounts via OAuth. Platform imports profile photo, bio, and display name on first connect (with user confirmation). Caches subscriber/follower counts, refreshed nightly. Connected accounts display as trust signals on the public mini-site.

Paired with a soft profile completion nudge card on the You tab showing percentage complete + 5-item checklist + inline "+ Add bio" ghost affordances.

**Status:** NOT yet locked on scope tier. Recommended M1 (ships post-MVP in first fast-follow release) due to OAuth legal/privacy review timing.

**Rationale:** Social connections are underrated identity verification. They reduce signup friction by auto-importing profile data. They give creators trust signals on the mini-site that improve conversion. Engineering is straightforward (~2 weeks) but needs legal review for third-party data handling.

**Schema:**
```sql
CREATE TABLE user_social_accounts (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('youtube', 'instagram')),
  platform_user_id text NOT NULL,
  platform_username text NOT NULL,
  subscriber_count integer,
  previous_subscriber_count integer,
  previous_fetched_at timestamptz,
  last_synced_at timestamptz,
  sync_state text NOT NULL DEFAULT 'healthy' CHECK (sync_state IN ('healthy','delayed','failed','rate_limited','revoked')),
  access_token_encrypted bytea,
  refresh_token_encrypted bytea,
  connected_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, platform)
);

ALTER TABLE user_social_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY self_access ON user_social_accounts FOR ALL USING (auth.uid() = user_id);
```

**Source:** Screen 12 You tab v2, Screen 12d Connected social account detail.

**Open question:** Lock scope tier (M0 vs M1) before SRS consolidation.

---

### DD-032 · Custom spot cover upload · **LOCKED · V1**

**Decision:** MVP uses the Google Places photo (first `photo_reference` from Place Details API) as the spot thumbnail in self-paced itineraries. Custom upload by the creator is deferred to V1.

**Rationale:** Forcing creators to upload 24 photos per itinerary would be a major publishing barrier. Google Places photos are "good enough" for MVP. V1 adds override capability.

**SRS:** CRT-FR-016 spot editor specifies `photo_reference` from Google Places as the sole source of spot imagery in M0.

**Source:** Screen 07 Publishing wizard Step 3.

---

### DD-033 · Wizard Step 5 full-page preview · **LOCKED · M0** (promoted from V1)

**Decision:** Publishing wizard Step 5 Review shows a full-page preview of what travellers will actually see, rendered with the actual detail-page components (Screen 04d) using the draft content. Not a mini card thumbnail.

**Rationale:** Card previews are anxiety-inducing for creators about to hit Publish. Full-page previews are trust-building. Worth the +2-3 days engineering cost for a shared render pipeline between preview and production detail pages.

**Implementation:** Reuse the same components as the public detail page (Screen 04d). Wrap in a "PREVIEW" banner overlay. Replace the Book action bar with a Publish action bar pinned to the bottom. Publish button gated by T&Cs checkbox + all validation items passing.

**SRS:** CRT-FR-020 amended to specify full-page preview rendering.

**Source:** Screen 07 Publishing wizard Step 5, confirmed in open-questions resolution pass.

---

### DD-034 · Notification channels are fixed (push, WhatsApp, email) · **LOCKED**

**Decision:** Notification system supports exactly three channels: push (Firebase Cloud Messaging + in-app), WhatsApp, and email. NO SMS as a notification channel. SMS is reserved exclusively for authentication OTP events.

**Rationale:** WhatsApp penetration in India makes SMS notifications redundant for most users. Maintaining a separate SMS provider + templates + rate limits for notifications adds operational cost without reach benefit.

**Source:** Screen 12a Notifications preferences.

---

### DD-035 · Username change cooldown · **LOCKED**

**Decision:** Creators can change their username, but only once every 30 days. Amber warning shown in Edit profile explaining the cooldown. Server enforces via `username_changed_at` timestamp.

**Rationale:** Compromise between abuse prevention (spammers creating and rapidly rotating usernames) and legitimate rebranding needs. 30 days is the industry standard for username change rate limits.

**SRS:** PROF-FR-007 new requirement.

**Source:** Screen 12b Edit profile.

---

### DD-036 · Profile surface is minimal by design · **LOCKED**

**Decision:** MVP profile does NOT collect: date of birth, gender, pronouns, website link, theme/color preferences, multi-language bio. Only the minimum fields needed for the product to function.

**Rationale:** Each field adds PII surface area, moderation burden, and UX complexity. Start with the minimum viable profile and expand only with clear product justification.

**Source:** Screen 12b Edit profile.

---

### DD-037 · Self-paced itinerary purchases separated from "bookings" in UI · **LOCKED**

**Decision:** The Bookings screen has two sections: "Your next trips" (time-based: scheduled experiences + events) and "Your library" (ownership-based: self-paced itinerary purchases). Self-paced items never appear in the Upcoming tab or Past tab.

**Rationale:** Users mental-model purchases as ownership and bookings as appointments. Merging them creates cognitive friction. The schema can still share the `transactions` table, but the UI splits by `has_departure_date`.

**Source:** Screen 12c Bookings list.

---

### DD-038 · OAuth permissions transparency as a UX requirement · **LOCKED** (pending DD-031 scope confirmation)

**Decision:** Every connected social account detail screen must explicitly list both granted and NOT granted permissions with plain-language descriptions. This is a trust-building discipline, not just a compliance requirement.

**Rationale:** Users are (rightly) suspicious of OAuth integrations. Showing what we DON'T access is a trust move that reduces anxiety and support questions.

**Implementation:** Map OAuth scopes to friendly labels in a config file. Never display raw scope strings. Apply this pattern to any future OAuth integration.

**SRS:** Applies to PROF-FR-011 Connected social account detail screen.

**Source:** Screen 12d Connected social account detail.

---

### DD-039 · Home page is curated, not algorithmic · **LOCKED**

**Decision:** In MVP, the featured creators and featured trips on the web home page (Screen 10) are manually selected by the platform team via a `featured` boolean flag on `users` and `content` tables. No algorithmic ranking.

**Rationale:** MVP scale is too small for meaningful algorithmic ranking. Curation ensures quality control during early growth. V1+ adds algorithmic ranking layer.

**SRS:** WEB-FR-008 new requirement.

**Source:** Screen 10 Web home logged-out.

---

### DD-040 · Responsive design changes layout only, not content · **LOCKED**

**Decision:** For any screen that exists on both desktop and mobile (primarily the web screens), the responsive breakpoints must change ONLY the layout (grid columns, element sizes, sticky behaviors). Copy, trust signals, content items, and features must be IDENTICAL across breakpoints.

**Rationale:** Consistency between desktop and mobile is a trust signal. A user who shares a link between viewports should see the same information arranged differently, not a reduced feature set.

**Source:** Screen 09b Creator mini-site mobile responsive.

---

## Section 3 · New functional requirements (FR-* IDs)

All new functional requirements introduced by the wireframes, organized by module. Each has a scope tier (M0 = MVP, M1 = first fast-follow, V1+ = future).

### 3.1 · Booking module (BK-FR-*)

| ID | Scope | Requirement | Source |
|---|---|---|---|
| BK-FR-007 | M0 | 10-minute hold timer with `booking_intents` table · TTL-based expiry via Supabase Realtime | Screen 05 |
| BK-FR-008 | M0 | WhatsApp confirmation as primary booking channel · receipt + creator contact | Screen 05 |
| BK-FR-009 | M0 | Names of other travellers collected post-booking via WhatsApp form | Screen 05 |
| BK-FR-010 | M0 | Bookings list screen with two sections (Upcoming + Library), filter chips | Screen 12c |
| BK-FR-011 | M0 | Booking status lifecycle enum: `pending_payment`, `confirmed`, `awaiting_creator_confirmation`, `departing_soon`, `in_progress`, `completed`, `cancelled_by_user`, `cancelled_by_creator`, `refund_pending`, `refunded`, `no_show` | Screen 12c |
| BK-FR-012 | M0 | Urgent "departing soon" state for trips within 48 hours with exact address not yet sent | Screen 12c |
| BK-FR-013 | M0 | Download GST invoice PDF on demand for completed bookings | Screen 12c |
| BK-FR-014 | M0 | Refund status visibility inline in booking card (reason, amount, ETA) | Screen 12c |
| BK-FR-015 | M0 | Library section for purchased self-paced itineraries with offline-available marker | Screen 12c |

### 3.2 · Studio module (STUD-FR-*)

| ID | Scope | Requirement | Source |
|---|---|---|---|
| STUD-FR-001 | M1 | Contextual alert hero with priority rules engine (blocker > time-sensitive > celebration > activity > quiet state) | Screen 06 |
| STUD-FR-002 | M1 | Content list with Published/Drafts/Archived filter pills | Screen 06 |
| STUD-FR-003 | M1 | Stats row counts-only (views, saves, bookings, followers) · no charts in MVP | Screen 06 |
| STUD-FR-004 | M1 | Earnings card with KYC badge + single-line pending payout + next payout date | Screen 06 |

**New schema:**
```sql
CREATE TABLE studio_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  alert_type text NOT NULL,
  priority integer NOT NULL,
  payload jsonb NOT NULL,
  cta_target text,
  expires_at timestamptz,
  dismissed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_studio_alerts_active ON studio_alerts(user_id, priority DESC) WHERE dismissed_at IS NULL;
```

### 3.3 · Creator / Publishing module (CRT-FR-*)

| ID | Scope | Requirement | Source |
|---|---|---|---|
| CRT-FR-014 | M0 | Content type picker entry screen with 4 cards (Post, Event, Scheduled, Self-paced) · KYC requirement indicators per type | Screen 07 |
| CRT-FR-015 | M0 | Publishing wizard framework · 5-step with progress indicator · draft auto-save every 30 seconds server-side | Screen 07 |
| CRT-FR-016 | M0 | Spot editor with Google Places autocomplete · 300ms debounce · "powered by Google" attribution · `photo_reference` from Place Details is sole source of spot imagery | Screen 07 |
| CRT-FR-017 | M0 | Pricing step with freemium toggle (default ON for self-paced) · auto-filled inclusions list · GST displayed as separate line not included in listed price | Screen 07 |
| CRT-FR-018 | M0 | Basics step with live character counters (title 5-100, description 0-280) · warning state at 85%, error at 100% | Screen 07 |
| CRT-FR-019 | M0 | Trip overview step with day-count skeleton · creates empty day buckets for spot editor on step transition · `itinerary_days` table | Screen 07 |
| CRT-FR-020 | M0 | Review step with validation checklist + full-page preview rendering actual detail-page components with draft data | Screen 07 (amended via DD-033) |
| CRT-FR-021 | M0 | Creator T&Cs consent per publish · records to `tnc_versions` table with creator_id, content_id, tnc_version, timestamp · IP attestation required | Screen 07 |
| CRT-FR-022 | M0 | Scheduled experience meeting point two-part privacy model · public neighbourhood text + PostGIS area point · private exact address · configurable sharing window (12/24/48 hours) | Screen 07 |
| CRT-FR-023 | M0 | Scheduled experience pricing with creator take-home preview · computed as `price - platform_fee - 1% TDS` · real-time on keystroke (500ms debounce) | Screen 07 |
| CRT-FR-024 | M0 | Editable inclusion/exclusion checklists · free text up to 80 chars each · max 15 items per list · stored in vertical_data JSONB | Screen 07 |
| CRT-FR-025 | M0 | Platform-defined cancellation policy picker · enum (flexible/moderate/strict) · creators cannot customize wording · foreign key to `cancellation_policy_versions` for audit trail | Screen 07 |

**New schemas:**
```sql
CREATE TABLE meeting_points (
  content_id uuid PRIMARY KEY REFERENCES content(id) ON DELETE CASCADE,
  location_description text NOT NULL, -- public neighbourhood text
  area_point geography(POINT, 4326) NOT NULL, -- PostGIS point, rendered as radius
  exact_location text NOT NULL, -- private address
  exact_shared_hours_before integer NOT NULL DEFAULT 24 CHECK (exact_shared_hours_before IN (12, 24, 48))
);

CREATE TABLE tnc_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  content_id uuid REFERENCES content(id),
  tnc_version text NOT NULL,
  consented_at timestamptz NOT NULL DEFAULT now(),
  ip_address inet,
  user_agent text
);

CREATE TABLE cancellation_policy_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_name text NOT NULL CHECK (policy_name IN ('flexible','moderate','strict')),
  policy_text text NOT NULL,
  effective_from timestamptz NOT NULL,
  effective_to timestamptz
);
```

### 3.4 · Social &amp; saves module (SOC-FR-*)

| ID | Scope | Requirement | Source |
|---|---|---|---|
| SOC-FR-004 | **AMENDED M0** | Save / bookmark a content item · multi-list wishlist pattern (replaces single collection) · global save state via EXISTS check across all user's lists | Screen 11, DD-030 |
| SOC-FR-008 | M0 | Saved tab with wishlist grid · 2-column cards · auto cover from first item · item count badge | Screen 11 |
| SOC-FR-009 | M0 | Inside-list view with sort (Recently added / Oldest / A-Z / Price asc / Price desc) and type filter | Screen 11 |
| SOC-FR-010 | M0 | Save-to-list bottom sheet with multi-select · pre-checked lists shown with coral confirmation · "Create new list" action at bottom | Screen 11 |
| SOC-FR-011 | M0 | First-save default list auto-creation · named "My saved trips" · created silently server-side · rename toast shown to user | Screen 11 |

### 3.5 · Profile module (PROF-FR-*)

| ID | Scope | Requirement | Source |
|---|---|---|---|
| PROF-FR-006 | M0 | Edit profile screen · display_name (required), username (creator-only, 30-day cooldown), bio (280 chars), location (GeoNames), email (optional) | Screen 12b |
| PROF-FR-007 | M0 | Username change cooldown · 30-day rolling window · `username_changed_at` timestamp · server rejects within window with 429 | Screen 12b, DD-035 |
| PROF-FR-008 | M1 | Profile photo import from connected social accounts · fetch current photo from platform API, preview, confirm, upload to Supabase Storage | Screen 12b, DD-031 |
| PROF-FR-009 | M0 | Phone number change flow · separate multi-step with OTP verification · old number logged in `audit_events` | Screen 12b |
| PROF-FR-010 | M0 | Save confirmation on unsaved changes · dirty-state detection · discard/keep editing prompt | Screen 12b |
| PROF-FR-011 | M1 | Connected social account detail screen · per-platform view with sync status, permissions, disconnect | Screen 12d, DD-031 |
| PROF-FR-012 | M1 | Subscriber count delta tracking · store `previous_subscriber_count` + timestamp · display week-over-week delta | Screen 12d |
| PROF-FR-013 | M1 | Manual refresh rate limiting · once per 5 minutes per user per platform · toast feedback if exceeded | Screen 12d |
| PROF-FR-014 | M1 | Disconnect flow preserves imported assets · profile photo stays even if originally from platform · only metrics removed | Screen 12d |
| PROF-FR-015 | M1 | Platform revocation link · deep-link to Google/Facebook OAuth management · opens in external browser | Screen 12d |
| PROF-FR-016 | M1 | Sync status states tracked per connection · enum (`healthy`, `delayed`, `failed`, `rate_limited`, `revoked`) · UI renders different states | Screen 12d |

### 3.6 · Identity &amp; access module (IAM-FR-*)

| ID | Scope | Requirement | Source |
|---|---|---|---|
| IAM-FR-005 | M0 | Google / Apple login promoted from DEF to M0 · secondary path for auth wall | Screen 04e, carried from DD-016 |
| IAM-FR-009 | M1 | Connected social accounts (YouTube + Instagram) · OAuth with import capability · nightly sync of counts | Screen 12 v2, DD-031 |
| IAM-FR-010 | M1 | Profile completion nudge system · 5-field checklist · dismissable card with 7-day reappear logic · inline ghost affordances | Screen 12 v2, DD-031 |

### 3.7 · Notifications module (NOT-FR-*)

| ID | Scope | Requirement | Source |
|---|---|---|---|
| NOT-FR-001 | M0 | Notification preferences screen · 6 categories × 3 channels · stored as `user_notification_preferences` with composite key | Screen 12a |
| NOT-FR-002 | M0 | WhatsApp channel locked for bookings_trips category · server enforcement + UI lock icon · soft toast on interaction | Screen 12a |
| NOT-FR-003 | M0 | Do not disturb master switch · overrides all categories except bookings_trips | Screen 12a |
| NOT-FR-004 | V1 | Quiet hours scheduler · timezone-aware · per-channel optional overrides · placeholder row in MVP | Screen 12a |
| NOT-FR-005 | M0 | Default notification preferences by category on new user creation (transactional ON, marketing OFF) | Screen 12a |

**New schema:**
```sql
CREATE TABLE user_notification_preferences (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN (
    'bookings_trips','messages_creators','new_content_followed',
    'activity_own_content','platform_updates','promotions'
  )),
  channel text NOT NULL CHECK (channel IN ('push','whatsapp','email')),
  enabled boolean NOT NULL DEFAULT false,
  PRIMARY KEY (user_id, category, channel)
);

ALTER TABLE users ADD COLUMN dnd_enabled boolean NOT NULL DEFAULT false;
```

### 3.8 · Web / SEO module (WEB-FR-*)

| ID | Scope | Requirement | Source |
|---|---|---|---|
| WEB-FR-001 | M0 | Creator mini-site public page · SSR via Next.js with ISR · `/{vertical}/{username}` URL · Schema.org structured data · OG metadata · canonical URL · sitemap inclusion · Core Web Vitals targets (FCP <1.2s, LCP <2.5s, CLS <0.1) | Screen 09 |
| WEB-FR-002 | M0 | Travellers hosted metric · computed from `bookings WHERE trip_date < now() AND status = 'completed'` · displayed on mini-site + Studio · minimum threshold to display (10 bookings) | Screen 09 |
| WEB-FR-003 | M0 | Aggregated social reach · sum of `subscriber_count` across user_social_accounts · cached with 1-hour TTL | Screen 09 |
| WEB-FR-004 | M0 | Mini-site trust signals section · conditionally renders up to 3 cards (KYC, YouTube, Instagram) + refund guarantee strip | Screen 09 |
| WEB-FR-005 | M0 | Content filter tabs on mini-site with counts per type | Screen 09 |
| WEB-FR-006 | M0 | Mini-site responsive breakpoints · desktop (≥1080px), tablet (640-1079px), mobile (<640px) | Screens 09, 09b |
| WEB-FR-007 | M0 | Public home page · SSR · India-first copy · Core Web Vitals targets (FCP <1s, LCP <2s, CLS <0.05) | Screen 10 |
| WEB-FR-008 | M0 | Featured creators and trips curated manually · `featured` boolean flag on users and content tables | Screen 10, DD-039 |
| WEB-FR-009 | M0 | "Example payout" stat on home page computed from current platform fee rate, not hardcoded | Screen 10 |
| WEB-FR-010 | M0 | Structured data on home page · Organization schema, ItemList with TouristTrip items, Person references | Screen 10 |
| WEB-FR-011 | M0 | India-specific positioning · English only · INR only · no multi-language / multi-currency | Screen 10 |
| WEB-FR-012 | M0 | Sticky header on creator mini-site mobile · appears on scroll past hero · Intersection Observer pattern | Screen 09b |
| WEB-FR-013 | M0 | Horizontal scrollable strips on mobile for stats row and filter tabs | Screen 09b |

### 3.9 · Security workstream (SEC-FR-*) · DEFERRED

All security requirements identified during Screen 09 discussion are **deferred to the web build phase** per user decision. They remain in the backlog but are not blocking MVP wireframe lock.

| ID | Scope | Requirement | Status |
|---|---|---|---|
| SEC-FR-001 | M0 | Public surface content moderation pipeline (auto via OpenAI API + human review for first 3 publishes per creator) | Deferred |
| SEC-FR-002 | M0 | Cache isolation for public vs authenticated · Cloudflare cache key includes auth state | Deferred |
| SEC-FR-003 | M0 | PII allowlist for SEO surfaces · structured data and OG metadata strict allowlist | Deferred |
| SEC-FR-004 | M0 | Indexing gates · `noindex` until creator has 1+ published, profile photo, bio, 24h+ account age | Deferred |
| SEC-FR-005 | M0 | Reporting + takedown SLAs · 48h triage for profile/content reports, 4h for severe categories | Deferred |
| SEC-FR-006 | M0 | Cloudflare rate limiting on all public surfaces | Deferred |
| SEC-FR-007 | M0 | Emergency private mode · creator request flow with 1h SLA · returns 404 to public traffic | Deferred |
| SEC-FR-008 | M1 | Block list functionality · per-user-pair visibility controls | Deferred |
| SEC-FR-009 | M1 | Anomaly detection on bookings and follows · fraud pattern matching | Deferred |

**Note:** These must be revisited and resolved before the creator mini-site and web home go live.

---

## Section 4 · Design system amendments

### 4.1 · Color system additions

**Base palette (from DD v1.2, unchanged):** warm neutrals `#FAF7F4` surface, `#F2EEE8` sunken, `#E5E0D7` border, `#C9C3B6` line, `#9C9689` soft-ink, `#6B6660` muted, `#2C2823` ink + coral `#E15A41` accent.

**Amendments:**

**4.1.1 · Background color correction**
- Previous: `#FFF5F1` used for profile hero cards (Screen 12 v2)
- Correction: Use `#F2EEE8` (standard sunken surface token) for all warm card backgrounds
- Rationale: `#FFF5F1` reads too orange and breaks system token alignment
- Applies to: all hero cards, sunken card backgrounds, and warm section containers

**4.1.2 · Coral usage rules expanded (DD-013 / DD-024 amendment)**

Added legitimate semantic contexts for coral:
1. Primary CTAs (original)
2. Active save/bookmark icon (original)
3. Location pin icons (original)
4. Active bottom tab indicator (original)
5. Overnight itinerary pin (original)
6. Critical unread signals (DD-024)
7. **NEW:** Profile completion progress indicator (DD-031)
8. **NEW:** Soft profile warmth — ring accents on verified avatars (DD-031)

Coral must still earn its place. These are narrow semantic contexts, not general-purpose accent uses.

### 4.2 · Typography additions

No changes to type scale or font choices. Fraunces + Inter combination preserved.

**Observations from wireframing:**
- Fraunces used at **68px (hero)** on web home desktop — largest use in the product
- Fraunces used at **44px (H1)** on creator mini-site desktop
- Fraunces italic used for editorial voice (creator bios, post body content, pull quotes)
- Fraunces tabular numerals used for all price displays

### 4.3 · Component additions

New UI patterns established during wireframing:

| Pattern | First use | Notes |
|---|---|---|
| Contextual alert hero | Screen 06 Studio | Priority-ranked server-computed alert card at top of Studio tab |
| Save-to-list bottom sheet | Screen 11 | Multi-select sheet with pre-checked state and create-new row |
| Sticky header on mobile web | Screen 09b | Condensed header slides in after scroll past hero |
| Horizontal scrollable stats strip | Screen 09b | Mobile adaptation for 5+ stats |
| Two-part meeting point privacy model | Screen 07 | Public area + private exact address with configurable reveal window |
| Wizard framework with progress bar | Screen 07 | 5-7 step pattern reused across all content types |
| Booking status pill system | Screen 12c | 11 states with color-coded semantic pills |
| Permissions transparency card | Screen 12d | Explicit granted + not-granted list for OAuth connections |
| Profile completion nudge card | Screen 12 v2 | Warm sunken card with progress bar and 5-item checklist |
| Phone bezel wireframe treatment | All mobile screens | Consistent rendering format for mobile wireframes |

### 4.4 · Bottom tab bar structure

**5-tab bottom bar for authenticated mobile users (DD-029):**

| Position | Tab | Icon (Phosphor) | Visibility |
|---|---|---|---|
| 1 | Home | House | All users |
| 2 | Discover | MagnifyingGlass | All users |
| 3 | **Studio** | PencilSimple | All users (new per DD-029) |
| 4 | Saved | BookmarkSimple | All users |
| 5 | You | UserCircle | All users |

All tabs always visible. Active tab in coral, inactive in soft-ink gray.

---

## Section 5 · Branding and naming conventions

### 5.1 · Placeholder policy

Throughout this document and all wireframes:
- **Brand name:** `<AppName>` placeholder (name not yet decided)
- **Domain:** `xyz.com` placeholder
- **Creator example:** Riya Menon (@riya_menon) with YouTube @riyawanders and Instagram @riya_wanders
- **Follower example:** Aanya R. (new user, Stories-only)
- **Buyer example:** Rohit Sharma (booking flow participant)
- **Verticals:** Travel (launch wedge, locked for MVP)

### 5.2 · Retroactive fixes to apply

The following references need to be corrected when the wireframes are consolidated:
- Any remaining "Roamy" references → `<AppName>`
- Any remaining "roamy.com" references → `xyz.com`
- Specifically affects: Screen 04e soft auth wall callouts, Screen 09 creator mini-site footer and trust cards, any prose walkthrough mentions

---

## Section 6 · Compliance and legal considerations

### 6.1 · DPDPA (India data protection) requirements identified

| Requirement | Surface | Status |
|---|---|---|
| Download my data (right to portability) | Screen 12 You tab row | Drawn |
| Delete account (right to erasure) | Screen 12 You tab row, red text | Drawn · 30-day soft delete grace period |
| Explicit opt-in for marketing notifications | Screen 12a Notifications | Drawn · Promotions category defaults to all OFF |
| Consent recording for T&Cs, marketing opt-in | Implicit in IAM-FR-* and NOT-FR-005 | Requires `consent_events` table |
| Third-party data handling disclosure for OAuth | Screen 12d info strip + privacy policy update | Drawn, needs legal review before launch |

### 6.2 · IT Act 2021 (Intermediary Rules) requirements

| Requirement | Surface | Status |
|---|---|---|
| Grievance officer contact visible in app | Screen 12 You tab Help &amp; legal section | Drawn |
| Report this content / profile mechanism | Screen 09 mini-site footer, Screen 09b mobile | Drawn |
| 24-hour response SLA for grievances | Screen 10 trust strip claim | Drawn · operational commitment |
| Content moderation pipeline for UGC | SEC-FR-001 (deferred) | Flagged |
| Content takedown SLAs | SEC-FR-005 (deferred) | Flagged |

### 6.3 · Tax compliance (India)

| Requirement | Surface | Status |
|---|---|---|
| GST 18% added at checkout, not to listed price | Screen 05 booking flow, Screen 07 pricing step | Drawn |
| GSTIN on file for creators | Trust card on mini-site, "GSTIN pending" in Screen 10 footer | Drawn |
| Section 194-O TDS (1%) on creator payouts | Screen 07 pricing step creator take-home math | Drawn |
| GST invoice downloadable for completed bookings | Screen 12c Bookings list | Drawn (BK-FR-013) |

### 6.4 · Google Places API compliance

| Requirement | Surface | Status |
|---|---|---|
| "powered by Google" attribution on autocomplete | Screen 07 spot editor | Drawn |
| Server-side API proxy only (key never exposed client-side) | Implementation note | Flagged for engineering |
| Caching within allowed TTL | Implementation note | Flagged for engineering |

---

## Section 7 · Open questions requiring resolution before SRS lock

### 7.1 · RESOLVED during session

| Question | Resolution |
|---|---|
| Studio tab visibility for non-creators | Always show (DD-029) |
| Multi-list saves scope tier | Locked M0 (DD-030) |
| Custom spot cover upload | V1 (DD-032) |
| Wizard Step 5 preview depth | Full-page preview in M0 (DD-033) |
| Mini-site security workstream | Deferred to web build phase |
| Mini-site mobile responsive | Drawn (Screen 09b) |
| You tab sub-screens | All drawn (12a, 12b, 12c, 12d) |
| Background color on hero cards | Fixed to `#F2EEE8` |

### 7.2 · STILL PENDING

| Question | Recommendation | Blocking? |
|---|---|---|
| DD-031 scope tier (M0 vs M1) | M1 — OAuth legal review adds calendar time | Yes |
| SEC-FR-001 through SEC-FR-007 prioritization | All must land before mini-site public launch | Yes for launch |
| Brand name decision | Needed before any public launch material | Yes for launch |
| Domain registration | Needed before any public launch material | Yes for launch |
| Are we shipping the creator mini-site at MVP, or after the web build phase? | Recommend MVP with security safeguards in place | Yes for scope |

---

## Section 8 · Handoff instructions for SRS consolidation

### 8.1 · Materials to hand to Claude Code

1. **This document** (`wireframe-consolidation-changelog-final.md`)
2. **Original SRS changelog** (`srs-design-decisions-changelog-final.md`) closed at DD-028
3. **Consolidation prompt** (`claude-code-prompt-srs-consolidation.md`)
4. **Original SRS v1.1** (`srs-v1.md` · 1601 lines, creator-platform pivot version)

### 8.2 · Recommended consolidation order

When Claude Code runs the SRS v1.2 generation:

1. **Start with original SRS v1.1** as the base
2. **Apply DD-001 through DD-028** from the closed changelog (already a clean operation)
3. **Apply DD-029 through DD-040** from this document in order
4. **Add new functional requirements** organized by module (Section 3 of this document)
5. **Add schema changes** as consolidated `CREATE TABLE` and `ALTER TABLE` statements in §5.1
6. **Update the design system appendix** with color correction, coral rules, bottom tab structure
7. **Add compliance section** covering DPDPA, IT Act, tax, Google Places requirements
8. **Flag all DEFERRED items** in a "Post-MVP scope" section so nothing gets lost
9. **Flag all OPEN questions** in a "Decisions needed before lock" section

### 8.3 · Branding fix pass

Before consolidation output, run a find/replace:
- `Roamy` → `<AppName>`
- `roamy.com` → `xyz.com`
- `roamy` → `<appname>` (case-insensitive contexts)

### 8.4 · Verification checks

After consolidation, verify:
- All DDs in sequence with no gaps
- Every new FR-* requirement has a module prefix and scope tier
- Every schema change has accompanying RLS policy where needed
- No broken cross-references between old and new sections
- All placeholder brand names are `<AppName>` / `xyz.com`
- All wireframe references point to the correct Screen numbers from this document

---

## Section 9 · Wireframe file manifest

Files currently present in `/mnt/user-data/outputs/wireframes/`:

**Originally created (Screens 01-05):**
- `_shared.css`
- `index.html`
- `README.md`
- `screen-01-onboarding.html`
- `screen-02-home-feed.html`
- `screen-02b-location-picker.html`
- `screen-03-discover.html`
- `screen-04-experience-scheduled.html`
- `screen-04b-post-detail.html`
- `screen-04c-event-detail.html`
- `screen-04d-itinerary-detail.html`
- `screen-04e-soft-auth-wall.html`
- `screen-05-booking-flow.html`

**Created during current session:**
- `screen-09b-mini-site-mobile.html`
- `screen-10-web-home.html`
- `screen-12a-notifications.html`
- `screen-12b-edit-profile.html`
- `screen-12c-bookings.html`
- `screen-12d-connected-account.html`

**Inline-only (drawn via visualizer, not saved as files):**
- Screen 06 Studio tab (2 states)
- Screen 07 Publishing wizard (all 4 content types, 7+ step variants)
- Screen 09 Creator mini-site desktop
- Screen 11 Saved tab (3 states)
- Screen 12 You tab (v1, v2, v3)

**Note:** The inline-only screens exist in the session transcript but not as standalone files. If needed for designer handoff, they can be regenerated from the transcript by re-running the visualizer widgets.

---

## Section 10 · Summary statistics

- **Total distinct screens drawn:** 21
- **Total multi-state variants:** 40+
- **Total design decisions since DD-028:** 12 (DD-029 through DD-040)
- **New functional requirements introduced:** 50+ across 8 modules
- **New schema tables introduced:** 6 (`saved_lists`, `saved_list_items`, `user_social_accounts`, `studio_alerts`, `meeting_points`, `tnc_versions`, `cancellation_policy_versions`, `user_notification_preferences`)
- **Screens remaining for MVP:** 0
- **Wireframe set status:** **COMPLETE**

---

## Appendix A · Wireframing session retrospective

This wireframing pass was conducted across three continuous conversation sessions (v1, v2, v3), primarily using the inline visualizer widget with a fallback to HTML files for screens drawn after the tool was reset.

**What worked:**
- Drawing screens one at a time with dedicated walkthrough of decisions
- Flagging SRS implications inline so nothing gets lost
- Pre-thinking architecture before drawing (reduces rework)
- Batching open questions and resolving in a single pass
- Tracking changelog turn-by-turn rather than waiting until the end

**What to do differently:**
- Lock the design system fully BEFORE drawing screens (avoided one color correction)
- Generate the wireframe consolidation document at checkpoints, not only at the end
- Formalize the naming placeholder (`<AppName>`, `xyz.com`) upfront to avoid retroactive fixes
- Consider drawing the mobile-responsive version of web screens simultaneously with desktop
- Capture inline-visualizer screens as file snapshots at key milestones for better handoff

**Recommendations for the next phase:**
1. Lock remaining open questions (DD-031 scope, brand name)
2. Run SRS consolidation via Claude Code
3. Hand consolidated SRS v1.2 to the engineering team for sprint planning
4. Defer Figma creation until a designer is hired (current wireframes serve as the reference)
5. Revisit security workstream (SEC-FR-001 through SEC-FR-009) before any public web surface launch
6. Plan a design QA pass once the app is built against MVP scope

---

**End of document.**
