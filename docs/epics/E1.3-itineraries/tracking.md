# E1.3 — Itineraries Tracking

**Status:** IN REVIEW
**Progress:** 13/15 tasks implemented (T12 map + T14 SSR deferred)
**Branch:** `dev`
**Last Updated:** 2026-04-12

---

## Tasks

| ID | Task | Status | Notes |
|----|------|--------|-------|
| T1 | Itinerary Zod Schemas & Types | `[x]` Done | `createItineraryDraftSchema` (vertical + day_count), `reorderSpotsSchema`, `updateDaySchema`, `addSpotSchema`, `updateSpotSchema` — `packages/shared/src/schemas/index.ts` |
| T2 | Itinerary Service | `[x]` Done | 12 functions: `createItineraryDraft` (creates day skeletons), `getItineraryDetail` (free preview gating), `updateItinerary` (handles day count changes), `addDay`/`updateDay`/`removeDay` (with renumbering), `addSpot`/`updateSpot`/`removeSpot` (PostGIS points), `reorderSpots`, `publishItinerary`, `computeDayStats` — `apps/api/src/services/itinerary.service.ts` |
| T3 | Itinerary Days & Spots CRUD Handlers | `[x]` Done | 11 handlers in `apps/api/src/handlers/itineraries.ts` — full ownership chain verification (spot→day→content→user) |
| T4 | Itinerary Distance & Duration Calculator | `[x]` Done | PostGIS `ST_Distance` via Supabase RPC `compute_day_stats` — integrated in `computeDayStats()` service function |
| T5 | Place Cache Service | `[x]` Done | Migration `013_place_cache.sql` with PostGIS RPCs: `insert_itinerary_spot`, `extract_spot_coords`, `renumber_itinerary_days`, `renumber_itinerary_spots`, `compute_day_stats` |
| T6 | Itinerary Creation Wizard (Flutter) | `[x]` Done | 6-step wizard using E1.1 shell — `apps/mobile/lib/features/itineraries/` |
| T7 | Trip Overview Step (Flutter) | `[x]` Done | Day count stepper (1–30), city search, destination multi-select — `apps/mobile/lib/features/itineraries/widgets/trip_overview_step.dart` |
| T8 | Day Builder Screen (Flutter) | `[x]` Done | Day tabs, spot list with `ReorderableListView`, FAB to add spots — `apps/mobile/lib/features/itineraries/screens/day_builder_screen.dart` |
| T9 | Spot Picker Bottom Sheet (Flutter) | `[x]` Done | Places autocomplete, 300ms debounce, "Powered by Google" attribution — `apps/mobile/lib/features/itineraries/widgets/spot_picker_sheet.dart` |
| T10 | Spot Editor Bottom Sheet (Flutter) | `[x]` Done | Creator note, duration picker (minutes), stop type selector (regular/overnight/meal/viewpoint/activity) — `apps/mobile/lib/features/itineraries/widgets/spot_editor_sheet.dart` |
| T11 | Itinerary Detail Screen (Flutter) | `[x]` Done | Map placeholder, day tabs, spot cards, paywall overlay for paid itineraries — `apps/mobile/lib/features/itineraries/screens/itinerary_detail_screen.dart` |
| T12 | Itinerary Map Component (Flutter) | `[ ]` Deferred | Deferred until `google_maps_flutter` package added. Map placeholder is in place. |
| T13 | Itinerary Feed Card Widget (Flutter) | `[x]` Done | ITINERARY badge, day count chip, stats row (distance + duration), price badge — `apps/mobile/lib/features/itineraries/widgets/itinerary_feed_card.dart` |
| T14 | Itinerary Detail SSR Page (Web) | `[ ]` Deferred | Deferred to E2.10 (minimal web). SEO/WhatsApp sharing page. |
| T15 | Mount Itinerary Routes in App | `[x]` Done | `app.route('/api/v1/itineraries', itinerariesRoutes)` in `apps/api/src/index.ts`. Spots/reorder routes ordered before `/:spotId` to avoid conflicts. |

---

## Tests

| Module | Test File | Written | Passing | Notes |
|--------|-----------|---------|---------|-------|
| Itinerary Service — ownership chain | `apps/api/src/services/itinerary.service.test.ts` | `[x]` Yes | `[x]` **20/20** | 3-level ownership (spot→day→content→user), free preview gating (non-owner of paid sees only Day 1 spots), day renumbering RPC called after remove |
| Itinerary Service — PostGIS | `apps/api/src/services/itinerary.service.test.ts` | `[x]` Yes | `[x]` **20/20** | `addSpot` calls `insert_itinerary_spot` RPC with lat/lng; Day 1 → `is_free_preview=true`; `computeDayStats` calls `compute_day_stats` RPC, updates day |
| Itinerary Handlers | `apps/api/src/handlers/itineraries.test.ts` | `[x]` Yes | `[x]` **33/33** | 401 no auth (all write routes), 400 invalid body/vertical/day_count, 400 tnc_accepted≠true, 400 invalid spot (name/lat/lng missing), 400 non-UUID in reorder, 201/200/204 success, 404/403 propagation |
| Itinerary Feed Card | widget test | `[ ]` Pending | — | Needs: ITINERARY badge renders, day count chip, price badge for paid |
| Spot Picker Sheet | widget test | `[ ]` Pending | — | Needs: debounce fires after 300ms, results list renders, "Powered by Google" visible |
| Day Builder Screen | widget test | `[ ]` Pending | — | Needs: FAB triggers spot picker, spot list reorderable |
| **Auth Middleware** | `apps/api/src/middleware/authenticate.test.ts` | `[x]` Yes | `[x]` **15/15** | Shared with E1.1 — covers authenticate, optionalAuthenticate, requireCreator, requireKYC |

---

## Review Gate

| Review | Status | Findings |
|--------|--------|----------|
| Edge Cases | `[x]` Passed | Day renumbering triggers after remove; spot reorder preserves all IDs; free preview shows only Day 1 spots for non-buyers; ownership chain verified at 3 levels |
| Security | `[x]` Passed | 3-level ownership: `spot.itinerary_day_id` → `day.content_id` → `content.user_id` === `userId`; PostGIS only via Supabase RPCs (no raw SQL injection surface); KYC check for paid publishing |
| Architecture | `[x]` Passed | PostGIS RPCs in migration (not inline SQL); `handler→service→query` pattern; Riverpod `FutureProvider.family.autoDispose` for detail screen; spot/reorder routes ordered before `/:spotId` |
| Code Quality | `[x]` Passed | `flutter analyze`: 0 issues; `tsc --noEmit`: 0 errors |

---

## Pre-Commit Checklist

| Check | Status | Result |
|-------|--------|--------|
| Itinerary service tests | `[x]` Done | **20/20 passed** in `itinerary.service.test.ts` — ownership chain, PostGIS RPCs, free preview gating |
| Itinerary handler tests | `[x]` Done | **33/33 passed** in `itineraries.test.ts` — auth wiring, all CRUD routes, day/spot operations, reorder UUID validation |
| Flutter itinerary widget tests | `[ ]` Pending | Widget tests not yet written |
| Auth middleware tests (shared) | `[x]` Done | **15/15 passed** in `authenticate.test.ts` |
| Dart analyze (`flutter analyze`) | `[x]` Passed | **0 issues** |
| TypeScript typecheck (`tsc --noEmit`) | `[x]` Passed | **0 errors** |
| Edge case review | `[x]` Passed | See Review Gate above |
| Security review | `[x]` Passed | See Review Gate above |
| Architecture review | `[x]` Passed | See Review Gate above |
| Code quality review | `[x]` Passed | See Review Gate above |
| API boots — `/healthz` 200 | `[x]` Passed | Verified: `{"status":"ok"}` on port 3001 |
| API readyz — database | `[x]` Passed | `database: true` — migrations 001–013 deployed, service role key configured |
| API readyz — firebase | `[x]` Passed | `firebase: true` |
| Flutter launches | `[ ]` Pending | Not yet run (`flutter run`) |
| Tracking file updated | `[x]` Done | This file |

**Commit gate:** Blocked on → Flutter widget tests + Flutter launch verified

---

## Changelog

| Date | Change |
|------|--------|
| 2026-04-12 | Epic created, 15 tasks defined |
| 2026-04-12 | 13/15 tasks completed (T12 map + T14 SSR deferred). 6 API files + 9 Flutter files + 1 migration. `flutter analyze`: 0, `tsc`: 0 errors |
| 2026-04-12 | Pre-commit checklist added with full task detail. Service tests pending. API boots confirmed on port 3001. Firebase confirmed working. DB pending migrations. |
| 2026-04-12 | `itinerary.service.test.ts` written: 20/20 passing. Covers ownership chain (3-level), PostGIS RPC calls, free preview gating, day renumbering. Migrations 001–013 deployed. |
