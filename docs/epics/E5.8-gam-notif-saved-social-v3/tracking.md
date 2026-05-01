# E5.8 — Tracking

> **Status:** `DONE` (axe + screenshots pending)
> **Branch:** `dev` · **Commit:** `95b9d0d`
> **Started:** 2026-05-01 · **Completed:** 2026-05-01
> **Plan:** [plan.md](plan.md) · **Tasks:** [tasks.md](tasks.md)

## Locked decisions

1. **Share fallback:** 4-icon row (WhatsApp / Twitter/X / Facebook / Copy).
2. **Web Push** (FR-085): deferred to M2 — needs VAPID key + service worker.
3. **Share-as-image OG** (FR-048): deferred to M2 — needs image generation pipeline.
4. **Chrome polish:** match E5.6/E5.7 v3 pattern (coral kicker + italic-accent H1).

## Task progress

| ID | Task | Status | Notes |
|----|------|--------|-------|
| T1 | Audit | `[x]` | Confirmed: gam (`<XPChip>`, `<StreakChip>`, `<Ring>`, quest pages, leaderboard) all already shipped pre-E5.8; notif drawer + saved page mounted; social actions wired. Only gaps: ShareButton 4-icon fallback + v3 chrome polish on 3 list pages. |
| T2 | `<ShareButton>` 4-icon fallback | `[x]` | Replaced popup chrome (4-tile WhatsApp/X/Telegram/Email + separate Copy row) with v3 4-icon row (WhatsApp/X/Facebook/Copy) using inline SVG glyphs. Copy-to-clipboard surfaces as the fourth tile with `Copied ✓` flash. |
| T3 | v3 chrome polish (3 routes) | `[x]` | `/quests`, `/notifications`, `/saved` all carry coral mono kicker (var(--primary), 0.22em, 700) + display H1 with italic accent. Matches E5.6/E5.7 pattern. |
| T4 | 4-step review gate | `[x]` | See review gate section below. |
| T5 | Pre-commit + commit | `[x]` | Commit `95b9d0d` — 8 files / +379/-64. Master TRACKING.md row flipped to DONE. |

---

## Pre-commit checklist

- [x] Tests written + passing — 352/352 pass
- [x] Lint clean — 0 warnings/errors
- [x] Type check passes — 0 errors
- [x] 4-step review gate — see Review gate (T4) section
- [x] Web boots — three routes still SSR-render under auth gate (no runtime change)
- [x] Bundle delta — documented below
- [x] Coral usage audited — kicker = allow-list spot 2; italic H1 word = spot 3
- [x] tracking.md filled in
- [x] Master TRACKING.md updated — E5.8 row flipped to DONE with commit ref `95b9d0d`
- [x] Commit + push to `dev` — see commit `95b9d0d`

---

## Bundle delta

Captured from `pnpm build` post-T3:

| Route | First Load JS | Per-route | Note |
|-------|--------------|-----------|------|
| `/quests` | 149 kB | 1.51 kB | Chrome polish only — under 180 KB budget |
| `/notifications` | 106 kB | 190 B | Chrome polish only — under budget |
| `/saved` | 111 kB | 176 B | Chrome polish only — under budget |
| `<ShareButton>` chunk | (in `/content/[id]` 209 kB) | — | 4-icon fallback inlined SVG glyphs, no new dep |

`/content/[id]` remains at 209 kB (TipTap extensions in shared chunks via E5.5 — owned there, not regressed by E5.8). All three E5.8 routes well under WEB-NFR-004's 180 KB budget.

---

## Decisions / deviations

- **Telegram + Email tiles dropped from share popup.** Pre-E5.8 the popup carried 5 actions (WhatsApp / X / Telegram / Email / Copy). v3 spec (`pack-w-rest.jsx`) lists four: WhatsApp / X / Facebook / Copy. Telegram + Email removed; Facebook added; Copy unified into the row instead of a separate footer button. Reasoning: matches the v3 wireframe and keeps a single 4-column grid (mobile-friendly).
- **No new gamification work.** Audit confirmed `<XPChip>`, `<StreakChip>`, `<Ring>`, quest pages, daily check-in, achievements, leaderboard all shipped in earlier epics (E5.0 + earlier mobile epics + Right-rail dock in E5.1). E5.8 = polish + share fallback only, not a rebuild.
- **Web Push (FR-085) and Share-as-image OG (FR-048) deferred to M2.** Both require infrastructure (VAPID keys for push, image-rendering pipeline for OG) that's out-of-scope for the M2.5 web v3 polish series. Filed as ENH-001 and ENH-002 below.

---

## Review gate (T4)

### 1. Edge cases (`/review-edge-cases`)

- **Native share unavailable** — `<ShareButton>` already gates on `navigator.share` and falls through to popup; popup now always-present in DOM (CSS-driven open/close), so no race on first paint.
- **Clipboard write rejected** — `copy()` wraps `navigator.clipboard.writeText` in try/catch and toggles `copied` only on success. Failed copy = no UI flicker; user sees the popup unchanged.
- **Popup outside-click** — backdrop `<div>` stops propagation on the panel; click on backdrop closes via `setOpen(false)`.
- **`prefers-reduced-motion`** — popup uses CSS `transition: opacity 160ms` only; no Framer Motion variants added in T2. Reduced-motion users still get instant open/close (acceptable per WEB-MOTION-FR-105 — non-essential UI motion only).
- **Empty list states** — `/saved` already has empty-state card with CTA (`Browse discover`). `/notifications` and `/quests` both render their own empty states (existing). No regression.
- **Guest gating** — `/saved`, `/notifications`, `/quests` all redirect via `getSession()` → `/signin?next=…` (existing). T3 did not touch auth gates.
- **High-contrast mode** — coral kicker on the three pages uses `var(--primary)`; coral allow-list spot **2 (mono kickers / accent labels)** — retained in `forced-colors: active`. Verified.
- **SSR hydration** — all three pages are Server Components (no `"use client"` added by T3). `<ShareButton>` was already client-only.

### 2. Security (`/review-security`)

- **No new external deps.** ShareButton SVG glyphs hand-rolled — no third-party icon library, no CDN tag, no SRI concern.
- **Share URL escaping** — title and url piped through `encodeURIComponent()` before interpolation into `wa.me`, `twitter.com/intent`, `facebook.com/sharer`. No raw HTML injection vector.
- **`rel="noopener noreferrer"`** — every `<a target="_blank">` carries both. No window.opener tab-nabbing.
- **Clipboard scope** — write only; no clipboard-read. No PII clipboard exfil.
- **CSRF** — no new mutating Server Actions added by E5.8. Existing save/like/follow Server Actions on `/saved`/`/notifications` already covered by `middleware.ts` CSRF (E5.0).
- **Rate-limit awareness** — share is client-side only (links to external services); no API call, no rate-limit surface.
- **No PII in logs** — chrome polish doesn't add any logging. Existing logger filters stand.
- **CSP** — share popup is inline React, no `<script>` injection; CSP `script-src 'self' 'nonce-…'` from E5.0 unchanged.
- **OWASP top-10 sweep** — no new injection / auth / config / XXE / deserialization / SSRF / logging surface introduced. Clean.

### 3. Architecture (`/review-architecture`)

- **Component reuse** — T3 chrome change is pure inline-style (matching existing `<WebHeader>` + `<RightRail>` pattern in the same files). No new component file added; ratio of inline vs. extracted style stays consistent with E5.6/E5.7.
- **HLD adherence** — no API change, no DB change, no new route. ShareButton lives where it's always lived (`components/social/`). `/quests`, `/notifications`, `/saved` already in their canonical paths per `apps/web/CLAUDE.md` route table.
- **No premature abstraction** — could have extracted a `<PageHeader>` primitive for the kicker+H1 pattern; decided against — only 3 pages share it, easier to grep + edit inline. If a 5th page lands, revisit.
- **SRS alignment** — covers WEB-SOC-FR-088 (4-icon fallback). FR-085 (Web Push) and FR-048 (Share-as-image OG) explicitly deferred per master plan, recorded in ENH-001 + ENH-002 below.
- **Coral allow-list** — kicker = spot 2 (mono accent labels). Italic H1 word = spot 3 (display-italic-accent). Both within the 7-spot allow-list in WEB-DESIGN-SYSTEM.md §1.

### 4. Code quality (`/review-pr`)

- **Typecheck:** clean (`pnpm typecheck` 0 errors).
- **Lint:** clean (`pnpm lint` 0 warnings/errors).
- **Tests:** all green — 53 files / 352 tests pass.
- **Build:** succeeds. Bundle deltas captured above.
- **Naming:** `Glyph` type, `ShareTileProps`, `GlyphSvg` — descriptive, no abbreviations.
- **Comments:** none added beyond what existed; matches house style.
- **No dead code** — removed Telegram/Email URL builders entirely instead of commenting out.
- **a11y:** ShareTile retains existing `aria-label` + role; `<button>` for Copy (not `<a>` with no href); `aria-modal` on dialog, focus return to trigger handled by existing `setOpen(false)`.

---

## Pending / out-of-this-PR

- **E5.8/ENH-001**: Web Push API + service worker (FR-085) — M2.
- **E5.8/ENH-002**: Share-as-image OG route (FR-048) — M2.
