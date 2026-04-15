# E1.5 — Home Feed — Tracking

> Status: **DONE**
> Detail per task lives here. Master dashboard: `docs/epics/TRACKING.md`.

---

## Status

| Field | Value |
|-------|-------|
| Epic | E1.5 Home Feed |
| Milestone | M1 |
| Status | `DONE` |
| Plan approved | `[x]` Yes |
| Implementation started | `[x]` Yes |
| Implementation complete | `[x]` Yes |
| Committed | `[x]` Yes — commit `dev` branch |

---

## Task Status

| ID | Task | Agent | Status | Tests | Notes |
|----|------|-------|--------|-------|-------|
| T1 | Migration 013: `lat`/`lng` columns on cities + `update_user_city` RPC | API | `DONE` | — | PostGIS geo columns |
| T2 | `feed_near_you()` PL/pgSQL waterfall (4-level: city → 200km → 500km → India) | API | `DONE` | — | Graceful fallback chain |
| T3 | `feed.service.ts` (getUserLocation, getNearYouSection, getVerticalSection, getDiscoverSection, updateUserCity) | API | `DONE` | `[x]` 15/15 | `feed.service.test.ts` |
| T4 | `feed.ts` handlers + `feed.routes.ts` (GET /near-you, GET /vertical/:vertical, GET /discover) | API | `DONE` | `[x]` 13/13 | `feed.test.ts` |
| T5 | Flutter models: `FeedContentItem`, `NearYouResult`, `DiscoverCreator` | Mobile | `DONE` | — | `fromJson` factories |
| T6 | Flutter providers: `nearYouProvider`, `verticalSectionProvider`, `discoverProvider`, `userCityProvider` | Mobile | `DONE` | — | Riverpod 3.x Notifier |
| T7 | Flutter widgets: `FeedRailCard`, `DiscoverCreatorCard`, `SectionHeader`, `NearYouSection`, `VerticalSection`, `DiscoverSection` | Mobile | `DONE` | — | Honesty banner DISC-FR-028 |
| T8 | `HomeFeedScreen` (CustomScrollView + pinned top bar, vertical chips, pull-to-refresh, location picker) | Mobile | `DONE` | `[x]` 12/12 | `home_feed_screen_test.dart` |
| T9 | `LocationPickerScreen` (bottom sheet, city search, invalidates feed providers) | Mobile | `DONE` | — | |
| T10 | PUT /api/v1/users/me/city (invalidates city + location) | API | `DONE` | `[x]` — | Included in feed.test.ts |
| T11 | Wire `HomeFeedScreen` into router at `/` | Mobile | `DONE` | — | |

---

## Pre-Commit Checklist

- `[x]` All tests passing
- `[x]` `tsc --noEmit` — 0 errors
- `[x]` `flutter analyze` — 0 errors
- `[x]` API boots — `/healthz` 200
- `[x]` Flutter launches — no crash
- `[x]` Tracking updated

---

## Test Coverage

| File | Tests | Passing |
|------|-------|---------|
| `apps/api/src/services/feed.service.test.ts` | 15 | `[x]` 15/15 |
| `apps/api/src/handlers/feed.test.ts` | 13 | `[x]` 13/13 |
| `apps/mobile/test/features/feed/screens/home_feed_screen_test.dart` | 12 | `[x]` 12/12 |

**Total: 40 tests — all passing**

---

## Notes

- `SliverPersistentHeader` fix required in Flutter 3.41: delegate's `build()` must explicitly set `height: maxExtent` on the returned widget or child collapses to intrinsic height, making `paintExtent < layoutExtent` (invalid geometry). Fixed in `_FeedTopBarDelegate`.
- Near-you waterfall uses 4 fallback levels: exact city → 200km radius → 500km radius → all India. Honesty banner shown when radius expands (DISC-FR-028).
