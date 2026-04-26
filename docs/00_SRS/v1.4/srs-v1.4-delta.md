# SRS v1.4 — Delta from v1.3

> Companion to `docs/00_SRS/v1.3/srs-v1.3-delta.md` and `docs/00_SRS/v1.2/srs-v1.2.md`.
> v1.4 is a **delta only**: Discover home redesign + monochrome design-system
> tightening. Everything in v1.2 + v1.3 still applies unless explicitly
> superseded below.

**Date:** 2026-04-26
**Author:** Founder + Claude (tech cofounder)
**Status:** ACTIVE
**Supersedes:** v1.3 sections noted inline · v1.2 §6 (design-system) coral rule

---

## 0.1 Revision history

| Rev | Date | Author | Change |
|-----|------|--------|--------|
| 1.4 | 2026-04-26 | Founder | Discover home redesign (DD-013/014/015): monochrome chrome, 5-place coral, search-first editorial layout, algorithmic handpicked collections, rotating top-search placeholder |

---

## 6.1 Design system — supersedes v1.2 §6 coral rule

### Coral `#E15A41` — 5 allowed places (was 8 in v1.2)

The coral accent now appears in **exactly five contexts**. Anywhere else is a
violation:

1. **Primary CTAs** — booking buttons, filter sheet "Show N results", create
   FAB, primary actions in modals
2. **Active bookmark icon** — when a piece of content is saved
3. **Location pin** — header city pin chip, Explore-by-city chips, results-page
   destination indicators
4. **Active bottom-tab indicator** — current tab in the bottom navigation
5. **Critical unread signals** — notification badge dot, active-filter count
   badge in the search pill, inbox unread bullet

**Removed from the v1.2 list:** active segmented-tab underline, eyebrow text,
loading shimmer accent. These now use ink/inkSoft monochrome.

### Monochrome palette — locked

| Token | Hex | Use |
|---|---|---|
| `surface` | `#FAF7F4` | Card and chip backgrounds |
| `surfaceAlt` | `#F2EEE8` | Sunken / pressed states |
| `hairline` | `#E5E0D7` | All borders, dividers, separators |
| `inkSoft` | `#9C9689` | Tertiary text, inactive icons |
| `inkMuted` | `#6B6660` | Secondary text, captions |
| `ink` | `#2C2823` | Primary text, active icons |
| `coral` | `#E15A41` | The 5 places listed above |

No other accent colors are permitted in chrome. Photography content (cover
images, user-uploaded media) is exempt.

### Initial avatars — supersedes v1.2 colored-initial palette

The 8-color initial-avatar palette used in v1.2 is retired. All initial
circles now use a 4-color warm-neutral grayscale derived from the monochrome
palette: `[#6B6660, #9C9689, #2C2823, #8B847A]`. Background is the chosen
color at 14 % alpha; text is the same color at full opacity. Rendering is
deterministic on the user's name hash.

A shared `InitialAvatar` widget at
`apps/mobile/lib/shared/components/initial_avatar.dart` is the only allowed
implementation. Three pre-existing inline copies were deleted as part of this
revision.

---

## 4.6 Discover (DISC) — additions to v1.3

### DISC-FR-050 · [M1] · Discover home — search-first editorial layout

Replaces the v1.3 Discover home (creators rail + 6-tile themes grid +
experiences list). The new home surface is structured top to bottom as:

1. **Sticky header (168 dp)**
   - Page title `Discover` (Fraunces 26, ink) + city pin chip on the right
     (coral fill `mapPin` icon, ink text, `surface` chip with `hairline`
     border). Tapping the chip opens the existing `LocationPickerScreen` as a
     bottom sheet.
   - Subhead `Trips, creators, stories, and cities` (Inter 14, inkSoft).
   - Search pill (50 dp, `surface` background, 0.5 px `hairline` border, fully
     rounded). Left: search icon. Center: rotating placeholder
     (DISC-FR-052). Right: filter icon with active-count badge (badge filled
     coral when count > 0).
2. **Browse by category** (DISC-FR-051) — 2-col grid of all 12 travel
   sub-categories, 4 active full-opacity, 8 dimmed with SOON pill.
3. **Handpicked collections** (DISC-FR-053) — horizontal rail of algorithmic
   collection tiles (4:5 portrait covers).
4. **Explore by city** (DISC-FR-054) — horizontal chip rail of top active
   cities; tap re-scopes the user's city and routes to `/feed`.

Removed sections (moved to Home feed in v1.3 already, were duplicated on
Discover): creators rail, themes grid, experiences list.

### DISC-FR-051 · [M1] · Browse-by-category 12-tile grid

A 2-column `GridView` with `childAspectRatio: 1.55`. Tile contents: outline
Phosphor icon (24 px, ink) + sub-cat name (Inter 14 / 600 ink) + count line
(Inter 11 inkSoft, e.g. "247 trips") for active tiles only.

| Sub-cat | Slug | State | Approx count |
|---|---|---|---|
| Road Trips | `travel.road_trips` | active | 247 |
| Biking | `travel.biking` | active | 89 |
| Trekking | `travel.trekking` | active | 156 |
| Food Trails | `travel.food_trails` | active | 78 |
| Adventure | — | SOON | — |
| Heritage | — | SOON | — |
| Wildlife | — | SOON | — |
| Photo Walks | — | SOON | — |
| Wellness | — | SOON | — |
| Family | — | SOON | — |
| Luxury | — | SOON | — |
| Offbeat | — | SOON | — |

Active tile tap → `context.push('/feed/section/sub-cat/<slug>')` (the existing
locked-filter section screen from FEED/REDESIGN-001). SOON tiles are
opacity-0.55 with a SOON pill (Inter 9 pt, w700, letter-spacing 0.8, inkSoft
text, surface chip, hairline border) and have no tap handler.

The 12 tiles are hardcoded in `BrowseByCategoryGrid` rather than fetched
dynamically from `subCategoriesProvider` — the active-set roadmap is a product
decision, not a data property, and the count placeholders are illustrative
until per-sub-cat live counts ship.

### DISC-FR-052 · [M1] · Rotating search placeholder (DD-015)

The Discover search pill placeholder text rotates through real top searches
every 3.5 s with a 220 ms `AnimatedSwitcher` fade. Source:

- `GET /api/v1/discover/search/popular?limit=10`
  - Returns top normalised queries from the existing `top_searches_7d`
    materialised view (built on `search_queries`, mig 010).
  - Filters: `char_length(normalized_query) >= 3`, no `@` or `+91`, MIN 5
    occurrences in the 7-day window.
- **Cold-start fallback:** if the view returns < 5 rows, the server appends
  from the existing `search_placeholder_defaults` table (mig 010), seeded by
  migration 027 with: `Spiti`, `Aarti Gokhale`, `weekend trips near Pune`,
  `Lonavla`, `solo trips`, `monsoon treks`, `food trails`,
  `road trips Konkan`, `Bangalore creators`, `Coorg coffee trails`. De-duped
  by query string.

Client behaviour:
- On cold start (provider unresolved or empty list) the pill shows the static
  string `Search trips, creators, cities`.
- When the list resolves, the placeholder format becomes `Try "{query}"`.
- Cycle index advances on a single `Timer.periodic` registered post-frame.

### DISC-FR-053 · [M1] · Handpicked collections rail (DD-014)

Horizontal `ListView.separated`, 312 dp tall, 200 dp wide tiles, 4:5 cover
aspect. Each tile renders:
- Cover image with overlaid count pill in the top-left corner
  (`{count} {UNIT}` — `TRIPS` for trip-typed templates, `READS` for
  `short_reads`, `CREATORS` for `new_voices`. Pill is `ink @ 0.85` background
  with white 10 pt 700 text).
- Title (Fraunces 16 / 600 ink, 1 line ellipsis).
- Subtitle (Inter 12 inkMuted, 1 line ellipsis).

Source: `GET /api/v1/discover/collections?city_id=&limit=4` returns up to 4
algorithmic collections per call. Each item shape:
`{ id, title, subtitle, kind, count, cover_url }`. Kinds:

| Kind | Title pattern | Query |
|---|---|---|
| `popular_in_city` | `Popular in {City}` | top items by `views_7d + bookings_7d * 5` where `starting_city_id = $cityId` |
| `under_budget` | `Under ₹2k` | `price_paisa BETWEEN 1 AND 200000` ordered by `published_at desc` |
| `short_reads` | `Short reads` | `type = 'post'` with `length(body) <= 1500` chars (~5-min proxy until `read_time_minutes` denorm column lands) |
| `new_voices` | `Fresh creators worth following` | creators with `created_at > now() - 90d` ordered by follower delta |

`cover_url` is the cover of the top item. Templates returning fewer than
`MIN_COLLECTION_COUNT = 6` items are dropped from the response so the rail
never shows a thin "looks broken" tile.

Tile tap → `context.push('/discover/results?...filters serialized from kind')`
(reuses the existing 13-filter results screen):

| Kind | Route |
|---|---|
| `popular_in_city` | `/discover/results?starting_city_id={cityId}&sort=trending` (or `?sort=trending` if no city set) |
| `under_budget` | `/discover/results?budget_buckets=lt2k` |
| `short_reads` | `/discover/results?type=post` |
| `new_voices` | `/discover/results?sort=trending` |

The rail hides itself when the provider returns an empty list. Skeleton state
is 2 shimmer tiles at the same dimensions.

### DISC-FR-054 · [M1] · Explore-by-city chip rail

Horizontal chip rail, 44 dp tall. Source:
`GET /api/v1/discover/cities?limit=6` — top active cities by content count.
Each chip is `[📍 {city} · {count}]` — coral fill `mapPin` (one of the 5
allowed coral spots), city name Inter 13/500 ink, count Inter 12 inkMuted.
Surface chip with hairline border, fully rounded.

Tap behaviour:
1. `userCityProvider.notifier.updateCity(cityId, name)`
2. `context.go('/feed')` — jumps to home with the new city scope so the rest
   of the app re-scopes immediately.

The rail hides itself on empty / error responses. Skeleton is 4 shimmer chips
with width 110 dp.

### DISC-FR-055 · [M1] · Algorithmic-collections backend

| Endpoint | Purpose |
|---|---|
| `GET /discover/search/popular?limit=` | DISC-FR-052 source |
| `GET /discover/collections?city_id=&limit=` | DISC-FR-053 source |
| `GET /discover/cities?limit=` | DISC-FR-054 source |

All 3 routes use `optionalAuthenticate` (guests see the same content) and
`validateQuery` against Zod schemas in `packages/shared/src/schemas/index.ts`:
`popularSearchesQuerySchema`, `handpickedCollectionsQuerySchema`,
`discoverCitiesQuerySchema`. Response envelopes follow the project standard
`{ success: true, data: { queries | collections | cities: [...] } }`.

V1 deferral: a `handpicked_collections` table + admin-panel CRUD that
overrides the algorithmic templates when present. Until V1, all collections
are server-generated per request.

---

## 4.X Database migrations introduced in v1.4

| File | Purpose |
|---|---|
| `027_search_placeholder_seeds.sql` | Adds UNIQUE constraint on `search_placeholder_defaults.placeholder_text` and seeds 10 rows for cold-start placeholder rotation |

No schema additions beyond seed data — DISC-FR-053/054 reuse existing
`content`, `cities`, and `users` columns.

---

## Code-deletion record

The following symbols/files were retired in this revision (replaced by the
new architecture, no behavioural fallback needed):

- `apps/mobile/lib/features/discover/providers/discover_tab_provider.dart`
- `apps/mobile/lib/features/discover/widgets/editorial_tile.dart`
- `_CreatorsSection`, `_CreatorChip` (inline in old Discover home)
- `_ExperiencesSection`, `_ExperienceCard` (inline in old Discover home)
- `_ThemesSection` (replaced by Handpicked collections)
- Inline `_CreatorAvatar` in `search_overlay.dart` (replaced by `InitialAvatar`)
- Inline `_CreatorAvatar` in `post_rail_card.dart` (replaced by `InitialAvatar`)

---

## Verification gate

- `flutter analyze` — 0 errors / 0 warnings (info-level lints only)
- `flutter test` — 319 tests pass
- `tsc --noEmit` (apps/api) — 0 errors
- `pnpm test` (apps/api) — 60 files / 1002 tests pass
- Migration 027 deployed to Supabase: pending operator action (alongside
  still-pending 024–026 from v1.3)
- Manual smoke test checklist: see epic plan
  `docs/epics/E1.10-discover-monochrome/plan.md` § Verification

---

## Open follow-ups (not in v1.4)

- `handpicked_collections` table + admin-panel CRUD (DD-014 V1)
- Admin panel for `search_placeholder_defaults` editing (DD-015 V1)
- Public "Trending searches" Discover section (separate from rotating
  placeholder; build when log volume justifies a public surface)
- Re-rendering all earlier screens for monochrome consistency (onboarding,
  primitives) — separate "mono pass" epic
- Per-sub-cat live count endpoint (replaces the hardcoded `247 / 89 / 156 / 78`
  illustrative counts in the Browse grid)
