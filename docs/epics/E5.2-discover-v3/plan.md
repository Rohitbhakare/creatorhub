# E5.2 — Discover + Search v3 (W4)

> **Series:** Third epic in the M2.5 Web v3 Parity series. Depends on E5.0 (Foundation) + E5.1 (Home).
> **Goal:** Rebuild `/discover` to the v3 wireframe; tighten the Cmd+K command palette + filter drawer.
> **SRS refs:** WEB-DISC-FR-032..039 + WEB-A11Y-FR-107 (kbd shortcuts)
> **Wireframes:** see §3
> **Master plan:** [`/Users/rohit/.claude/plans/web-application-is-not-enumerated-matsumoto.md`](/Users/rohit/.claude/plans/web-application-is-not-enumerated-matsumoto.md)

---

## 1. Overview

Today's `/discover` (290 lines) renders rails-heavy: header chips → popular searches → category browse grid → handpicked collections rail → top creators rail → upcoming experiences rail. It's serviceable but it's **not** the v3 design.

v3 Discover is a magazine-style **editorial header + persistent 240px left sidebar (Type / Vibe / Distance) + 3-column masonry grid** with `gridAutoFlow: 'dense'` and 1×/2× spans, sort tabs (Trending / Recent / Near me / Top creators), and a "Load 24 more" CTA. It's a hard reshape, not just a restyle.

E5.2 ships:
1. The new editorial discover page (`/discover`)
2. The 13-filter side drawer (WEB-DISC-FR-034) for "more filters" beyond the sidebar's primary three
3. Cmd+K command palette polish (already exists — minor restyle to match v3 search overlay)
4. Active-filter chip row above the grid (FR-036)
5. Wire the 4 sort tabs to the existing `/discover/results` query API

`/discover/results` (the deep-link search page) is already there from a prior epic and stays — E5.2 styles it consistently with the new discover home.

## 2. SRS Requirements

| ID | Requirement | Notes |
|----|-------------|------|
| WEB-DISC-FR-032 | Discover home web — search-first editorial layout, 3-col category, 4-tile collection rail | Restyled per v3 (see §5 Decision 1) |
| WEB-DISC-FR-033 | Cmd/Ctrl+K search overlay | Already shipped in E5.0; minor visual polish only |
| WEB-DISC-FR-034 | 13-filter side panel (mobile bottom-sheet → desktop right-side drawer 420px) | New; opens from "+ More filters" link in sidebar (per v3) |
| WEB-DISC-FR-035 | Discover Results page (deep-linkable URL identical to mobile) | Already exists at `/discover/results` |
| WEB-DISC-FR-036 | Active filter chip row | Above the grid, removable × on each chip |
| WEB-DISC-FR-037 | Destination search with Places autocomplete | Server proxy already exists; verify wired in the drawer |
| WEB-DISC-FR-038 | Handpicked collections rail | Existing `<HandpickedCollectionsRail>` — keep, restyle inline with v3 |
| WEB-DISC-FR-039 | Explore-by-city chip rail | Existing — restyle |
| WEB-A11Y-FR-107 | `Cmd/Ctrl+K` opens search · `Esc` closes · `/` focuses search | Already partially shipped |

## 3. Wireframes Referenced

| File | Use |
|---|---|
| [docs/01_wireframes/v3/project/pack-w-discover.jsx](docs/01_wireframes/v3/project/pack-w-discover.jsx) | Lines 1–149 (`W_Discover`), 151–242 (`W_Search` overlay), 243–406 (`W_Filter` sheet). |
| Standalone HTML — section "W · Web — discover, search, filter, create" | Visual cross-check at 5 breakpoints |
| [docs/01_wireframes/v3/project/uploads/pack-w4-discover-search.html](docs/01_wireframes/v3/project/uploads/pack-w4-discover-search.html) | Earlier standalone for delta-spotting |
| Existing E5.0 chrome | `<WebHeader>`, search-pill (Cmd+K trigger) already in place |

## 4. Dependencies

| Dependency | Status | What we use |
|---|---|---|
| E5.0 Web Foundation | DONE | `<Btn>`, `<Pill>`, `<Tag>`, `<InitialAvatar>`, `<PageShell>`, motion library, `<ToastRegion>`, CSRF middleware |
| E5.1 Home | DONE | `<RailScroller>` (snap-scroll arrows), `<ContentCard>` variants, mood-selector (drop here too?), `<MapStrip>` placeholder |
| Existing /discover components | — | `<CommandPalette>`, `<FilterChipBar>`, `<FilterSheet>`, `<DiscoverFilters>`, `<CategoryBrowseGrid>`, `<HandpickedCollectionsRail>`, `<TopCreatorsRail>`, `<UpcomingExperiencesRail>`, `<PopularSearchesChips>`, `<SortSelect>` — restyle, do not rebuild |
| Existing API surface | — | `/api/v1/discover/category`, `/discover/cities`, `/discover/collections`, `/discover/creators`, `/discover/experiences`, `/discover/search`, `/discover/search/popular`, `/discover/sub-categories`, `/discover/themes` (all 9 already 200) |

## 5. Architecture Decisions — OPEN QUESTIONS

### Decision 1 — page layout: v3 sidebar+grid vs current rails-heavy

**v3 wireframe**: editorial H1 + 2-column inside the page (240px sidebar + 1fr 3-col masonry grid). Lots of grid; rails are gone.

**Current code**: header + chips + 4 horizontal rails (Categories, Handpicked Collections, Top Creators, Upcoming Experiences) + popular searches.

**Three options:**

| Option | Layout | Trade-off |
|---|---|---|
| **A. Honor v3 (recommended)** | Editorial H1 + 240px sidebar (Type/Vibe/Distance) + 3-col masonry grid + Load More. The 4 existing rails move below the grid as secondary editorial bands (or some get demoted to /discover/results sub-views). | Matches the wireframe. The "discover" experience becomes a real grid-driven explore page, not a rails ticker. Some content surface gets demoted (handpicked rail goes from above-the-fold to below-the-grid). |
| **B. Hybrid** | v3 sidebar + grid up top; current rails (Handpicked, Top Creators, Upcoming Experiences) below the grid. Best of both, more code surface. | More content visible; longer page; some redundancy (a story might appear in the grid AND in a rail). |
| **C. Keep current shape** | Restyle the existing rails-heavy page to v3 chrome but don't rebuild the layout. | Cheapest. Ignores the v3 design intent. Discover stays a rails-page, not a grid-page. |

**Recommended: A** — the wireframe is explicit and the grid-with-spans is the thing that distinguishes Discover from Home.

### Decision 2 — filters: persistent sidebar vs SRS drawer vs both

**v3 wireframe** shows a **persistent 240px left sidebar** with Type / Vibe / Distance always visible + "+ More filters" link.

**SRS WEB-DISC-FR-034** explicitly specifies a **right-side drawer 420px wide** with **all 13 filter groups** inside it.

**Three options:**

| Option | What ships | Trade-off |
|---|---|---|
| **A. Both — sidebar = primary 3, drawer = full 13 (recommended)** | Sidebar shows Type / Vibe / Distance always (v3 visible). "+ More filters" opens the existing `<FilterSheet>` as a 420px right drawer with all 13 (FR-034). | Honors both specs. Sidebar gives instant primary filters (good UX); drawer provides depth without cluttering the page. Most code surface. |
| **B. Sidebar only** | v3's 3 primary filters are persistent. The other 10 filter groups go away (or move to results page). | Cleaner. Discover becomes more curated/less power-tool. SRS FR-034 not satisfied. |
| **C. Drawer only** | Drop sidebar; all 13 filters live in the drawer. "Filters" button opens it. | Matches the SRS literally. Loses v3's at-a-glance primary filtering. |

**Recommended: A.**

### Decision 3 — vibe tags: hardcoded list vs dynamic from API

**v3 wireframe** shows 8 hardcoded Vibe pills: `Konkan`, `Spiti`, `Bandra`, `Slow travel`, `Solo`, `Monsoon`, `Foodie`, `Sunrise`. Mix of cities + moods + travel-styles.

**Two options:**

| Option | Source | Trade-off |
|---|---|---|
| **A. Pull from API: top 8 popular tags + cities (recommended)** | `/api/v1/discover/themes` or compose from existing popular-tags + popular-cities calls. List rotates with what's actually trending. | Real signal; doesn't go stale. |
| **B. Hardcoded** | Same 8 v3 keywords, fixed in the component | Cheapest. Goes stale fast; unhelpful when the launch verticals shift. |

**Recommended: A.**

### Decision 4 — sort tabs: ship all 4 (Trending / Recent / Near me / Top creators)?

v3 shows 4 sort tabs above the grid. Each maps to a different ranking signal. Three options:

| Option | What ships | API gap |
|---|---|---|
| **A. All 4 (recommended)** | Trending (`like_count` desc) · Recent (`published_at` desc) · Near me (city-distance asc) · Top creators (creator follower count desc) | "Top creators" sort needs `?sort=top_creators` on `/discover/category` or similar API extension. Trending and Recent are basic ORDER BY. Near me uses session.cityId. |
| **B. Just Trending + Recent** | Two tabs. | Skips the sorts that need API changes. Lower spec compliance. |

**Recommended: A** — but only ship the 3 that work today (Trending, Recent, Near me); add a `Top creators` tab tagged "Coming soon" until the API supports it. Documented as ENH follow-up.

### Other decisions (no user input needed)

| Decision | Choice | Rationale |
|---|---|---|
| Cmd+K command palette | Reuse `<CommandPalette>` from E5.0 split — minor visual polish if the v3 spec says different chrome | Already lazy-loaded; bundle-cheap |
| View toggle (grid/list) | Defer to V2 | Adds complexity; not in SRS |
| "Load 24 more" pagination | Server-paginated; existing `/discover/results?page=` works — wire it | Standard pattern |
| Width | 1640px max-width matching home page (E5.1 fix) | Consistent with rest of app |

## 6. Database

No DB changes. All filter / sort permutations resolve via existing API.

## 7. API Contract

No new endpoints. Possibly: extend `/api/v1/discover/category` to accept `?sort=trending|recent|near|top_creators` if not already. To verify in T1.

## 8. Test Plan

| Layer | Coverage |
|---|---|
| Unit | New: `<DiscoverSidebar>` (filter state + URL sync), `<MasonryGrid>` (span calc), sort-tab routing. ~10 new tests. |
| Integration | URL-param routing: `?type=story&vibe=Slow+travel&distance=6h&sort=recent` round-trips. |
| SSR | `/discover` renders for: signed-in, signed-out, `?type=*`, `?vibe=*`, `?sort=*` permutations. Sample 5 combos. |
| A11y | Tab through sidebar → sort tabs → grid cards. Grid cards have role="article" with accessible names. Drawer has focus trap. |
| Visual | 5-breakpoint screenshots committed. Sidebar collapses on mobile (becomes top filter bar); drawer becomes bottom sheet on mobile. |

## 9. Edge Cases

- 0 results → empty state with "Clear filters" CTA + suggested tag chips
- 10000+ results → paginated (24 per page); "Load 24 more" or jump-to-page; "Showing X–Y of Z"
- Drawer + sidebar conflict: only one source of truth per filter — drawer state wins on submit, sidebar reflects the active values
- `?sort=` not in allow-list → fall back to "Trending"
- Mobile: sidebar collapses to a top-pill row + "Filter" button → opens FilterSheet bottom-sheet
- Slow tag click → mood-rerank kicks in IF the tag matches a known mood (reuse `rankByMood()` from E5.1)
- 13-filter drawer state lives in URL (deep-linkable per FR-035)
- Active-filter chip row deduplicates — if a city is selected via Vibe AND distance-from-city, show one chip

## 10. InfoSec Review

| Concern | Mitigation |
|---|---|
| Filter param injection | Existing Zod validation on the API side; web side validates against allow-lists |
| Cmd+K cold-state localStorage (recent searches from E5.0 palette) | Already cap at 5; sanitize on read; not user-auth-related |
| Places API key | Server proxy only (per ui-ux.md); verify drawer's destination autocomplete uses it |
| Sort param | Server-side enum; web validates against [trending,recent,near,top_creators] before hitting API |

## 11. Governance

- **DPDPA:** Search queries already logged via existing `search_queries` table; retention 30 days (existing).
- **Coral usage on /discover:** primary CTAs ("Apply filters", "Load more"), active sort tab, active filter dot — all allow-list spots 1, 4, 5. Sidebar's coral-tint halo on active type filter is allow-list 4.
- **Doc sync:** WEB-DESIGN-SYSTEM.md → add `<DiscoverSidebar>`, `<MasonryGrid>` if structural enough. Otherwise inline-only.
- **ADR:** if Decision 1 picks A and we promote handpicked-rail/etc below the grid, that's a discoverability change worth a brief ADR-0003.

## 12. Tasks (preliminary — refined after decisions land)

| ID | Task |
|----|------|
| T1 | Audit existing `/discover` API surface; verify sort permutations + counts work |
| T2 | `<DiscoverHeader>` editorial H1 + live-stats line |
| T3 | `<DiscoverSidebar>` — Type pills with counts + Vibe tags + Distance slider + "+ More filters" link |
| T4 | `<DiscoverGrid>` — 3-col masonry with 1×/2× spans, gridAutoFlow: dense |
| T5 | Sort tabs (Trending / Recent / Near me / Top creators) wired to URL `?sort=` |
| T6 | Active-filter chip row above grid (FR-036) |
| T7 | "+ More filters" → open `<FilterSheet>` as 420px right drawer (FR-034) |
| T8 | Restyle `<HandpickedCollectionsRail>`, `<TopCreatorsRail>`, `<UpcomingExperiencesRail>` to sit below the grid |
| T9 | Restyle `/discover/results` to match new chrome |
| T10 | Page rewrite — `apps/web/src/app/discover/page.tsx` |
| T11 | Cmd+K minor polish (verify v3 chrome match) |
| T12 | 4-step review gate |
| T13 | Pre-commit + screenshots + commit |

## 13. Definition of Done

Standard E5.X DoD inherited from the cross-cutting quality contract (master plan §): typecheck/lint/tests green · `/` 200 · LCP < 2.5s · axe-core 0 critical · screenshots committed · 4-step review · master TRACKING.md row → DONE.
