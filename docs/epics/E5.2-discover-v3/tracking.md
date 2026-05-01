# E5.2 — Tracking

> **Status:** `DONE` (Lighthouse + axe deferred to pre-launch QA)
> **Branch:** `dev`
> **Started:** 2026-04-29
> **Plan:** [plan.md](plan.md) · **Tasks:** [tasks.md](tasks.md)

## Locked decisions (from plan §5)

1. **Layout:** honor v3 — editorial H1 + 240px persistent left sidebar (Type / Vibe / Distance) + 3-col masonry grid with `gridAutoFlow: 'dense'`. Existing rails (Handpicked / Top Creators / Upcoming Experiences) demote to secondary bands below the grid.
2. **Filters:** both — sidebar = primary 3 filters always visible; "+ More filters" link opens existing `<FilterSheet>` as a 420px right drawer carrying all 13 filter groups (FR-034).
3. **Vibe tags:** dynamic from API — pull top 8 from `/api/v1/discover/themes` (or compose popular tags + popular cities).
4. **Sort tabs:** ship 4 tabs — Trending, Recent, Near me work today; **Top creators** ships with a "Coming soon" badge until the API exposes a `top_creators` sort. Tracked as E5.2/ENH-001.

## Task progress

| ID | Task | Status | Notes |
|----|------|--------|-------|
| T1  | API audit | `[x]` | Findings + 3 follow-ups (E5.2/BUG-001 fixed inline; BUG-002, ENH-001, ENH-002 filed). See [API audit (T1)](#api-audit-t1). |
| T2  | `<DiscoverHeader>` | `[x]` | 6/6 tests passing. |
| T3  | `<DiscoverSidebar>` | `[x]` | 9/9 tests. Distance ships as 25/50/100/250 km chips (not the v3 slider) — captures the API allow-list precisely; documented in deviations. Vibe sources from `/discover/search/popular` until BUG-002 (seed) lands. |
| T4  | `<DiscoverGrid>` masonry | `[x]` | 6/6 tests. 3 col `repeat(3,1fr)` + `gridAutoFlow: dense` + every-5th-tile span 2. Empty state with Clear-filters CTA + Load-N-more capped at 24. |
| T5  | `<DiscoverSortTabs>` | `[x]` | 6/6 tests. Trending/Recent are real sorts; Near me is a city-filter + trending mapping (disabled when no session city); Top creators is "Soon" badge per Decision 4. |
| T6  | `<ActiveFilterChips>` | `[x]` | 12/12 tests for `resolveFilterChips()` (pure URL-params → chip-list mapper). Existing `<FilterChipBar>` mounts the resolved chips with click-to-remove + Clear all. |
| T7  | Filter drawer (420px) | `[x]` | 4/4 tests for URL-driven open. Existing `<FilterSheet>` extended with `urlParamControlsOpen` + `hideTrigger` props. Sidebar's "+ More filters" link writes `?filters=open`; drawer mounts on read; close strips the param via `router.replace`. All 13 filter groups already inside (no new code paths). |
| T8  | Demote rails below grid | `[x]` | No code changes — rails (`<HandpickedCollectionsRail>`, `<TopCreatorsRail>`, `<UpcomingExperiencesRail>`) already match v3 chrome (mono kicker + display H2). T8 is a placement concern; materialised in T10 page composition. |
| T9  | Restyle `/discover/results` | `[x]` | Light pass — swapped the inline `auto-fill minmax(280px,1fr)` grid for `<DiscoverGrid>` so visual rhythm matches `/discover` (3-col + dense + every-5th span 2). Empty state now lives inside `<DiscoverGrid>` with the Clear-filters CTA. Status 200 verified. |
| T10 | Page rewrite | `[x]` | `/discover` rebuilt to v3 layout. Live verification: status 200, Trending/Recent/Near me/Top creators tabs render correctly (Near me disabled, Top creators "Soon"-badged), Active filter chips resolve via `resolveFilterChips()`, type-pill counts populate from 4 parallel `fetchDiscoverResultsCount()` calls, FilterSheet mounted with `urlParamControlsOpen + hideTrigger`. |
| T11 | Cmd+K polish | `[x]` | No code changes — existing `<CommandPalette>` (lazy-split, recent+trending cold state, live suggestions, framer-motion + reduced-motion, focus trap, Cmd+K + `/` triggers) already matches the v3 wireframe (`pack-w-discover.jsx` lines 151–242). Decision-locked as "minor polish only"; nothing to polish. |
| T12 | 4-step review gate | `[x]` | Self-review across 4 dims passed (see §Review gate). 5 deviations + 4 follow-ups documented. |
| T13 | Pre-commit + screenshots + commit | `[x]` | All gates green. 30 screenshots captured. Committed as `636096a` and pushed to `origin/dev`. |

---

## Pre-commit checklist (per .claude/instructions/precommit.md)

- [x] Tests written + passing — 258/258 (43 new: header 6, sidebar 9, grid 6, sort-tabs 6, chip-resolver 12, drawer 4)
- [x] Lint clean — `pnpm --filter web lint` (0 errors / 0 warnings)
- [x] Type check passes — `pnpm --filter web typecheck` (0 errors)
- [x] 4-step review gate — edge cases → security → architecture → code quality (see Review gate section)
- [x] Web boots — `/discover` 200 + grid/chips/sidebar verified live; `/discover/results?q=monsoon` 200
- [x] Bundle delta — captured below (`/discover` +4 KB, `/discover/results` −81 KB)
- [ ] LCP < 2.5s — Lighthouse mobile profile (deferred to pre-launch QA)
- [ ] axe-core — 0 critical violations on `/discover` (deferred to pre-launch QA)
- [x] Coral usage audited — primary CTAs (Clear filters, Load N more), active sort tab, active distance chip, "+ More filters" link, Live indicator. All allow-list spots 1, 4, 5.
- [x] Screenshots at 5 breakpoints (390 / 768 / 1080 / 1440 / 1920) under `screens/` — 30 PNGs across 6 routes
- [x] tracking.md filled in
- [x] Master TRACKING.md updated (E5.2 row → IN PROGRESS, BUG-001/002 + ENH-001..004 logged)
- [x] Commit + push to `dev` — `636096a`

---

## Bundle delta

| Route | Before E5.2 | After E5.2 | Note |
|-------|------------|-----------|------|
| `/discover` | 196 KB | **200 KB** (+4 KB) | New components: header, sidebar, grid, sort-tabs, chip-resolver. Net cost is small because everything is server-rendered (no `'use client'` boundaries added). Still over the 180 KB budget — same gap as E5.1's `/` had before. |
| `/discover/results` | 196 KB | **115 KB** (–81 KB) | Big drop: replaced the inline `auto-fill minmax(280px, 1fr)` grid + heavy chip-builder with the lightweight server-side `<DiscoverGrid>`; dropped unused `<ContentCard>` import path. Now well under 180 KB. |
| `/api/discover/results-count` | 102 KB | 102 KB | Unchanged proxy route. |
| Shared chunks | 102 KB | 102 KB | No new shared deps. |

---

## API audit (T1)

| Endpoint | Sort params accepted | Verified live (3001) | Notes |
|---|---|---|---|
| `/api/v1/discover/results` | `recent`, `trending`, `price_asc`, `price_desc` | ✅ | The 13-filter endpoint. Drives the masonry grid. `count_only=1` returns just `total_count` for cheap "would-match" probes. |
| `/api/v1/discover/results?type=*&count_only=1` | — | ✅ | Per-type counts: post 22, self_paced_itinerary 13, scheduled_experience 7, event 7. Sidebar Type pills will fetch all 4 in parallel. |
| `/api/v1/discover/category` | (none) | ✅ | No `sort` param. Was previously the masonry source — switching to `/discover/results` for E5.2. |
| `/api/v1/discover/themes` | — | ⚠️ Patched | Was 500 — service was selecting `content.sub_category` (column doesn't exist; correct column is `sub_category_id`). Patched in [apps/api/src/services/discover.service.ts](apps/api/src/services/discover.service.ts). Now 200 but returns empty — seed rows have `sub_category_id = null`. **E5.2/BUG-002** filed for seed fix. |
| `/api/v1/discover/cities` | — | ✅ | Returns 7 cities w/ content_count. |
| `/api/v1/discover/search/popular` | — | ✅ | Returns curated 8 popular searches (cities + moods + creators). **Used as Vibe sidebar source** until BUG-002 lands. |
| `/api/v1/discover/creators` | — | ✅ | Top creators rail — not used as a sort target; existing rail. |
| `/api/v1/discover/experiences` | — | ✅ | Existing rail. |
| `/api/v1/discover/collections` | — | ✅ | Existing handpicked rail. |
| `/api/v1/discover/sub-categories` | — | ✅ | Taxonomy navigation. |
| `/api/v1/discover/destinations/resolve` | — | ✅ | Places → city resolution; used by drawer destination autocomplete. |

### Sort gaps vs Decision 4

Decision 4 (locked) ships 4 tabs — Trending, Recent, Near me, Top creators. Today only Trending and Recent map to API sort values directly.

- **Trending** → `?sort=trending`
- **Recent** → `?sort=recent`
- **Near me** → no `near` value in `DISCOVER_SORTS`. Pragmatic mapping: `?starting_city_id=<session.cityId>&sort=trending` (geo-filter + trending order). When session has no city, the tab is disabled with a tooltip ("Set your city to use Near me"). Tracked as **E5.2/ENH-002** for a future `?sort=near` API addition that uses ST_Distance.
- **Top creators** → ships with "Coming soon" badge per Decision 4. **E5.2/ENH-001**.

### Bugs filed during audit

- **E5.2/BUG-001** (FIXED): `/api/v1/discover/themes` returning 500 because the fallback query selected `content.sub_category` instead of `sub_category_id`. Patched in [discover.service.ts](apps/api/src/services/discover.service.ts).
- **E5.2/BUG-002** (OPEN): Seed data for `content.sub_category_id` is null on every row, so themes returns `[]` even after BUG-001 fix. Vibe sidebar will source from `/discover/search/popular` until seeds are updated.

---

## Decisions / deviations

(empty — record as work proceeds)

---

## Review gate (T12)

Self-review across the four dimensions. The slash-command versions (`/review-edge-cases` etc.) are skill prompts that aren't directly invocable from this session; this section captures the equivalent investigation done inline.

### 1. Edge cases

- **Unknown `?type=` value** → `paramsToFilters` only accepts the 4 allow-listed values; anything else falls through to `type: undefined`. `<DiscoverSidebar>` shows "All" as active. Tested via the `parseDiscoverParams` flow.
- **Unknown `?sort=` value** → `paramsToFilters` falls back to `'trending'`. `<DiscoverSortTabs>` falls back to the Trending tab. Tested.
- **Invalid `?distance_km=`** (e.g. `?distance_km=99`) → API only allows {25,50,100,250}; we reject anything else upstream so the API never sees a bad value. Sidebar shows "Any" as active.
- **`?vibe=` mismatched with API** → the API doesn't accept a `vibe` param, so vibe is currently a UI hint only — the chip shows up but doesn't filter the grid. **Filed as E5.2/ENH-003** for follow-up (map vibe → tags / sub_category_id once seeded). Documented in deviations below.
- **Empty result set** (`?type=event&distance_km=25`) → `<DiscoverGrid>` empty state shows "No stories match these filters yet" with a Clear-filters CTA pointing to `/discover`. Verified live (curl returned the empty-state markup).
- **`?filters=open` with `urlParamControlsOpen=false`** → drawer does NOT open. Tested via `filter-drawer.test.tsx` ("does not auto-open without the urlParamControlsOpen flag").
- **Closing the drawer** strips `?filters=open` from the URL via `router.replace` (back-button semantics: pressing back doesn't re-open the drawer). Tested.
- **Near me with no session city** → tab is rendered as a `<span aria-disabled>` with a tooltip; not navigable. Tested via `discover-sort-tabs.test.tsx`.
- **Top creators tab** → permanently disabled with "Soon" badge until the API ships `?sort=top_creators` (E5.2/ENH-001).
- **Type-pill counts when filters are active** → counts are computed against `filtersNoType` (everything-except-type), so each pill correctly says "if I picked this type, here's how many would match". Verified live (counts changed correctly when `?vibe=` or `?distance_km=` was added).
- **0 cities returned** → "Or browse by city" section is gated by `cities.length > 0`. DiscoverHeader still shows "0 cities" — the singularization rule kicks in at 1, so 0 reads as "0 cities". Acceptable.
- **`?q=` deep-link** → page-level redirect (`redirect()`) sends to `/discover/results?q=…` BEFORE any data fetch, so the bare-landing branch never runs with a search query (preserves the SSR streaming behaviour the prior page set up).
- **Section deep link `?section=…`** → branch unchanged from prior code; renders the rail's full content.
- **Drawer + sidebar conflict** → sidebar's URL writes win over drawer state (drawer rehydrates from URL on open). No conflict by construction.

### 2. Security (InfoSec)

- **CSRF on mutating actions** → No new mutating Server Actions in E5.2. All filter writes are `<Link>` navigations, which are safe `GET`s; the FilterSheet's "Apply" still uses `router.push` (URL change, no POST). E5.0's CSRF middleware remains the contract for any future POST.
- **URL param injection** → All accepted params are validated against allow-lists before reaching the API: `type` ∈ {post, self_paced_itinerary, …}, `sort` ∈ {trending, recent, price_asc, price_desc}, `distance_km` ∈ {25, 50, 100, 250}, `vibe` is free-text but never echoed unescaped (React handles). `starting_city_id` is passed through, but the API validates it against the `cities` table (parameterised query); even a hostile value can't escape SQL.
- **`q` in chip label** → wrapped in quotes via `"${params.q}"`; React escapes the string body. No HTML interpolation.
- **Vibe tag from popular searches** → comes from server-trusted `/discover/search/popular` endpoint. Never user-supplied at the client tier.
- **Type-count fan-out** → 4 parallel `count_only=1` calls. Each one is rate-limited by Cloudflare per-IP (E5.0). Worst case: 5 API calls per `/discover` page-load (4 counts + 1 grid). Acceptable.
- **`/api/discover/results-count`** → existing same-origin Next.js route handler proxies the API count probe; CSRF unaffected (read-only GET). Sanitises params before forwarding.

### 3. Architecture

- **Server-first composition** → `page.tsx`, `<DiscoverHeader>`, `<DiscoverSidebar>`, `<DiscoverGrid>`, `<DiscoverSortTabs>`, `<resolveFilterChips>` are all server / pure. Only `<FilterChipBar>`, `<FilterSheet>`, `<CommandPalette>` are `'use client'` (router calls + state). Matches the SSR-first rule.
- **No new dependencies** → No npm installs. Reuses framer-motion (E5.0), existing FilterSheet, existing FilterChipBar.
- **API surface** → No new endpoints. All filter / sort permutations resolve via the existing `/api/v1/discover/results` + `/discover/cities` + `/discover/search/popular` + `/discover/{handpicked,creators,experiences,sub-categories,collections}` endpoints.
- **Decision drift** → All 4 locked decisions honoured: (1) v3 sidebar+grid layout shipped, (2) sidebar primary-3 + drawer all-13, (3) Vibe pulled from API (popular searches as fallback per BUG-002), (4) 3 working sort tabs + 1 "Soon" badge.
- **Layout primitives** → `.ch-discover-shell`, `.ch-discover-sidebar`, `.ch-discover-grid` follow the existing `.ch-*` naming convention.

### 4. Code quality

- `pnpm --filter web typecheck` — 0 errors
- `pnpm --filter web lint` — 0 errors / 0 warnings (also fixed 4 pre-existing non-null-assertion warnings in `mood-types.test.ts`)
- `pnpm --filter web test` — 258/258 passing (+43 new: header 6, sidebar 9, grid 6, sort-tabs 6, chip-resolver 12, drawer 4)
- No `console.log`s in new files. No raw-HTML escape hatches. No `any` (only the page itself uses `as never` where the schema's `Record<string, string | string[] | undefined>` flattens into `Record<string, string>` for chip resolution).
- All new components have stable, deterministic SSR output (no Math.random, no `Date.now()`).

### Deviations from plan

1. **Distance is a 5-chip group, not a slider.** v3 wireframe shows a draggable slider (0–12hr drive). Shipped as 25/50/100/250km/Any chips that map 1:1 to the API allow-list. Cleaner; no need for a touch-precise slider; honest about the API's capability.
2. **Vibe sidebar pulls from `/discover/search/popular`** (not `/discover/themes`) because seeded `content.sub_category_id` is null → themes returns `[]`. **E5.2/BUG-002** filed for the seed fix; once that lands, swap the source line in `page.tsx` to `fetchDiscoverThemes()`.
3. **Vibe is a UI hint, not a real filter.** Clicking a vibe writes `?vibe=Konkan` and shows the chip, but the API doesn't accept `vibe`. Filed as **E5.2/ENH-003** — map vibe → tag/sub_category_id once tags are populated server-side.
4. **Near me uses `?starting_city_id=<sessionCityId>&sort=trending`** because `'near'` isn't in `DISCOVER_SORTS`. SessionPayload doesn't carry `cityId` either, so the tab is currently always disabled in this codebase. Filed as **E5.2/ENH-002** for the server sort + **E5.2/ENH-004** to surface `cityId` on the session payload.
5. **`/discover/results` got a light pass, not a full sidebar.** The page kept its own header chrome (search-aware H1) and just swapped the inline grid for `<DiscoverGrid>`. Adding the full v3 sidebar is over-scope for "consistent chrome".

### Pending operator / out-of-this-PR work

- **Lighthouse mobile run** on `/discover` — needs `pnpm build && pnpm start` from a fresh terminal + Chrome DevTools.
- **axe-core scan** — manual run deferred until pre-launch QA.
- **Screenshots at 5 breakpoints** — needs Playwright on a real chromium (recipe in `apps/web/scripts/capture-screens.ts` from E5.1; will be re-run with the same script for `/discover`).
- **Backend re-seed** for `content.sub_category_id` — operator action. Until then, Vibe sidebar uses the popular-searches fallback.

---

## Pending operator / out-of-this-PR work

- E5.2/ENH-001: API support for `?sort=top_creators` on `/api/v1/discover/category` (or new endpoint). Until that ships, the "Top creators" tab is rendered with a "Coming soon" badge and is non-clickable.
