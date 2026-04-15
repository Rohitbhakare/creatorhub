# E2.3 — Payments & Booking — Tasks

> Epic status: **DONE**
> Plan: `docs/epics/E2.3-payments-booking/plan.md`

---

## Task Breakdown

| ID | Task | Platform | Description |
|----|------|----------|-------------|
| T1 | `money.ts` utils | Shared | `calculateBookingAmounts` — base price, 17% platform fee, 18% GST on fee, 1% TDS on base; all amounts in paisa |
| T2 | `booking.service.ts` | API | `createBooking` (Razorpay order + atomic capacity decrement), `confirmPayment` (HMAC verify), `getBooking`, `listUserBookings` (cursor), `completeBooking` |
| T3 | Booking handlers + routes | API | `/api/v1/bookings` — create, confirm, list, get; `/api/v1/experiences/:id/bookings` — creator view |
| T4 | Booking service tests | API | `booking.service.test.ts` — 27 tests covering booking lifecycle, capacity, HMAC verification |
| T5 | `booking_provider.dart` | Mobile | Riverpod 3.x Notifier — booking state machine, payment flow orchestration |
| T6 | `BookingSheet` | Mobile | Price breakdown (base + platform fee + GST + TDS), Razorpay payment sheet integration |
| T7 | `BookingConfirmationScreen` | Mobile | Booking ID, QR code, calendar add CTA, share |
| T8 | `MyBookingsScreen` | Mobile | Tabbed (upcoming / past / cancelled), booking card, cancel CTA |
| T9 | Add routes | Mobile | `/bookings`, `/bookings/:id`, `/bookings/:id/confirmation` in `router.dart` |

---

## Test Files

| File | Tests |
|------|-------|
| `apps/api/src/services/booking.service.test.ts` | 27 |

**Total: 27 API tests**
