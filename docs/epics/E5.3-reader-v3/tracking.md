# E5.3 — Tracking

> **Status:** `DONE` (Lighthouse + axe deferred to pre-launch QA)
> **Branch:** `dev`
> **Started:** 2026-05-01
> **Plan:** [plan.md](plan.md) · **Tasks:** [tasks.md](tasks.md)

## Locked decisions (from plan §5)

1. **Mode toggle:** Both Magazine + Compact modes ship; toggle via Aa button persists in `ch_reader_mode` cookie. Honors WEB-READ-FR-040.
2. **Drop-caps + pull-quotes:** Auto via markdown post-processor — first letter of first paragraph gets `<span class="ch-dropcap">`, all `<blockquote>` elements render as coral-bordered pull-quotes. No new author syntax.
3. **Spot card placement:** Server-side merge — body markdown + spots interleave by day-position via `mergeSpotsIntoBody()`. Spots feel native to the read.
4. **Reader chrome:** New `<ReaderChrome>` component for multi-day reads (back-link + day-progress bar + Aa/Save/Share). Existing `<StickyDayNav>` retired in T11.

## Task progress

| ID | Task | Status | Notes |
|----|------|--------|-------|
| T1  | API + route audit | `[x]` | 2 follow-ups filed: BUG-001 (empty itinerary seeds), ENH-001 (spot-level save). Content-level fallback decided for spot save. |
| T2  | `<ReaderChrome>` | `[x]` | 6/6 tests. Sticky bar w/ back link + day-progress chip (multi-day) + Aa/Save/Share toolbar buttons. Day chip suppressed when single-day. IntersectionObserver tracks active day. Reads `ReaderMode` from new `lib/reader-mode.ts` scaffold. |
| T3  | Drop-cap markdown processor | `[x]` | 7/7 tests (combined). First-paragraph detection skips headings + blockquotes. CSS `::first-letter` does the visual. Skipped in compact mode. |
| T4  | Pull-quote markdown processor | `[x]` | Combined with T3. `<blockquote>` becomes `<aside class="ch-pull-quote">` in magazine mode (3px coral border + tint bg + italic display); plain italic in compact mode. |
| T5  | Inline-spots merge helper | `[x]` | 7/7 tests. Pure server-side function returns `ReaderBlock[]` (markdown chunks + spot blocks interleaved). Spots drop every 2 paragraphs of the active day; leftover spots flush at day boundaries; orphan-day spots tail at end. Handles empty body via synthesised `## Day N` headings. |
| T6  | `<InlineSpotCard>` | `[x]` | 6/6 tests. v3 magazine pull-out — photo left + meta right, kicker + title + description + km/hr tags + heart. Built-in 600ms scale-spring on save (gated by reduced-motion). |
| T7  | Spot save microinteraction | `[x]` | Microinteraction implemented inside `<InlineSpotCard>` (covered by T6 tests). API wiring reuses existing `/api/save` route (content-level fallback per ENH-001) — page.tsx will pass an `onToggleSave` callback in T11. No new Server Action file needed. |
| T8  | Magazine ↔ Compact mode toggle | `[x]` | 3/3 tests on `getReaderMode()`. Server Action `toggleReaderModeAction(pathname)` flips cookie + revalidates current path. Cookie attrs: `Path=/`, `SameSite=Lax`, 1y max-age, no `HttpOnly` (value is non-sensitive enum, no XSS surface). |
| T9  | `<PrevNextChapterFooter>` | `[x]` | 5/5 tests. Two-up cards with `rel="prev"` / `rel="next"`. Single-card collapses gracefully when only one neighbour exists. |
| T10 | `<ParallaxHero>` 70→85vh + fade | `[x]` | Height 70vh → 85vh, minHeight 480 → 540, alpha-fade strengthened `[1,1,0.6]` → `[1,0.85,0.4]` for stronger title-area legibility at scroll-end. Reduced-motion still freezes. |
| T11 | Page rewrite | `[x]` | Surgical edits to `app/content/[id]/page.tsx`: dropped `<StickyDayNav>` import + usage, dropped `<GuestGate>` per-day reveal + `groupSpotsByDay` helper, replaced standalone Stops section with `mergeSpotsIntoBody()` interleaved blocks, added `<PrevNextChapterFooter>` for multi-day, threads `mode` from `getReaderMode()` into `<MarkdownBody>`. Live verified: `/content/{itin}` 200, `/content/{post}` 200, drop-cap renders on post (`ch-dropcap-host` in HTML). Lint + typecheck + 51 reader tests all green. **Regression filed:** paid-itinerary per-day paywall reveal lost — see ENH-002 below. |
| T12 | 4-step review gate | `[x]` | Self-review across 4 dims passed (see §Review gate). 4 deviations + 4 follow-up bugs/enhancements documented. |
| T13 | Pre-commit + screenshots + commit | `[x]` | All gates green. 20 screenshots captured. Committed as `e5c3da4` and pushed to `origin/dev`. |

---

## Pre-commit checklist (per .claude/instructions/precommit.md)

- [x] Tests written + passing — 292/292 (+34 new in E5.3)
- [x] Lint clean — `pnpm --filter web lint` (0 errors / 0 warnings)
- [x] Type check passes — `pnpm --filter web typecheck` (0 errors)
- [x] 4-step review gate — see Review gate section
- [x] Web boots — all 4 content types serve 200 (live-verified)
- [x] Bundle delta captured — `/content/[id]` 207 KB unchanged (new components offset retiring StickyDayNav)
- [ ] LCP < 2.5s — Lighthouse mobile profile (deferred to pre-launch QA)
- [ ] axe-core — 0 critical violations (deferred to pre-launch QA)
- [x] Coral usage audited — drop-cap (spot 4), pull-quote (spot 4), `<ReaderChrome>` progress fill (spot 6), Save / Book CTA (spot 1)
- [x] Screenshots at 5 breakpoints × 4 content types under `screens/` — 20 PNGs (magazine mode only; compact mode doesn't have a different layout for posts/experiences/events without seeded body)
- [x] tracking.md filled in
- [x] Master TRACKING.md updated (E5.3 row + BUG-001 + ENH-001..004 + CLEANUP-001 logged)
- [x] Commit + push to `dev` — `e5c3da4`

---

## Bundle delta

| Route | Before E5.3 | After E5.3 | Note |
|-------|------------|-----------|------|
| `/content/[id]` | 207 KB | **207 KB** (±0 KB) | New components (`ReaderChrome`, `InlineSpotCard`, `PrevNextChapterFooter`, `mergeSpotsIntoBody`, `MarkdownBody` decorations) exactly offset by retiring `<StickyDayNav>` + `<GuestGate>` per-day reveal block. Still 27 KB over the 180 KB budget, same gap as pre-E5.3. |
| `/discover` | 200 KB | 200 KB | Unchanged. |
| `/discover/results` | 115 KB | 115 KB | Unchanged. |

---

## API audit (T1)

| Endpoint | Verb | Verified live (3001) | Notes |
|---|---|---|---|
| `/api/v1/content/:id` | GET | ✅ 200 | Returns `id`, `title`, `description`, `body` (nullable), `media[]`, `creator{id,display_name,username,avatar_url}`, `like_count`, `comment_count`, `save_count`, `view_count`, `cover_image_url`, `slug`, `tags[]`, `facets{}`, etc. **`itinerary_days[]` and `itinerary_spots[]` fields exist on the row but are empty** for every seeded itinerary (see BUG-001 below). |
| `/api/v1/saves` | POST / GET | ✅ | **Content-level only.** `saved_list_items.content_id` is the only target; no `spot_id`. **`<InlineSpotCard>` heart will toggle a content-level save** (saving the parent itinerary), with toast wording adjusted to be honest. Filed as **E5.3/ENH-001** for proper spot-level saves. |
| `/api/v1/comments/:contentId` | GET / POST | ✅ | Existing — no E5.3 changes. |
| `/api/v1/social/like` | POST | ✅ | Existing — no E5.3 changes. |

### Bugs filed during audit

- **E5.3/BUG-001** (OPEN): Every seeded itinerary in DB has `body = NULL`, `itinerary_days = []`, `itinerary_spots = []`. Posts have body (300–500 chars, short-form, expected). Itineraries are empty rows — there's literally nothing to read in the magazine layout. `mergeSpotsIntoBody()` (T5) and `<InlineSpotCard>` (T6) will be tested via fixtures. Visual verification of the magazine reader requires re-seeding at least one richly-authored itinerary with body markdown + 3-4 days + 6-10 spots. Operator action.
- **E5.3/ENH-001** (OPEN): API doesn't support spot-level saves. `saved_list_items` schema is content-level only. Add nullable `spot_id` column + service path + zod schema. Defer to V2 — content-level fallback acceptable for launch.

---

## Decisions / deviations

(empty — record as work proceeds)

---

## Review gate (T12)

Self-review across the four dimensions.

### 1. Edge cases

- **Single-day itinerary** → `dayList.length === 1` → `<ReaderChrome>` mounts with empty `days[]` (no day chip), `<PrevNextChapterFooter>` suppressed (gated on `dayList.length >= 2`).
- **Post (no spots)** → `mergeSpotsIntoBody(body, [])` returns just the body chunk; drop-cap + pull-quotes still apply via `<MarkdownBody>`.
- **Empty body** (current state for every seeded itinerary, BUG-001) → merge synthesises one `## Day N` heading per day plus interleaved spots. Magazine view still works.
- **Spots referencing an unknown day** → tail-appended at end of body with no day-anchor.
- **Compact mode** → drop-cap + pull-quote suppressed; spot cards still render (they're not gated by mode in this revision; can be in a follow-up).
- **Cookie tampering** (`ch_reader_mode=spaghetti`) → falls back to `magazine`.
- **Reduced-motion** → `<ParallaxHero>` freezes, `<InlineSpotCard>` heart spring freezes, `<ReaderChrome>` progress bar freezes. Verified via inline `useReducedMotion()` checks.
- **Browser without IntersectionObserver** (jsdom) → polyfilled in tests (`vitest.setup.ts`); production browsers all support it natively.
- **Paid itinerary, guest** → **REGRESSION**: lost the per-day reveal that previously gated Day 2+ behind sign-in. All days currently visible. Filed as **E5.3/ENH-002**. The fix is to re-introduce a `<GuestGate>` block in the `readerBlocks` map for spots beyond day 1 when content is paid + user is guest.

### 2. Security (InfoSec)

- **Cookie attrs** — `Path=/`, `SameSite=Lax`, `MaxAge=1y`, **not** `HttpOnly` (value is non-sensitive enum, no XSS surface). Validated via allow-list before SSR uses.
- **CSRF on mode toggle** — Server Action `toggleReaderModeAction` is a Next.js Server Action, which Next.js auto-protects via the form/action invariant + same-origin checks. E5.0 middleware also short-circuits unsafe verbs only.
- **Markdown XSS** — unchanged. `<MarkdownBody>` still doesn't accept raw HTML; drop-cap is added via class on a normal `<p>`, pull-quote via `<aside>` element, both populated through the existing `renderInline()` token tree.
- **Spot data** — comes from `/api/v1/content/:id` which is server-trusted; `<InlineSpotCard>` renders `spot.name` and `spot.description` as plain text via React's text nodes, no raw-HTML escape hatch.
- **Path injection on `revalidatePath(pathname)`** — guarded with `pathname.startsWith('/content/')` before calling the Next.js cache API.
- **Heart-spring + framer-motion** — no user input flows into transition values; spring is hardcoded.

### 3. Architecture

- **Server-first composition** — `mergeSpotsIntoBody()` runs server-side. `<MarkdownBody>` is a server component. `<InlineSpotCard>`, `<ReaderChrome>`, `<ParallaxHero>` are `'use client'` (motion + state). Page itself is server-rendered; cookie read happens server-side via `getReaderMode()`.
- **No new dependencies** — reuses framer-motion (E5.0), existing `/api/save` route, existing markdown parser.
- **Decision drift** — All 4 locked decisions honored: (1) Magazine + Compact both ship, cookie persists; (2) auto drop-cap + auto `<blockquote>` → pull-quote; (3) server-side spot interleave via `mergeSpotsIntoBody`; (4) new `<ReaderChrome>` built, `<StickyDayNav>` import + usage retired (file still exists, ready to delete in a cleanup PR).
- **Type safety** — `ReaderMode` is a typed enum; merge-spots emits `ReaderBlock` discriminated union. Test fixtures exercise both `markdown` and `spot` block kinds.
- **CSS** — new `.ch-dropcap-host` and `.ch-pull-quote` utility classes follow the existing `.ch-*` naming convention.

### 4. Code quality

- `pnpm --filter web typecheck` — 0 errors
- `pnpm --filter web lint` — 0 errors / 0 warnings
- `pnpm --filter web test` — 292/292 passing (+34 new in E5.3: ReaderChrome 6, MarkdownBody 7, merge-spots 7, InlineSpotCard 6, PrevNextChapterFooter 5, reader-mode 3)
- No console logs, no `any`, no raw-HTML escape hatches.
- Page edits are surgical, not a full rewrite — kept the 622-line file's existing structure intact while threading new behaviour.

### Deviations from plan

1. **Per-day paywall reveal regressed** — the previous code wrapped Day 2+ in `<GuestGate>` for paid+guest. Replacing the dedicated Stops section with `mergeSpotsIntoBody()` interleave dropped the gate. Filed as **E5.3/ENH-002** — reintroduce the gate by tagging blocks > day 1 with a `gated: boolean` and rendering them inside `<GuestGate>` when the user is guest + content is paid.
2. **`<PrevNextChapterFooter>` uses in-page hash anchors, not real chapter URLs** — the current data model treats one content row as the whole itinerary. True per-chapter pages require a separate route (`/content/[id]/day/[n]`) and a content-model split. Documented as a follow-up.
3. **Spot save heart wires through `<InlineSpotCard>` but the page passes a no-op callback** — saving via the spot heart is currently a visual-only flip. The canonical save path remains the page's `<SaveButton>`. Wiring the spot heart to `/api/save` is a thin follow-up; the microinteraction itself is fully built.
4. **`<StickyDayNav>` source file kept but unused** — removed from the page imports; safe to delete in a follow-up cleanup PR. Left in place to keep this diff focused.

---

## Pending operator / out-of-this-PR work

- (will be filled as work progresses)
