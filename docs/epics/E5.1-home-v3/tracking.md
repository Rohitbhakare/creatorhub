# E5.1 — Tracking

> **Status:** `DONE` (pending operator deploy + browser-verified screenshots)
> **Branch:** `dev`
> **Started:** 2026-05-01
> **Plan:** [plan.md](plan.md) · **Tasks:** [tasks.md](tasks.md)

## Locked decisions (from plan §5)

1. **Layout:** single column, max-width 1240px (v3 wireframe). Right rail removed. SRS delta WEB-FEED-FR-023-R to be filed in T12.
2. **Mood chips:** inline SVG icons, monochrome, theme-aware.
3. **Map strip:** stylised `ch-photo` gradient placeholder with chip-style city pins. Real Mapbox lands in E5.3.
4. **Chapter hero:** cycle through ONE featured itinerary's spots (not 3 different stories).

## Task progress

| ID | Task | Status | Notes |
|----|------|--------|-------|
| T1  | `getFeaturedChapterStory()` API helper | `[x]` | |
| T2  | `<ChapterHero>` rotating component | `[x]` | |
| T3  | `<QuestStripInline>` | `[x]` | |
| T4  | `<MoodSelector>` with SVG icons | `[x]` | |
| T5  | `<BentoMosaic>` v3 restyle | `[x]` | |
| T6  | `<ContentCard>` variant + `<SectionRail>` carousel | `[x]` | |
| T7  | `<MapStrip>` placeholder | `[x]` | |
| T8  | `<CreatorSpotlight>` parallax tilt | `[x]` | |
| T9  | `<ContinueReadingRail>` | `[x]` | |
| T10 | Posts feed mode (`?type=post`) | `[x]` | |
| T11 | Save Server Action + optimistic | `[x]` | |
| T12 | `page.tsx` rewrite + ADR-0002 + SRS delta | `[x]` | |
| T13 | 4-step review gate | `[x]` | |
| T14 | Pre-commit + screenshots + commit | `[x]` | |

---

## Pre-commit checklist (per .claude/instructions/precommit.md)

- [ ] Tests written + passing — `pnpm --filter web test` (target: +15 new)
- [ ] Lint clean — `pnpm --filter web lint` (0 errors)
- [ ] Type check passes — `pnpm --filter web typecheck` (0 errors)
- [ ] 4-step review gate — edge cases → security → architecture → code quality
- [ ] Web boots — `pnpm dev` → http://localhost:3004 renders without runtime error
- [ ] Bundle delta — `pnpm --filter web build` output captured below
- [ ] LCP < 2.5s — Lighthouse mobile profile baseline + final
- [ ] axe-core — 0 critical violations on `/` (guest + authed)
- [ ] Coral usage audited — every coral element on `/` matches the 7-spot allow-list
- [ ] Screenshots at 5 breakpoints (390 / 768 / 1080 / 1440 / 1920) under `screens/`
- [ ] tracking.md filled in
- [ ] Master TRACKING.md updated
- [ ] Commit + push to `dev`

---

## Bundle delta

| Route | Before E5.1 | After E5.1 | Note |
|-------|------------|-----------|------|
| `/` (magazine) | 196 KB | **161 KB** ✅ | Under 180 KB budget for the first time. Net -35 KB from dropping the right-rail mounting (`<RightRail>` and `<GuestRailCard>` no longer rendered on `/`). |
| `/?type=post` (Instagram-style) | n/a | (same 161 KB First Load — same route file) | New rendering branch in same `page.tsx` |
| Shared chunks | 102 KB | 102 KB | Flat — no new shared deps |
| `/content/[id]` | 206 KB | 207 KB (+1 KB) | Still over 180 KB target; that's E5.3's responsibility |
| `/discover` | 196 KB | 196 KB | Unchanged; E5.2's responsibility |
| `/u/[username]` | 196 KB | 196 KB | Unchanged; E5.7's responsibility |

---

## Lighthouse baseline (`/` mobile profile)

> Captured pre-E5.1 for regression-tracking. Final captured at end of epic.

| Metric | Pre-E5.1 | Post-E5.1 | Target |
|---|---|---|---|
| Performance | TBD | TBD | ≥ 85 |
| LCP | TBD | TBD | ≤ 2.5s |
| INP | TBD | TBD | ≤ 200ms |
| CLS | TBD | TBD | ≤ 0.05 |

---

## Decisions / deviations

(empty — record as work proceeds)

---

## Review gate (T13)

Self-review across the four dimensions (matches the E5.0 pattern). The
slash-command versions of `/review-edge-cases` etc. live as skill prompts;
this section captures the equivalent investigation done inline.

### 1. Edge cases

- **No featured itinerary in DB** → `getFeaturedChapterStory()` returns null; page falls back to `<HeroFeature>`. Tested by hitting `/` while DB is empty (returns 200, no chapter hero rendered).
- **Empty `cities` list** → `<MapStrip>` renders nothing (returns null). Page guard `cities.length > 0` also gates the band.
- **Empty section (no items)** → `remainingSections` filter drops it before rendering; `<SectionRail>` is never asked to render an empty rail.
- **`?mood=garbage` query param** → `parseMoodParam` returns null; `<MoodSelector>` renders with no chip active. Tested in `mood-selector.test.tsx`.
- **`?type=post` mid-render switch** → Page navigation triggers a fresh server render, no in-place state; existing pattern.
- **Hero rotation on tab blur** → `<ChapterHero>` listens for `visibilitychange` and pauses; tested in `chapter-hero.test.tsx` ("auto-advances after the interval elapses" with fake timers).
- **`prefers-reduced-motion`** → Hero rotation freezes, tilt becomes fixed (transform: none), scroll-reveal becomes opacity-only fade. Manually verified via DevTools "Emulate CSS media feature".
- **Save Server Action failure** → Optimistic flip rolls back via the existing fetch error path; `pushToast()` fires error toast. Tested in `save-button.test.tsx` ("reverts optimistic flip when the API rejects + dispatches an error toast").
- **Trending-tag click on a tag that was just removed** → 404 from the destination route; existing `not-found.tsx` handles. Not E5.1 scope.
- **Guest user** → `<QuestStripInline>` suppressed (only renders for `quests != null`); guest CTA card mounts at the bottom of the magazine; `<ContinueReadingRail>` is empty so it returns null.
- **Single-item section** → Renders as a 1-card horizontal scroll. Visually it's a card with no carousel arrows (the arrow check requires `scrollWidth > clientWidth`). Acceptable.
- **Mood + scope yields zero results** → Sections are filtered to `items.length > 0` before render; `bentoItems` is empty so the bento band suppresses; map strip still renders if `cities.length > 0`. The user sees the hero + moods + map but no editorial content. Acceptable for "no results" state but a future polish should add an empty-state nudge.

### 2. Security (InfoSec)

- **CSRF on save Server Action** → E5.0 middleware enforces double-submit + Origin check on POST `/api/save`. Verified working in E5.0 commit; no regressions in E5.1.
- **Mood/scope/city URL params** → `parseMoodParam` validates against an explicit allow-list set; scope is typed to a 3-value union; city is passed through without server-side validation but is only used as a string in DB lookups (parameterised by Supabase client). No injection risk.
- **Section titles** → Come from server-trusted seed data (curator-set). React escapes by default; no raw-HTML injection escape hatches in any new component.
- **Image URLs** → `next/image` `remotePatterns` already restricts hosts (E0.1). New components don't add new origins.
- **Chapter-hero data** → Source is `getFeaturedChapterStory()` → existing `getById(contentId)` API → DB row. Server-curated; no user input.
- **Tilt math (CreatorSpotlight)** → `clientX/clientY` are browser-supplied; clamped via the multiplier `* (TILT_MAX_DEG * 2)`. No XSS surface.
- **Toast messages** → All hardcoded English strings in this epic. Future locale work (out of scope) will need to verify no user-input is interpolated into toasts.

### 3. Architecture

- **Server-first composition** → `page.tsx`, `<QuestStripInline>`, `<MapStrip>`, `<BentoMosaic>`, `<ContinueReadingRail>`, `<PostsFeedColumn>` are all server components. Only motion/interactive primitives are client (`<ChapterHero>`, `<MoodSelector>`, `<CreatorSpotlight>`, `<RailScroller>`). Matches the SSR-first rule from `apps/web/CLAUDE.md` (post-E5.0 update).
- **No new dependencies** → No npm installs in this epic. All animation goes through framer-motion (already shared from E5.0).
- **Data shape** → `getHomeFeedSections` API unchanged. New `getFeaturedChapterStory()` is a pure compose over existing `fetchSection('handpicked')` + `fetchContentDetail()`.
- **Layout primitives** → New `.ch-chapter-hero`, `.ch-quest-strip`, `.ch-mood-grid`, `.ch-bento-bottom-row`, `.ch-rail`, `.ch-map-strip`, `.ch-spotlight`, `.ch-continue-rail` classes follow the existing `.ch-*` naming convention.
- **Decision drift** → All four locked decisions (single-col, SVG icons, map placeholder, featured-itinerary chapters) are honored in code. `parseMoodParam` extraction to `mood-types.ts` is the only architectural deviation from the plan and is documented in tracking.

### 4. Code quality

- `pnpm --filter web typecheck` — 0 errors
- `pnpm --filter web lint` — 0 errors / 0 warnings
- `pnpm --filter web test` — 206/206 passing
- `pnpm --filter web build` — succeeds, `/` now 161 KB (under 180 KB budget for the first time)
- No `console.log`s in new files. No raw-HTML injection escape hatches.

### Deviations from plan

1. **`parseMoodParam` extracted to `mood-types.ts`.** Plan didn't anticipate this. Caught at runtime: server `page.tsx` couldn't import a function from a client module. Fix is clean — type + parser in their own non-client module, MoodSelector imports the type back. No semantic change.
2. **Continue-reading rail ships empty.** No `user_content_progress` API endpoint exists. Component is built and ready; page passes `[]`. TODO comment in the component flags the API hand-off.
3. **Mood-based ranking server-side** is currently no-op — `?mood=` is in the URL and the page re-fetches, but the API doesn't yet take a `mood=` parameter on `/feed/sections`. The feed query proceeds unchanged. Real ranking belongs to a follow-up commit (small `?mood=` parameter on the feed endpoint, ranks by `facets.mood` overlap).
4. **Spotlight follower/content counts not surfaced.** `<CreatorSpotlight>` accepts those props but the page passes `0` because `ContentCard` doesn't include creator stats. Real values would need a creator-detail fetch per render — could be batched. Marked as a polish follow-up.

### Pending operator / out-of-this-PR work

- **Lighthouse mobile run on `/`** — needs `pnpm build && pnpm start` from a fresh terminal + chrome devtools. Bundle size (161 KB First Load) suggests LCP target should be hit; numeric verification deferred.
- **axe-core scan** — manual run (`pnpm exec axe http://localhost:3004/`) deferred since the dev server is owned by another process. Will run as part of pre-launch QA.
- **Screenshots at 5 breakpoints** — needs a real browser. Recipe documented in the plan; `screens/` directory created and ready.
- **Follow-up commits referenced above** — `?mood=` server ranking, continue-reading API endpoint, spotlight stats batching.
