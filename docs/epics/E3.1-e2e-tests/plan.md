# E3.1 — End-to-End Tests (Patrol + flutter_gherkin BDD)

> Epic plan written before implementation. Test cases (BDD feature files) are the primary deliverable of this planning phase and exist at `apps/mobile/integration_test/features/`.

---

## 1. Overview

E3.1 adds a complete E2E test suite that exercises every major user journey through the live Flutter app against a staging API. Tests are written in BDD Gherkin syntax (`.feature` files) using `flutter_gherkin` 4.x and executed by `Patrol` 3.x — which provides native-level interaction (system dialogs, permissions, camera, deep links) that the base `integration_test` package cannot reach.

The suite serves three purposes:
1. **Regression safety** — catch regressions before every release
2. **Launch readiness proof** — every M0+M1+M2 user journey verified end-to-end
3. **Living documentation** — Gherkin scenarios are readable by non-engineers and map directly to SRS requirements

All 11 feature files and every scenario are written *before* any implementation code (step definitions, runner, CI config). This is the BDD contract that the implementation must satisfy.

---

## 2. SRS Requirements Validated

This epic does not implement new features. It validates existing feature requirements end-to-end.

| Journey | SRS IDs validated |
|---------|-------------------|
| Auth | IAM-FR-001–004, IAM-FR-008–010 |
| Onboarding | ONB-FR-001–011 |
| Home Feed | DISC-FR-001–010, DISC-FR-031–037 |
| Content Discovery | DISC-FR-007, CRT-FR-001–005 |
| Social | SOC-FR-001–011 |
| Content Creation | CRT-FR-001–004, CRT-FR-007–013 |
| Profile | PROF-FR-001–010 |
| Saved Lists | SOC-FR-007–009 |
| Studio | STUD-FR-001–004 |
| Booking | BOOK-FR-001–007 |
| KYC | KYC-FR-001–010 |

---

## 3. Test Stack

| Tool | Version | Role |
|------|---------|------|
| `patrol` | ^3.4.0 | Native interaction driver (permissions, system dialogs, notifications, deep links) |
| `flutter_gherkin` | ^4.0.0 | BDD syntax engine — parses `.feature` files, matches step definitions |
| `integration_test` | Flutter SDK | Underlying integration test bridge |
| `patrol_cli` | latest | CLI tool: `patrol test` command that drives Patrol on device/emulator |

### Integration Architecture

```
.feature files  →  flutter_gherkin parser  →  step definitions (Dart)
                                                       │
                                        PatrolIntegrationTester ($)
                                                       │
                                     native interaction (permissions, dialogs)
                                     + WidgetTester (pump, tap, find)
```

Step definitions receive `PatrolIntegrationTester` (which extends `WidgetTester`) via a shared `AppWorld` context. This gives each step access to both flutter_gherkin's matcher API and Patrol's native automation.

### Why Patrol over plain `integration_test`

| Need | `integration_test` | Patrol |
|------|--------------------|--------|
| Tap permissions dialog (camera, location) | Cannot reach native UI | `$.native.grantPermissionWhenInUse()` |
| Handle iOS/Android system alerts | Cannot | `$.native.dismissAlert()` |
| Run on Firebase Test Lab with video | Partial | Full support |
| Interact with Razorpay WebView | Limited | `$.native.tap(Selector(text: 'Pay'))` |
| Reliable `pump` + native settle | Manual polling | `$.pumpAndSettle()` with retry |

---

## 4. Test Environment

| Environment | Purpose | Base URL |
|-------------|---------|---------|
| **staging** | E2E tests run here | `https://api-staging.creatorhub.in` |
| **local** | Dev smoke runs | `http://localhost:3001` |

### Test Data Strategy

Tests use **pre-seeded, stable test users** in the staging DB. No test creates or deletes real users — this prevents flaky teardown. Transactional content (posts, bookings, reviews) IS created by tests and cleaned up in `afterScenario` hooks via direct API calls using a service-role key.

Test user roster (defined in `support/test_data.dart`):

| Handle | Role | Purpose |
|--------|------|---------|
| `@e2e_traveler` | Traveler (no content) | Discovery, booking, social journeys |
| `@e2e_creator` | Creator (KYC verified) | Studio, content creation journeys |
| `@e2e_creator_unkyc` | Creator (KYC not started) | KYC journey |
| `@e2e_booker` | Traveler (with existing booking) | Booking confirmation, review journeys |

All test users have phone numbers in the format `+91 9000 00X XXX` and always receive OTP `123456` in staging (Firebase Auth emulator or staging override).

---

## 5. Architecture Decisions

| Decision | Chosen approach | Rejected alternative | Rationale |
|----------|----------------|---------------------|-----------|
| BDD engine | `flutter_gherkin` | Custom Patrol-only test files | Gherkin feature files are the required deliverable; readable by founder/stakeholders |
| Step registry | Central `steps_registry.dart` imports all step files | Auto-discovery | flutter_gherkin 4.x requires explicit step registration; auto-discovery has ESM-style issues |
| PatrolTester access in steps | Via `AppWorld.patrol` field on the shared world context | Patrol-native test per scenario | World context is already how flutter_gherkin passes state between steps; adding `patrol` field is idiomatic |
| OTP entry in staging | Firebase Auth with test phone numbers (OTP = `123456`) | SMS interception | Deterministic; no SMS costs; standard practice for staging |
| Razorpay sandbox in booking | Use Razorpay test UPI (`success@razorpay`) | Skip payment test | Real payment flow must be exercised at least once; test UPI triggers success deterministically |
| Test content IDs | Hardcoded UUIDs in `test_data.dart` seeded to staging DB | Dynamic lookup before each test | Faster; no dependency on search/list endpoints in test setup |
| Parallelism | Scenarios run sequentially per device; multiple devices in parallel on Test Lab | All parallel | flutter_gherkin 4.x + Patrol does not support intra-device scenario parallelism yet |

---

## 6. Feature File Coverage

All 11 feature files live at `apps/mobile/integration_test/features/`. They are the test cases — written now, implemented in the build phase.

| File | Scenarios | Journeys covered |
|------|-----------|-----------------|
| `F01_auth.feature` | 4 | Phone OTP login, guest mode, soft auth wall |
| `F02_onboarding.feature` | 3 | Full flow, skip creators, location step |
| `F03_home_feed.feature` | 5 | Feed sections, vertical filters, near-you |
| `F04_content_discovery.feature` | 4 | Post / itinerary / event / experience detail |
| `F05_social.feature` | 4 | Like, save, follow, share |
| `F06_content_creation.feature` | 4 | Create post, itinerary, event; guest redirect |
| `F07_profile.feature` | 3 | Own profile, edit name, view other profile |
| `F08_saved_lists.feature` | 3 | Save to new list, view list, remove item |
| `F09_studio.feature` | 2 | Studio tab, content list |
| `F10_booking.feature` | 3 | Book experience (Razorpay sandbox), confirmation, my bookings |
| `F11_kyc.feature` | 3 | KYC status screen, start wizard, PAN validation |
| **Total** | **38** | **Full MVP journey coverage** |

---

## 7. Directory Structure

```
apps/mobile/
├── integration_test/
│   ├── features/                        # BDD feature files — test cases (written NOW)
│   │   ├── F01_auth.feature
│   │   ├── F02_onboarding.feature
│   │   ├── F03_home_feed.feature
│   │   ├── F04_content_discovery.feature
│   │   ├── F05_social.feature
│   │   ├── F06_content_creation.feature
│   │   ├── F07_profile.feature
│   │   ├── F08_saved_lists.feature
│   │   ├── F09_studio.feature
│   │   ├── F10_booking.feature
│   │   └── F11_kyc.feature
│   │
│   ├── steps/                           # Step definitions (implemented in build phase)
│   │   ├── steps_registry.dart          # Central import + export of all steps
│   │   ├── auth_steps.dart             # Phone OTP, OTP entry, guest mode
│   │   ├── navigation_steps.dart       # Screen assertions, tab navigation
│   │   ├── content_steps.dart          # View post/itinerary/event/experience
│   │   ├── social_steps.dart           # Like, save, follow, share
│   │   ├── creation_steps.dart         # Create post, itinerary, event
│   │   ├── profile_steps.dart          # View/edit profile
│   │   ├── booking_steps.dart          # Book, confirm, view bookings
│   │   └── kyc_steps.dart              # KYC wizard steps
│   │
│   ├── support/
│   │   ├── app_world.dart              # Shared World: holds PatrolTester + state
│   │   ├── app_driver.dart             # App bootstrap (ProviderScope + App)
│   │   ├── test_data.dart              # Test user credentials + seed content IDs
│   │   └── api_helper.dart             # Staging API client for beforeScenario setup
│   │
│   ├── hooks/
│   │   └── global_hooks.dart           # beforeScenario (seed), afterScenario (cleanup)
│   │
│   └── integration_test_runner.dart    # Main entry point — GherkinFlutterTestRunner
│
└── patrol.yaml                         # Patrol configuration (app ID, timeout, etc.)
```

---

## 8. Security Considerations

| Risk | Mitigation |
|------|-----------|
| Test credentials committed to repo | `test_data.dart` reads from env vars (`TEST_USER_PHONE`, `TEST_OTP_SECRET`) when running in CI; hardcoded only in local dev config file excluded from git |
| Service-role key used in teardown hooks | Key stored in CI secret `SUPABASE_SERVICE_ROLE_KEY`; never in source |
| Razorpay test payment in staging | Uses test UPI ID — cannot move real money; staging Razorpay keys only |
| Staging DB polluted by failed tests | `afterScenario` hook always runs (even on failure); deletes by `test_run_id` tag |

---

## 9. Edge Cases & Error States Tested

- [ ] App launched with no network → sees offline error on home feed load
- [ ] OTP entry with wrong code → error message shown, retry available
- [ ] OTP expired → user can re-request
- [ ] Content creation without auth → redirected to `/auth`
- [ ] Booking at full capacity → "Sold Out" state visible on experience detail
- [ ] KYC required modal shown when non-KYC creator tries to publish paid content
- [ ] Soft auth wall shown when guest taps like/follow

---

## 10. CI/CD Integration Plan

```yaml
# .github/workflows/e2e.yml (written in T12)
name: E2E Tests
on:
  push:
    branches: [dev, main]
  schedule:
    - cron: '0 2 * * *'      # Nightly at 2AM IST

jobs:
  e2e-android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: subosito/flutter-action@v2
      - run: dart pub global activate patrol_cli
      - run: patrol test --target integration_test/integration_test_runner.dart
                         --device emulator-5554
        env:
          STAGING_API_URL: ${{ secrets.STAGING_API_URL }}
          TEST_USER_PHONE: ${{ secrets.TEST_USER_PHONE }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

Firebase Test Lab integration is Phase 2 (post-launch): run on real Android + iOS devices, capture video of each failing scenario.

---

## 11. Open Questions

| # | Question | Resolution |
|---|----------|-----------|
| 1 | Does staging Firebase Auth emulator accept test OTP `123456`? | Use Firebase Auth test phone numbers — these bypass SMS and always accept `123456` |
| 2 | Can flutter_gherkin 4.x step definitions access `PatrolTester`? | Yes — via `AppWorld` context that holds `patrol` field; steps cast world to `AppWorld` |
| 3 | Razorpay WebView — can Patrol automate it? | Yes, Patrol's `$.native.tap(Selector(text: ...))` reaches WebView DOM via native accessibility tree |
| 4 | Scenario isolation: does booking state bleed between tests? | No — `afterScenario` hook deletes all content tagged `test_run_id={runId}` via service-role DELETE |
| 5 | iOS vs Android step differences? | Patrol's `$.native` API is platform-unified; any platform-specific branching done inside step via `$.nativeAutomator.isAndroid` |

---

## 12. Pre-Implementation Checklist

**Before writing a single step definition:**
- [x] All 11 feature files written with complete Gherkin scenarios
- [x] Test data strategy defined (stable test users + cleanup hooks)
- [x] AppWorld interface designed
- [x] Directory structure created
- [ ] Staging API deployed with test phone numbers configured
- [ ] `patrol_cli` installed: `dart pub global activate patrol_cli`
- [ ] Emulator or physical device connected: `patrol devices`

---

*Plan written: 2026-04-16*
*Author: Claude Sonnet 4.6 (Opus-grade planning pass)*
*Approval required before build phase begins.*
