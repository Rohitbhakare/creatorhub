# E2.3 — Payments & Booking Flow

> **SRS refs:** BOOK-FR-001–007, BK-FR-007–015
> **Depends on:** E2.1 (scheduled experiences), E2.2 (KYC), E2.6 (tax — GST/TDS calculations)
> **Critical path:** Revenue-generating feature. Razorpay Route approval needed.

---

## Market Research — Booking & Payment UX (India)

### Razorpay Checkout (standard in India)
- **UPI-first:** Pre-selects UPI. Shows GPay, PhonePe, Paytm buttons. QR code fallback.
- **Flow:** Amount summary → UPI app selection → redirect to UPI app → return → confirmation.
- **Escrow (Route):** Payment splits automatically. Platform keeps fee, creator gets payout after completion.

### MakeMyTrip / Goibibo
- **Booking summary:** Clear price breakdown (base + taxes + fees). Coupon code field.
- **Seat hold:** "This price is available for 15:00 minutes" countdown timer.
- **Post-booking:** Confirmation page + WhatsApp message + email with booking details + PDF ticket.

### CreatorHub Approach
- **Booking flow:** Select date → seat hold (10 min) → price breakdown (base + GST 18%) → Razorpay Checkout (UPI default) → confirmation → WhatsApp confirmation.
- **State machine:** pending_payment → paid → confirmed → departing_soon → in_progress → completed → reviewed.
- **Escrow:** Razorpay Route holds payment. Creator payout after completion + 48h dispute window.
- **Two-section bookings list:** "Your next trips" (upcoming scheduled) + "Your library" (purchased itineraries).

---

## Task Breakdown

| ID | Task | Platform | Est. Tests |
|----|------|----------|-----------|
| T1 | Booking schemas + types (booking, booking_intent, payment) | Shared | — |
| T2 | Booking service (create intent, confirm payment, cancel, state transitions) | API | ~20 |
| T3 | Seat hold service (10-min TTL, cleanup cron, spots_booked management) | API | ~8 |
| T4 | Razorpay integration service (create order, verify payment, Route setup) | API | ~10 |
| T5 | Payment webhook handler (Razorpay webhook → confirm booking) | API | ~8 |
| T6 | Booking handlers + routes | API | ~12 |
| T7 | Booking flow screen (date selection → summary → payment → confirmation) | Mobile | — |
| T8 | Price breakdown component (base + GST + total, formatted in INR) | Mobile | — |
| T9 | Razorpay Checkout integration (Flutter plugin, UPI-first config) | Mobile | — |
| T10 | Booking confirmation screen (success animation, WhatsApp link, booking details) | Mobile | — |
| T11 | My Bookings screen (two-section: upcoming trips + library) | Mobile | — |
| T12 | Booking detail screen (status pill, itinerary, meeting point, refund info) | Mobile | — |
| T13 | Seat hold timer UI (countdown, expired state) | Mobile | — |
| T14 | Booking providers (booking list, booking detail, payment state) | Mobile | — |
| T15 | API tests | API | ~58 total |

**Estimated total: ~58 API tests**

---

## Key UX Decisions

1. **Price breakdown:** Show "₹X,XXX" base + "₹XXX GST (18%)" + "₹X,XXX Total" — always in INR, formatted with Indian grouping.
2. **Seat hold countdown:** Prominent timer on booking screen. Red at < 2 minutes. "Hold expired" screen with retry CTA.
3. **Post-booking:** Confetti animation → booking summary → "Share on WhatsApp" prominent CTA → "View in My Bookings".
4. **Bookings list:** Two sections never mixed. Upcoming sorted by start_date ASC. Library sorted by purchase_date DESC.
5. **Meeting point:** "Exact location shared 24h before departure" until T-24h.

## Definition of Done

- [ ] End-to-end booking: select date → hold → pay → confirm
- [ ] Razorpay Checkout integration (sandbox)
- [ ] Seat hold (10 min) with cleanup
- [ ] Payment webhook handler
- [ ] Booking state machine (11 states)
- [ ] My Bookings screen (two sections)
- [ ] WhatsApp booking confirmation
- [ ] ~58 API tests passing
- [ ] `flutter analyze` 0, `tsc --noEmit` 0
