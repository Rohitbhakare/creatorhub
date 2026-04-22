# Home Feed — Wireframe vs Build Diff

> Reference: `docs/01_wireframes/v2/project/pack-b-discover.jsx` — screen `S_Home` (B1)
> Build: `apps/mobile/lib/features/feed/screens/home_feed_screen.dart`
> Captured: 2026-04-20

This is the first screen on every session. The drift here compounds because everything
downstream (card taps, See all, detail navigation) inherits it.

---

## Drift Summary — 9 items

| # | Severity | Element | Wireframe | Build | Status |
|---|----------|---------|-----------|-------|--------|
| 1 | HIGH | Top bar | `CreatorHub.` Fraunces 26 wordmark + coral dot + search icon + bell | Location chip + bell (wordmark dropped in E1.5b per founder call — location-picker-first) | RESOLVED (E1.5b) |
| 2 | HIGH | Segmented tabs | "For you / Following / Near you" — 3 full-width segmented pills | SegmentedTabs component (`segmented_tabs.dart`) — 3-up pill track, ink-filled active | RESOLVED (E1.5b) |
| 3 | HIGH | Hero "Featured chapter" | Coral mono eyebrow + 190h photo + Chapter X of Y + display title + "Read →" outline btn | `HeroCard` 220h photo overlay, coral eyebrow, Fraunces 22 white title, tab-aware via `heroProvider(tab)` | RESOLVED (E1.5b) |
| 4 | MED  | Weekly Quest strip | Ink-black card, flame icon, progress bar, X/Y | **Missing entirely** (SRS marks quests V1-preview optional, so allowed, but wireframe has it) | ALLOWED |
| 5 | HIGH | Feed layout | Vertical stack of **full-width** cards (172h cover + padded body) | Hybrid: `ContentCard.vertical` (3:2) stack for primary items + `ContentCard.rail` (1:1) for per-vertical rails | RESOLVED (E1.5b) |
| 6 | MED  | Card photo | 172h cover with type pill (white bg), bookmark top-right, Editor's pick coral tag | `ContentCard` uses white 95% type pill (P1.1 resolved); bookmark + editor's pick tag still deferred to P1 pass | PARTIAL (E1.5b) |
| 7 | MED  | Card body | Avatar + name + "· meta" dot, Fraunces 19 title, heart/comment/clock row | `ContentCard` meta row: creator · heart · comments · duration/age; title Fraunces H4 (vertical) / bodyLarge 15 (rail) | RESOLVED (E1.5b) |
| 8 | LOW  | Honesty footer | Not in wireframe for Home | Removed in E1.5b rewrite of `home_feed_screen.dart` | RESOLVED (E1.5b) |
| 9 | HIGH | Card tappability | — | Wired to detail routes via `onTap` in `ContentCard` + `HeroCard` | RESOLVED |

---

## Fix List (in suggested priority order)

### P0 — must fix before calling Home "done"

- **P0.1 — Top bar**: Replace location chip + bell with wordmark `CreatorHub.` + coral accent dot, search icon, bell icon. Move location-picker trigger into a pill inside the segmented row OR a secondary header line.
  - Files: `home_feed_screen.dart` `_FeedTopBarDelegate`, new `_WordmarkHeader` widget
  - Acceptance: search icon pushes to `/search`, bell shows notification stub

- **P0.2 — Segmented tabs**: Replace chip row with Segmented primitive ("For you / Following / Near you"). Wireframe shows full-width segmented control, not small chips.
  - Files: `home_feed_screen.dart` `_VerticalChipRow`, needs new `SegmentedControl` shared widget OR copy pattern from wireframe
  - Acceptance: matches 3 tabs; active tab is ink pill; inactive is transparent

- **P0.3 — Vertical feed, not horizontal rails**: The wireframe shows stacked full-width cards. Rails belong on Discover (B2), not Home (B1). Either:
  - Option A: Convert Home to vertical feed (per wireframe), move rails to new Discover tab
  - Option B: Make rails + vertical feed hybrid — rail at top for quick scan, vertical feed below
  - **Recommendation**: Option A — matches wireframe, simpler, better for engagement

- **P0.4 — Hero "Featured chapter"**: Add the big photo card with coral eyebrow, Chapter X of Y, display title, outline Read button. Driven by a new `editor_picks` table or a flag on existing content.
  - Files: new `_HeroChapter` widget, new API `GET /api/v1/feed/hero`
  - Acceptance: 1 card at top of feed, tappable to content detail

### P1 — polish

- **P1.1 — Card photo chrome**: Type pill on white 95% bg (not dark), add bookmark circle top-right, support "Editor's pick" coral tag
- **P1.2 — Card body meta**: Add engagement counters (heart + comment + clock), de-emphasize price (only for paid items)
- **P1.3 — Card title font**: Bump from bodySmall 14 to Fraunces display 19 to match wireframe hierarchy

### P2 — nice to have

- **P2.1 — Quest strip**: Add optional V1 preview quest card (behind feature flag per SRS GAM-FR)
- **P2.2 — Honesty footer**: Keep for now (it's a trust requirement per DISC-FR-001), but consider moving to Settings in a later epic

---

## What Went Right (worth keeping)

- Pull-to-refresh pattern on CustomScrollView ✓
- Section-based architecture (each section independently fetches + hides on empty) ✓
- RefreshIndicator with coral tint matches design system ✓
- Skeleton loading for each section (not spinner) ✓
- SafeArea on root ✓
- Fraunces for H2 section titles ✓
- Coral map-pin (approved coral context #3) ✓

---

## Root Cause Analysis

**Why did this drift happen?**

Looking at git log for E1.5: the epic was built from SRS DISC-FR-001..034 without a
wireframe parity check. SRS describes *requirements* ("near-you section with fallback
waterfall"); the wireframe describes *layout* ("vertical stack of full-width cards with
hero at top"). The engineer interpreted "section-based" as "horizontal rails" — which is
how Discover (B2) works, not Home (B1).

**How to prevent next time:**

Screenshot parity check added to `.claude/instructions/precommit.md` step 6. Every UI
epic must now capture a screenshot per screen and compare against the wireframe pack
before the epic can be declared DONE. If an engineer builds from SRS alone, the
screenshot gate will catch the drift at PR review, not 6 weeks later at launch prep.

---

## Recommended Epic: E1.5b — Home Feed Wireframe Parity

Scope: P0.1 through P0.4 from above. Estimated 1.5 days.

- Day 1: Top bar wordmark + segmented tabs + convert to vertical feed
- Day 0.5: Hero chapter widget + API endpoint
- Afterwards: Screenshot parity table in tracking.md

---

## E1.5b Resolution (2026-04-22)

E1.5b shipped as planned. P0.1–P0.4 resolved, P1.1 partially resolved, hybrid feed
replaced pure vertical per founder call (rails retained for per-vertical scan).

| Diff # | Fix | Commit artefact |
|--------|-----|-----------------|
| 1 | Location chip + bell kept (wordmark dropped by design) | [home_feed_screen.dart](../../../apps/mobile/lib/features/feed/screens/home_feed_screen.dart) |
| 2 | `SegmentedTabs` widget, 3-up | [segmented_tabs.dart](../../../apps/mobile/lib/features/feed/widgets/segmented_tabs.dart) |
| 3 | `HeroCard` 220h + tab-aware provider | [hero_card.dart](../../../apps/mobile/lib/features/feed/widgets/hero_card.dart), [hero_provider.dart](../../../apps/mobile/lib/features/feed/providers/hero_provider.dart) |
| 5, 7 | `ContentCard` rail + vertical variants | [content_card.dart](../../../apps/mobile/lib/features/feed/widgets/content_card.dart) |
| 6 | White type pill (P1.1) — bookmark + editor's pick deferred | same |
| 8 | Honesty footer removed | home_feed_screen.dart |

Backend: `/feed/for-you`, `/feed/following`, `/feed/hero?tab=…` (Option-C merge, 2× follow
weight + 1× vertical weight). See [E1.5b tracking](../E1.5b-home-feed-v2/tracking.md).

Remaining P1 items (bookmark, editor's-pick coral tag, Fraunces 19 title bump) and the
Weekly Quest strip are out of scope for E1.5b and tracked as hardening tasks in the
E1.5b tracking file.
