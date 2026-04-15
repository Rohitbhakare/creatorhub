# E3.1 — E2E Tests — Tracking

| Field | Value |
|-------|-------|
| Epic | E3.1 — End-to-End Tests (Patrol + flutter_gherkin) |
| Milestone | M3 — Quality & Launch Readiness |
| Status | IN PROGRESS — Planning phase complete |
| Started | 2026-04-16 |
| Target | 2026-04-23 |

---

## Progress

### Planning Phase (DONE)
- [x] T1: Feature files written — 11 `.feature` files, 38 scenarios

### Build Phase (NOT STARTED)
- [ ] T2: pubspec.yaml + patrol.yaml dependencies
- [ ] T3: Support infrastructure (AppWorld, AppDriver, TestData, ApiHelper)
- [ ] T4: Global hooks (beforeScenario / afterScenario cleanup)
- [ ] T5: Step definitions — Auth + Navigation
- [ ] T6: Step definitions — Content + Social
- [ ] T7: Step definitions — Creation + Profile
- [ ] T8: Step definitions — Booking + KYC
- [ ] T9: Steps registry (central import)
- [ ] T10: Integration test runner (GherkinFlutterTestRunner)
- [ ] T11: Semantic widget keys on production widgets
- [ ] T12: CI/CD pipeline (.github/workflows/e2e.yml)
- [ ] T13: Staging seed data migration (009_e2e_test_seed.sql)

---

## Pre-Commit Checklist (fill before marking DONE)

- [ ] `patrol test` runs all 38 scenarios on Android emulator without error
- [ ] `patrol test` runs all 38 scenarios on iOS simulator without error
- [ ] All 38 scenarios PASS (green)
- [ ] No scenario is marked @skip without a linked issue
- [ ] `flutter analyze` still 0 errors/warnings after T11 key additions
- [ ] CI pipeline passes on first push to `dev`
- [ ] `test_results/*.json` artifact uploaded in CI

---

## Known Risks

| Risk | Mitigation |
|------|-----------|
| Staging Firebase Auth test phones not configured | Founder must add test phone numbers in Firebase Console before T5 build |
| Razorpay WebView automation brittle | Have fallback: skip booking payment step with `@skip` tag, document as known gap |
| flutter_gherkin 4.x + Patrol 3.x version conflict | Pin exact versions; test on clean `flutter pub get` before T5 |
| Seed data UUIDs hardcoded — risk if staging DB reset | Seed migration is idempotent (INSERT ... ON CONFLICT DO NOTHING) |
