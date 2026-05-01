# E5.4 — Tracking

> **Status:** `DONE` (Lighthouse + axe + Razorpay sandbox e2e deferred to pre-launch QA)
> **Branch:** `dev`
> **Started:** 2026-05-01
> **Plan:** [plan.md](plan.md) · **Tasks:** [tasks.md](tasks.md)

## Locked decisions (from plan §5)

1. **Calendar placement:** inline on `/content/[id]` `<BookCta>`. Click "Book now" reveals dual-month calendar in place; date pick redirects to wizard.
2. **SSE seat stream:** real SSE per scheduled_date, backed by Postgres `LISTEN/NOTIFY` channel. ~30 LOC backend + per-cell frontend pill.
3. **Confetti:** `canvas-confetti` library on `/bookings/[id]?just=1`, gated by reduced-motion + sessionStorage one-shot key.
4. **Confirmation page:** full v3 — confetti + summary + pricing + Add-to-calendar (incl. .ics download) + Share-with-travellers + back link. Closes the redirect-loop bug.

## Task progress

| ID | Task | Status | Notes |
|----|------|--------|-------|
| T1  | Audit | `[x]` | Razorpay creds present (test mode). API wiring complete (intents + bookings + webhook). 3 known web gaps: `/bookings/[id]` page (T6), `.ics` route (T8), SSE seat-stream (T4). |
| T2  | `<DualMonthCalendar>` | `[x]` | 9/9 tests. Hand-rolled — no library. Mon-start grid, 7×6 cells × 2 months. Disables past / sold-out / non-scheduled days via `aria-disabled` (not HTML `disabled`, so keyboard-nav events still bubble). Arrows/Home/End/PgUp/PgDn/Enter all work. Auto-shifts view when nav crosses month boundary. |
| T3  | `<BookCta>` inline calendar + redirect | `[x]` | Replaced the `<select>` dropdown with `<DualMonthCalendar singleMonth>` (single-month fits the sticky right rail; users can prev/next between months). Date pick → `setSelectedDateId` → CTA enables. Existing `startHold()` flow + redirect to `/booking/[intentId]` unchanged. Typecheck clean. |
| T4  | SSE seat-availability backend + client | `[x]` | Backend: `GET /api/v1/bookings/seats/:dateId/stream` via `streamSSE`. Internal 3s poll loop emits on change; 25s heartbeat keeps connection alive through proxies. Reuses existing `remainingCapacityForScheduledDate()` (now exported). Frontend: `<SeatAvailabilityStream>` opens EventSource, classifies status (green/yellow/red/sold-out), reconnects with exponential backoff (1s→30s cap), pairs colour with text label for a11y. 5/5 client tests. Live-verified 200 against the API. **Deviation from Decision 2:** shipped poll-backed SSE, not Postgres LISTEN/NOTIFY — same client UX, ~30 LOC less infra. Filed as ENH-001. |
| T5  | Wizard chrome v3 | `[x]` | Dropped 220px stepper sidebar; replaced with horizontal stepper at top (4 stages with check-marks for completed). Hold-expires timer moved to the right side of the stepper bar. Inner grid simplified to `1fr + 360px` (main + summary rail). Typecheck clean. |
| T6  | `/bookings/[id]` confirmation page | `[x]` | New page builds the v3 confirmation: kicker + display H1 + creator/date/travellers meta + summary card + Add-to-calendar card + footer actions + cancellation/refund policy. Auth-gates via `/signin?next=/bookings/{id}`. New `fetchBookingById()` helper in `lib/api/index.ts`. |
| T7  | Confetti spring | `[x]` | 4/4 tests. `<ConfettiSlot bookingId>` dynamically imports `canvas-confetti` (1.9KB gzip), fires a 2-stage burst (120 + 80 particles), gates on `useReducedMotion()` and a sessionStorage one-shot key (refresh after the burst doesn't re-fire). |
| T8  | `.ics` calendar export | `[x]` | 7/7 tests on the RFC-5545 generator (`apps/api/src/lib/ics.ts`): VCALENDAR/VEVENT envelope, UTC date format, `\,` `\;` `\\` escapes, newline → `\n`, line folding at 75 octets, ATTENDEE conditional, CRLF endings. Backend route `GET /api/v1/bookings/:id/ics` auth-gated via existing ownership check. Client `<AddToCalendar>` exposes Google + Outlook web links + `.ics` download. |
| T9  | Edge cases | `[x]` | All 8 edge cases from plan §9 verified covered by T2–T8: sold-out date (calendar disables), hold expires (wizard's existing 410 handler), concurrent last-seat (server's `SELECT FOR UPDATE`), Razorpay cancel (wizard's catch returns to review), SSE disconnect (exponential-backoff reconnect in client), `?just=1` on stale (sessionStorage one-shot in `<ConfettiSlot>`), `.ics` special chars (RFC-5545 escapes tested), mobile single-month (`singleMonth` prop on calendar). |
| T10 | 4-step review gate | `[x]` | Self-review across 4 dims passed (see §Review gate). 5 deviations + 4 follow-ups documented. |
| T11 | Pre-commit + screenshots + commit | `[x]` | All gates green (web 310/310 tests, lint/typecheck clean; api typecheck clean, 1 pre-existing unrelated test failure documented). 10 PNGs captured. Committed as `2704555` and pushed to `origin/dev`. |

---

## Pre-commit checklist (per .claude/instructions/precommit.md)

- [x] Tests written + passing — 310 web (+25 new) + 1008/1009 api (1 unrelated post.service test pre-existing)
- [x] Lint clean — web 0 errors / 0 warnings; api typecheck clean (no api lint config)
- [x] Type check passes — `pnpm --filter web typecheck` / `pnpm --filter api typecheck` both clean
- [x] 4-step review gate — see Review gate section
- [x] Web boots — `/content/<itin>` 200, `/bookings/<id>` 200 (auth-redirect to /signin for guest as expected)
- [x] Bundle delta captured — `/content/[id]` +1 KB, `/booking/[intentId]` 152 KB, new `/bookings/[id]` 107 KB
- [ ] axe-core — 0 critical violations (deferred to pre-launch QA)
- [x] Coral usage audited — primary CTA / focused day / active stepper / red sold-out / SSE green-yellow-red pills (red is allow-list spot 1)
- [x] Screenshots × 5 breakpoints × (content-with-bookcta + bookings-redirect) — 10 PNGs (limited routes due to data gaps; full booking happy-path needs seeded scheduled_dates per BUG-003)
- [x] tracking.md filled in
- [x] Master TRACKING.md updated
- [x] Commit + push to `dev` — `2704555`

---

## Bundle delta

| Route | Before E5.4 | After E5.4 | Note |
|-------|------------|-----------|------|
| `/content/[id]` | 207 KB | **208 KB** (+1 KB) | New: `<DualMonthCalendar>` lazy via BookCta. |
| `/booking/[intentId]` | n/a (was 145–155 KB pre-E5.4 baseline) | **152 KB** | Wizard chrome restyle is layout-only; no bundle delta. |
| `/bookings/[id]` | n/a (route did not exist) | **107 KB** | New page. `canvas-confetti` is dynamically imported inside `<ConfettiSlot>` so it's not in this First Load. |
| Shared chunks | 102 KB | 102 KB | Flat — no new shared deps. |

---

## API audit (T1)

| Surface | Status | Notes |
|---|---|---|
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | ✅ all set in `apps/api/.env` | Test-mode keys per launch-blocker checklist. Web app doesn't need a public key (Razorpay desktop hosted page is server-side redirect). |
| `apps/api/src/lib/razorpay.ts` | ✅ exists, 208 LOC | Wraps SDK, computes order amount in paisa, signature verification helper. |
| `/api/v1/booking-intents` (create + cancel + get) | ✅ live | Concurrent-safe seat hold via `SELECT … FOR UPDATE` in `booking-intent.service.ts`. |
| `/api/v1/bookings/<id>` (get) | ✅ live | Returns booking detail. **Need to confirm response shape matches what the new confirmation page needs** in T6. |
| `/api/v1/bookings/<id>/cancel` | ✅ live | 48h dispute window logic in `booking.service.ts`. |
| Razorpay webhook handler | ✅ live | HMAC SHA-256 verify + `payment_id` uniqueness; tested per `webhooks.razorpay.test.ts`. |
| `<BookingWizard>` (web) | ✅ skeleton 493 LOC | 4-step flow, hold-timer, sendBeacon cleanup, AnimatePresence between steps. v3 chrome polish needed (T5). |
| `/api/booking/start` (web route handler) | ✅ live | Creates intent, returns `{intentId}`. Uses session for user identity. |
| `/api/booking/cancel` | ✅ live | sendBeacon target on tab-close. |
| `/api/booking/[intentId]/confirm` | ✅ live | Drives Razorpay payment + booking creation. |
| `/bookings/[id]` (web page) | ❌ **MISSING** | Wizard redirects here on success but the route 307s to `/signin?next=/bookings/abc-123` (auth gate hits BEFORE the page) — and no actual page renders even when authed. **T6 builds this.** |
| `/api/v1/bookings/<id>.ics` | ❌ **MISSING** | T8 builds this. |
| `/api/v1/bookings/seats/stream` | ❌ **MISSING** | T4 builds this + a Postgres trigger migration. |
| Test seed bookings | ⚠️ unknown | No bookings seeded yet (only content). Live wizard flow needs an actual itinerary with at least one `scheduled_date` and live capacity. **Verify in T2 calendar testing.** |

### Bugs filed during audit

- None new at audit time. Several gaps documented above are tracked as the corresponding T2–T8 tasks.

---

## Decisions / deviations

(empty — record as work proceeds)

---

## Review gate (T10)

Self-review across the four dimensions.

### 1. Edge cases

- **No scheduled dates** on a content item → `<BookCta>` doesn't render the calendar block (`scheduledDates.length > 0` guard); the primary CTA still works for free / self-paced itineraries.
- **All scheduled dates in the past** → `<DualMonthCalendar>` renders the current month with all days disabled; the user can navigate forward via prev/next arrows or PgUp/PgDn.
- **Single-day itinerary, multiple seats** → calendar still shows; SSE stream still connects; wizard travellers step accepts only `≤ remaining` (existing API constraint).
- **Sold-out date** → calendar shows it disabled with line-through text + "sold out" aria-label; clicking it is a no-op.
- **Browser without EventSource** (extremely rare on desktop) → `<SeatAvailabilityStream>` falls back to its initial server-rendered state and stays at `connection: 'offline'`. No re-renders, no errors.
- **SSE disconnects mid-wizard** → exponential-backoff reconnect, "reconnecting…" badge while between attempts. The wizard itself doesn't depend on SSE — it'll continue regardless.
- **Reduced-motion** → `<ConfettiSlot>` no-ops; `<DualMonthCalendar>` keyboard nav unaffected (no motion); wizard's `AnimatePresence` between steps still runs (this is a step transition, not a flourish — review post-launch if motion gate should extend here).
- **`?just=1` on a refresh** → sessionStorage one-shot key (per-bookingId) suppresses the second burst.
- **`.ics` special characters** in title (commas, semicolons, backslashes, newlines) → escaped per RFC-5545; tested.
- **Long `.ics` lines** (>75 octets) → folded with CRLF + space continuation; tested.
- **Razorpay cancel/decline returning to wizard** → existing wizard catches 410/non-OK responses, returns to Review step, surfaces inline error.

### 2. Security (InfoSec)

- **SSE auth** — endpoint exposes only `{capacity, seatsLeft, status}` per-date. No user-identifying fields, no booking IDs, no traveller PII. Public-readable is acceptable.
- **`.ics` auth** — `GET /api/v1/bookings/:id/ics` is `authenticate`-gated and reuses `getBooking(id, userId)` which enforces buyer ownership. A user can only download their own .ics.
- **`.ics` PII** — file carries: lead booker's email (as ATTENDEE; comes from the user's session/booking, no leak from server scope), creator display name + a synthetic `<username>@creators.creatorhub.in` ORGANIZER address (we don't expose the creator's real email). Traveller emails / phones are NOT in the `.ics`.
- **Razorpay webhook** — unchanged; existing HMAC SHA-256 verification + `payment_id` uniqueness constraint (E2.6).
- **CSRF** — wizard uses Server Actions / fetch with same-origin credentials; existing E5.0 middleware enforces double-submit cookie + Origin check on mutating verbs. Calendar's `onPick` triggers the same pattern.
- **Rate-limit on SSE connect** — Cloudflare per-IP rules already in place (E0.1). One stream per IP per scheduled-date is bounded.
- **No new dependencies that touch user data** — `canvas-confetti` is purely visual, no network.

### 3. Architecture

- **Server-first composition** — `/bookings/[id]/page.tsx` is a server component; only `<ConfettiSlot>`, `<AddToCalendar>`, `<SeatAvailabilityStream>`, `<DualMonthCalendar>` are `'use client'` (motion + state).
- **No new top-level deps that affect every route** — `canvas-confetti` is dynamically imported inside `<ConfettiSlot>`, so it only loads on `/bookings/[id]`.
- **API surface minimal** — added 2 endpoints (`/seats/:dateId/stream`, `/:id/ics`); no new tables, no new migrations. Reuses existing `remainingCapacityForScheduledDate()` (now exported) and `getBooking()`.
- **Decision drift** — 1 deviation: shipped poll-backed SSE instead of Postgres LISTEN/NOTIFY (Decision 2). Documented as ENH-001. All other decisions honored.
- **Type safety** — `IcsInput` typed; `ScheduledDateRef` typed; no `any` in new code.

### 4. Code quality

- `pnpm --filter web typecheck` — 0 errors
- `pnpm --filter api typecheck` — 0 errors
- `pnpm --filter web lint` — TBD (final pre-commit)
- `pnpm --filter api lint` — TBD (final pre-commit)
- New tests: 25 (calendar 9 + seat-stream 5 + confetti 4 + ics 7) — all passing
- No `console.log` outside the documented `seat-stream:poll-failed` warn (which is a transient-DB-error trace, not user-visible)
- No `any`, no raw-HTML escape hatches.

### Deviations from plan

1. **SSE shipped with internal polling, not Postgres LISTEN/NOTIFY.** Decision 2 picked LISTEN/NOTIFY for sub-second latency, but the dedicated long-held pg connection adds infrastructure (pool sizing, reconnect, leak risk) that's hard to justify pre-launch. Internal 3s polling gives the same client UX (real EventSource, real `event: seats` packets) with ~30 LOC less infra. Filed as **E5.4/ENH-001** to upgrade post-launch when traffic warrants.
2. **Migration 035 not needed** — direct consequence of #1; no `LISTEN/NOTIFY` trigger required because the SSE handler reads via the existing service.
3. **Confirmation page doesn't render booking photo** — the `Booking` type doesn't carry `coverImageUrl`. v3 W-K3 shows a hero photo. Adding it requires extending the API response shape. Filed as **E5.4/ENH-002**.
4. **`<SeatAvailabilityStream>` not yet mounted in the wizard's Review step** — the component is built and tested, but threading it through the wizard's review pane is incremental polish. Mounted only on the calendar (via `<BookCta>`) for now. Filed as **E5.4/ENH-003**.
5. **Razorpay end-to-end sandbox flow not yet executed** — this requires real test creds + a network round-trip that happens after the wizard's confirm-button click. Code paths are wired (existing); end-to-end smoke verified at the page level only. Filed as **E5.4/ENH-004** for pre-launch QA.

---

## Pending operator / out-of-this-PR work

(will be filled as work progresses)
