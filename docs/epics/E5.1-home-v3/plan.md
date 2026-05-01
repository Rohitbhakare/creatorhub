# E5.1 — Home Feed v3 (Magazine W3)

> **Series:** Second epic in the M2.5 Web v3 Parity series. Depends on E5.0 (Foundation).
> **Goal:** Rebuild the home page (`/`) to match the v3 magazine wireframe.
> **SRS refs:** WEB-FEED-FR-023..031 (also WEB-MOTION-FR-103 cursor microinteractions, WEB-A11Y-FR-110 high-contrast)
> **Wireframes:** see §3
> **Master plan:** [`/Users/rohit/.claude/plans/web-application-is-not-enumerated-matsumoto.md`](/Users/rohit/.claude/plans/web-application-is-not-enumerated-matsumoto.md)

---

## 1. Overview

Today's `/` renders a serviceable but pre-v3 layout: editorial greeting hero + bento mosaic + 8 horizontal section rails + right-rail quest dock. It works but it's not the v3 magazine.

E5.1 rebuilds `/` to match `pack-w3-home-web.jsx`: a chapter-rotating hero (storytelling — multi-day itinerary chapters cycle through), a quest strip, a 5-mood selector, a magazine bento mosaic, an interactive map strip, a creator spotlight with cursor-tilt parallax, and a "continue reading" rail. The 11 SRS sections still surface — they live below the magazine band as restyled snap-scroll carousels.

This epic ships the visual rebuild + interaction rewrites; data shape stays compatible with the existing `getHomeFeedSections` API. No DB changes. No new API endpoints (one new Server Action for optimistic save).

## 2. SRS Requirements

| ID | Requirement | Notes / scope decisions |
|----|-------------|------------------------|
| WEB-FEED-FR-023 | Web home shell | **CONFLICT WITH WIREFRAME — see §5 Decision 1** |
| WEB-FEED-FR-024 | Near you / Following scope chips + filter chips (All / Posts / Road Trips / Biking / Trekking / Food Trails) | Existing `<FeedChipRail>` already covers this; keep |
| WEB-FEED-FR-025 | 11 editorial sections (Hot near you · Hand-picked · Trending posts · This weekend · Ending soon · From your city · From follows · New voices · Under ₹2k · Short reads · Long reads) | Existing API already returns these; restyle the rails |
| WEB-FEED-FR-026 | Posts feed mode (`?type=post` → single-column 640px Instagram-style with photo carousel) | New: distinct mode, separate code path from magazine layout |
| WEB-FEED-FR-027 | "See all" routes preserve scroll position via `pushState` | Verify current `<Link>` already does this |
| WEB-FEED-FR-028 | `<ContentCard>` variants — grid / horizontal / featured | Add `variant` prop to existing `<ContentCard>`; no new component |
| WEB-FEED-FR-029 | `<ExpandableText>` — Fraunces 14/1.65, 3-line clamp + "Show all" | Likely already exists — reuse |
| WEB-FEED-FR-030 | Right-rail dock (quest ring + streak + 3 trending tags) on ≥1080px; mobile collapses to floating bottom-right pill | **CONFLICT — see §5 Decision 1** |
| WEB-FEED-FR-031 | Optimistic save / like — instant flip, server retries quietly, snap back with toast on fail | New Server Action; uses E5.0's `pushToast()` for failure path |
| WEB-MOTION-FR-103 | Cursor-aware microinteractions (card hover tilt ±2°) | Apply to creator spotlight; disabled on touch via media query |
| WEB-MOTION-FR-105 | All animation gated by `useReducedMotion` | Hero rotator pauses; tilt becomes fixed |

## 3. Wireframes Referenced

| File | Use |
|---|---|
| [docs/01_wireframes/v3/project/pack-w3-home-web.jsx](docs/01_wireframes/v3/project/pack-w3-home-web.jsx) | Canonical layout source. Read **lines 187–740 specifically** — Hero, QuestStrip, Moods, Bento, MapStrip, Spotlight, Continue. |
| [docs/01_wireframes/v3/project/CreatorHub Redesign (standalone).html](docs/01_wireframes/v3/project/CreatorHub%20Redesign%20%28standalone%29.html) | Visual cross-check at 5 breakpoints. Section "W · Web home feed". |
| [docs/01_wireframes/v3/project/uploads/pack-w3-home-feed.html](docs/01_wireframes/v3/project/uploads/pack-w3-home-feed.html) | Earlier standalone — useful for spotting deltas if v3 src is ambiguous. |
| [docs/01_wireframes/v3/project/pack-w-chrome.jsx](docs/01_wireframes/v3/project/pack-w-chrome.jsx) | Header / right-rail mounting (already aligned in E5.0 T4). |
| [docs/01_wireframes/v3/WEB-DESIGN-SYSTEM.md](docs/01_wireframes/v3/WEB-DESIGN-SYSTEM.md) | Tokens, primitives index, coral allow-list. |

## 4. Dependencies

| Dependency | Status | What we use |
|---|---|---|
| E5.0 Web Foundation | DONE | `<Btn>`, `<BtnLink>`, `<Pill>`, `<XPChip>`, `<StreakChip>`, `<Ring>`, `<InitialAvatar>` primitives; `<PageShell>`, `<TwoColLayout>`, `<ReaderLayout>` layout primitives; motion library; `<ToastRegion>` + `pushToast()`; CSRF middleware |
| E1.5 Home feed API | DONE | `getHomeFeedSections(scope)` already returns the 11-section payload |
| Existing components | — | `<HeroFeature>`, `<BentoMosaic>`, `<SectionRail>`, `<ContentCard>`, `<FeedChipRail>`, `<RightRail>`, `<GuestRailCard>`, `<GuestLocationPrompt>` — all restyled, none rebuilt |

**No new dependencies.** Mapbox stays uninstalled; map strip ships as a stylised placeholder until E5.3 (reader epic) adds the real Mapbox integration. Documented in §5 Decision 3.

## 5. Architecture Decisions — OPEN QUESTIONS

These are real forks. Each needs your call before code starts.

### Decision 1 — single-column vs two-column layout (LOAD-BEARING)

**SRS says** (WEB-FEED-FR-023): three-column grid on ≥1080px — 240px sidebar nav + 720–960px feed + 280px right rail with quests dock.

**v3 wireframe says** (line 1 comment): "single-column, no side nav, magazine + interactive" with the quest strip inline as a horizontal section between hero and moods.

**Current code does**: two-column — main + 296px right rail with quests/streak/trending dock (the SRS without the left sidebar).

Three options:

| Option | Layout | Trade-off |
|---|---|---|
| **A. Honor v3 (recommended)** | Single column, max-width 1240px, quest strip inline | Magazine feel preserved as designed. Loses the persistent right rail; quest visibility moves to header chip + the inline strip. Closer to the SRS-spec'd mobile behavior at all breakpoints. |
| **B. Honor SRS** | Two-column with right-rail dock at ≥1080px (current pattern) | Persistent quest visibility (good for engagement). Loses magazine "openness" of single-column. v3 wireframe shows this differently. |
| **C. Hybrid** | Single column for the magazine band (hero, bento, map, spotlight, continue), then two-column below for the 11 SRS sections | More complex. Best of both but more code surface. |

**Recommended: A.** v3 was redesigned deliberately as single-column; the SRS clause predates v3 and a delta (WEB-FEED-FR-023-R) should be filed. I'll write the SRS delta as part of T8.

### Decision 2 — mood chip glyphs

v3 wireframe uses emoji: 🌿⚡🥘🌅🎨. Project rule per CLAUDE.md: "Only use emojis if the user explicitly requests it." Three options:

| Option | Glyph | Trade-off |
|---|---|---|
| **A. Inline SVG icons (recommended)** | Custom SVG per mood, monochrome ink, color picks up theme | Matches the v3 visual punch without breaking the no-emoji rule. ~40 lines of SVG. |
| **B. Text-only labels** | "Slow & quiet" / "High octane" / etc. with a coral underline-on-active | Cheapest. Loses some scannability. |
| **C. Emoji as content (not chrome)** | Treat the mood glyph as user-facing data, not chrome decoration | Skirts the rule with a defensible interpretation. Inconsistent with E5.0 (where I replaced the streak emoji with SVG). |

**Recommended: A.** Consistent with E5.0's `<StreakChip>` which uses a hand-rolled SVG flame.

### Decision 3 — map strip without Mapbox

v3's `MapStrip` shows "interactive city pins" — clicking a pin filters the feed by that city. Mapbox isn't installed yet; E5.3 (reader epic) is the right place to install it.

Two options:

| Option | What ships in E5.1 | Trade-off |
|---|---|---|
| **A. Stylised placeholder (recommended)** | Existing `ch-photo--<city>` gradient as a 16:9 backdrop, with chip-style city pins absolute-positioned over it. Click filters feed. Static, no actual map data. | No new dep. Visually close to v3. Real interactive map lands in E5.3 with Mapbox. |
| **B. Install Mapbox now** | Real tile map with pins | Adds ~50KB to bundle, CSP additions, vendor cost. Mapbox is properly E5.3's responsibility. |

**Recommended: A.**

### Decision 4 — chapter hero data source

v3's `heroStory` shows ONE itinerary's multi-day chapters cycling through (`heroStory.chapters[chapter]`). To do this for real, we need an itinerary with `≥3` days/spots and the API to surface them.

| Option | What we ship | Trade-off |
|---|---|---|
| **A. Pick a featured itinerary, query its spots, show as chapters (recommended)** | Single editorial itinerary cycles through its days. Backend already returns spots via `getById(id, …)`. | Authentic v3 storytelling. Requires admin to mark one item as `featured=true` and we cycle its days. |
| **B. Treat chapters as 3 different featured items** | Hero rotates through 3 separate stories | Easier; loses the "narrative progression" feel of v3. |

**Recommended: A.** Add a small `getFeaturedChapterStory()` helper that returns the first featured itinerary + its spots; cycle through `spots` as chapter cards.

### Other architecture decisions (no user input needed)

| Decision | Choice | Rationale |
|---|---|---|
| Server Action for save toggle | Yes — Next.js 15 Server Actions | Optimistic UI on the client, server-side mutation, CSRF auto-honored by Next |
| Section rail snap-scroll arrows | CSS `scroll-snap` + JS-controlled buttons (hover-revealed at ≥1080px) | No new dep; gesture-only on touch |
| Component placement | Restyle in place (`apps/web/src/components/content/`); new `chapter-hero.tsx`, `mood-selector.tsx`, `map-strip.tsx`, `creator-spotlight.tsx`, `continue-reading-rail.tsx` in `apps/web/src/components/content/` (or `feed/` for filter-bound ones) | Matches existing convention |
| Page composition | Server component shell + client islands for each interactive section | SSR-first per CLAUDE.md; client only where motion or input requires it |

## 6. Database

No DB changes. Reads via existing `getHomeFeedSections`, `fetchQuestSummary`, `fetchPopularCities`. The optimistic-save Server Action calls existing `/api/v1/content/:id/save` endpoint.

## 7. API Contract

No new endpoints. One new Server Action wrapper in `apps/web/src/app/actions/save.ts` (new path):
- Function: `toggleContentSaveAction(contentId: string, isSaved: boolean)`
- Input: validated by existing `saveContentSchema` from `@creatorhub/shared`
- Calls `POST /api/v1/save` (or `DELETE /api/v1/content/:id/save`)
- Returns `{ success: true, savedCount: number }` on happy path, RFC-9457 problem on failure
- CSRF: enforced by E5.0 middleware (Origin check on POST)

## 8. Test Plan

| Layer | Coverage |
|---|---|
| Unit | New components — chapter-hero (rotation timer + reduced-motion), mood-selector (URL param sync), map-strip (city pin click), creator-spotlight (tilt math), continue-reading-rail. ~15 new tests. |
| Integration | Server Action happy path + failure path + CSRF rejection. ~3 tests. |
| SSR | Render `/` server-side per `(scope, mood, type)` permutation matrix — sample 6 combos: guest+near-you+default, authed+following, authed+near-you+mood=slow, authed+near-you+type=post, authed+near-you+city=mumbai, authed+near-you+mood=food+type=post. Snapshot stable. |
| A11y | `axe-core` scan on `/` for guest + authed variants — 0 critical. Keyboard nav: Tab through hero rotator (left/right arrows advance chapter), mood chips (arrow keys cycle), bento cards (Tab + Enter), section rail (arrow keys snap). |
| Motion | All Framer Motion variants tested with `prefers-reduced-motion` — hero rotation freezes, tilt stops, scroll-reveal becomes opacity-only fade. |
| High contrast | `forced-colors: active` — coral retained only on save (allow-list 2), location pin (3), nav active (4), unread badge (5), XP fill (6). Bento gradients drop to `Canvas` background. |
| Visual | Manual screenshot diff at 5 breakpoints (390 / 768 / 1080 / 1440 / 1920); commit to `screens/`. |
| Lighthouse | LCP ≤ 2.5s on `/` mobile profile; record baseline + final in tracking.md. |

## 9. Edge Cases

- **Empty section** (no data) → suppress the rail entirely, don't render an empty heading.
- **Single-item section** → render as a standalone card (not a carousel of 1).
- **Mood + scope yields zero results** → empty-state inside the bento with "remove filter" CTA.
- **No featured itinerary in DB** (chapter hero source) → fall back to current `<HeroFeature>` (single editorial story) — graceful degrade.
- **Hero rotation paused** on tab blur (`visibilitychange`); resumes on re-focus.
- **`?type=post` mid-render switch** → page navigation (not in-place re-render); existing pattern.
- **Optimistic save fail** → instant flip back + toast via `pushToast({ tone: 'error' })`.
- **Trending-tag click** while tag was just removed by curation → 404; show "tag no longer available" toast on next render.
- **Right-rail dock** doesn't apply if Decision 1 = A (single-column). If Decision 1 = B/C, the existing dock stays + we add the floating-pill collapse for <1080px (FR-030).

## 10. InfoSec Review

| Concern | Mitigation |
|---|---|
| CSRF on save Server Action | E5.0 middleware (double-submit + Origin check) |
| Rate-limit on save spam | API-side rate limit on `/api/v1/save` (existing); 429 → toast "you're going too fast" |
| XSS in section titles / chapter sub-titles | React escapes by default; titles come from server-trusted seed/admin curation. Spot-check no raw-HTML escape hatches in new components. |
| Mood / scope params reflected in URL | URL params stay in `?mood=slow` etc.; SSR validates against allow-list before passing to feed query |
| Image URL spoofing | All cover URLs come from server (DB row); `next/image` `remotePatterns` already restricts hosts |
| Chapter-hero anonymous data | Featured itinerary is server-curated; no user input |

## 11. Governance

- **DPDPA:** No new collection points. Save analytics events use existing pattern.
- **Coral usage audit on `/`:** must stay within 7-spot allow-list. New surfaces: XP ring fill (6), trending-tag chip dot when active (5), save-icon active state (2). Mood chip active state should NOT use coral fill — use ink underline + bold instead (avoid violating the chrome-only-coral rule).
- **A11y ownership:** WCAG 2.2 AA non-negotiable. axe-core in CI tightens from warn-only to blocking starting this epic (E5.0 set warn-only).
- **Lighthouse target:** LCP < 2.5s mobile profile. If we overshoot, lazy-load below-fold sections (creator-spotlight + continue-reading) before merge.
- **ADR:** if Decision 1 picks Option A (single-column), file ADR-0002 documenting the WEB-FEED-FR-023 → FR-023-R delta. If B/C, no ADR.
- **Doc sync:** WEB-DESIGN-SYSTEM.md updated with new component entries (chapter-hero, mood-selector, map-strip, creator-spotlight, continue-reading-rail).

## 12. Tasks

See [tasks.md](tasks.md). Tracking lives in [tracking.md](tracking.md).

## 13. Definition of Done

- [ ] All 11 tasks (T1..T11) checked
- [ ] `pnpm --filter web typecheck` 0 errors
- [ ] `pnpm --filter web lint` 0 errors
- [ ] `pnpm --filter web test` green (+15 new tests)
- [ ] `pnpm --filter web build` succeeds; bundle delta on `/` documented
- [ ] LCP < 2.5s on `/` mobile profile (Lighthouse) — baseline + final captured
- [ ] axe-core scan: 0 critical violations on guest + authed `/`
- [ ] Coral usage audited — every coral element on `/` matches the 7-spot allow-list
- [ ] Screenshots at 5 breakpoints in screens/
- [ ] 4-step review gate passed (edge cases → security → architecture → code quality)
- [ ] tracking.md pre-commit checklist filled in
- [ ] Master TRACKING.md row updated to `DONE`
- [ ] Commit + push to `dev`
