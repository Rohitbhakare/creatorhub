# E1.10 — Discover Redesign: Monochrome + 5-Place Coral

> Goal: replace the v1.3 Discover home (creators rail + themes grid + experiences
> list) with the search-first editorial home agreed in DD-013/014/015. Strip the
> last multi-color avatar leaks, lock coral to the 5 founder-approved spots, and
> move the curatorial weight from a six-tile theme grid to an algorithmic
> handpicked-collections rail backed by real top-search analytics.
>
> Companion SRS delta: `docs/00_SRS/v1.4/srs-v1.4-delta.md`
> Source plan (approved 2026-04-26): `~/.claude/plans/zesty-skipping-rainbow.md`

---

## Context

The v1.3 13-filter Discover sheet, search overlay, results screen, and Places
fallback shipped clean and follow the new design language already — only the
*home surface* of Discover was off-spec. Three founder decisions drove this
epic:

1. **DD-013** — Monochrome chrome + one coral accent. 7 colors total. Coral
   appears in exactly **5 places**: primary CTAs, active bookmark, location pin,
   active bottom tab, critical unread signals.
2. **DD-014** — Discover home is search-first + editorial: page title → city pin
   chip → search pill → Browse-by-category grid → Handpicked collections rail →
   Explore-by-city chips. Algorithmic templates for MVP; admin manual curation
   deferred to V1.
3. **DD-015** — Search field placeholder rotates through real top searches
   (90-day analytics already logged via `/api/v1/discover/search/log`) with a
   seeded fallback for cold-start volume.

Founder confirmations (2026-04-26):
- Browse grid shows all **12 travel sub-categories** with the 4 active at full
  opacity and 8 dimmed to 60% with a SOON pill — signals roadmap without faking
  activity.
- Handpicked collections are server-generated algorithmic templates for MVP;
  manual collections override algorithmic ones in V1.

---

## Wireframe

```
┌─────────────────────────────────────────────────┐
│  Discover                              [📍 Pune]│  Fraunces 26 + coral pin
│  Trips, creators, stories, and cities           │  Inter 14 inkSoft
├─────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────┐ [⚙]   │  search pill + filter icon
│  │ 🔍 Try "Spiti" or "Aarti Gokhale"    │       │  placeholder ROTATES (3.5s)
│  └──────────────────────────────────────┘       │
├─────────────────────────────────────────────────┤
│  Browse by category                             │
│  12 ways to wander                              │
│  ┌────────────┐ ┌────────────┐                  │
│  │ 🚗 Road    │ │ 🏍️  Biking  │   active        │
│  │   Trips    │ │            │   full opacity  │
│  │ 247 trips  │ │ 89 trips   │                 │
│  └────────────┘ └────────────┘                  │
│  ... 4 active + 8 SOON tiles in pairs ...       │
│                                                 │
│  Handpicked collections                         │
│  Curated by the team · refreshed weekly         │
│  ┌─────────┐ ┌─────────┐  →  horizontal rail    │
│  │ 12 TRIPS│ │ 7 WRITERS│      4:5 portrait     │
│  │ [cover] │ │ [cover]  │      tile w/ count    │
│  ├─────────┤ ├─────────┤                       │
│  │ Monsoon │ │ Story-   │                       │
│  │ Western │ │ tellers  │                       │
│  └─────────┘ └─────────┘                       │
│                                                 │
│  Explore by city                                │
│  Where creators are building something          │
│  📍 Pune (34) · 📍 Mumbai (52) · 📍 Bangalore → │
└─────────────────────────────────────────────────┘
```

---

## Data dependencies — verified

- `search_queries` (mig 010) — 90-day search log, source for top-searches
- `search_placeholder_defaults` (mig 010) — pre-existing, seeds added in mig 027
- `top_searches_7d` materialized view (mig 010) — drives `/discover/search/popular`
- `cities` table with `lat`/`lng` columns (mig 013) + content `starting_city_id`
  → drives `/discover/cities` (no PostGIS query needed)
- `content` table with `views_7d`, `bookings_7d`, `price_paisa`, `body`,
  `published_at` — all four collection templates derive from existing columns
- 4 active sub-cat slugs already routable via `/feed/section/sub-cat/<slug>`
  (FEED/REDESIGN-001 shipped this in v1.3)

No schema changes beyond mig 027 seed.

---

## Approach

### Phase 1 — Backend additions

**A) Rotating search placeholder source**

| File | Change |
|---|---|
| `apps/api/src/db/migrations/027_search_placeholder_seeds.sql` | NEW — adds UNIQUE on `placeholder_text`, seeds 10 rows |
| `apps/api/src/services/discover.service.ts` | +`getPopularSearches(limit)` — pulls from `top_searches_7d`, falls back to seeds (priority desc), de-dups |
| `apps/api/src/routes/discover.routes.ts` | +`GET /discover/search/popular?limit=` |
| `packages/shared/src/schemas/index.ts` | +`popularSearchesQuerySchema` |

Seed list: `Spiti`, `Aarti Gokhale`, `weekend trips near Pune`, `Lonavla`,
`solo trips`, `monsoon treks`, `food trails`, `road trips Konkan`,
`Bangalore creators`, `Coorg coffee trails`. Idempotent via
`ON CONFLICT (placeholder_text) DO NOTHING`.

**B) Algorithmic handpicked collections**

| File | Change |
|---|---|
| `apps/api/src/services/discover.service.ts` | +`getHandpickedCollections(cityId, limit)` + 4 template helpers |
| `apps/api/src/routes/discover.routes.ts` | +`GET /discover/collections?city_id=&limit=` |
| `packages/shared/src/schemas/index.ts` | +`handpickedCollectionSchema`, +`handpickedCollectionsQuerySchema`, +`HANDPICKED_COLLECTION_KINDS` |

| Template | Title | Query |
|---|---|---|
| `popular_in_city` | Popular in {City} | top items by `views_7d + bookings_7d * 5` where `starting_city_id = $cityId` |
| `under_budget` | Under ₹2k | `price_paisa BETWEEN 1 AND 200000` ordered by `published_at desc` |
| `short_reads` | Short reads | type = post, `length(body) <= 1500` (~5-min proxy) |
| `new_voices` | Fresh creators worth following | creators `created_at > now() - 90d` ordered by follower delta |

`MIN_COLLECTION_COUNT = 6` — templates returning fewer items are dropped from
the response so the rail never shows a thin "looks broken" tile.

**C) Active cities for chip rail**

| File | Change |
|---|---|
| `apps/api/src/services/discover.service.ts` | +`getActiveCities(limit)` — over-fetch content rows, aggregate counts in JS, join `cities` by id |
| `apps/api/src/routes/discover.routes.ts` | +`GET /discover/cities?limit=` |
| `packages/shared/src/schemas/index.ts` | +`discoverCitySchema`, +`discoverCitiesQuerySchema` |

PostgREST doesn't expose GROUP BY directly; the 2-step approach is acceptable
for the 6-row use case.

### Phase 2 — Mobile redesign

**Discover home rewrite** — `apps/mobile/lib/features/discover/screens/discover_tab_screen.dart`

New 168 px sticky header (`_DiscoverHeaderDelegate`):
- "Discover" Fraunces 26 + `_CityPinChip` (coral pin, tap → reuse
  `LocationPickerScreen` via `showModalBottomSheet`)
- Subhead "Trips, creators, stories, and cities" Inter 14 inkSoft
- `_SearchPill` 50 tall + filter icon with coral count badge
- `_RotatingPlaceholder` cycles top-searches every 3.5 s with 220 ms
  `AnimatedSwitcher` fade; falls back to "Search trips, creators, cities" on
  cold start

New sliver order:
```
SliverPersistentHeader(_DiscoverHeaderDelegate)
SliverToBoxAdapter(BrowseByCategoryGrid)
SliverToBoxAdapter(HandpickedCollectionsRail)
SliverToBoxAdapter(ExploreByCityChips)
```

**New widgets**

| File | Notes |
|---|---|
| `widgets/browse_by_category_grid.dart` | 2-col grid, 12 hardcoded `_CatTile`s, `childAspectRatio: 1.55`. Active routes `context.push('/feed/section/sub-cat/<slug>')`; SOON tiles wrapped in `Opacity(0.55)` + 9 pt SOON pill, tap is no-op. |
| `widgets/handpicked_collections_rail.dart` | 200 × 312 horizontal rail, 4:5 cover with `ink @ 0.85` overlay count pill. `_routeFor(kind, cityId)` maps to `/discover/results?…` querystrings. |
| `widgets/explore_by_city_chips.dart` | Coral fill `mapPin` icon (one of the 5 allowed coral spots), tap calls `userCityProvider.notifier.updateCity(...)` then `context.go('/feed')`. |

**New providers + models**

| File | Purpose |
|---|---|
| `providers/discover_home_providers.dart` | `popularSearchesProvider`, `handpickedCollectionsProvider(cityId)`, `discoverCitiesProvider` |
| `models/discover_home_models.dart` | `HandpickedCollection`, `DiscoverCity` with `fromJson` |

**Shared monochrome avatar**

| File | Change |
|---|---|
| `apps/mobile/lib/shared/components/initial_avatar.dart` | NEW — 4-color warm-neutral palette `[#6B6660, #9C9689, #2C2823, #8B847A]`, `CachedNetworkImage` when url present else initial circle with `color.withValues(alpha: 0.14)` background |
| `apps/mobile/lib/features/discover/screens/search_overlay.dart` | Replace inline `_CreatorAvatar` (8-color violation) with `InitialAvatar` |
| `apps/mobile/lib/features/feed/widgets/post_rail_card.dart` | Same — replace inline `_CreatorAvatar` |

The third 8-color violation in `discover_tab_screen.dart` (`_CreatorsSection`)
is eliminated by deleting the section entirely (already lives on Home feed).

**Code deletion**

| File / symbol | Reason |
|---|---|
| `_CreatorsSection`, `_CreatorChip` in old `discover_tab_screen.dart` | Already on Home feed (DiscoverNew section) |
| `_ExperiencesSection`, `_ExperienceCard` | Already on Home feed (Hot near you / Upcoming events) |
| `_ThemesSection` | Replaced by Handpicked collections |
| `providers/discover_tab_provider.dart` | No longer referenced |
| `widgets/editorial_tile.dart` | No longer referenced |

---

## Critical Files

### Backend
| File | Change |
|---|---|
| `apps/api/src/db/migrations/027_search_placeholder_seeds.sql` | NEW |
| `apps/api/src/services/discover.service.ts` | +3 methods + 4 template helpers |
| `apps/api/src/routes/discover.routes.ts` | +3 routes |
| `packages/shared/src/schemas/index.ts` | +6 schemas/types/constant |

### Mobile
| File | Change |
|---|---|
| `apps/mobile/lib/features/discover/screens/discover_tab_screen.dart` | Full rewrite |
| `apps/mobile/lib/features/discover/widgets/browse_by_category_grid.dart` | NEW |
| `apps/mobile/lib/features/discover/widgets/handpicked_collections_rail.dart` | NEW |
| `apps/mobile/lib/features/discover/widgets/explore_by_city_chips.dart` | NEW |
| `apps/mobile/lib/features/discover/providers/discover_home_providers.dart` | NEW |
| `apps/mobile/lib/features/discover/models/discover_home_models.dart` | NEW |
| `apps/mobile/lib/features/discover/screens/search_overlay.dart` | Replace 8-color avatar |
| `apps/mobile/lib/features/feed/widgets/post_rail_card.dart` | Replace 8-color avatar |
| `apps/mobile/lib/shared/components/initial_avatar.dart` | NEW |
| `apps/mobile/lib/features/discover/providers/discover_tab_provider.dart` | DELETED |
| `apps/mobile/lib/features/discover/widgets/editorial_tile.dart` | DELETED |

---

## Verification

### Backend
- `pnpm test` (apps/api) — 60 files / 1002 tests pass
- `tsc --noEmit` — 0 errors
- `GET /discover/search/popular?limit=10` returns array of strings; falls
  through to seed table on sparse dev data
- `GET /discover/collections?city_id=…` returns ≤ 4 collections, each with
  `cover_url` and `count >= 6`
- `GET /discover/cities?limit=6` returns ≤ 6 cities ordered by content count

### Mobile
- `flutter analyze` — 0 errors / 0 warnings (info-level lints only)
- `flutter test` — 319 tests pass
- Discover home renders: page title + rotating placeholder cycling every
  ~3.5 s → Browse grid (12 tiles, 4 active full-opacity, 8 dimmed with SOON)
  → Handpicked rail → Explore-by-city chips
- Active sub-cat tile → `/feed/section/sub-cat/<slug>` opens with locked filter
- SOON tile is no-op
- City chip tap → `userCityProvider` updates + navigates to `/feed`
- Collection tile tap → opens `/discover/results` with the kind's filters
- Filter icon opens existing 13-filter sheet; active count badge appears in coral
- No multicolor avatars anywhere on Discover or in the polaroid post card on Home
- Coral appears only on: header location pin, city chip pins, primary CTAs in
  filter sheet, active filter count badge

---

## Out of scope (deferred to V1)

- Manual `handpicked_collections` table + admin-panel CRUD that overrides the
  algorithmic templates when present (DD-014 second half)
- Admin panel for editing search placeholder seeds (DD-015) — currently SQL only
- Trending searches as a *visible* Discover section — separate from rotating
  placeholder; build when search log volume justifies a public surface
- Re-rendering all earlier screens for monochrome consistency (onboarding,
  primitives) — separate "mono pass" epic

---

## Pre-commit checklist

- [x] `flutter analyze` — 0 errors
- [x] `pnpm test` (apps/api) — 1002 / 1002 pass
- [x] `flutter test` — 319 / 319 pass
- [x] API boots — `/healthz` 200 (verified locally)
- [x] Mobile launches — no runtime crashes on Discover tab
- [x] `docs/epics/TRACKING.md` updated with `DISCOVER/REDESIGN-monochrome` row
- [x] SRS v1.4 delta written
- [x] Epic plan + tracking written (this folder)
