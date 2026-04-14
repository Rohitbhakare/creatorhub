# CreatorHub — Master Epic Tracking

> Single source of truth for sprint progress.
> Detail lives in `docs/epics/<epic-id>/tracking.md` — this file is the summary dashboard.
> Last updated: 2026-04-14

---

## Legend

| Symbol | Meaning |
|--------|---------|
| `DONE` | Committed and merged |
| `IN REVIEW` | Code complete, pre-commit checklist in progress |
| `IN PROGRESS` | Actively being built |
| `NOT STARTED` | Not yet begun |
| `[x]` | Check passed / item complete |
| `[ ]` | Not done / pending |
| `[~]` | Partially done |
| `[-]` | Deferred (intentional skip) |

---

## Current Sprint

**Milestone:** M1 — Private Alpha
**Focus:** E1.1/E1.2/E1.3/E1.4 DONE — next: E1.5 Home Feed

**All M1 blockers resolved:**
1. `[x]` ~~Deploy SQL migrations 001–013 to Supabase~~ — Done (48 tables deployed)
2. `[x]` ~~Write `post.service.test.ts` + `itinerary.service.test.ts`~~ — Done (16+20 tests passing)
3. `[x]` ~~Add `SUPABASE_SERVICE_ROLE_KEY` to `.env`~~ — Done, `/readyz` → `database: true`
4. `[x]` ~~Write handler tests~~ — Done (`posts.test.ts` 20 tests, `itineraries.test.ts` 33 tests, all passing)
5. `[x]` ~~Write remaining service tests~~ — Done (content, media, tnc: 29+23+8 = 60 new API tests)
6. `[x]` ~~Write Flutter widget tests~~ — Done (post_detail 11, itinerary_detail 11, + existing 55)
7. `[x]` ~~`flutter build apk --debug`~~ — Compiles without errors

---

## M0 — Foundations

| Epic | Name | Status | Tasks | Tests | Lint | Type | Review Gate | Commit |
|------|------|--------|-------|-------|------|------|-------------|--------|
| E0.1 | Repo & Infra | `DONE` | 9/9 | `[ ]` none written | `[x]` | `[x]` | `[ ]` not run | `[x]` |
| E0.2 | Database Schema | `DONE` | 12/12 | `[ ]` none written | `[x]` | `[x]` | `[ ]` not run | `[x]` |
| E0.3 | Authentication | `DONE` | 10/10 | `[~]` auth middleware (15 tests) | `[x]` | `[x]` | `[ ]` not run | `[x]` |
| E0.4 | Design System | `DONE` | 12/12 | `[ ]` none written | `[x]` | `[x]` | `[ ]` not run | `[x]` |
| E0.5 | Onboarding | `DONE` | 10/10 | `[ ]` none written | `[x]` | `[x]` | `[x]` passed | `[x]` |

> **Note on M0 tests:** M0 epics were committed before the test-required process was established. Tests for auth middleware (E0.3) have since been backfilled and are now passing (15/15). Remaining M0 tests are tech debt — will be addressed in a dedicated "test backfill" session before M1 gate.

---

## M1 — Private Alpha

| Epic | Name | Status | Tasks | Tests | Lint | Type | Review Gate | API Boot | DB | Flutter | Commit |
|------|------|--------|-------|-------|------|------|-------------|----------|----|---------| -------|
| E1.1 | Content Framework | `DONE` | 14/14 | `[x]` 115 API tests (content+media+tnc+handlers) | `[x]` | `[x]` | `[x]` | `[x]` | `[x]` | `[x]` | `[x]` |
| E1.2 | Posts | `DONE` | 10/10 | `[x]` 16 service + 20 handler + 11 Flutter | `[x]` | `[x]` | `[x]` | `[x]` | `[x]` | `[x]` | `[x]` |
| E1.3 | Itineraries | `DONE` | 15/15 | `[x]` 20 service + 33 handler + 11 Flutter | `[x]` | `[x]` | `[x]` | `[x]` | `[x]` | `[x]` | `[x]` |
| E1.4 | Events | `DONE` | 11/11 | `[x]` 56 Flutter + 188 API | `[x]` | `[x]` | `[x]` passed | `[x]` | `[x]` | `[x]` | `[x]` |
| E1.5 | Home Feed | `NOT STARTED` | 0/? | — | — | — | — | — | — | — | — |
| E1.6 | Profiles | `NOT STARTED` | 0/? | — | — | — | — | — | — | — | — |
| E1.7 | Social | `NOT STARTED` | 0/? | — | — | — | — | — | — | — | — |
| E1.8 | Studio Tab | `NOT STARTED` | 0/? | — | — | — | — | — | — | — | — |
| E1.9 | Notifications | `NOT STARTED` | 0/? | — | — | — | — | — | — | — | — |

---

## M2 — Public MVP

| Epic | Name | Status | Blocked By |
|------|------|--------|------------|
| E2.1 | Scheduled Experiences | `NOT STARTED` | E1.1 |
| E2.2 | KYC Flow | `NOT STARTED` | E0.3, E0.4 |
| E2.3 | Payments & Booking | `NOT STARTED` | E2.1, E2.2 |
| E2.4 | Refunds & Cancellations | `NOT STARTED` | E2.3 |
| E2.5 | Reviews | `NOT STARTED` | E2.3 |
| E2.6 | Tax Compliance | `NOT STARTED` | E2.3 |
| E2.7 | Trust & Safety | `NOT STARTED` | E0.3 |
| E2.8 | Admin Panel | `NOT STARTED` | E2.2, E2.3 |
| E2.9 | Notifications (full) | `NOT STARTED` | E1.9 |
| E2.10 | Web (minimal) | `NOT STARTED` | E1.6, E1.2 |
| E2.11 | DPDPA & Legal | `NOT STARTED` | E0.3 |

---

## Epic Detail — Tasks & Tests

### E0.1 — Repo & Infra `DONE`

| ID | Task | Done | Test |
|----|------|------|------|
| T1 | Git & root config (.gitignore, tsconfig.base, eslint, prettier) | `[x]` | — |
| T2 | Scaffold API (Hono + Dockerfile + fly.toml + env.ts) | `[x]` | — |
| T3 | Scaffold Mobile (Flutter + analysis_options + permissions) | `[x]` | — |
| T4 | Scaffold Web (Next.js + Tailwind v4 + fonts) | `[x]` | — |
| T5 | Shared package (types, schemas, constants) | `[x]` | — |
| T6 | Environment config (.env.example for api + web) | `[x]` | — |
| T7 | CI pipeline (parallel: lint+typecheck / flutter-analyze+test) | `[x]` | — |
| T8 | pnpm dev command (api + web concurrent) | `[x]` | — |
| T9 | Root README | `[x]` | — |

---

### E0.2 — Database Schema `DONE`

| ID | Task | Done | Test |
|----|------|------|------|
| T1 | Enums & extensions (PostGIS, pgcrypto, pg_trgm + 8 enums) | `[x]` | — |
| T2 | Users & auth tables (users, devices, sessions, audit_events) | `[x]` | — |
| T3 | Cities table + ~500 cities seeded (GIST + trigram indexes) | `[x]` | — |
| T4 | Vertical sub-categories + seed (12 travel + 5 stories) | `[x]` | — |
| T5 | Content & media tables (tsvector search, auto-update trigger) | `[x]` | — |
| T6 | Itinerary & event tables (days, spots, dates, meeting points) | `[x]` | — |
| T7 | Social & engagement (follows, likes, comments, saves, shares, reports) | `[x]` | — |
| T8 | Booking & payment (bookings, financials, payments, payouts, refunds) | `[x]` | — |
| T9 | KYC & notification tables | `[x]` | — |
| T10 | Search & analytics (search_queries, matview, dpdpa, feature_flags) | `[x]` | — |
| T11 | RLS policies (all tables) | `[x]` | — |
| T12 | DB utility functions (nearby_content, search_content, increment_count) | `[x]` | — |

> **Migrations:** Files exist in `apps/api/src/db/migrations/`. **Not yet deployed to Supabase.** Deploy is a prerequisite for `/readyz` database check.

---

### E0.3 — Authentication `DONE`

| ID | Task | Done | Test |
|----|------|------|------|
| T1 | Firebase Admin SDK setup (`apps/api/src/lib/firebase.ts`) | `[x]` | `[x]` verified — Firebase SDK initializes on boot |
| T2 | Auth middleware (authenticate, optionalAuthenticate, requireCreator, requireKYC) | `[x]` | `[x]` **15/15** — `authenticate.test.ts` |
| T3 | Auth routes & handlers (register, refresh, sign-out) | `[x]` | `[ ]` pending |
| T4 | Auth service & tokens (jose JWTs, SHA-256 refresh tokens, mutex refresh) | `[x]` | `[ ]` pending |
| T5 | Flutter — Phone OTP screen (Pinput, resend timer, max attempts) | `[x]` | `[ ]` pending |
| T6 | Flutter — Google + Apple OAuth | `[x]` | `[ ]` pending |
| T7 | Flutter — Auth state & token storage (Riverpod Notifier, flutter_secure_storage) | `[x]` | `[ ]` pending |
| T8 | Flutter — Soft auth wall (bottom sheet for guests) | `[x]` | `[ ]` pending |
| T9 | Rate limiting middleware (10/min auth, 5/hr OTP, 100/min general) | `[x]` | `[ ]` pending |
| T10 | Audit event logging (fire-and-forget, no PII) | `[x]` | `[ ]` pending |

---

### E0.4 — Design System `DONE`

| ID | Task | Done | Test |
|----|------|------|------|
| T1 | Color system (warm neutrals, coral accent, vertical colors, shimmer) | `[x]` | — visual |
| T2 | Typography (Fraunces display/H1/H2/postBody, Inter everything else) | `[x]` | — visual |
| T3 | Spacing & layout constants (4px grid, radii, tap targets) | `[x]` | — visual |
| T4 | ThemeData (Material 3, AppBar, BottomNav, Cards, Buttons, Input) | `[x]` | — visual |
| T5 | Button component (4 variants, 3 sizes, loading, haptic, animation) | `[x]` | `[ ]` pending |
| T6 | Input component (AppInput, AppSearchInput with debounce) | `[x]` | `[ ]` pending |
| T7 | Card component (ContentCard, CreatorCard) | `[x]` | `[ ]` pending |
| T8 | Bottom sheet wrapper (showAppBottomSheet) | `[x]` | `[ ]` pending |
| T9 | Skeleton shimmer (SkeletonLoader + variants) | `[x]` | `[ ]` pending |
| T10 | Empty state component (illustration + title + CTA) | `[x]` | `[ ]` pending |
| T11 | Badge & avatar components (CategoryBadge, AppAvatar) | `[x]` | `[ ]` pending |
| T12 | Animation presets (durations, curves, reduce-motion) | `[x]` | — visual |

---

### E0.5 — Onboarding `DONE`

| ID | Task | Done | Test |
|----|------|------|------|
| T1 | Welcome screen (Get Started, Sign In, Browse as Guest) | `[x]` | `[ ]` pending |
| T2 | Progress bar component (4-segment animated, coral) | `[x]` | `[ ]` pending |
| T3 | Location capture screen (city search + GPS placeholder) | `[x]` | `[ ]` pending |
| T4 | City search API (GET /cities trigram + ILIKE, GET /cities/nearby PostGIS) | `[x]` | `[ ]` pending |
| T5 | Vertical picker screen (2-col grid, 8 verticals, min 3) | `[x]` | `[ ]` pending |
| T6 | Verticals API (GET /verticals, PUT /onboarding/verticals) | `[x]` | `[ ]` pending |
| T7 | Suggested creators screen (follow toggle, optimistic update, skip) | `[x]` | `[ ]` pending |
| T8 | Suggested creators API (GET /onboarding/suggested-creators, follow/unfollow) | `[x]` | `[ ]` pending |
| T9 | Onboarding complete flow (celebration screen, POST /onboarding/complete) | `[x]` | `[ ]` pending |
| T10 | Onboarding state (Riverpod 3.x Notifier, 5-step tracking) | `[x]` | `[ ]` pending |

---

### E1.1 — Content Framework `DONE`

| ID | Task | Done | Test |
|----|------|------|------|
| T1 | Content Zod schemas & types (createContentSchema, updatePostSchema, updateItinerarySchema, publishContentSchema…) | `[x]` | — schemas validated by usage |
| T2 | Content CRUD service (createDraft, getById, updateDraft, listDrafts cursor pagination, softDelete) | `[x]` | `[x]` **29/29** — `content.service.test.ts` |
| T3 | Content state machine (publish → per-type validation + KYC, unpublish, archive) | `[x]` | `[x]` **20/20** — `content-state.service.test.ts` |
| T4 | Content CRUD handlers & routes (9 handlers at `/api/v1/content`) | `[x]` | `[x]` **25/25** — `content.test.ts` |
| T5 | Media upload service (signedUrl, addMedia count limits 5/10, removeMedia, reorderMedia) | `[x]` | `[x]` **23/23** — `media.service.test.ts` |
| T6 | Google Places proxy (autocomplete India bias, placeDetails in-memory cache) | `[x]` | `[ ]` pending (E1.3 scope) |
| T7 | T&Cs consent service (recordConsent idempotent, hasConsented) | `[x]` | `[x]` **8/8** — `tnc.service.test.ts` |
| T8 | Pricing calculator (calculatePricing, formatPricePaisa Indian grouping) | `[x]` | `[x]` **35/35** — `pricing.test.ts` |
| T9 | Content type picker screen (2×2 grid, Post+Itinerary enabled) | `[x]` | `[ ]` widget test deferred |
| T10 | Publishing wizard shell (stepper + progress + 30s auto-save) | `[x]` | `[ ]` widget test deferred |
| T11 | Basics step (title/description/body, live char counters) | `[x]` | `[ ]` widget test deferred |
| T12 | Pricing step (free/paid toggle, GST/platform fee/TDS breakdown) | `[x]` | `[ ]` widget test deferred |
| T13 | Review & publish step (validation checklist, T&Cs checkbox) | `[x]` | `[ ]` widget test deferred |
| T14 | Draft auto-save service (30s debounce, save status indicator) | `[x]` | `[ ]` widget test deferred |

**Pre-commit status:**
`[x]` All API service+handler tests · `[x]` Pricing tests 35/35 · `[x]` Content-state tests 20/20 · `[x]` Lint 0 · `[x]` Types 0 errors · `[x]` Review gate · `[x]` API `/healthz` · `[x]` Firebase · `[x]` DB migrations deployed · `[x]` Flutter build passes

---

### E1.2 — Posts `DONE`

| ID | Task | Done | Test |
|----|------|------|------|
| T1 | Post Zod schema & validation (updatePostSchema — already existed) | `[x]` | — |
| T2 | Post service (createPostDraft forces free, publishPost no KYC, getPostDetail, listPosts) | `[x]` | `[x]` **16/16** — `post.service.test.ts` |
| T3 | Post handlers & routes (5 handlers at `/api/v1/posts`, auth middleware) | `[x]` | `[x]` **20/20** — `posts.test.ts` |
| T4 | Post creation wizard (3-step: Basics → Media → Review, uses E1.1 shell) | `[x]` | `[ ]` widget test deferred |
| T5 | Post body editor (1000-char live counter, location chip placeholder) | `[x]` | `[ ]` widget test deferred |
| T6 | Post media step (image_picker, 2-col grid, max 5 images) | `[x]` | `[ ]` widget test deferred |
| T7 | Post detail screen (hero image, Fraunces body, engagement bar, skeleton) | `[x]` | `[x]` **11/11** — `post_detail_screen_test.dart` |
| T8 | Post feed card (16:9 cover, POST badge, press animation, creator row) | `[x]` | `[x]` — existing `post_feed_card_test.dart` |
| T9 | Post detail SSR page (Web) | `[-]` Deferred | E2.10 |
| T10 | Mount post routes | `[x]` | — |

**Pre-commit status:**
`[x]` Auth tests 15/15 · `[x]` Post service 16/16 · `[x]` Post handlers 20/20 · `[x]` Flutter detail screen 11/11 · `[x]` Lint 0 · `[x]` Types 0 errors · `[x]` Review gate · `[x]` API `/healthz` · `[x]` Firebase · `[x]` DB migrations · `[x]` Flutter build passes

---

### E1.3 — Itineraries `DONE`

| ID | Task | Done | Test |
|----|------|------|------|
| T1 | Itinerary Zod schemas (createItineraryDraftSchema, reorderSpotsSchema, updateDaySchema, addSpotSchema, updateSpotSchema) | `[x]` | — schemas validated by usage |
| T2 | Itinerary service (12 functions: createDraft+day skeletons, getDetail+free preview, updateItinerary+day count, addDay/updateDay/removeDay+renumber, addSpot/updateSpot/removeSpot PostGIS, reorderSpots, publish, computeDayStats) | `[x]` | `[x]` **20/20** — `itinerary.service.test.ts` |
| T3 | Itinerary handlers & routes (11 handlers, 3-level ownership chain) | `[x]` | `[x]` **33/33** — `itineraries.test.ts` |
| T4 | Distance & duration calculator (PostGIS ST_Distance via compute_day_stats RPC) | `[x]` | `[ ]` widget test deferred |
| T5 | Place cache service + migration 013 (PostGIS RPCs: insert_spot, renumber_days, renumber_spots, compute_day_stats) | `[x]` | `[ ]` integration test deferred |
| T6 | Itinerary creation wizard (6-step, uses E1.1 shell) | `[x]` | `[ ]` widget test deferred |
| T7 | Trip overview step (day count stepper 1–30, city search, destination multi-select) | `[x]` | `[ ]` widget test deferred |
| T8 | Day builder screen (day tabs, ReorderableListView, FAB → spot picker) | `[x]` | `[ ]` widget test deferred |
| T9 | Spot picker bottom sheet (Places autocomplete, 300ms debounce, "Powered by Google") | `[x]` | `[x]` — existing `spot_picker_sheet_test.dart` |
| T10 | Spot editor bottom sheet (creator note, duration picker, stop type selector) | `[x]` | `[ ]` widget test deferred |
| T11 | Itinerary detail screen (map placeholder, day tabs, spot cards, paywall overlay) | `[x]` | `[x]` **11/11** — `itinerary_detail_screen_test.dart` |
| T12 | Itinerary map component | `[-]` Deferred | Until google_maps_flutter added |
| T13 | Itinerary feed card (ITINERARY badge, day count, stats row, price badge) | `[x]` | `[x]` — existing `itinerary_feed_card_test.dart` |
| T14 | Itinerary detail SSR page (Web) | `[-]` Deferred | E2.10 |
| T15 | Mount itinerary routes | `[x]` | — |

**Pre-commit status:**
`[x]` Auth tests 15/15 · `[x]` Itinerary service 20/20 · `[x]` Itinerary handlers 33/33 · `[x]` Flutter detail screen 11/11 · `[x]` Lint 0 · `[x]` Types 0 errors · `[x]` Review gate · `[x]` API `/healthz` · `[x]` Firebase · `[x]` DB `database: true` · `[x]` Flutter build passes

---

## Global Test Status

| Test File | Package | Tests | Status |
|-----------|---------|-------|--------|
| `packages/shared/src/utils/pricing.test.ts` | shared | **35** | `[x]` All passing |
| `apps/api/src/middleware/authenticate.test.ts` | api | **15** | `[x]` All passing |
| `apps/api/src/services/content-state.service.test.ts` | api | **20** | `[x]` All passing |
| `apps/api/src/services/content.service.test.ts` | api | **29** | `[x]` All passing |
| `apps/api/src/services/media.service.test.ts` | api | **23** | `[x]` All passing |
| `apps/api/src/services/tnc.service.test.ts` | api | **8** | `[x]` All passing |
| `apps/api/src/services/post.service.test.ts` | api | **16** | `[x]` All passing |
| `apps/api/src/services/itinerary.service.test.ts` | api | **20** | `[x]` All passing |
| `apps/api/src/services/event.service.test.ts` | api | **26** | `[x]` All passing |
| `apps/api/src/handlers/content.test.ts` | api | **25** | `[x]` All passing |
| `apps/api/src/handlers/posts.test.ts` | api | **20** | `[x]` All passing |
| `apps/api/src/handlers/itineraries.test.ts` | api | **33** | `[x]` All passing |
| `apps/api/src/handlers/events.test.ts` | api | **38** | `[x]` All passing |
| `apps/mobile/test/features/posts/screens/post_detail_screen_test.dart` | mobile | **11** | `[x]` All passing |
| `apps/mobile/test/features/itineraries/screens/itinerary_detail_screen_test.dart` | mobile | **11** | `[x]` All passing |
| `apps/mobile/test/features/events/widgets/event_feed_card_test.dart` | mobile | **11** | `[x]` All passing |
| `apps/mobile/test/features/events/widgets/date_block_test.dart` | mobile | **7** | `[x]` All passing |
| `apps/mobile/test/features/events/screens/event_detail_screen_test.dart` | mobile | **10** | `[x]` All passing |
| Other Flutter widget tests (post_feed, itinerary_feed, spot_picker) | mobile | **27** | `[x]` All passing |

**Total passing: 385 / 385 written tests** (35 shared + 273 API + 77 Flutter)

---

## Infrastructure & Environment

| Item | Status | Notes |
|------|--------|-------|
| Supabase credentials | `[x]` Configured | `apps/api/.env` |
| Firebase credentials | `[x]` Configured + Verified | Firebase Admin SDK initializes on boot |
| JWT_SECRET | `[x]` Configured | Dev placeholder — change before production |
| Google Places API key | `[ ]` Placeholder | Needed for places autocomplete (E1.3 T9) |
| Razorpay keys | `[ ]` Placeholder | Not needed until E2.3 |
| API boots (`/healthz` 200) | `[x]` Verified | Port 3001 |
| API `/readyz` firebase | `[x]` Verified | `firebase: true` |
| API `/readyz` database | `[x]` Verified | `database: true` — service role key configured, 48 tables accessible |
| Flutter `flutter run` | `[ ]` Not yet run | Pending credentials + migrations |
| SQL migrations deployed | `[x]` Done | Migrations 001–013 deployed via psql to `tqumwskwxthsmknjqznv.supabase.co`. 48 tables created. |

---

## Milestone Gates

### M0 Gate (Week 2) — COMPLETE (with test debt)
- `[x]` `pnpm dev` boots all apps
- `[x]` CI passes (lint + typecheck)
- `[x]` Phone OTP sign-up implemented
- `[x]` Guest browsing + soft auth wall implemented
- `[x]` Schema DDL written, ~500 cities seeded
- `[x]` Design system components built
- `[x]` Onboarding flow implemented
- `[ ]` **Migrations not yet deployed to Supabase** (blocks e2e verification)

### M1 Gate (Week 6)
- `[ ]` All 4 content types creatable (free) — Posts + Itineraries built, Events + Experiences pending
- `[ ]` Home feed shows real content (E1.5 not started)
- `[ ]` Studio tab, profiles, social features (E1.6–E1.8 not started)
- `[ ]` Push notifications fire (E1.9 not started)
- `[ ]` p95 API read < 400ms
- `[ ]` Alpha builds on TestFlight + internal APK

### M2 Gate (Week 12)
- `[ ]` All M2 epics — not yet started

---

## Pre-Coding Deliverables

| Deliverable | Status | File |
|-------------|--------|------|
| CLAUDE.md (root) | `[x]` Done | `CLAUDE.md` |
| HLD | `[x]` Done | `docs/engineering/HLD.md` |
| OpenAPI Spec (M0+M1) | `[x]` Done | `docs/engineering/openapi.yaml` |
| E0.1–E0.5 Task Breakdowns | `[x]` Done | `docs/epics/E0.*/tasks.md` |
| E1.1–E1.3 Task Breakdowns | `[x]` Done | `docs/epics/E1.*/tasks.md` |
| Precommit instruction file | `[x]` Done | `.claude/instructions/precommit.md` |
| E1.4 Task Breakdown + Plan | `[x]` Done | `docs/epics/E1.4-events/` — COMMITTED |
| E1.5–E1.9 Task Breakdowns | `[ ]` Not yet written | Needed before building |
