# E2.1 — Scheduled Experiences — Tasks

> Epic status: **DONE**
> Plan: `docs/epics/E2.1-scheduled-experiences/plan.md`

---

## Task Breakdown

| ID | Task | Platform | Description |
|----|------|----------|-------------|
| T1 | `experience.service.ts` | API | `createDraft`, `getDetail` (T-24h host reveal), `updateExperience`, `setMeetingPoint`, `publishExperience` (KYC gate via `requireKYC` middleware) |
| T2 | `scheduled-dates.service.ts` | API | `addDate`, `updateDate`, `deleteDate` (soft-delete if bookings exist), `listDates` with availability counts |
| T3 | Experience handlers + routes | API | Full CRUD at `/api/v1/experiences`; date management at `/api/v1/experiences/:id/dates` |
| T4 | Experience service tests | API | `experience.service.test.ts` — 27 tests covering all service functions |
| T5 | Scheduled dates service tests | API | `scheduled-dates.service.test.ts` — 26 tests including soft-delete and capacity edge cases |
| T6 | `experience_provider.dart` | Mobile | Riverpod 3.x Notifier — experience detail, draft state, publish flow |
| T7 | `ExperienceDetailScreen` | Mobile | Host reveal banner (T-24h), meeting point map pin, booking CTA, skeleton loading |
| T8 | `CreateExperienceWizard` | Mobile | 6-step wizard: Basics → Itinerary → Meeting Point → Dates → Pricing → Review |
| T9 | Router wiring | Mobile | Add `/experiences/:id` and `/create/experience` routes to `router.dart` |

---

## Test Files

| File | Tests |
|------|-------|
| `apps/api/src/services/experience.service.test.ts` | 27 |
| `apps/api/src/services/scheduled-dates.service.test.ts` | 26 |

**Total: 53 API tests**
