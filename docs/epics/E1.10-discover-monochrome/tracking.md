# E1.10 — Discover Monochrome Redesign · Tracking

> Source plan: `./plan.md`
> SRS delta: `docs/00_SRS/v1.4/srs-v1.4-delta.md`
> Approved: 2026-04-26 (founder)
> Shipped: 2026-04-26

---

## Status

`DONE`

---

## Tasks

| # | Task | Owner | Status | Notes |
|---|------|-------|--------|-------|
| 1 | Migration 027 — seed `search_placeholder_defaults` (10 entries, idempotent UNIQUE) | API | `DONE` | `apps/api/src/db/migrations/027_search_placeholder_seeds.sql` |
| 2 | `getPopularSearches(limit)` service method | API | `DONE` | Uses `top_searches_7d` view, falls back to seed table |
| 3 | `getHandpickedCollections(cityId, limit)` + 4 template helpers | API | `DONE` | `MIN_COLLECTION_COUNT = 6`, drops thin templates |
| 4 | `getActiveCities(limit)` service method | API | `DONE` | 2-step content-aggregation + cities join |
| 5 | 3 new routes: `/discover/search/popular`, `/discover/collections`, `/discover/cities` | API | `DONE` | All `optionalAuthenticate + validateQuery` |
| 6 | 6 shared schemas/types/constant | Shared | `DONE` | `popularSearchesQuerySchema`, `handpickedCollectionSchema`, `handpickedCollectionsQuerySchema`, `discoverCitySchema`, `discoverCitiesQuerySchema`, `HANDPICKED_COLLECTION_KINDS` |
| 7 | `InitialAvatar` shared widget (4-color warm-neutral palette) | Mobile | `DONE` | `apps/mobile/lib/shared/components/initial_avatar.dart` |
| 8 | Replace 8-color avatar in `search_overlay.dart` | Mobile | `DONE` | Inline `_CreatorAvatar` deleted |
| 9 | Replace 8-color avatar in `post_rail_card.dart` | Mobile | `DONE` | Inline `_CreatorAvatar` deleted |
| 10 | `discover_home_models.dart` — `HandpickedCollection`, `DiscoverCity` | Mobile | `DONE` | |
| 11 | `discover_home_providers.dart` — 3 providers | Mobile | `DONE` | All `FutureProvider.autoDispose`, family on `cityId?` for collections |
| 12 | `BrowseByCategoryGrid` widget — 12 hardcoded tiles (4 active + 8 SOON) | Mobile | `DONE` | Active routes to `/feed/section/sub-cat/<slug>` |
| 13 | `HandpickedCollectionsRail` widget — 200×312 horizontal rail | Mobile | `DONE` | `_routeFor(kind, cityId)` maps to `/discover/results` |
| 14 | `ExploreByCityChips` widget — coral-pin chip rail | Mobile | `DONE` | Tap updates `userCityProvider` + `context.go('/feed')` |
| 15 | Rewrite `discover_tab_screen.dart` — new header + slivers | Mobile | `DONE` | `_DiscoverHeaderDelegate`, `_CityPinChip`, `_SearchPill`, `_RotatingPlaceholder` |
| 16 | Delete orphans: `discover_tab_provider.dart`, `editorial_tile.dart` | Mobile | `DONE` | |
| 17 | `flutter analyze` — 0 errors | Verify | `DONE` | 99 info-level lints (style only) |
| 18 | `pnpm test` (apps/api) — 1002 pass | Verify | `DONE` | 60 files |
| 19 | `flutter test` — 319 pass | Verify | `DONE` | |
| 20 | Update `docs/epics/TRACKING.md` with `DISCOVER/REDESIGN-monochrome` row | Docs | `DONE` | Added at line 475 |
| 21 | Write SRS v1.4 delta | Docs | `DONE` | `docs/00_SRS/v1.4/srs-v1.4-delta.md` |

---

## Pre-commit checklist (CLAUDE.md non-negotiable)

| Gate | Result |
|------|--------|
| 1. Tests written + passing | ✓ 1002 API + 319 mobile |
| 2. Lint clean | ✓ `flutter analyze` 0 errors, `eslint` 0 errors |
| 3. Type check passes | ✓ `tsc --noEmit` 0 errors |
| 4. 4-step review gate | ✓ edge cases (empty templates dropped) · security (all routes `optionalAuthenticate` + Zod validation) · architecture (reuses `userCityProvider`, `LocationPickerScreen`, `discoverFiltersQuerySchema`) · code quality (no inline color palettes, monochrome rule enforced) |
| 5. API boots | ✓ `/healthz` 200 |
| 6. Flutter launches | ✓ Discover tab opens, all 3 sections render |
| 7. Tracking file updated | ✓ this file + `docs/epics/TRACKING.md` |

---

## Operator follow-up

- Deploy migration 027 to Supabase (alongside the still-pending 024–026 from
  FEED/REDESIGN-001) before the API endpoints will resolve seed data.
- Manual smoke test on iOS sim against staging once migrations are deployed.

---

## Out of scope (V1 follow-ups)

- `handpicked_collections` table + admin CRUD (overrides algorithmic templates)
- Admin panel for `search_placeholder_defaults` editing
- Public "Trending searches" Discover section (separate from rotating placeholder)
