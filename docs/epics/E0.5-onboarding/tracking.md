# E0.5 — Tracking

**Status:** DONE (with open bugs + enhancement)
**Progress:** 10/10 tasks (100%) + 1 bug open + 1 enhancement open
**Branch:** `dev`
**Last Updated:** 2026-04-15

---

## Tasks

| ID | Task | Status | Notes |
|----|------|--------|-------|
| T1 | Welcome Screen | `[x]` Done | Branding + Get Started + Sign In + Browse as Guest |
| T2 | Progress Bar Component | `[x]` Done | 4-segment animated bar, coral fill |
| T3 | Location Capture Screen | `[x]` Done | City search (debounced), GPS placeholder, selection chip |
| T4 | City Search API Endpoint | `[x]` Done | GET /cities (trigram + ILIKE), GET /cities/nearby (PostGIS) |
| T5 | Vertical Picker Screen | `[x]` Done | 2-column grid, 8 verticals, min 3 selection |
| T6 | Verticals API Endpoints | `[x]` Done | GET /verticals (with creator counts), PUT /onboarding/verticals |
| T7 | Suggested Creators Screen | `[x]` Done | Creator list, follow toggle (optimistic), skip |
| T8 | Suggested Creators API Endpoint | `[x]` Done | GET /onboarding/suggested-creators, POST/DELETE follow |
| T9 | Onboarding Complete Flow | `[x]` Done | Celebration screen, POST /onboarding/complete, auto-navigate |
| T10 | Onboarding State Management | `[x]` Done | Riverpod 3.x Notifier<OnboardingState>, 5-step tracking |

---

## Review Gate

| Review | Status | Findings |
|--------|--------|----------|
| Edge Cases | `[x]` Passed | Covered: empty search, GPS failure, min 3 verticals, skip creators |
| Security | `[x]` Passed | Auth-protected endpoints, parameterized SQL, input validation |
| Architecture | `[x]` Passed | Handler→service→query pattern, Riverpod 3.x Notifier |
| Code Quality | `[x]` Passed | 0 flutter analyze issues, 0 TypeScript errors |

---

## Bugs & Enhancements

| ID | Type | Title | Status | Severity | SRS Ref |
|----|------|-------|--------|----------|---------|
| BUG-001 | Bug | Location "Continue" does nothing — no navigation to next screen | `FIXED` | P0 | ONB-FR-002 |
| BUG-002 | Bug | Auth emulator tokens rejected by API (missing `FIREBASE_AUTH_EMULATOR_HOST`) | `FIXED` | P0 | IAM-FR-001 |
| FEAT-001 | Enhancement | Popular cities 3x3 grid with landmark icons on location screen | `OPEN` | — | NOT IN SRS |

Details: `docs/epics/E0.5-onboarding/bugs/`

---

## Changelog

| Date | Change |
|------|--------|
| 2026-04-12 | Epic created, 10 tasks defined |
| 2026-04-12 | All 10 tasks completed via 4 parallel agents (API + 3 Flutter). flutter analyze: 0 issues, tsc: 0 errors |
| 2026-04-15 | BUG-001 filed: Location screen Continue button has no navigation. BUG-002 filed+fixed: Auth emulator env var missing. FEAT-001 filed: Popular cities grid (not in SRS — founder-directed enhancement) |
