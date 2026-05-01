# ADR-0002 — Home feed is single-column (v3 wireframe), not three-column (SRS)

**Status:** Accepted, 2026-05-01
**Authors:** Founder, Claude (E5.1)
**Supersedes:** WEB-FEED-FR-023 (the three-column spec)
**Adds:** WEB-FEED-FR-023-R (single-column delta)

---

## Context

SRS v1.5 §4.16.2 specifies the home feed as a three-column layout on screens ≥ 1080px:

> **WEB-FEED-FR-023 · [M1] · Web home shell**
> Three-column grid on ≥1080 px: sidebar nav (240 px) + feed (centered, 720–960 px) + right rail (280 px) with quests/streak dock. Sticky scope+filter chip rail at top of feed column.

The v3 wireframe (`docs/01_wireframes/v3/project/pack-w3-home-web.jsx`) is explicitly **single-column** and labels itself "single-column, no side nav, magazine + interactive". The quest dock that the SRS placed in the right rail is rendered as an inline horizontal band (`QuestStripInline`) between the chapter hero and the mood selector.

The two specs disagree. E5.1 needs a single answer.

## Decision

**Honor v3.** Home feed renders as a single column, max-width 1240px, no left sidebar, no right rail. The quest visibility moves from a persistent right-rail dock to:
1. The header streak chip (always visible when authed)
2. The inline `QuestStripInline` band (visible when scrolling past the hero)

This is filed as **WEB-FEED-FR-023-R** in `docs/00_SRS/v1.5/srs-v1.5-r-deltas.md`.

## Why

1. **v3 is the canonical visual spec.** The v3 wireframes were the design pass that locked the Pure White + Coral system, the typography, and the editorial voice. Where v3 contradicts older SRS clauses, v3 wins — that's what makes it "v3" and not just another iteration.
2. **The right rail's job moves elsewhere.** The SRS-spec'd right-rail dock was the persistent home for quests + streak + trending tags. v3 splits those across the inline `QuestStripInline` (quests + streak), header chrome (streak chip in WebHeader), and the existing trending-tags chip that lives at the bottom of editorial sections. Same information surface area, different composition.
3. **One layout per breakpoint is simpler.** v3's single column reads identically on tablet, desktop, and ultrawide. The three-column SRS layout would have collapsed to single-column on mobile anyway, which means the multi-column variant is desktop-only chrome — extra code paths for one breakpoint band.
4. **Magazine-first matches the editorial brand.** "Stories worth saving, plans worth booking" reads better in a single-column rhythm than in a sidebar-bracketed feed column.

## What we keep, what we lose

| Surface | SRS three-col | v3 single-col | Where it lives now |
|---|---|---|---|
| Quest progress | Right-rail card | `QuestStripInline` band | Below hero, above moods |
| Streak chip | Right-rail card | Header + quest strip | `WebHeader` + `QuestStripInline` |
| Trending tags | Right-rail card | Below section rails | Existing `<RightRail>` component is now unused on `/`; will be re-used on `/u/<username>` and `/discover` per their epic decisions |
| Sidebar nav | Left 240px column | None | Header chrome |
| Feed column | Centered 720–960px | Full 1240px max | `<PageShell>` with single-column body |

## Trade-offs accepted

- **Quest dock loses persistence.** Once the user scrolls past the magazine band, they don't see the quest progress until they scroll back up or reach the bottom. v3's design call is that the inline strip + header chip are enough; if engagement metrics later disagree, we can reintroduce a sticky mini-dock without reverting the full layout.
- **`<RightRail>` component is orphaned on `/`.** Kept in tree for use on creator mini-sites and the discover page (E5.2 / E5.7 will decide). Listed here so a future "delete dead code" sweep doesn't kill it prematurely.
- **Mobile changes.** SRS three-col already collapsed to single-col on mobile, so mobile users won't notice. Tablet and desktop users see the new magazine layout — that's the deliberate change.

## Reversal

If single-column doesn't perform (LCP regressions, engagement drop), revert by:
1. Re-mounting `<RightRail>` in `apps/web/src/app/page.tsx` inside a `<TwoColLayout>` from E5.0
2. Removing `<QuestStripInline>` from the magazine band
3. Reverting WEB-FEED-FR-023-R in the SRS deltas file

The components shipped in E5.1 (`<ChapterHero>`, `<MoodSelector>`, `<MapStrip>`, `<CreatorSpotlight>`, `<ContinueReadingRail>`, `<PostsFeedColumn>`) are layout-agnostic and stay regardless.

## Related

- E5.1 plan: `docs/epics/E5.1-home-v3/plan.md` §5 Decision 1
- v3 wireframe: `docs/01_wireframes/v3/project/pack-w3-home-web.jsx`
- E5.0 layout primitives: `apps/web/src/components/ui/page-shell.tsx`, `two-col-layout.tsx`
