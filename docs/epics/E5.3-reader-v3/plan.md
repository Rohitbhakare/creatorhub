# E5.3 — Reader / Detail v3 (W-C1 / W-C2 / W-C3)

> **Series:** Fourth epic in the M2.5 Web v3 Parity series. Depends on E5.0 (Foundation).
> **Goal:** Bring `/content/[id]` to v3 — Magazine vs Compact mode, refined parallax hero, drop-caps + pull-quotes, inline spot cards with save microinteraction, sticky reader chrome with day-progress, prev/next chapter cards. **Closes the original "story-page photo dominates the screen" complaint** that started this whole series.
> **SRS refs:** WEB-READ-FR-040..048, WEB-STORY-FR-095..098
> **Wireframes:** see §3
> **Master plan:** [`/Users/rohit/.claude/plans/web-application-is-not-enumerated-matsumoto.md`](/Users/rohit/.claude/plans/web-application-is-not-enumerated-matsumoto.md)

---

## 1. Overview

`/content/[id]` already has the bones — `<ParallaxHero>`, `<MarkdownBody>`, `<StickyDayNav>`, `<AnimatedMap>`, `<ReadingProgress>`, `<SaveButton>`, `<BookCta>`, `<GuestGate>`, `<CommentsSection>`, `<EndOfArticleRail>` — and the page already branches on `isStory` to give posts a blog-style header instead of the parallax hero (a fix landed earlier today). The page is **622 lines** and mostly works.

What's missing vs v3:

1. **Magazine vs Compact mode toggle** (FR-040) — user-controlled view mode that switches the body from full-typographic magazine layout (drop-caps + pull-quotes + inline spots + 720px column) to a compact list view (terser, denser, no decorations). Cookie-persisted per user.
2. **Drop-caps + pull-quotes** (WEB-STORY-FR-097) — `<MarkdownBody>` doesn't render these today. Needs a markdown post-processor that:
   - drops a 76px coral capital on the first letter of each story body
   - styles `> ` blockquotes as italic-display pull-quotes with coral left-border + tint background
3. **Inline spot cards** (FR-046–047) — itineraries currently render spots as a dedicated list section; v3 wants them **interleaved with body** at their natural day-position with the magazine "pull-out card" treatment (photo on left, meta + tags on right). Plus a 600ms save microinteraction (heart-spring).
4. **Sticky reader chrome** (W-C2 wireframe lines 233–253) — for multi-day reads, a thin top bar with "← All chapters" back, a centered day-progress indicator (e.g. "Day 1 of 4 · The Konkan Coast" + progress bar), and Aa / Save / Share buttons. Replaces the current `<StickyDayNav>`.
5. **Prev/Next chapter footer** (W-C2 lines 320–338) — at the bottom of each chapter, render two-up cards (Prev chapter ← / Next chapter →) so multi-day itineraries read as a book.
6. **Hero polish** — bump `<ParallaxHero>` from 70vh → 85vh per FR-041, strengthen the alpha-fade gradient at scroll-end for title legibility.
7. **Story page polish** — verify the today-fixed `isStory` blog header looks right (760px width, photo as figure not parallax). If still off, refine here.

## 2. SRS Requirements

| ID | Requirement | Notes |
|----|-------------|------|
| WEB-READ-FR-040 | Magazine ↔ Compact mode toggle | New — Aa button in chrome |
| WEB-READ-FR-041 | 80–90vh parallax hero w/ alpha-fade | Bump 70vh → 85vh + stronger fade |
| WEB-READ-FR-042 | Sticky day-nav | Replace existing with reader-chrome variant |
| WEB-READ-FR-043 | Reading-progress bar (top of viewport) | Already shipped (`<ReadingProgress>`) |
| WEB-READ-FR-044 | Schema.org JSON-LD | Already shipped |
| WEB-READ-FR-045 | Animated map (per-day polyline) | Already shipped (`<AnimatedMap>`) |
| WEB-READ-FR-046 | Inline spot cards in body | **New** — interleave with markdown |
| WEB-READ-FR-047 | Spot save microinteraction | **New** — 600ms heart-spring |
| WEB-READ-FR-048 | Share-as-image OG route | **Deferred to M2** (per master plan) |
| WEB-STORY-FR-095 | Story reader 720px column | Currently 760px — narrow to 720 |
| WEB-STORY-FR-096 | Drop-cap on first paragraph | **New** |
| WEB-STORY-FR-097 | Pull-quote (`>`) styled with coral border | **New** |
| WEB-STORY-FR-098 | Prev/Next chapter footer cards | **New** |

## 3. Wireframes Referenced

| File | Use |
|---|---|
| [docs/01_wireframes/v3/project/pack-w-detail.jsx](docs/01_wireframes/v3/project/pack-w-detail.jsx) | W-C1 (lines 4–224, itinerary detail), W-C2 (226–344, story reader), W-C3 (346–512, experience detail), W-C4 (514–605, save sheet) |
| Standalone HTML — section "W · Web — detail screens" | Visual cross-check at 5 breakpoints |
| [docs/01_wireframes/v3/project/uploads/reader-magazine.html](docs/01_wireframes/v3/project/uploads/reader-magazine.html) | v2 magazine reference (still visually accurate) |

## 4. Dependencies

| Dependency | Status | What we use |
|---|---|---|
| E5.0 Web Foundation | DONE | `<Btn>`, `<Pill>`, motion library, `<ToastRegion>`, CSRF middleware |
| E5.1 Home | DONE | (no direct reuse — reader doesn't share home components) |
| Existing `/content/[id]` surface | — | `<ParallaxHero>`, `<MarkdownBody>`, `<StickyDayNav>`, `<AnimatedMap>`, `<ReadingProgress>`, `<SaveButton>`, `<BookCta>`, `<GuestGate>`, `<CommentsSection>`, `<EndOfArticleRail>`, `<CommentComposeStub>`, `<GuestPromptBar>` — refine, do not rebuild |
| Existing API surface | — | `/api/v1/content/:id`, `/api/v1/social/like`, `/api/v1/saves`, `/api/v1/comments/:contentId` — all already in place |

## 5. Architecture Decisions — OPEN QUESTIONS

### Decision 1 — Magazine ↔ Compact mode: scope + persistence

**v3 wireframe** shows an "Aa" button in the sticky reader chrome (W-C2 line 250). Tap-to-cycle through view modes. SRS FR-040 calls for **Magazine** + **Compact** modes.

**Three options:**

| Option | What ships | Trade-off |
|---|---|---|
| **A. Both modes + cookie persistence (recommended)** | Magazine = full typography (drop-caps, pull-quotes, inline spots, serif body, generous spacing). Compact = sans body, tighter line-height, no decorations, plain spot list. Toggle via Aa button → writes `ch_reader_mode=magazine\|compact` cookie → next load picks it up. | Honors FR-040. Two layouts to maintain. |
| **B. Magazine only — defer Compact to V2** | Just ship Magazine mode polished. The Aa button is a no-op (or hidden). | Cheapest. SRS FR-040 not satisfied. |
| **C. URL-param toggle, no cookie** | `?mode=compact` works but doesn't stick. | Honest about persistence; users still have to opt in each time. Acceptable middle. |

**Recommended: A** — the toggle is core to the v3 reading experience and cookie-persistence matches what readers expect (Pocket, Medium, Reader View all do this).

### Decision 2 — Drop-caps + pull-quotes: implementation approach

**v3 spec:** drop-cap on first paragraph, `> blockquote` styled as pull-quote.

**Two options:**

| Option | Approach | Trade-off |
|---|---|---|
| **A. Markdown post-processor (recommended)** | Extend `<MarkdownBody>` to: (1) auto-add a `<span class="ch-dropcap">` wrapping the first letter of the first `<p>` after the lead photo, (2) replace `<blockquote>` rendering with `<aside class="ch-pull-quote">` with our coral-bordered tint background. CSS does the styling. No new markdown syntax. | Works on existing seeded content immediately. Zero authoring friction. |
| **B. Explicit `:::pullquote` syntax** | Authors mark pull-quotes explicitly with `:::pullquote ... :::` blocks. Requires a markdown plugin and re-authoring of seeded content. | Editorial control. Slower to ship. |
| **C. Both** | Auto drop-cap (A) + optional `:::pullquote` syntax for authors who want non-blockquote pull-quotes. | Belt-and-braces; more code to maintain. |

**Recommended: A** — the `>` blockquote is already standard markdown and authors already use it. Auto drop-cap on first letter is a static rule, no per-doc config.

### Decision 3 — Inline spot cards: where do they appear in itineraries?

**v3 wireframe** shows spot cards interleaved with body markdown (W-C2 lines 301–313 — a "Pull-out card" for Kihim Beach appearing mid-paragraph). Today spots render as a **dedicated section** below the markdown.

**Three options:**

| Option | Layout | Trade-off |
|---|---|---|
| **A. Server-side merge: spots interleaved by day-position (recommended)** | Page server-merges body markdown + spots ordered by `dayNumber` then `orderIndex`. After paragraph N of day D, render spot cards for that day. CMS authoring stays markdown-only; the merge is a render-time concern. | Honors v3. Body and spots feel native. The merge logic is small (~30 LOC). |
| **B. Dedicated "Stops" section after body** | Keep current behaviour — render `<MarkdownBody>` then a "Stops on this trip" section with the spot cards. | What we ship today. Misses v3 magazine feel. |
| **C. Authors inject `:::spot id="x"` shortcodes** | Body markdown can reference spots by id; the renderer injects the card at that position. | Maximum editorial control. Requires markdown extension + author re-tooling. |

**Recommended: A** — the v3 magazine layout is what makes the reader feel like a magazine. Server-side merge is the right place (body parsing happens once on render, no client cost).

### Decision 4 — Sticky reader chrome: build new vs extend existing `<StickyDayNav>`

**v3 wireframe** (W-C2 lines 233–253) shows a thin sticky top bar specific to multi-day reads — not the same as current `<StickyDayNav>` which is a chip-based day-jump bar.

**Two options:**

| Option | What ships | Trade-off |
|---|---|---|
| **A. New `<ReaderChrome>` component, retire `<StickyDayNav>` (recommended)** | Build new component matching v3: "All chapters" back link, centered day-progress (e.g. "Day 1 of 4" + thin coral progress bar tracking scroll within current day), Aa / Save / Share buttons. The chrome is multi-day-only; single-day itineraries / posts / experiences don't get it. `<StickyDayNav>` is removed. | Matches v3 cleanly. Day-jump UX moves into the progress bar. |
| **B. Keep `<StickyDayNav>` + add the v3 chrome above it** | Two stacked bars when reading multi-day. | Visually heavy, not what v3 shows. |
| **C. Restyle `<StickyDayNav>` to look like the v3 chrome** | Keep the day-jump dots but add the back link + Aa/Save/Share. | Mid-effort. Component name no longer fits. |

**Recommended: A** — the v3 chrome is its own pattern. The day-progress bar is the primary navigation; explicit "jump to day" can still happen via the bar's hover state or a quick-nav popup.

### Other decisions (no user input needed)

| Decision | Choice | Rationale |
|---|---|---|
| Hero height | 85vh (up from 70vh) | Per FR-041 80–90vh range; 85 is mid-range and matches v3 mock |
| Hero alpha-fade | Strengthen scroll-end opacity 1→0.4 (was 1→0.6) | Better title legibility at scroll-end |
| Story column width | 720px (from 760) | Per WEB-STORY-FR-095 |
| Drop-cap colour | `var(--primary)` (coral) | v3 spec line 279 — allow-list spot 4 |
| Pull-quote bg | `var(--primary-tint)` | Allow-list spot 4 |
| Comments section | Already shipped — no E5.3 changes | Out of scope |
| Share-as-image OG | Deferred to M2 per master plan | FR-048 |

## 6. Database

No DB changes. All E5.3 polish + new bits resolve via existing API.

## 7. API Contract

No new endpoints. Possibly: a small extension to `/api/v1/saves` to support **spot-level saves** (currently saves are content-level). To verify in T1.

## 8. Test Plan

| Layer | Coverage |
|---|---|
| Unit | New: `<ReaderChrome>` (back-link routing, progress calc, Aa toggle), drop-cap markdown processor, pull-quote markdown processor, inline-spots merge function. ~12 new tests. |
| Integration | Cookie-driven mode toggle: write cookie, reload, verify SSR picks it up. Spot save: optimistic flip + rollback on API failure. |
| SSR | `/content/[id]` renders for: itinerary (multi-day), itinerary (single-day), post, experience, event. 5 type permutations × Magazine / Compact = 10 SSR snapshots. |
| A11y | Tab through reader chrome → body → spot cards → prev/next chapter. Drop-cap has `aria-hidden` (decorative); body text reads cleanly via screen reader. Progress bar has accessible `role="progressbar"` with `aria-valuenow`. |
| Visual | 5-breakpoint screenshots committed for: itinerary detail (multi-day, Magazine), story (post, Magazine), experience detail, save modal, Compact mode. |
| Reduced motion | ParallaxHero already gates; verify. Heart-spring on save freezes. |

## 9. Edge Cases

- Single-day itinerary → no chapter footer, no day-progress bar (just standard reader chrome with Save/Share)
- Story (post) → no spot cards, no day-progress; blog header (today's fix), full markdown body with drop-cap + pull-quotes
- Experience → reader chrome shows session details (date, capacity); BookCta is the prominent action
- Event → like experience, with RSVP CTA instead of Book
- Long markdown (10 000+ words) → lazy-render via `react-markdown` chunks; reading progress paces correctly
- Broken cover image → fallback to coloured gradient via `pickPhoto()` (existing)
- Multi-day with `distance_km` = null → animated map degrades to a static base layer
- Comments stream disconnect → existing `<CommentsSection>` handles
- Browser without Web Share API → `<ShareButton>` falls back to copy-link (existing)
- User scrolls past end of chapter → prev/next cards become focus targets; keyboard nav (← →) works

## 10. InfoSec Review

| Concern | Mitigation |
|---|---|
| Markdown XSS | Existing `<MarkdownBody>` already sanitises via `react-markdown` (no `rehype-raw`); drop-cap span is added post-render via wrapper component, not via raw HTML injection |
| Comment XSS | Existing `<CommentsSection>` already DOMPurify's the body |
| Spot save authentication | Existing CSRF middleware (E5.0); spot-save is content-level today, so no new vector |
| Reading progress persistence | Currently client-only via cookie; if we add server-side persistence later, gate on DPDPA consent |
| Share-link signing | OG image route is M2; signed-link enforcement deferred |
| Cookie attrs (mode toggle) | `Path=/`, `SameSite=Lax`, **NOT** `HttpOnly` (client toggles it) — value is non-sensitive enum |

## 11. Governance

- **DPDPA:** reading progress not persisted server-side in E5.3 (just session-level via `<ReadingProgress>`). If V2 adds analytics like "read 64% of the chapter", that's an opt-out toggle.
- **Coral usage on `/content/[id]`:** primary CTAs (Read this, Save, Book), drop-cap, pull-quote left-border, day-progress bar, active sort/Aa state. All allow-list spots 1, 4, 5, 6.
- **Doc sync:** WEB-DESIGN-SYSTEM.md gets `<ReaderChrome>`, drop-cap + pull-quote utility classes, inline-spot card style. ADR-0003 if Decision 4 picks A and we retire `<StickyDayNav>`.

## 12. Tasks (preliminary — refined after decisions land)

| ID | Task |
|----|------|
| T1 | Audit existing `/content/[id]` route — confirm current 4-type render, identify deprecated bits, check if `/saves` API supports spot-level saves |
| T2 | `<ReaderChrome>` — sticky top bar with back-link, day-progress (multi-day), Aa toggle, Save/Share |
| T3 | Drop-cap markdown processor — auto-wrap first letter of first paragraph |
| T4 | Pull-quote markdown processor — render `<blockquote>` with coral border + tint |
| T5 | Inline-spots merge — server-side combine body + spots-by-day for itineraries |
| T6 | `<InlineSpotCard>` — magazine pull-out variant (photo + meta + tags + heart) |
| T7 | Spot save microinteraction — 600ms heart-spring + Server Action wiring |
| T8 | Magazine ↔ Compact mode — toggle + cookie + SSR-aware rendering |
| T9 | `<PrevNextChapterFooter>` — two-up cards at end of each chapter |
| T10 | Hero polish — `<ParallaxHero>` 70vh → 85vh + alpha-fade strengthen |
| T11 | Page rewrite — `apps/web/src/app/content/[id]/page.tsx` to compose all of the above; remove `<StickyDayNav>` if Decision 4 picks A |
| T12 | 4-step review gate (edge cases → security → architecture → code quality) |
| T13 | Pre-commit + 5-breakpoint screenshots for all 4 content types × Magazine/Compact + commit |

## 13. Definition of Done

Standard E5.X DoD inherited from the cross-cutting quality contract. Plus: today's "story-page hero photo dominates the screen" complaint is fully resolved (story shows blog header at 720px, NOT the parallax hero — already partially landed today).
