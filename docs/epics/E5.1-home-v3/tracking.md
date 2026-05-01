# E5.1 — Tracking

> **Status:** `IN PROGRESS`
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
| T1  | `getFeaturedChapterStory()` API helper | `[ ]` | |
| T2  | `<ChapterHero>` rotating component | `[ ]` | |
| T3  | `<QuestStripInline>` | `[ ]` | |
| T4  | `<MoodSelector>` with SVG icons | `[ ]` | |
| T5  | `<BentoMosaic>` v3 restyle | `[ ]` | |
| T6  | `<ContentCard>` variant + `<SectionRail>` carousel | `[ ]` | |
| T7  | `<MapStrip>` placeholder | `[ ]` | |
| T8  | `<CreatorSpotlight>` parallax tilt | `[ ]` | |
| T9  | `<ContinueReadingRail>` | `[ ]` | |
| T10 | Posts feed mode (`?type=post`) | `[ ]` | |
| T11 | Save Server Action + optimistic | `[ ]` | |
| T12 | `page.tsx` rewrite + ADR-0002 + SRS delta | `[ ]` | |
| T13 | 4-step review gate | `[ ]` | |
| T14 | Pre-commit + screenshots + commit | `[ ]` | |

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
| `/` (magazine) | 196 KB | TBD | Target ≤ 180 KB (WEB-NFR-004); page-specific imports may force lazy-loading of below-fold sections |
| `/?type=post` (Instagram-style) | n/a | TBD | New route branch |
| Shared chunks | 102 KB | TBD | Should be flat — no new shared deps |

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

(filled after implementation)
