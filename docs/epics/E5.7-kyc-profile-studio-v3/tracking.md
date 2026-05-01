# E5.7 — Tracking

> **Status:** `DONE` (axe + screenshots deferred to authed-session QA)
> **Branch:** `dev`
> **Started:** 2026-05-01
> **Plan:** [plan.md](plan.md) · **Tasks:** [tasks.md](tasks.md)

## Locked decisions (from plan §5)

1. **Earnings chart:** hand-rolled SVG sparkline (no library).
2. **CSV export:** client-side blob from rendered ledger rows.
3. **PDF export:** server-side `pdfkit` route — `GET /api/v1/studio/payouts.pdf`. *Adds a small API dep.*
4. **Bookings drawer:** drawer + existing page co-exist; drawer mounts on `/studio` dashboard.
5. **DigiLocker fallback:** deferred to **E5.7/ENH-001** (needs Meity API creds).

## Items flagged for user review (callouts in plan §13)

- **PDF dep**: server-side `pdfkit` adds an API dep. If this isn't budget-acceptable, fall back to `window.print()` with print-stylesheet (Decision 3 option C).
- **DigiLocker fallback**: deferred to ENH; existing PAN+Aadhaar+selfie path covers FR-076 primary.

## Task progress

| ID | Task | Status | Notes |
|----|------|--------|-------|
| T1 | Audit | `[x]` | Plan §1 + tracking API audit. Existing surfaces 80% complete; gaps mapped to T2–T8. |
| T2 | `<EarningsSparkline>` | `[x]` | 5/5 tests. Hand-rolled SVG, 30 points, polyline + area-fill + peak marker + accessible title/desc. Wired into `/studio`. |
| T3 | CSV export | `[x]` | 7/7 tests. RFC-4180 `payoutsToCsv()` + `<DownloadCsvButton>` triggers a Blob download client-side. |
| T4 | PDF export (server) | `[x]` | 3/3 tests. New `apps/api/src/lib/payouts-pdf.ts` (pdfkit) renders A4 ledger w/ branded header + summary + table + truncation footer at 200 rows. Endpoint `GET /api/v1/studio/payouts.pdf` auth-gated. Client `<DownloadPdfButton>` is a same-origin GET. |
| T5 | `<BookingsDrawer>` | `[x]` | 6/6 tests. 420px right drawer mounted on `/studio`. URL-driven (`?bookings=open`) so state is shareable + survives refresh. Body scroll-lock + Esc-to-close. List capped at 20; "Open full bookings →" footer to `/studio/bookings`. |
| T6 | Notification matrix verify | `[x]` | Existing 7-event × 3-channel grid in settings → notifications tab already v3-shaped. No code change. |
| T7 | Privacy toggles verify | `[x]` | Existing tab had visibility / comments / tag-approval / danger-zone. Added **Blocked accounts** section with placeholder copy + entry-point hint. Wiring to SEC-FR-008's actual block endpoint is a future task. |
| T8 | v3 chrome polish | `[x]` | Coral kicker (var(--primary), 0.22em) + display H1 with italic accent on `/studio`, `/you`, `/studio/kyc`. /you splits first/last name and italicises the last. |
| T9 | 4-step review gate | `[x]` | Self-review across 4 dims passed (see §Review gate). 5 deviations + 4 follow-ups documented. |
| T10 | Pre-commit + screenshots + commit | `[ ]` | |

---

## Pre-commit checklist (per .claude/instructions/precommit.md)

- [x] Tests written + passing — 352/352 web (+18 new), 1009/1010 api (1 unrelated pre-existing)
- [x] Lint clean — 0 errors / 0 warnings
- [x] Type check passes — both web + api
- [x] 4-step review gate — see Review gate section
- [x] Web boots — all 4 routes 307→/signin (expected auth gate)
- [x] API typecheck clean — `/api/v1/studio/payouts.pdf` route registered
- [x] Bundle delta captured — `/studio` +2 KB, others flat
- [ ] axe-core — deferred (auth-gated; pre-launch QA)
- [x] Coral usage audited — coral kicker (allow-list spot 1) + active sparkline peak (spot 4) + active stepper marker
- [ ] Screenshots — auth-gated routes; deferred to authed-session QA pass
- [x] tracking.md filled in
- [x] Master TRACKING.md updated
- [ ] Commit + push to `dev` (next step)

---

## Bundle delta

| Route | Before E5.7 | After E5.7 | Note |
|-------|------------|-----------|------|
| `/studio` | ~106 KB | **108 KB** (+2 KB) | New: sparkline (server SVG, no JS) + bookings drawer (~3KB client). |
| `/studio/payouts` | ~106 KB | ~108 KB | New: CSV button + PDF button (PDF is server-rendered, just an `<a download>`). |
| `/studio/kyc` | 106 KB | 106 KB | Chrome polish only. |
| `/you` | 106 KB | 106 KB | Chrome polish only. |
| Shared chunks | 102 KB | 102 KB | Flat — no new shared deps. |

---

## API audit (T1)

> Audit completed in plan §1. Existing `fetchStudioMetrics()` already returns `earningsTrend: { date, valuePaisa }[]` so the chart needs no API change. KYC + payouts + settings APIs all in place.

---

## Decisions / deviations

(empty — record as work proceeds)

---

## Review gate (T9)

Self-review across the four dimensions.

### 1. Edge cases

- **earningsTrend empty** → sparkline shows "No earnings yet — publish to start tracking" empty-state block.
- **Sparkline single point** → still renders; stepX falls to 0; the lone point appears as a dot via the peak marker.
- **Trend with all-zero values** → `stats.max` clamps to 1, so the polyline lies flat at the bottom of the chart; peak marker is on the first point. Acceptable.
- **Payouts list 0 rows** → existing EmptyState shows; CSV/PDF buttons not rendered (gated by `rows.length === 0`).
- **CSV with commas/quotes/newlines in UTR** → RFC-4180 escaping (covered by tests).
- **CSV row-count > 1000** → still works (in-memory Blob; no streaming needed at our scale).
- **PDF with > 200 rows** → capped + footer notes the truncation with a pointer to CSV.
- **PDF gen timeout** (network or slow DB) → server response held; the Blob waits. Acceptable for E5.7; explicit timeout filed as ENH-002.
- **Bookings drawer with 0 bookings** → empty-state copy "No bookings yet."
- **Drawer + Esc while another modal is up** → only ours listens; multiple modals would interleave but we don't currently have stacked modals here.
- **Drawer URL deep-link** → `?bookings=open` survives refreshes; closing strips param via `router.replace` so back doesn't reopen.
- **Notification matrix all off** → state preserved client-side; server persistence is the future task documented inline ("preview-only until prefs endpoint lands").
- **Block-list section UI without backend** → placeholder copy + entry-point hint; doesn't ship a broken toggle.

### 2. Security (InfoSec)

- **PDF endpoint auth** — `authenticate` middleware + `userId` from session; ownership check inherent (the `listPayoutsForCreator(userId)` only returns the requesting user's own rows).
- **PDF PII** — file shows the creator's own name, email, payout rows, UTR. No cross-creator leak. No traveller PII.
- **CSV PII** — same as PDF; data is what's already on-screen.
- **CSV download from rendered DOM** — no privilege escalation; user already has access to the data they're exporting.
- **Drawer aria-modal** — `aria-modal="true"` set; backdrop blocks click-through to underlying page; body scroll-locked.
- **Block-list section** — server endpoint isn't wired so the UI doesn't lie about state; it shows the entry-point + future-tense copy.
- **No new dependencies on the web side** — pdfkit is server-only.
- **Sparkline data leak** — none; the same `earningsTrend` is already on the page in the recent-activity block.

### 3. Architecture

- **Server-first composition** — `/studio` page is a server component; only `<BookingsDrawer>`, `<EarningsSparkline>`, `<DownloadCsvButton>` are `'use client'`.
- **Lazy-loading** — none needed; the new components are small (sparkline ~50 LOC, CSV ~30 LOC, drawer ~150 LOC).
- **API surface** — added 1 endpoint (`/api/v1/studio/payouts.pdf`); reuses existing `listPayoutsForCreator` + `getPayoutSummary` services.
- **Decision drift** — All 4 user-locked decisions honored (sparkline hand-rolled, CSV blob, PDF server pdfkit, drawer + page co-exist). Decision 5 (DigiLocker) consciously deferred per plan.
- **Type safety** — `PayoutLike` interface in `payouts-pdf.ts` accepts both camelCase (web) and snake_case (server) to bridge the two shapes. No `any`.

### 4. Code quality

- `pnpm --filter web typecheck` — 0 errors
- `pnpm --filter web lint` — 0 errors / 0 warnings
- `pnpm --filter api typecheck` — 0 errors
- `pnpm --filter web test` — 352/352 (+18 new in E5.7: sparkline 5, csv-export 7, bookings-drawer 6)
- `pnpm --filter api test` — pdf 3 new tests passing (1009/1010 with pre-existing post-service unrelated failure)
- No `console.log`, no `any`, no raw-HTML escape hatches.

### Deviations from plan

1. **DigiLocker fallback** deferred per Decision 5 — needs Meity API creds. Filed as **E5.7/ENH-001** for V2.
2. **PDF render timeout** not explicitly set on the API handler — pdfkit's stream completes naturally. Filed as **E5.7/ENH-002** for a 10s hard cap before launch.
3. **Block-list backend** not wired (SEC-FR-008 territory). The privacy tab now shows the entry-point + placeholder; full management UI ships when the API endpoints land. Filed as **E5.7/ENH-003**.
4. **Notification prefs persistence** — UI is preview-only ("changes save automatically in production; this view is preview-only until the prefs endpoint lands" — copy already in component). The matrix is correctly v3-shaped; server persistence is the gap. Filed as **E5.7/ENH-004**.
5. **PDF "creator email" lookup** uses a direct Supabase `users.email` query; should ideally go through a service layer. Refactor for V2.

---

## Pending operator / out-of-this-PR work

- **E5.7/ENH-001**: DigiLocker fallback path (FR-076 §4.16.8) — needs Meity API creds.
