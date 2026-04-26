# SRS v1.3 — Delta from v1.2

> Companion to `docs/00_SRS/v1.2/srs-v1.2.md`. Read v1.2 for the full base spec.
> v1.3 is a **delta only**: launch posture pivot + new FRs introduced by the
> Travel-Only Launch redesign. Everything in v1.2 still applies unless explicitly
> superseded below.

**Date:** 2026-04-26
**Author:** Founder + Claude (tech cofounder)
**Status:** ACTIVE
**Supersedes:** v1.2 sections noted inline

---

## 0.1 Revision history

| Rev | Date | Author | Change |
|-----|------|--------|--------|
| 1.3 | 2026-04-26 | Founder | Travel-Only launch posture; new home feed structure; Posts feed; Discover 13-filter rewrite; 4 active sub-cats; destinations seed |

---

## 1.3 Product scope — supersedes v1.2 §1.3

### IN scope at launch (M1 + M2)

- **Single vertical: Travel.** Stories is removed as a launch vertical.
  Stories/Blogs/Photo essays are reframed as *formats* (post `leaf_type`s)
  inside the Travel vertical, not a separate niche.
- **4 active travel sub-categories:** Road Trips, Biking, Trekking, Food
  Trails. Other 8 (adventure, heritage, wildlife, photo_walks, wellness,
  family, luxury, offbeat, nightlife) remain seeded in DB but appear ONLY in
  Discover — never on Home.

### OUT of scope at launch (deferred to V2)

- Stories vertical (re-introduce only if analytics signal post-launch demand)
- "Coming soon" UI for inactive sub-cats
- Personalized ranking using `users.travel_sub_categories`
- Quest strip, streaks, saved searches
- Any non-travel vertical

---

## 4.5 Feed (FEED) — additions to v1.2

#### FEED-FR-040 · [M1] · Travel-only home feed structure

The home feed surface is structured as **scope chips + filter chips + body**:

- **Scope chips (left, mutually exclusive):** `Near you` (default) · `Following`
- **Filter chips (right, mutually exclusive):** `All` (default) · `Posts` · `🚗 Road Trips` · `🏍️ Biking` · `🥾 Trekking` · `🍜 Food Trails`

**Body modes:**

| Scope | Filter | Body |
|---|---|---|
| Near you | All | 9-section editorial layout (FEED-FR-041) |
| Near you | Posts | Inline Instagram-style vertical post feed (FEED-FR-042) |
| Near you | sub-cat | Single 2-col grid filtered to that sub-cat |
| Following | All | Chronological grid of followed creators' content |
| Following | Posts | Followed creators' posts, vertical feed |
| Following | sub-cat | Followed creators' content filtered to sub-cat |

Compound filtering: `Posts` + sub-cat = posts of that sub-cat only.

**Removed:** "For You" tab, Stories chip, "More" chip, dimmed "coming soon" chips.

#### FEED-FR-041 · [M1] · Default home feed sections (Near you + All)

Section order top to bottom:

1. Top bar (location chip + search + notifications)
2. Sticky scope/filter chip rail
3. Quick intent strip — 2x2 tile grid: This weekend, Day trips, Weekend getaways, Upcoming events
4. Stories from {city} — horizontal post-card rail (≤100 km, recency)
5. What's hot near you — horizontal rail of trending mixed types (7-day window, ranked by `views + bookings*5`)
6. Trips starting from {city} — horizontal rail of itineraries/experiences with `starting_city_id = cityId`
7. This weekend in {city} — horizontal rail filtered by upcoming sat/sun ≤90 km
8. 4 sub-cat rails — Road Trips, Biking, Trekking, Food Trails (each "near {city}")
9. Upcoming events — horizontal rail, next 30 days
10. Browse by interest — 2-col tile grid (4 sub-cats); tap applies sub-cat chip in place
11. New voices in {city} — horizontal creator chip rail

#### FEED-FR-042 · [M1] · Posts feed (inline Instagram-style)

When `Posts` chip is active, the body switches to a single-column vertical
feed of post-typed content only, with cursor-pagination (10 per page). Each
post row renders the existing `ContentCard` grid variant (no new card design
per founder rule). Pull-to-refresh and infinite scroll on the parent
`ScrollController`.

#### FEED-FR-043 · [M1] · Section "See all" navigation

Each home rail's "See all" pushes to a focused `SectionGridScreen` with the
rail's filter pre-locked (NOT to Discover). Routes:

- `/feed/section/hot-near-you`
- `/feed/section/trips-from-city`
- `/feed/section/this-weekend`
- `/feed/section/upcoming-events`
- `/feed/section/day-trips`
- `/feed/section/weekend-getaways`
- `/feed/section/sub-cat/:slug`
- `/feed/posts?scope=near|following&city_id=&sub_category_id=` (Stories rail)

Each section screen has a Filters icon top-right that opens the Discover
filter sheet pre-populated with the rail's filters → on Apply pushes to
`/discover/results` with the merged filter set. Discover thus becomes the
explicit refinement destination, not a generic dumping ground.

Smooth back: all section nav uses `context.push()` (not `go`), preserving
home scroll position.

#### FEED-FR-044 · [M1] · Posts content type — surfaces

| Surface | Card | Filtering |
|---|---|---|
| Home Stories from {city} rail | Compact post card with multi-image dot indicator | post-type, ≤100 km |
| Home Posts chip selected | ContentCard grid variant | post-type, scope = near or followed |
| Home Posts chip + sub-cat chip | ContentCard grid variant | post + sub-cat |
| Discover Results when `type=post` filter active | ContentCard grid variant in 2-col grid | all filters apply |

#### FEED-FR-045 · [M1] · ExpandableText component

Post body text uses Fraunces 14 px / line-height 1.65, truncated to 3 lines
with a "Show all" CTA. In feed context tap navigates to `PostDetailScreen`;
in detail context expands inline.

---

## 4.6 Discover (DISC) — additions to v1.2

#### DISC-FR-040 · [M1] · Discover Results — deep-linkable refinement destination

New screen at `/discover/results?subCat=&leaf=&time=&from=&to=&season=&month=&duration=&budget=&difficulty=&groupSize=&distance=&type=&dest=&q=`.

Layout:
1. Top bar: back, "Results" title, filter icon with active-count badge
2. Active filter chip row — every applied filter as a removable chip; tap × to remove
3. 2-col `GridView` of `ContentCard(grid)` with infinite scroll
4. Empty state: illustration + "Try fewer filters" + "Tune filters" outlined coral CTA

#### DISC-FR-041 · [M1] · 13-filter Discover sheet

Replaces the v1.2 stub filter sheet (which was UI-only and never wired to
the API). Filter groups:

| Group | UI | Multi? | Backend |
|---|---|---|---|
| Sub-category | Chip rail | single | `content.sub_category_id` |
| Leaf type | Contextual chip rail | single | `content.leaf_type` |
| Content type | Pills All/Posts/Itineraries/Experiences/Events | single | `content.type` |
| Time window | Radio: Today · This weekend · Next 7 days · This month · Custom | single | derived |
| Custom date range | Calendar range picker | n/a | `start_at BETWEEN from AND to` |
| Duration | Pills: Day trip ≤8h · Weekend (2d) · 3-5 days · 6+ days | multi | `content.duration_minutes` |
| Season | Pills: Monsoon · Winter · Summer · Spring · Autumn | multi | `content.facets->>'season'` |
| Month | 12 pills | multi | `EXTRACT(MONTH FROM start_at) OR facets->'best_months'` |
| Budget | Pills: Free · ≤₹2k · ₹2-5k · ₹5-15k · ₹15k+ | multi | `content.price_paisa` |
| Difficulty | Pills: Easy/Moderate/Hard/Expert | multi | `content.facets->>'difficulty'` |
| Group size | Pills: Solo/Pair/Small/Large | multi | `content.facets->>'group_size'` |
| Destination | Autocomplete (cities + Google Places fallback) | single | `starting_city_id` OR `destination_city_ids[]` OR `ST_DWithin(point, dest_point, 25 km)` |
| Distance from me | Slider 25/50/100/250/Anywhere | single | `ST_DWithin(starting_city_point, user_point, distance_km)` |

Sticky footer: `Clear all` ghost (left) · `Show N results` coral CTA (right).

#### DISC-FR-042 · [M1] · Destination search with Places fallback

`getSearchSuggestions(q)` first matches `cities` table; if matches < 3, calls
Google Places autocomplete (already proxied at
`/api/v1/places/autocomplete`). Tapping a Places suggestion calls
`POST /api/v1/discover/destinations/resolve { place_id }` which fetches Place
Details, upserts into `place_cache`, and returns
`{ destination_id, name, lat, lng }`. The client then filters within 25 km
of those coords.

#### DISC-FR-043 · [M1] · Maharashtra/Konkan destinations seed

Migration `026_seed_travel_destinations.sql` inserts ~50 popular Maharashtra/
Konkan/Western Ghats destinations as `cities` rows (Diveagar, Lonavla,
Mahabaleshwar, Tarkarli, Ganpatipule, etc.) with PostGIS points, so spatial
queries (`starting_city_id`, `destination_city_ids[]`) work without forcing
every query through Places lookup.

---

## 4.4 Onboarding (ONB) — supersedes v1.2 ONB-FR-008

#### ONB-FR-008 (R) · [M1] · Travel sub-category picker

Replaces the v1.2 vertical picker (which offered 8 verticals). The
onboarding screen now shows a single 4-tile grid: Road Trips 🚗, Biking 🏍️,
Trekking 🥾, Food Trails 🍜. Minimum 2 selections required.

**Persistence:** `PUT /api/v1/users/me/travel-sub-categories { travel_sub_categories: string[] }`
writes to the new `users.travel_sub_categories TEXT[]` column (migration 025).

Auth and guest paths use the same screen (single source of truth) with
guest-mode branching for the top bar and persistence target (guest writes
to local `guestPrefsProvider`).

---

## 4.X Identity (IAM) — minor additions

#### IAM-FR-040 · [M1] · `users.travel_sub_categories` column

Added via migration 025: `TEXT[] DEFAULT '{}'` with GIN index for array
membership queries. Used as input to (deferred V2) personalised ranking.

---

## 4.X Database migrations introduced in v1.3

| File | Purpose |
|---|---|
| `024_split_biking_subcategory.sql` | Splits `travel.biking` out of `travel.road_trips`; backfills existing content rows by `leaf_type` |
| `025_user_travel_subcategories.sql` | `users.travel_sub_categories TEXT[]` + GIN index |
| `026_seed_travel_destinations.sql` | ~50 Maharashtra/Konkan destination cities with PostGIS points |

---

## Code-deletion record

The following symbols/files were retired in this revision (replaced by the
new architecture, no behavioural fallback needed):

- `for_you_provider.dart`, `editors_picks_provider.dart`, `discover_new_provider.dart`
- `editors_picks_section.dart`, `discover_new_section.dart`, `discover_section.dart`
- `feed_content_card.dart`, `segmented_tabs.dart`, `hero_card.dart`
- `vertical_section.dart`, `near_you_section.dart`
- `feed.service.ts::getForYouSection()`, `feed.service.ts::getEditorsPicks()`

---

## Verification gate

- `flutter analyze` — 0 errors (info-level lints only)
- `tsc --noEmit` (apps/api) — 0 errors
- Migrations 024–026 deployed to Supabase: pending operator action
- Manual smoke test checklist: see plan `zesty-skipping-rainbow.md` §Verification

---

## Open follow-ups (not in v1.3)

- E2E test rewrite for new home feed (`home_feed_screen_test.dart` was retired — incompatible with chip-rail structure)
- Personalised ranking using `users.travel_sub_categories` (V2)
- `itineraries.day_count` denormalised column (faster Weekend Getaways query)
- Re-introduce Stories vertical IF analytics signals demand
