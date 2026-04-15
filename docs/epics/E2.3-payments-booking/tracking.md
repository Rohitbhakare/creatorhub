# E2.3 — Payments & Booking — Tracking

> Status: **DONE**
> Detail per task lives here. Master dashboard: `docs/epics/TRACKING.md`.

---

## Status

| Field | Value |
|-------|-------|
| Epic | E2.3 Payments & Booking |
| Milestone | M2 |
| Status | `DONE` |
| Plan approved | `[x]` Yes |
| Implementation started | `[x]` Yes |
| Implementation complete | `[x]` Yes |
| Committed | `[x]` Yes — commit `dev` branch |

---

## Task Status

| ID | Task | Agent | Status | Tests | Notes |
|----|------|-------|--------|-------|-------|
| T1 | `money.ts` utils (`calculateBookingAmounts` — 17% fee + 18% GST + 1% TDS, all in paisa) | Shared | `DONE` | — | |
| T2 | `booking.service.ts` (createBooking Razorpay order + atomic capacity, confirmPayment HMAC verify, getBooking, listUserBookings, completeBooking) | API | `DONE` | `[x]` 27/27 | `booking.service.test.ts` |
| T3 | Booking handlers + routes (`/api/v1/bookings`) | API | `DONE` | — | |
| T4 | Booking service tests (27 tests — lifecycle, capacity, HMAC) | API | `DONE` | `[x]` 27/27 | |
| T5 | `booking_provider.dart` (Riverpod 3.x Notifier — state machine, payment orchestration) | Mobile | `DONE` | — | |
| T6 | `BookingSheet` (price breakdown: base + platform fee + GST + TDS, Razorpay integration) | Mobile | `DONE` | — | UPI first |
| T7 | `BookingConfirmationScreen` (booking ID, QR code, calendar add, share) | Mobile | `DONE` | — | |
| T8 | `MyBookingsScreen` (upcoming / past / cancelled tabs, cancel CTA) | Mobile | `DONE` | — | |
| T9 | Add `/bookings`, `/bookings/:id`, `/bookings/:id/confirmation` routes | Mobile | `DONE` | — | |

---

## Pre-Commit Checklist

- `[x]` All tests passing
- `[x]` `tsc --noEmit` — 0 errors
- `[x]` `flutter analyze` — 0 errors
- `[x]` API boots — `/healthz` 200
- `[x]` Flutter launches — no crash
- `[x]` Tracking updated

---

## Test Coverage

| File | Tests | Passing |
|------|-------|---------|
| `apps/api/src/services/booking.service.test.ts` | 27 | `[x]` 27/27 |

**Total: 27 API tests — all passing**

---

## Notes

- All monetary amounts stored and computed in paisa (integer). Never use floats for money.
- Razorpay HMAC verification uses `crypto.createHmac('sha256', RAZORPAY_KEY_SECRET)` over `orderId|paymentId`.
- Capacity decrement uses a Postgres transaction to prevent race conditions on concurrent bookings.
- UPI is always the default payment method in the Razorpay SDK config.
