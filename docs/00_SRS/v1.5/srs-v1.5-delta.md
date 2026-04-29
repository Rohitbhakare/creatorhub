# SRS v1.5 — Delta from v1.4

> Companion to `docs/00_SRS/v1.4/srs-v1.4-delta.md`, `docs/00_SRS/v1.3/srs-v1.3-delta.md`, and `docs/00_SRS/v1.2/srs-v1.2.md`.
> v1.5 is a **delta only**: full web application parity (auth, feed, discover, immersive reader, booking, studio, publishing, KYC, profile, social) plus two web-first surfaces (gamification + storytelling).

**Date:** 2026-04-28
**Author:** Founder + Claude
**Status:** ACTIVE
**Supersedes:**
- v1.2 §4.16 (WEB) — extended `WEB-FR-001..013` → adds 14 web sub-domains under `WEB-*-FR-014..110`
- v1.2 §4.17 (SEC) — `SEC-FR-001..009` un-deferred (M0/M1)
- v1.2 §4.9 NTF-FR-006 (Web push) — un-deferred, moves to `[M2]`
- v1.4 §6.1 (coral rule) — extended to **7 contexts on web** (5 mobile + 2 web-only)

---

## 0.1 Revision history

| Version | Date | Author | Summary |
|---|---|---|---|
| 1.5 | 2026-04-28 | Founder | Web app full-parity expansion: auth, feed, discover, reader, booking, studio, publish, KYC; gamification web surfaces; immersive storytelling reader; Framer Motion language; SEC un-deferred; WEB-FR-014–099 added across 11 new sub-domains plus WEB-NFR-001..011 + WEB-A11Y-FR-106..110. Wireframe pack at `docs/01_wireframes/v2/web/` (12 packs, 4 standalones). |

---

## 1.4 Web product scope (NEW)

### 1.4.1 In scope at launch (M1 + M2 web)

Authenticated home feed · 13-filter discover · Cmd/Ctrl+K search overlay · immersive content reader (magazine + compact modes) · 4-step booking flow + Razorpay desktop hosted page · creator studio (analytics + content list + bookings + reviews + payouts ledger) · publishing wizard for all 4 content types · KYC web flow · profile + settings · notification centre + web push · saved + social actions (follow/like/comment/share) · gamification (quests/streaks/levels/leaderboard) · Framer Motion–driven page transitions and microinteractions.

### 1.4.2 Out of scope (web V2)

Rewards marketplace · native apps · PWA install / offline mode · multi-tab analytics drilldowns beyond mobile parity · web-based DMs/chat (deep-links to mobile) · multi-currency / i18n (English + INR locked) · dark mode · real-time collaborative editing in publishing wizard.

### 1.4.3 Web-distinct personas

- **The longform reader** — opens an itinerary on a 13" laptop in evening, scrolls 8+ minutes through magazine-style body, uses sticky day-nav to jump.
- **The studio operator** — creator opens dashboard on 24" external monitor, multi-tab between Studio Analytics and Bookings, copies large blocks of itinerary text from Notes.app into the publishing wizard.
- **The destination researcher** — guest uses search + filters on desktop, opens 4 candidate trips in tabs, deep-links results to spouse via copy URL.
- **The booking buyer** — uses card autofill + UPI deep-link hand-off; expects Razorpay desktop hosted-page flow, not the mobile WebView.

---

## 1.5 Locked constraints (reaffirmed)

- Travel-only launch (4 active sub-cats: Road Trips, Biking, Trekking, Food Trails)
- 4 content types only (post, self-paced itinerary, scheduled experience, event)
- English + INR only (no i18n / multi-currency)
- No PWA / no React Native / no native apps in v1.5
- **Web mirrors mobile semantics** — no business-logic divergence
- Coral re-locked (see §6.1 below) — 5 mobile + 2 web-only

---

## 4.16.1 Web Identity & Auth (WEB-AUTH)

### WEB-AUTH-FR-014 · [M0] · Web sign-up flow
Email + password, Google OAuth, phone-OTP — three tabs on `/signup`. Reuses `/api/v1/auth/signup` and `/api/v1/auth/verify`. Form submit via Next.js Server Action. Routes new users to onboarding (W2.5 sub-cat picker) on success.

### WEB-AUTH-FR-015 · [M0] · Web sign-in flow
Email/password + magic-link option + Google OAuth + phone OTP fallback at `/signin`. On success, sets `httpOnly Secure SameSite=Lax` session cookie (30-day rolling, idle 24 h). Magic-link: 15-min expiry, single-use.

### WEB-AUTH-FR-016 · [M0] · Google OAuth web
OAuth redirect via Supabase Auth. First-time users routed to onboarding. Existing users routed to `/feed`.

### WEB-AUTH-FR-017 · [M0] · Phone OTP fallback
Twilio path identical to mobile. 6-digit OTP, 30-second resend, auto-tab on type, paste-distributes.

### WEB-AUTH-FR-018 · [M0] · Session middleware
Edge middleware validates session cookie on protected routes. Refreshes silently. Redirects guests to `/signin?redirect=…` on protected paths.

### WEB-AUTH-FR-019 · [M1] · Logout + multi-device
Logout clears cookie + revokes refresh token. "Sign out everywhere" in settings revokes all device sessions.

### WEB-AUTH-FR-020 · [M0] · Password reset
Email link → set-new-password page. Rate-limited to 3/hour/IP. Token expiry 1 hour, single-use.

### WEB-AUTH-FR-021 · [M0] · CSRF defense
Double-submit cookie on all mutating Server Actions. Origin header check. Reject on mismatch with 403.

### WEB-AUTH-FR-022 · [M0] · Onboarding parity
Travel sub-category picker (per ONB-FR-008-R) renders as a 4-tile grid on web; min 2 selections; same `PUT /api/v1/users/me/travel-sub-categories`. Welcome celebration with Framer Motion confetti spring on completion.

---

## 4.16.2 Web Home Feed (WEB-FEED)

### WEB-FEED-FR-023 · [M1] · Web home shell
Three-column grid on ≥1080 px: sidebar nav (240 px) + feed (centered, 720–960 px) + right rail (280 px) with quests/streak dock. Sticky scope+filter chip rail at top of feed column.

### WEB-FEED-FR-024 · [M1] · Scope + filter chips parity
`Near you` / `Following` scope chips. Filter chips: `All · Posts · Road Trips · Biking · Trekking · Food Trails`. Mirrors FEED-FR-040.

### WEB-FEED-FR-025 · [M1] · Editorial 11-section layout
Same 11 sections from FEED-FR-041 (Hot near you, Hand-picked, Trending posts, This weekend, Ending soon, From your city, From follows, New voices, Under ₹2k, Short reads, Long reads). Horizontal rails become snap-scrolling carousels with hover-revealed arrow buttons.

### WEB-FEED-FR-026 · [M1] · Posts feed (Instagram-style)
When `Posts` filter active: centered single-column 640 px max. Infinite scroll via IntersectionObserver. Post cards show full-bleed photo carousel (max 5 images, dot indicator), 3-line caption clamp, top-2 comments preview.

### WEB-FEED-FR-027 · [M1] · Section "see all" routes
All 8 routes from FEED-FR-043 reused. `pushState` navigation preserves scroll. Back button restores feed scroll position.

### WEB-FEED-FR-028 · [M1] · ContentCard web variants
Grid / horizontal / featured (no new types per content-type lockdown). Responsive image via `next/image`. Type pill, save bookmark, title (Fraunces 18), creator avatar + name.

### WEB-FEED-FR-029 · [M1] · ExpandableText web
Fraunces 14 / 1.65 line-height; 3-line clamp. "Show all" expands inline (no nav to detail).

### WEB-FEED-FR-030 · [M1] · Right-rail dock
Quest ring + streak flame + 3 trending tags. Visible on ≥1080 px only. Mobile-web (<768 px) collapses to floating bottom-right pill.

### WEB-FEED-FR-031 · [M1] · Optimistic save / like
Click bookmark/heart → instant ring pulse + state flip. Server Action retries quietly. Snap back with toast on failure.

---

## 4.16.3 Web Discover & Search (WEB-DISC)

### WEB-DISC-FR-032 · [M1] · Discover home web
Same DISC-FR-050 search-first editorial layout, desktop grid (3-col category, 4-tile collection rail).

### WEB-DISC-FR-033 · [M1] · Search overlay
Cmd/Ctrl+K opens centered modal with rotating placeholder per DISC-FR-052. Cold state shows recent + trending. Typing debounced 150 ms, max 8 suggestions. Esc closes.

### WEB-DISC-FR-034 · [M1] · 13-filter side panel
Mobile bottom sheet → desktop right-side drawer 420 px wide. Same 13 filter groups (DISC-FR-041). Sticky footer "Reset all" + "Show {N} results".

### WEB-DISC-FR-035 · [M1] · Discover Results page
Deep-linkable URL identical to mobile. 3-col grid desktop / 2-col tablet / 1-col mobile. Sort dropdown (Relevance / Newest / Price / Rating).

### WEB-DISC-FR-036 · [M1] · Active filter chip row
Removable × on each chip. "Clear all" link. Mirrors mobile.

### WEB-DISC-FR-037 · [M1] · Destination search with Places
Reuses DISC-FR-042 server endpoints. Google Places autocomplete. Powered-by Google footer (legally required).

### WEB-DISC-FR-038 · [M1] · Handpicked collections rail
4-tile rail per DISC-FR-053. Tile hover expands to show 2-line description + 3 mini content thumbs.

### WEB-DISC-FR-039 · [M1] · Explore-by-city chip rail
Per DISC-FR-054. Chip click re-scopes city + routes to `/feed`.

---

## 4.16.4 Web Content Reader / Detail (WEB-READ)

### WEB-READ-FR-040 · [M1] · Reader shell
Two-mode: **Magazine** (immersive) and **Compact** (mobile-parity). Default Magazine on ≥768 px. Compact on <768 px or via user toggle.

### WEB-READ-FR-041 · [M1] · Parallax hero
80–90 vh hero with `transform: translateY(scrollY * 0.3)` (Framer Motion `useScroll`). Image alpha fades to 0.6 on full viewport scroll.

### WEB-READ-FR-042 · [M1] · Sticky day/chapter nav
Left rail on ≥1280 px showing day list with distance + weather. Current day highlights as scroll passes anchor. Click → smooth scroll jump.

### WEB-READ-FR-043 · [M1] · Animated map progress
Mapbox static base + animated polyline (`motion.path` `pathLength` bound to `scrollYProgress`). Spot markers populate one-by-one as scroll passes anchors.

### WEB-READ-FR-044 · [M1] · Reading progress bar
Top 2 px **coral** (locked spot 7) bar tied to scroll % of article body. Fades out 600 ms after reaching 100%.

### WEB-READ-FR-045 · [M1] · Magazine typography
Fraunces 22/1.55 body. Drop-cap on first paragraph (Fraunces 96 pt italic, 3-line height). Pull-quotes 28 pt italic with hairline left border.

### WEB-READ-FR-046 · [M1] · Inline spot cards
720×180 → expand to 720×260 on hover (300 ms easeOut). Show photo, name, distance, "Save spot" CTA.

### WEB-READ-FR-047 · [M1] · Save-spot microinteraction
Bookmark icon coral-fills + ring-burst animation (`scale [1, 1.7]` 600 ms ease-out). Toast bottom-right "Saved to {trip name} →".

### WEB-READ-FR-048 · [M2] · Share-as-image
"Share" → Next.js OG route generates 1080×1920 card → twitter / WhatsApp / IG-DM / copy link.

### WEB-READ-FR-049 · [DEFERRED] · Ambient audio (opt-in)
Optional ambient track per itinerary mood (waves/highway/forest). Off by default. Mute persists in `localStorage`. **Deferred** pending CC0-only audio sourcing decision.

---

## 4.16.5 Web Booking (WEB-BOOK)

### WEB-BOOK-FR-050 · [M1] · Booking flow shell
4-step desktop wizard: Date → Pax → Add-ons → Pay. Left progress rail + canvas + right summary card with live price breakdown.

### WEB-BOOK-FR-051 · [M1] · Calendar slot picker
Dual-month calendar. Sold-out days struck through, low-availability badge (coral dot), today outlined.

### WEB-BOOK-FR-052 · [M1] · Pax + add-ons
Stepper widgets for Adults / Kids / Toddlers. Add-on toggles (helmet, photographer, guide, meals). Live price update with 200 ms debounce.

### WEB-BOOK-FR-053 · [M1] · Razorpay desktop hosted page
Same-tab redirect via Razorpay Standard Checkout. Success returns to `/booking/{id}/confirm`.

### WEB-BOOK-FR-054 · [M1] · Live seat availability
Server-Sent Events on `GET /api/v1/bookings/{contentId}/availability` (text/event-stream). Updates "X seats left" badge with color transition (green > yellow > red > sold out).

### WEB-BOOK-FR-055 · [M1] · Confirmation page
Animated confetti spring (Framer Motion 200 particles, 1.4 s). Itinerary download CTA. Calendar invite (.ics).

### WEB-BOOK-FR-056 · [M1] · My bookings page
List + detail. Tabs: Upcoming / Past / Cancelled. Chat with creator deep-links to mobile (web chat deferred V2).

---

## 4.16.6 Web Creator Studio (WEB-STUD)

### WEB-STUD-FR-057 · [M1] · Studio shell
Sidebar (Dashboard / Content / Bookings / Reviews / Payouts / Settings) + main canvas. Active item gets coral 2 px left-border.

### WEB-STUD-FR-058 · [M1] · Dashboard home
4 stat tiles (Earnings 30d, Bookings 30d, Saves 30d, Followers) + 30-day full-width earnings chart (area + line + peak marker) + recent activity feed.

### WEB-STUD-FR-059 · [M1] · Content list
Sortable table: title, type, status, views, saves, bookings, published_at. Filter by type/status. Bulk-select column.

### WEB-STUD-FR-060 · [M1] · Bookings table
All bookings; filter by status. Row-click opens drawer with traveler details + actions (Mark in-progress / Mark completed / Refund / Message).

### WEB-STUD-FR-061 · [M1] · Reviews list
Reply inline, flag, sort by rating.

### WEB-STUD-FR-062 · [M1] · Payouts ledger
UTR-tagged rows, status pills (Pending / Initiated / Settled / Failed), download statement (CSV / PDF). Sticky totals row.

### WEB-STUD-FR-063 · [M1] · Stats hover-card
Hover stat tile → mini sparkline tooltip (drilldown deferred V1+).

### WEB-STUD-FR-064 · [M1] · Bulk content actions
Select rows → archive / unpublish / set featured.

### WEB-STUD-FR-065 · [M1] · Studio settings
Payout details, KYC status banner, notification prefs, account.

### WEB-STUD-FR-066 · [M2] · Multi-tab safe state
Studio state cached per tab; mutations broadcast via `BroadcastChannel` to refresh sibling tabs. "Updated in another tab — Refresh / Dismiss" toast.

---

## 4.16.7 Web Publishing Wizard (WEB-PUB)

### WEB-PUB-FR-067 · [M1] · Wizard shell
Step rail left, canvas right, sticky save bar bottom. 5 steps: Type → Cover → Details → Spots/Days → Review.

### WEB-PUB-FR-068 · [M1] · Type picker
4 cards (post / itinerary / experience / event). Type-locked from URL `?type=`.

### WEB-PUB-FR-069 · [M1] · Cover uploader
Drag-drop zone, paste-from-clipboard, crop-to-aspect (2:1). Reuses S3 presign endpoint. Max 8 MB JPG/PNG/WebP.

### WEB-PUB-FR-070 · [M1] · Markdown body editor
**TipTap** (ProseMirror-based) editor with Fraunces preview pane, image inline, undo/redo. Lazy-loaded on route. Bundle budget: editor route allowed ~150 KB additional.

### WEB-PUB-FR-071 · [M1] · Spot search (Places)
Same Places autocomplete as mobile. Spot cards reorderable via drag (`framer-motion` `Reorder`).

### WEB-PUB-FR-072 · [M1] · Autosave draft
Server Action every 8 s + on blur. "Saved 3 s ago" indicator with states (idle / saving / saved / error / retry).

### WEB-PUB-FR-073 · [M1] · Publish + preview
Modal preview opens live mini-site URL in iframe. Publish CTA disabled until validations pass. Confirmation modal with confetti spring.

---

## 4.16.8 Web KYC (WEB-KYC)

### WEB-KYC-FR-074 · [M0] · KYC entry
Banner on Studio when status ≠ verified. "Start verification" CTA. States: not-started / in-review / rejected.

### WEB-KYC-FR-075 · [M0] · Document upload
PAN photo upload via file input or webcam capture (`getUserMedia`). Same validation as mobile.

### WEB-KYC-FR-076 · [M0] · Selfie capture
Browser camera with oval guide overlay. Same 4 positioning states (too far / close / off-center / centered) as mobile KYC.

### WEB-KYC-FR-077 · [M0] · Status tracking
Pending / In review / Verified / Rejected (with reason). Identical state machine to mobile.

---

## 4.16.9 Web Profile & Settings (WEB-PROF)

### WEB-PROF-FR-078 · [M1] · Authed profile page
Edit cover, avatar (drag-drop), bio, links (Instagram/YouTube/site).

### WEB-PROF-FR-079 · [M1] · Settings shell
Sidebar: Account / Notifications / Privacy / Connected accounts / Travel preferences / Danger.

### WEB-PROF-FR-080 · [M1] · Notification preferences
Per-channel × per-event matrix. Channels: Email / Push (browser) / WhatsApp / In-app. Reuses NTF-FR-004.

### WEB-PROF-FR-081 · [M1] · Privacy controls
Block list (SEC-FR-008), private mode emergency switch (SEC-FR-007), comment moderation toggle, tag approval toggle.

### WEB-PROF-FR-082 · [M1] · Travel sub-cat editor
Same 4-tile grid. Min 2. Updates `users.travel_sub_categories`.

### WEB-PROF-FR-083 · [M1] · Account deletion
14-day soft delete. Same flow as mobile. Confirmation requires typing username.

---

## 4.16.10 Web Notifications, Saved, Social

### WEB-NTF-FR-084 · [M1] · Notification centre
Slide-in drawer from top-right bell. Grouped by day. Mark-read on hover-end after 1 s.

### WEB-NTF-FR-085 · [M2] · Web push (un-defers NTF-FR-006)
Web Push API + service worker for notification delivery. Opt-in modal after 3rd visit.

### WEB-SAV-FR-086 · [M1] · Saved page
Tabs: All / Posts / Itineraries / Experiences / Events / Spots. Spots tab additionally shows mini-map (Mapbox cluster).

### WEB-SOC-FR-087 · [M1] · Follow / like / comment
Identical semantics to SOC-FR section. Optimistic UI with snap-back on server fail.

### WEB-SOC-FR-088 · [M1] · Share
Native Web Share API where available, else copy-link + 4-icon row (WhatsApp / X / IG-DM / Mail).

---

## 4.16.11 Web Gamification (WEB-GAM)

Plugs into existing `GAM-FR-001..006` (currently V1/V2 deferred for mobile UI; web ships UI first because longer sessions favor visual rewards).

### WEB-GAM-FR-089 · [M1] · Quests + streaks page
Daily quest ring (3 segments) + streak flame counter with XP bar + level pill. 3 daily quests reset midnight IST.

### WEB-GAM-FR-090 · [M1] · Daily check-in
Once-per-day claim → coin-burst animation (Framer Motion spring). +5 XP.

### WEB-GAM-FR-091 · [M1] · Achievements grid
Locked/unlocked tiles. Click locked → progress modal. Click unlocked → modal with confetti spring (200 confetti particles, 1.2 s).

### WEB-GAM-FR-092 · [M1] · Leaderboard
Tabs: Your city / National / All-time. Top 3 podium with rise animation (y: 40→0 stagger 80 ms). Ranks 4-50 list. Sticky bottom your-rank pill.

### WEB-GAM-FR-093 · [M1] · XP toast system
Action → toast bottom-right "+15 XP — Published an itinerary". Queue if multiple. Auto-dismiss 1.8 s.

### WEB-GAM-FR-094 · [M1] · Level-up sound (opt-in)
Single 0.6 s WebAudio chime on level-up. Off by default. Persists in user prefs.

---

## 4.16.12 Web Storytelling (WEB-STORY)

Cross-cuts WEB-READ but specifies the editorial language separate from reader chrome.

### WEB-STORY-FR-095 · [M1] · Scrollytelling itinerary
Whole-page scroll choreography: hero parallax, day chapters with sticky title-cards, map polyline progress.

### WEB-STORY-FR-096 · [M1] · Magazine layouts
Multi-column body on ≥1280 px (2-col with 32 px gutter). Single-col below.

### WEB-STORY-FR-097 · [M1] · Pull-quotes + drop-caps
Auto-detected from markdown `>` lines and first-paragraph first-letter.

### WEB-STORY-FR-098 · [M1] · Chapter title cards
Each "Day N" anchor renders as a full-width 240–280 px tall card with day name, distance, hero image.

### WEB-STORY-FR-099 · [M2] · Print-friendly export
Browser print stylesheet renders without nav/quests; usable as PDF via Cmd+P.

---

## 4.16.13 Web Motion Language (WEB-MOTION)

### WEB-MOTION-FR-100 · [M1] · Framer Motion adoption
Add `framer-motion@11` to `apps/web/package.json`. Use for orchestration only, not layout. Code-split per route.

### WEB-MOTION-FR-101 · [M1] · Page transitions
`AnimatePresence` between routes: fade + slide 8 px, 220 ms easeOut.

### WEB-MOTION-FR-102 · [M1] · Scroll reveals
List items reveal with `whileInView` (opacity 0→1, y 8→0), 180 ms, stagger 40 ms, max 8 animate.

### WEB-MOTION-FR-103 · [M1] · Cursor-aware microinteractions
Card hover tilt ±2° on mouse position. Disabled on touch devices (`@media (hover: hover) and (pointer: fine)`).

### WEB-MOTION-FR-104 · [M1] · Optimistic motion
All optimistic UI changes (save, like, follow) animate the success state instantly, snap back if server fails.

### WEB-MOTION-FR-105 · [M0] · Reduced-motion fallback
All Framer Motion variants gated by `useReducedMotion()` hook. Fallback = instant state change. Tested via DevTools "Reduced motion" emulation.

---

## 4.16.14 Web Accessibility (WEB-A11Y)

### WEB-A11Y-FR-106 · [M0] · WCAG 2.2 AA compliance
All interactive surfaces meet AA contrast, keyboard nav, focus-visible rings (2 px coral). axe-core CI scan with 0 critical violations.

### WEB-A11Y-FR-107 · [M1] · Keyboard shortcuts
`/` focuses search · `Cmd/Ctrl+K` opens search overlay · `J/K` next/prev card on feed · `?` opens shortcut help.

### WEB-A11Y-FR-108 · [M0] · Screen-reader landmarks
`<main>`, `<nav>`, `<aside>` correct on every page. `aria-live="polite"` for toasts.

### WEB-A11Y-FR-109 · [M0] · Focus management on route change
Focus moves to `<h1>` on route change. Toast announcements via `aria-live`.

### WEB-A11Y-FR-110 · [M0] · Reduced-motion + high-contrast
Respect both media queries. High-contrast strips coral except locked spots 1, 4, 5.

---

## 4.16.15 Web Non-Functional Requirements (WEB-NFR)

| ID | Category | Target |
|---|---|---|
| WEB-NFR-001 | LCP | < 2.0 s p75 on 4G/Slow 4G |
| WEB-NFR-002 | INP | < 200 ms p75 |
| WEB-NFR-003 | CLS | < 0.05 p75 |
| WEB-NFR-004 | JS bundle | < 180 KB gzip per initial route. Framer Motion code-split per route. |
| WEB-NFR-005 | TTFB | < 400 ms p75 SSR |
| WEB-NFR-006 | Responsive breakpoints | mobile <768 / tablet 768-1079 / desktop 1080-1439 / wide 1440-1919 / ultrawide ≥1920 |
| WEB-NFR-007 | Auth model | Server-validated httpOnly Secure SameSite=Lax session cookie; 30-day rolling, idle 24 h |
| WEB-NFR-008 | CSRF | Double-submit cookie + Origin header check on all mutating Server Actions |
| WEB-NFR-009 | Rate limits | Cloudflare per-IP: 60 reads/min, 10 mutations/min unauthed; 600/60 authed |
| WEB-NFR-010 | Realtime | SSE for booking availability; WebSocket only if multi-user real-time editing ships (NOT in v1.5) |
| WEB-NFR-011 | Browser support | Latest 2 versions Chrome, Safari, Edge, Firefox; iOS Safari ≥16; no IE |

---

## 4.17 Security workstream (SEC) — UN-DEFERRED

Move from `[DEFERRED]` to ACTIVE M0/M1:

| FR | New status | Why |
|---|---|---|
| SEC-FR-001 | ACTIVE M0 | Auth surfaces accept user-generated text; moderation pipeline blocks ship |
| SEC-FR-002 | ACTIVE M0 | Cache-key isolation needed for authed pages |
| SEC-FR-003 | ACTIVE M0 | OG/structured-data PII allowlist for share-as-image |
| SEC-FR-004 | ACTIVE M0 | `noindex` gate enforced on creator mini-sites |
| SEC-FR-005 | ACTIVE M0 | Reporting + 48 h triage SLA |
| SEC-FR-006 | ACTIVE M0 | Cloudflare rate limiting on all routes |
| SEC-FR-007 | ACTIVE M0 | Emergency private mode |
| SEC-FR-008 | ACTIVE M1 | Block-list visibility (referenced by WEB-PROF-FR-081) |
| SEC-FR-009 | ACTIVE M1 | Anomaly detection on bookings/follows |

---

## 4.9 Notifications — REVISION (R)

### NTF-FR-006 (R) · [M2] · Web push notifications
Was `[DEFERRED]` in v1.2. Now `[M2]` per WEB-NTF-FR-085. Web Push API + service worker. Opt-in modal after 3rd visit. Channel toggles in WEB-PROF-FR-080.

---

## 6.1 Design system — REVISION (R) — coral re-lock for web

Supersedes v1.4 §6.1 with web addendum. **Mobile remains 5 spots. Web adds 2 web-only contexts → web coral list = 7.** Anywhere else on web → bug.

| # | Context | Mobile | Web |
|---|---|---|---|
| 1 | Primary CTAs | ✓ | ✓ |
| 2 | Active bookmark icon | ✓ | ✓ |
| 3 | Location pin (city chips, results destination indicators) | ✓ | ✓ |
| 4 | Active nav indicator (top-bar tab underline / bottom-tab on mobile) | ✓ | ✓ |
| 5 | Critical unread signals (notif badge, active-filter count) | ✓ | ✓ |
| **6** | **(Web only)** XP/streak progress fill + level-up burst | — | ✓ |
| **7** | **(Web only)** Reading-progress bar in immersive reader | — | ✓ |

**Justification for the 2 web additions:** gamification and reading-progress are **user/content state indicators**, not chrome decoration. Constraining them to ink makes them invisible against monochrome surfaces — which kills the gamification engagement story (key web differentiator) and the storytelling reader's narrative momentum.

Photography exempt (covers, hero images). Initial avatars: warm-neutral grayscale palette.

---

## Database migrations introduced in v1.5

Likely **none required** — every API endpoint exists for mobile parity.

Two placeholder migration slots reserved (verify during implementation):

| File | Purpose |
|---|---|
| `028_web_push_subscriptions.sql` | Only if NTF-FR-006 ships (one new table: `endpoint`, `keys_p256dh`, `keys_auth`, `user_id`, `created_at`) |
| `029_web_session_refresh_log.sql` | Only if Supabase Auth cookies prove insufficient (decision item — confirm during impl) |

---

## Code-deletion record

None expected. v1.5 is purely additive — web shell currently has 6 SSR pages; nothing is being replaced.

---

## Verification gate

| Check | Pass criteria |
|---|---|
| `tsc --noEmit` (apps/web) | 0 errors |
| `pnpm test` (apps/web) | 0 Vitest failures |
| `pnpm playwright test` (apps/web) | 100% pass on new web E2E suite (signup, sign-in, feed, discover-results filter, content-detail magazine mode, booking happy path, studio dashboard, publish wizard, KYC start, gamification quest claim) |
| Lighthouse desktop | ≥95 perf, ≥100 a11y on `/`, `/[username]`, `/content/[id]`, `/feed` |
| axe-core CI scan | 0 critical violations |
| `prefers-reduced-motion: reduce` | All Framer Motion variants short-circuit to instant state |
| Manual browser test | Chrome + Safari + Firefox latest; iOS Safari 16+ |
| Manual scroll test | Immersive reader on desktop + tablet — parallax, sticky day-nav, animated map polyline all behave |
| Manual responsive test | 5 breakpoints (mobile / tablet / desktop / wide / ultrawide) — no layout breaks |
| Founder approval | Walkthrough of all 12 wireframe packs + 4 standalones |

---

## Open follow-ups (not in v1.5)

- Web-based DMs / chat (V2; mobile-only at launch — web deep-links to mobile)
- PWA install + offline mode (V2)
- Multi-currency / i18n (locked OUT)
- Real-time collaborative editing in publishing wizard (V2)
- Drilldown analytics in studio (V1+, post-launch)
- Rewards marketplace (V2 per GAM-FR-006)
- Dark mode (V2; separate design pass)
- Ambient audio in reader (WEB-READ-FR-049 — deferred pending CC0 audio sourcing)

---

## Wireframe artifacts

`docs/01_wireframes/v2/web/` — 12 packs (W1–W12), 4 standalones (reader-magazine, gamification-quests, studio-dashboard, booking-flow), master canvas, 3 shared modules. Every screen ID maps to at least one FR in this delta. See `web/README.md` for the cross-walk table.