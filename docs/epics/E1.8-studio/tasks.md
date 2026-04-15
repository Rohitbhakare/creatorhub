# E1.8 — Studio Tab · Task Breakdown

## Tasks

| ID | Task | Platform | Est. Tests |
|----|------|----------|-----------|
| T1 | Studio service (alerts, stats, content list) | API | ~12 |
| T2 | Studio handlers + routes | API | ~10 |
| T3 | Studio tab screen (full implementation from wireframe) | Mobile | — |
| T4 | Studio providers (alert, stats, content) | Mobile | — |
| T5 | Wire into router + remove placeholder | Mobile | — |
| T6 | API tests | API | ~22 total |

## Dependency Graph

- T1 → T2 → T6 (API sequential)
- T3 + T4 can run in parallel (different files)
- T5 depends on T3 + T4
- API (T1-T2) and Mobile (T3-T4) can run in parallel

## Phase Plan

**Phase 1 — API (T1, T2, T6):** Studio service, handlers, routes, tests.
**Phase 2 — Mobile (T3, T4, T5):** Studio screen, providers, router wiring.
