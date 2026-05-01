# E5.7 — KYC + Profile + Studio v3

> **Series:** Eighth epic in the M2.5 Web v3 Parity series. Depends on E5.0 (Foundation).
> **Goal:** Round out the studio + profile + KYC surfaces — 30-day earnings chart, payouts CSV/PDF export, bookings drawer, notification matrix verification, profile + settings polish, KYC chrome alignment.
> **SRS refs:** WEB-KYC-FR-074..077, WEB-PROF-FR-078..083, WEB-STUD-FR-057..066
> **Wireframes:** [docs/01_wireframes/v3/project/pack-w-rest.jsx](docs/01_wireframes/v3/project/pack-w-rest.jsx)
> **Master plan:** [`/Users/rohit/.claude/plans/web-application-is-not-enumerated-matsumoto.md`](/Users/rohit/.claude/plans/web-application-is-not-enumerated-matsumoto.md)

---

## 1. Overview

Most of the studio + profile + KYC surface is **already built**:

- **Studio dashboard** (204 LOC) — 4 stat tiles (Earnings 30d / Bookings 30d / Saves 30d / Followers) + recent-activity list + KYC banner
- **KYC wizard** (706 LOC) — PAN / Aadhaar / Selfie (with `getUserMedia` webcam) / Bank / Review steps + Firebase Storage upload
- **Studio routes** — `/studio` + `/studio/{content,bookings,reviews,payouts,settings,kyc,kyc/submit}` all in place
- **Settings page** — 4-tab (Account / Payout / Notifications / Privacy)
- **/you** — profile basics

**What's missing vs v3 + SRS** (the high-impact gaps):

1. **30-day earnings chart** (FR-058) — dashboard's earningsTrend data isn't visualised; needs a sparkline / area chart
2. **CSV + PDF export on payouts** (FR-062) — page exists but no download buttons
3. **Bookings drawer** (FR-060) — currently a full page; v3 wants a right-side drawer slide-in from `/studio` overview
4. **Notification prefs matrix verification** (WEB-PROF-FR-080) — settings has a notifications tab; need to confirm it's a per-channel × per-event matrix
5. **Block-list + private-mode toggle** (WEB-PROF-FR-081) — privacy tab exists; verify both toggles present
6. **DigiLocker fallback** (WEB-KYC §4.16.8) — currently no DigiLocker path; **flagged for review** (needs external creds, may defer)
7. **v3 chrome polish** — ensure studio + you + KYC pages match v3 W-rest spec (display H1 + coral kicker)

## 2. SRS Requirements

| ID | Requirement | Status |
|----|-------------|--------|
| WEB-STUD-FR-057 | Studio shell + 6-item sidebar nav | Existing |
| WEB-STUD-FR-058 | 4 stat tiles + 30d earnings chart | Tiles ✅; chart **new** |
| WEB-STUD-FR-059 | Content list + filters | Existing |
| WEB-STUD-FR-060 | Bookings drawer | **New** (currently a page) |
| WEB-STUD-FR-061 | Reviews moderation | Existing |
| WEB-STUD-FR-062 | Payouts ledger + CSV/PDF | **New (CSV/PDF)** |
| WEB-STUD-FR-063..066 | Settings tabs + audit | Existing |
| WEB-KYC-FR-074 | KYC wizard 5-step | Existing |
| WEB-KYC-FR-075 | PAN OCR + bank verify | Server side — out of scope |
| WEB-KYC-FR-076 | Webcam selfie w/ oval guide | Existing — verify oval guide visual |
| WEB-KYC-FR-077 | KYC FSM (status → in-review → approved/rejected) | Existing |
| WEB-KYC §4.16.8 | DigiLocker fallback | **Deferred** (ENH) |
| WEB-PROF-FR-078..079 | /you profile + edit | Existing — chrome polish |
| WEB-PROF-FR-080 | Notification prefs matrix | Existing — verify matrix shape |
| WEB-PROF-FR-081 | Block-list + private-mode | Existing — verify both present |
| WEB-PROF-FR-082..083 | Account deletion + soft-delete cron | Server-side — existing |

## 3. Wireframes Referenced

| File | Use |
|---|---|
| [docs/01_wireframes/v3/project/pack-w-rest.jsx](docs/01_wireframes/v3/project/pack-w-rest.jsx) | Studio dashboard / KYC / You / Settings layouts |
| [docs/01_wireframes/v3/project/uploads/studio-dashboard.html](docs/01_wireframes/v3/project/uploads/studio-dashboard.html) | Standalone dashboard reference |

## 4. Dependencies

| Dependency | Status | What we use |
|---|---|---|
| E5.0 Web Foundation | DONE | CSRF middleware, motion library |
| Existing studio routes | — | All 6 sidebar items already routed |
| Existing KYC wizard | — | 706 LOC scaffolding; restyle, do not rebuild |
| `fetchStudioMetrics` | — | Returns `earningsTrend: { date, valuePaisa }[]` — already shaped for the chart |

## 5. Architecture Decisions — OPEN QUESTIONS

### Decision 1 — Sparkline / earnings chart library (or hand-roll?)

`metrics.earningsTrend` is already shaped as `{ date, valuePaisa }[]` — just needs a chart.

| Option | Implementation | Trade-off |
|---|---|---|
| **A. Hand-rolled SVG sparkline (recommended)** | Pure SVG path: 30 points → polyline, area fill below. ~50 LOC, no dep. Tooltips on hover. | Lightest. Complete control. Matches our minimalist aesthetic (no axis chrome). |
| **B. Recharts (~100KB lazy)** | Drop in `<AreaChart>` with `<XAxis>` + `<YAxis>` + `<Tooltip>`. | Battle-tested, more features. ~100KB lazy. Overkill for one chart. |
| **C. Visx (~80KB lazy)** | Lower-level, more flexible than recharts. | Library complexity not justified. |

**Recommended: A.**

### Decision 2 — CSV export: client-side blob vs server route

| Option | Implementation | Trade-off |
|---|---|---|
| **A. Client-side blob from rendered ledger (recommended)** | `<DownloadCsv>` reads the already-rendered ledger DOM rows + builds a CSV string + creates a Blob URL + clicks an `<a download>`. Zero server round-trip. | Simplest. Honest about what's downloaded — exactly what's on-screen. |
| **B. Server-side CSV endpoint** | New `GET /api/v1/studio/payouts.csv` returns text/csv. | Server is canonical source. Authorization gate handled centrally. |
| **C. Both** | Client default; server for "all time" exports beyond the rendered page. | Belt-and-braces, most code. |

**Recommended: A** for E5.7 minimum; document server route as ENH for full-history exports.

### Decision 3 — PDF export: client lib vs server pdfkit

| Option | Implementation | Trade-off |
|---|---|---|
| **A. Server-side `pdfkit` endpoint (recommended)** | New `GET /api/v1/studio/payouts.pdf` — server renders a styled PDF (logo + table). 5-second backend, ~30 LOC + pdfkit dep on the API. | Canonical, branded, downloadable, **shareable** (signed URL). Server-side keeps PDF rendering off the client bundle. |
| **B. Client-side `@react-pdf/renderer` (~100KB)** | Render in-browser; download as Blob. | No server change. Adds ~100KB to studio/payouts route. PDF-rendering-from-browser libraries are notoriously fiddly for tables. |
| **C. `window.print()` with print-stylesheet** | Browser native; user picks "Save as PDF". | Cheapest. UX is awkward — user has to click "Save as PDF" in the print dialog. |

**Recommended: A** — pdfkit on the API is small and the result is consistent. **Flagged for review:** if the launch-blocker checklist hasn't budgeted for `pdfkit` install, we may defer to C.

### Decision 4 — Bookings drawer: build or restructure existing page?

v3 W-stud spec wants bookings as a right-side drawer that slides over the studio dashboard. Currently `/studio/bookings` is a full page.

| Option | Implementation | Trade-off |
|---|---|---|
| **A. Keep page + add drawer overlay (recommended)** | Drawer (420px right) opens via "View bookings" button on dashboard; `/studio/bookings` page stays for direct deep-linking. | Best of both. Page for shareable URLs; drawer for quick checks. |
| **B. Replace page with drawer-only** | Drop `/studio/bookings` route; bookings only via drawer. | Cleaner UX but loses deep-link sharing (e.g. "show me a booking"). |
| **C. Keep page only, no drawer** | Don't build the drawer. | Misses v3 spec. |

**Recommended: A.**

### Other decisions (no user input)

| Decision | Choice | Rationale |
|---|---|---|
| DigiLocker fallback | Defer to ENH | Needs external creds + sandbox account; not a launch blocker |
| Notification matrix | Verify existing covers the v3 grid; if it does, no rebuild | Cheaper |
| Block list + private mode | Verify both in privacy tab; add toggles if missing | Per WEB-PROF-FR-081 |
| Studio chrome | Match v3 W-rest — keep existing 6-item sidebar (no restructure) | E5.0 already aligned |

## 6. Database

No DB changes for E5.7. Settings + KYC schemas already in place.

## 7. API Contract

- **New: `GET /api/v1/studio/payouts.pdf`** (Decision 3 = A) — auth-gated, returns `application/pdf` with the requesting creator's payout ledger.
- **No changes** otherwise — existing `fetchStudioMetrics` returns `earningsTrend` already.

## 8. Test Plan

| Layer | Coverage |
|---|---|
| Unit | `<EarningsSparkline>` (date scaling, value clamping), `csv-export.ts` (CSV string formatting + escapes), `<BookingsDrawer>` (open/close + ESC). |
| Integration | Payouts.pdf endpoint round-trip vs Razorpay sandbox payouts seed. (Defer to pre-launch QA.) |
| SSR | All 7 studio routes + `/you` render for auth + non-auth (redirect). |
| A11y | Sparkline has `<title>` + `<desc>`; CSV/PDF buttons keyboard-accessible; drawer focus-trap + Esc close. |
| Visual | 5-breakpoint screenshots × 7 studio routes + /you. |

## 9. Edge Cases

- **earningsTrend with 0 data points** → sparkline shows "No earnings yet — publish to start"
- **30-day window with negative values** (refunds) → chart handles below-axis; tooltip shows the refund event
- **Payouts ledger with > 1000 rows** → CSV still works (streaming Blob); PDF capped at 200 rows with "see CSV for the full set" footer
- **CSV with special chars in creator name** (commas, quotes, newlines) → standard CSV escaping (`"…"` + `""` for embedded quotes)
- **PDF generation timeout** → server timeout 10s; if exceeded, return 500 + retry-friendly error
- **Webcam permission denied** → existing fallback: file-upload selfie path. Verify still wired.
- **Bookings drawer + tab switch via keyboard** → focus trap holds; Esc closes
- **Notification matrix all-off** → server preserves; user can re-enable later

## 10. InfoSec Review

| Concern | Mitigation |
|---|---|
| KYC PII (PAN/Aadhaar/bank) | Existing E2.2 — encrypted at rest; signed S3 URLs (TTL 1h) |
| PDF endpoint auth | `authenticate` + ownership check on creator id |
| CSV download from rendered DOM | No PII leakage — same data already on-screen |
| Block list privacy | Server enforces; blocked users can't see private mode profile |
| Account deletion | 14-day soft-delete (FR-083, existing cron) |
| Admin reviewer 2FA | Existing E2.8 |

## 11. Governance

- **DPDPA** — KYC PII purpose-limited (existing). PDF + CSV exports include only the requesting creator's own ledger; no cross-creator leakage.
- **Audit logs** — every KYC state change emits `audit_events` (existing E2.6). PDF download events log to `audit_events`.
- **Doc sync** — WEB-DESIGN-SYSTEM.md gets `<EarningsSparkline>` if generally reusable.

## 12. Tasks (preliminary)

| ID | Task |
|----|------|
| T1 | Audit existing studio + KYC + you surfaces (already in plan §1) |
| T2 | `<EarningsSparkline>` — hand-rolled SVG, 30 points, area fill |
| T3 | Payouts CSV export — `<DownloadCsvButton>` reads ledger rows + builds Blob |
| T4 | Payouts PDF export — server route `GET /api/v1/studio/payouts.pdf` (pdfkit) + client `<DownloadPdfButton>` |
| T5 | `<BookingsDrawer>` — 420px right drawer mounted on `/studio` dashboard, list + click-to-detail |
| T6 | Verify notification matrix in settings/notifications tab; add per-event × per-channel toggles if missing |
| T7 | Verify block-list + private-mode in settings/privacy tab; add toggles if missing |
| T8 | v3 chrome polish — `/studio`, `/you`, `/studio/kyc` aligned to W-rest spec (kicker + display H1 + italic accent) |
| T9 | 4-step review gate |
| T10 | Pre-commit + 5-breakpoint screenshots + commit |

## 13. Definition of Done

Standard E5.X DoD inherited from cross-cutting quality contract.

---

## Items flagged for review

- **Decision 3 (PDF)** — picked server-side `pdfkit`, but adds an API dep we haven't budgeted. If launch-budget is tight, fall back to `window.print()` (option C) which is acceptable for v1.
- **DigiLocker fallback (FR-076)** — deferred to ENH-001 since it needs external creds (Meity API setup) that aren't on the launch-blocker checklist.
- **Reader catch-up for E5.5 TipTap-authored images / tables** is a separate epic concern (E5.5/ENH-001); not addressed here.
