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

## Capture script behaviour

The script pre-disables animations + injects `[style*="opacity: 0"] { opacity: 1 !important; }` + programmatically scrolls the page top-to-bottom before each snapshot. That belt-and-braces combo is needed because every below-the-fold magazine band is wrapped in `<ScrollReveal>` which uses framer-motion's `whileInView` — without the override, Playwright's `fullPage: true` snapshot misses every section that hadn't been scrolled into view (because IntersectionObserver never fires on a non-scrolling page). See **E5.1/BUG-001** in `docs/epics/TRACKING.md` for the architectural fix.

## What the captures show

The full v3 magazine renders end-to-end:

- v3 chrome (header logo, search icon, theme indicator, signed-in vs guest)
- FeedChipRail (Near you / Following + 6 type filters)
- ChapterHero (1.3fr/1fr photo + narrative split)
- MoodSelector (5 chips with hand-rolled SVG icons — leaf / bolt / bowl / sun / brush per locked decision 2; emoji rule honored)
- BentoMosaic — 1 large feature + 1 tall + 2 small + bottom row of 4 (8 tiles total)
- MapStrip — stylised gradient placeholder with city pins (per locked decision 3; real Mapbox lands E5.3)
- CreatorSpotlight — parallax tilt card with cover photo
- 6+ editorial section rails: Hot near you · Picked for you · Stories worth your morning coffee · This weekend · Trending posts · Upcoming events
- Posts-mode column on `/?type=post`
- Single-column layout at every breakpoint (no right-rail), matching ADR-0002 + WEB-FEED-FR-023-R
- Guest CTA card at bottom + GuestLocationPrompt

Per-breakpoint visual inspection should focus on:
- Chapter hero 1.3fr/1fr split collapse at <768px (should stack with photo on top)
- Mood selector 5-col → 3-col → 2-col responsive
- Bento bottom row 4-col → 2-col → 1-col responsive
- Right-rail dock genuinely absent (single-column win)
