# E2.1 — Scheduled Experiences (Creation + Detail)

> **SRS refs:** CRT-FR-005, CRT-FR-013 (events already built — experiences differ by having dates + capacity + pricing)
> **Depends on:** E1.1 (content framework), E1.2 (posts pattern), E2.2 (KYC — required for paid)
> **Blocked by:** KYC (E2.2) for paid experiences. Free experiences can ship independently.

---

## Market Research — Experience Listing UX

### Airbnb Experiences
- **Creation:** Multi-step wizard: What you'll do → Where → Who can come → Pricing → Photos → Requirements → Review.
- **Date scheduling:** Calendar picker for available dates. Set capacity per date. Recurring dates supported.
- **Detail page:** Large hero image, host info, itinerary timeline, what's included/excluded, reviews, location map, booking CTA pinned at bottom.

### Viator / GetYourGuide
- **Scheduling:** Calendar with availability dots. Time slots per date. Real-time availability.
- **Detail:** Gallery, description, highlights, what's included, meeting point, cancellation policy, reviews.

### CreatorHub Approach
- **Creation wizard:** Extends E1.1 wizard framework. Steps: Basics → Itinerary (reuse spot builder from E1.3) → Dates & Capacity → Pricing → Media → Review.
- **Dates:** Calendar picker. Each date has capacity. Multiple dates allowed. Auto-close when full.
- **Detail page:** Hero image, creator card, day-by-day itinerary (reuse from E1.3), dates grid, price + Book CTA (sticky bottom), what's included, meeting point (revealed T-24h per SRS).
- **Capacity:** Per-date capacity with spots_booked counter. 10-min seat hold (BK-FR-007).

---

## Task Breakdown

| ID | Task | Platform | Est. Tests |
|----|------|----------|-----------|
| T1 | Experience Zod schemas + shared types | Shared | — |
| T2 | Scheduled dates service (CRUD dates, capacity management) | API | ~12 |
| T3 | Experience service (create draft, get detail, publish with KYC check) | API | ~15 |
| T4 | Experience handlers + routes | API | ~12 |
| T5 | Experience creation wizard (extends E1.1 shell — dates + capacity step) | Mobile | — |
| T6 | Date picker component (calendar with availability, capacity per date) | Mobile | — |
| T7 | Experience detail screen (itinerary timeline, dates grid, booking CTA) | Mobile | — |
| T8 | Experience feed card (date badge, price, capacity indicator) | Mobile | — |
| T9 | API tests | API | ~39 total |

**Estimated total: ~39 API tests**

---

## Key UX Decisions

1. **Dates grid on detail page:** Show next 3 available dates prominently. "See all dates" expands calendar. Full dates show "Sold out" pill.
2. **Meeting point:** Hidden until T-24h before departure. Detail page shows "Exact location shared 24h before" placeholder.
3. **Capacity indicator:** "X spots left" in amber when < 30% remaining. "Last spot!" in red when 1 left.
4. **Price display:** "From ₹X,XXX per person" with GST included badge.

## Definition of Done

- [ ] Experience creation wizard with dates + capacity step
- [ ] Experience detail page with itinerary + dates + booking CTA
- [ ] Scheduled dates CRUD API
- [ ] ~39 API tests passing
- [ ] Feed card renders for experiences
- [ ] `flutter analyze` 0 issues, `tsc --noEmit` 0 errors
