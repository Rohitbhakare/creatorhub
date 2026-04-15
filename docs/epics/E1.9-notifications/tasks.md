# E1.9 — Notifications · Task Breakdown

## Tasks

| ID | Task | Platform | Est. Tests |
|----|------|----------|-----------|
| T1 | Notification preferences service | API | ~10 |
| T2 | Device registration service | API | ~6 |
| T3 | Push notification sender (FCM) | API | ~8 |
| T4 | Notification handlers + routes | API | ~8 |
| T5 | Notification preferences screen (6×3 matrix + DND) | Mobile | — |
| T6 | Notification providers + FCM setup | Mobile | — |
| T7 | Wire into You tab settings + router | Mobile | — |
| T8 | Wire push triggers in social service | API | — |
| T9 | API tests | API | ~32 total |

## Dependency Graph

- T1 + T2 can run in parallel (no file conflicts)
- T3 depends on T1 + T2 (needs preferences + device tokens)
- T4 depends on T1 + T2
- T8 depends on T3 (needs push sender)
- T5 + T6 can run in parallel (different files)
- T7 depends on T5 + T6

## Phase Plan

**Phase 1 — API (T1–T4, T8, T9):** All services, handlers, routes, push sender, tests.
**Phase 2 — Mobile (T5–T7):** Preferences screen, providers, FCM setup, router wiring.
