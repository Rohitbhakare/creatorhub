# E5.1 home — captured screenshots

Captured 2026-05-01 via `pnpm tsx apps/web/scripts/capture-screens.ts`
against the running dev server (`localhost:3004`).

15 PNGs total — 3 routes × 5 breakpoints:

| Route | mobile-390 | tablet-768 | desktop-1080 | wide-1440 | ultrawide-1920 |
|---|---|---|---|---|---|
| `/` (magazine) | ✓ | ✓ | ✓ | ✓ | ✓ |
| `/?type=post` (posts-only) | ✓ | ✓ | ✓ | ✓ | ✓ |
| `/?mood=slow` (mood filter) | ✓ | ✓ | ✓ | ✓ | ✓ |

To re-capture (e.g. after style changes):

```bash
# 1. dev server running on localhost:3004
pnpm --filter web dev
# 2. in another tab
pnpm --filter web exec tsx scripts/capture-screens.ts
```

Override the base URL with `SCREENS_BASE_URL=https://staging.creatorhub.in`
to capture against a deployed environment instead.

## Findings flagged for follow-up

Looking at the captures, the magazine route renders with **substantial empty space** between the mood selector and the footer — the bento mosaic, map strip, creator spotlight, continue-reading rail, and 11 SRS section rails are all silently absent. The hero + moods + footer-CTA work; the editorial sections do not.

Probable causes (need triage):
1. **Dead Unsplash images** in the dummy DB seed (E5.0/BUG-002 — shipped a seed-file fix in `ccbb748`, but the DB rows still carry the dead URLs because no operator re-seed has run yet). Items WITH `coverImageUrl !== null` are preferred for bento; if the cover URLs are all 404'ing on the next/image fetch, the photos break but the cards should still render — so this alone shouldn't empty the bento.
2. **`getHomeFeedSections()` may be returning `[]`** for the dev DB (which would empty `allItems`, which empties `bentoCandidates`, which empties everything downstream). Needs `EXPLAIN`-level inspection.
3. **Filter logic over-exclusion**: the `remainingSections` step removes `chapterStory.content.id` + bento ids + spotlight id from each section's items. If a section returns ≤2 items and all overlap with what's already used elsewhere, it's empty and gets dropped.

Recommended next step: run the API directly and verify `/api/v1/feed/sections` returns 11 sections with items, then trace why the page composition doesn't surface them. This is **not an E5.1 component bug** — every component renders correctly when given items (proven by the 206 unit tests). It's a data/composition-layer issue that lives in `page.tsx` or upstream.

## What the captures DO show working

- v3 chrome (header logo, search icon, theme indicator, signed-in vs guest)
- FeedChipRail (Near you / Following + type filters)
- ChapterHero (1.3fr/1fr split, story-of-the-day pill, chapter dots)
- MoodSelector (5 chips with hand-rolled SVG icons — leaf / bolt / bowl / sun / brush per locked decision 2)
- Posts-mode column on `/?type=post`
- Single-column layout at every breakpoint (no right-rail), matching ADR-0002 + WEB-FEED-FR-023-R
- Guest CTA card at bottom
- GuestLocationPrompt for guests

Per-breakpoint visual inspection should focus on the chapter hero (does the photo/text 1.3fr split collapse correctly at <768px?) and the mood selector grid (5-col → 3-col → 2-col responsive).
