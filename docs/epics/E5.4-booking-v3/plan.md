# E5.4 — Booking v3 (W-K1 / W-K2 / W-K3)

> **Series:** Fifth epic in the M2.5 Web v3 Parity series. Depends on E5.0 (Foundation).
> **Goal:** Bring the booking flow up to v3 — dual-month calendar, full 4-step wizard chrome, SSE seat-availability stream, confetti spring on confirm, .ics calendar export, missing `/bookings/[id]` confirmation page.
> **SRS refs:** WEB-BOOK-FR-050..056
> **Wireframes:** see §3
> **Master plan:** [`/Users/rohit/.claude/plans/web-application-is-not-enumerated-matsumoto.md`](/Users/rohit/.claude/plans/web-application-is-not-enumerated-matsumoto.md)

---

## 1. Overview

The booking flow is partially built today:

- **API side (substantial)**: `apps/api/src/services/booking-intent.service.ts` (311 LOC) creates intents with concurrent-safe `SELECT … FOR UPDATE` seat holds, `booking.service.ts` (464 LOC) computes pricing (base + 17% platform fee + 18% GST), `lib/razorpay.ts` (208 LOC) wraps the SDK. Webhook handler + signature verification already in place.
- **Web side (skeleton)**: `/api/booking/start` creates an intent; `/booking/[intentId]/page.tsx` + `booking-wizard.tsx` (493 LOC) runs the existing 4-step wizard (Trip / Travellers / Review / Pay) with framer-motion AnimatePresence between steps, hold-countdown timer, beforeunload cleanup, Razorpay redirect.
- **Bookings index** at `/bookings/page.tsx` (121 LOC) lists user bookings.

What's missing vs v3 + SRS:

1. **Dual-month calendar** (FR-051) — date picker for itineraries with multiple `scheduled_dates`. Today the wizard's "Trip" step is read-only; the date is hard-coded into the intent. Calendar belongs **upstream** of the wizard, on the content detail page (E5.3) or as a step zero.
2. **SSE seat-availability stream** (FR-054) — color transitions green (>50%) → yellow (10-50%) → red (<10%) → sold-out. Backend `text/event-stream` endpoint + frontend `EventSource` consumer.
3. **`/bookings/[id]` confirmation page** — wizard redirects to it (`/bookings/{bookingId}?just=1`) but the route 404s. Big gap: no confirmation screen.
4. **Confetti spring on confirm** (FR-055) — 200-particle framer-motion spring at the top of `/bookings/[id]?just=1`, gated by reduced-motion.
5. **.ics calendar download** (FR-056) — RFC-5545 valid file generated from the booking; download button on `/bookings/[id]`.
6. **v3 chrome polish** — current wizard uses a 220px stepper sidebar; v3 (W-K1) uses a horizontal stepper at the top. Visual restyle to match.

## 2. SRS Requirements

| ID | Requirement | Status |
|----|-------------|--------|
| WEB-BOOK-FR-050 | 4-step desktop wizard | Skeleton exists; needs v3 chrome polish |
| WEB-BOOK-FR-051 | Dual-month calendar | **New** |
| WEB-BOOK-FR-052 | Razorpay UPI default + cards/netbank | Already wired (existing) |
| WEB-BOOK-FR-053 | Razorpay desktop hosted page redirect | Already wired (existing) |
| WEB-BOOK-FR-054 | SSE seat-availability stream | **New** |
| WEB-BOOK-FR-055 | Confetti spring on confirm | **New** |
| WEB-BOOK-FR-056 | `.ics` calendar export | **New** |

## 3. Wireframes Referenced

| File | Use |
|---|---|
| [docs/01_wireframes/v3/project/pack-w-booking.jsx](docs/01_wireframes/v3/project/pack-w-booking.jsx) | W-K1 (lines 4–175, Review with line-items + travellers + pricing rail), W-K2 (177–330, Pay with method picker + UPI active), W-K3 (332–470, Confirm celebratory) |
| Standalone HTML — section "W · Web — booking flow" | Visual cross-check at 5 breakpoints |

## 4. Dependencies

| Dependency | Status | What we use |
|---|---|---|
| E5.0 Web Foundation | DONE | `<Btn>`, motion library, `<ToastRegion>`, CSRF middleware |
| E5.3 Reader | DONE | Booking trigger lives on `/content/[id]` (the BookCta component) |
| Existing booking intents API | — | `/api/booking/start`, `/api/booking/[intentId]/confirm`, `/api/booking/cancel` |
| Existing booking service | — | Concurrent-safe seat holds, Razorpay wrap, webhook signature verification |
| Existing wizard skeleton | — | `<BookingWizard>` 4-step shell with framer-motion AnimatePresence — restyle, do not rebuild |

## 5. Architecture Decisions — OPEN QUESTIONS

### Decision 1 — Calendar placement: where does the user pick a date?

**v3 wireframe** doesn't show a calendar picker explicitly — W-K1 starts with the date already chosen ("Sat 14 Feb → Sun 22 Feb"). SRS FR-051 mandates a dual-month calendar somewhere.

**Three options:**

| Option | Where | Trade-off |
|---|---|---|
| **A. On `/content/[id]` BookCta (recommended)** | Click "Book now" → reveal an inline dual-month calendar → click a date → POST `/api/booking/start` with `scheduled_date_id` → redirect to wizard. Calendar lives in `<BookCta>`. | Matches v3's flow (date is settled before the wizard starts). Calendar surfaces only when user is ready to book — doesn't clutter the reader. |
| **B. New step zero in the wizard** | Wizard becomes 5 steps: Date / Trip / Travellers / Review / Pay. Calendar is the first step. | Cleaner wizard chrome, but two "Trip" screens (one for date, one for confirmation) is redundant. |
| **C. Hybrid** | BookCta opens a modal calendar; on date click, redirect to wizard. | Same as A but in a modal instead of inline. |

**Recommended: A** — content detail page is where users have context (creator, photos, body); a calendar there is natural. Modal (C) is acceptable but inline keeps the reader frame intact.

### Decision 2 — SSE seat-availability: server endpoint shape

**SRS FR-054**: real-time seat availability with color transitions. Implementation choices:

| Option | Endpoint | Trade-off |
|---|---|---|
| **A. SSE endpoint per scheduled_date (recommended)** | `GET /api/v1/bookings/seats/stream?date_id=<id>` returns `text/event-stream` with `data: {seatsLeft: N, capacity: M}` events. Frontend `<SeatAvailabilityStream>` opens an `EventSource` and re-renders on each event. Server pushes on every seat change via a Postgres LISTEN/NOTIFY channel. | Clean. Backed by existing concurrent-safe hold logic. Minimal client code (one EventSource). |
| **B. Polling /seats endpoint every 5s** | Frontend polls `GET /api/v1/scheduled-dates/<id>/availability` on a 5s interval. | Simpler infrastructure — no LISTEN/NOTIFY. Higher latency (up to 5s) and more requests. |
| **C. WebSocket** | Full-duplex with a dedicated WS endpoint. | Overkill — we only push server-to-client and the data is small. |

**Recommended: A** — SSE is the right primitive. The Postgres LISTEN/NOTIFY adds ~30 LOC backend.

### Decision 3 — Confetti: framer-motion spring vs canvas-confetti library

**SRS FR-055**: 200-particle confetti spring on confirm.

| Option | Implementation | Trade-off |
|---|---|---|
| **A. canvas-confetti library (recommended)** | `npm i canvas-confetti` (~5KB gzip). One `confetti()` call on mount. | Battle-tested, trivial to wire, respects reduced-motion via wrapping. |
| **B. Pure framer-motion 200×`<motion.div>`** | Hand-roll 200 particles with `useMotionValue` + spring. | No new dep. ~50 LOC. Performance risk at 200+ elements (DOM-heavy). |
| **C. CSS keyframe burst** | Pure CSS, 200 absolute-positioned divs with staggered animation-delay. | Lightest. Less expressive (no physics). |

**Recommended: A** — adds a tiny dep but the result is reliably high-quality, and it's a one-time use (only on /bookings/[id]?just=1).

### Decision 4 — `/bookings/[id]` confirmation page: build now vs degrade gracefully

The wizard redirects to `/bookings/[id]?just=1` but the route doesn't exist yet (404). Three options:

| Option | What ships | Trade-off |
|---|---|---|
| **A. Full v3 confirmation page (recommended)** | Build `/bookings/[id]` with: confetti spring on `?just=1`, full booking summary, .ics download, "Add to calendar" buttons (Google / Apple / Outlook), "Share with travellers" CTA, contextual next-steps for the creator. | Closes the redirect-loop bug. Honors v3 W-K3. |
| **B. Stub page** | Just shows "Booking confirmed" + booking ID + a back link. Defer the rest. | Cheapest. Confirms the flow but doesn't celebrate. |
| **C. Redirect to existing `/bookings` index** | After confirm, push to `/bookings` (the list page) instead of `/bookings/[id]`. | Avoids the missing route entirely. Loses the per-booking confirmation experience. |

**Recommended: A** — without a real confirmation page the booking flow ends abruptly; the celebratory moment is the whole point of FR-055.

### Other decisions (no user input needed)

| Decision | Choice | Rationale |
|---|---|---|
| Calendar dependency | Hand-roll (no react-day-picker etc.) | 4 weeks × 2 months = 56 cells × 2 = 112; trivial to implement; library bloat unjustified |
| .ics generator | Hand-roll RFC-5545 (~40 LOC) | One file format, well-specified, no library needed |
| Razorpay sandbox | Reuse existing `lib/razorpay.ts` wiring | Already done, no changes |
| Wizard chrome | Match v3 W-K1 horizontal stepper at top, drop the 220px sidebar | The current sidebar is unique to our impl; v3 puts the stepper inline above the content |

## 6. Database

No DB changes for the wizard polish. SSE seat stream needs a `LISTEN/NOTIFY` channel `seat_availability_<scheduled_date_id>` — that's ephemeral, not a schema change.

## 7. API Contract

New: `GET /api/v1/bookings/seats/stream?date_id=<id>` returns SSE.
New: `GET /api/v1/bookings/<id>.ics` returns `text/calendar` content.
Existing: `/api/v1/booking-intents/...` unchanged.

## 8. Test Plan

| Layer | Coverage |
|---|---|
| Unit | `<DualMonthCalendar>` (date math, disabled days, click-to-select), `<SeatAvailabilityStream>` (EventSource lifecycle, color buckets), `.ics` generator (RFC-5545 fields, special-char escapes), confetti reduced-motion gate. |
| Integration | Razorpay sandbox happy path + abort + 3DS-fail (existing tests cover server-side). Wizard golden path: pick date → start intent → fill travellers → review → pay → confirm page with confetti + .ics download. |
| E2E (deferred) | Full Playwright spec spanning content detail → calendar → wizard → Razorpay test mode → confirm page. Target post-E5.4. |
| A11y | Calendar keyboard nav (arrow keys, Home/End, PageUp/PageDown), accessible day cell labels, `role="grid"`. SSE color changes paired with text label ("3 seats left" not just colour). |

## 9. Edge Cases

- **Sold-out date** at intent creation → API returns 410; calendar marks date as disabled; user picks another.
- **Hold expires** mid-wizard → existing toast + redirect to review (already wired).
- **Two users hit pay simultaneously** for the last seat → server-side `SELECT … FOR UPDATE` resolves; loser gets 410 + "seats just sold out" toast.
- **Razorpay 3DS canceled** → user lands back on `/booking/[intentId]` with `?status=cancelled`; wizard restores Review step.
- **SSE disconnect** → exponential backoff reconnect (1s, 2s, 4s; max 30s); user sees "reconnecting…" badge.
- **`?just=1` on stale booking** (refresh after confetti already shown) → confetti gates on `sessionStorage` key so a second view doesn't fire it again.
- **.ics download with special characters in title** → escape `\,` `\;` `\\` and CRLF per RFC-5545.
- **Mobile (< 768px)** → calendar stacks to single month; wizard stepper becomes a centered dot row.

## 10. InfoSec Review

| Concern | Mitigation |
|---|---|
| Razorpay webhook replay | Existing HMAC SHA-256 verify + `payment_id` uniqueness constraint (E2.6) |
| Refund authorization | Existing creator + admin gate |
| `.ics` PII leakage | The .ics carries `summary`, `dtstart`, `location`, `organizer email`. Email + phone of *travellers* are NOT in the .ics — only the lead booker's email (used as `ATTENDEE`). |
| SSE auth | Endpoint is public-readable (anyone with a valid `date_id` can stream); no PII exposed (just a count). |
| Confetti CDN | Use the npm package, not a CDN script. Bundled with the route. |
| Rate-limit on SSE connect | One stream per scheduled-date per IP; existing Cloudflare rules cover. |

## 11. Governance

- **Audit logs:** every booking state change already emits an `audit_events` row (E2.6) — no new audit logic needed for E5.4.
- **DPDPA:** booking PII retention 7 years (regulatory) — already enforced server-side.
- **Cancellation/refund policy** displayed on `/bookings/[id]` — link to `/terms` + creator-set policy if any.
- **Coral usage** on booking pages: primary CTAs (Continue, Pay now, Add to calendar), active stepper marker, SSE warning badge (red, but coral allowed for warnings is allow-list spot 1). All in spec.

## 12. Tasks (preliminary — refined after decisions land)

| ID | Task |
|----|------|
| T1 | Audit existing booking surface (already done in plan §1) — verify Razorpay test creds + `/bookings/[id]` 404 |
| T2 | `<DualMonthCalendar>` — hand-rolled, 5×7 grid × 2 months, disabled-day support, keyboard nav |
| T3 | `<BookCta>` polish — open inline calendar on click, redirect to wizard on date pick |
| T4 | `GET /api/v1/bookings/seats/stream?date_id=<id>` SSE endpoint (server) + `<SeatAvailabilityStream>` client component |
| T5 | Wizard chrome to v3 — horizontal stepper at top, drop the 220px sidebar |
| T6 | `/bookings/[id]/page.tsx` — confirmation page with summary + .ics download + add-to-calendar |
| T7 | Confetti spring on `?just=1` (canvas-confetti, reduced-motion gated, sessionStorage one-shot) |
| T8 | `GET /api/v1/bookings/<id>.ics` endpoint (server, RFC-5545 hand-rolled) + helper |
| T9 | Edge-case wiring — Razorpay cancel return path, SSE reconnect, hold-expired toast |
| T10 | 4-step review gate (edge cases → security → architecture → code quality) |
| T11 | Pre-commit + 5-breakpoint screenshots × 3 wizard steps + confirmation page; commit + push to `dev` |

## 13. Definition of Done

Standard E5.X DoD inherited from the cross-cutting quality contract. Plus: end-to-end Razorpay sandbox happy-path test passes (pick date → wizard → pay → confirm page with confetti + .ics download).
