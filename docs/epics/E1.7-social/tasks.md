# E1.7 — Social · Task Breakdown

## Tasks

| ID | Task | Platform | Est. Tests |
|----|------|----------|-----------|
| T1 | Follow/unfollow service + handlers + routes | API | ~15 |
| T2 | Like/unlike service + handlers + routes | API | ~8 |
| T3 | Comment CRUD service + handlers + routes | API | ~18 |
| T4 | Saved lists CRUD + save-to-list service + handlers + routes | API | ~20 |
| T5 | Share tracking service + route | API | ~4 |
| T6 | Follow/unfollow UI (ProfileViewScreen wiring + confirmation sheet) | Mobile | — |
| T7 | Like UI + animation (engagement bars on all detail screens) | Mobile | — |
| T8 | Comment bottom sheet + threading + input bar | Mobile | — |
| T9 | Saved lists screen + list detail screen | Mobile | — |
| T10 | Save-to-list bottom sheet (multi-select) | Mobile | — |
| T11 | Share UI (WhatsApp + native share sheet) | Mobile | — |
| T12 | Wire engagement state into existing detail screens | Mobile | — |
| T13 | API tests for all services | API | ~65 total |

## Dependency Graph

- T1–T5 can run in parallel (all API, no file conflicts)
- T6–T12 depend on T1–T5 being done
- T6–T11 can run in parallel (different screen files)
- T12 depends on T6–T11 (integration wiring)
- T13 runs alongside T1–T5

## Phase Plan

**Phase 1 — API (T1–T5, T13):** Build all services, handlers, routes, and tests.
**Phase 2 — Mobile (T6–T12):** Build all Flutter screens, providers, and wire to API.
