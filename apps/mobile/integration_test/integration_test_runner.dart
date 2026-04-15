// E2E Test Runner — Patrol + BDD-style step functions
//
// The .feature files in integration_test/features/ serve as living documentation.
// The corresponding step implementations are in integration_test/steps/.
// Each feature area's scenarios live in integration_test/scenarios/.
//
// ══════════════════════════════════════════════════════════════════════════════
// Run all scenarios (requires a connected device/simulator):
//
//   patrol test \
//     --target integration_test/integration_test_runner.dart \
//     --dart-define STAGING_API_URL=https://api-staging.creatorhub.in \
//     --dart-define TEST_TRAVELER_PHONE=9090909090 \
//     --dart-define TEST_CREATOR_PHONE=9090909090 \
//     --dart-define TEST_UNKYC_PHONE=9090909090 \
//     --dart-define TEST_BOOKER_PHONE=9090909090 \
//     --dart-define SUPABASE_SERVICE_ROLE_KEY=<secret>
//
// Run a single feature:
//
//   patrol test --target integration_test/scenarios/auth_scenarios.dart
//
// Run only smoke tests:
//
//   patrol test --target integration_test/integration_test_runner.dart \
//     --tags smoke
//
// Skip slow / Razorpay scenarios in CI:
//
//   patrol test ... --exclude-tags "razorpay,slow"
// ══════════════════════════════════════════════════════════════════════════════

import 'scenarios/auth_scenarios.dart';
import 'scenarios/onboarding_scenarios.dart';
import 'scenarios/feed_scenarios.dart';
import 'scenarios/social_scenarios.dart';
import 'scenarios/creation_scenarios.dart';
import 'scenarios/profile_scenarios.dart';
import 'scenarios/booking_scenarios.dart';
import 'scenarios/kyc_scenarios.dart';

void main() {
  // F01 — Authentication
  authScenarios();

  // F02 — Onboarding Flow
  onboardingScenarios();

  // F03 — Home Feed  |  F04 — Content Discovery
  feedScenarios();

  // F05 — Social Interactions  |  F08 — Saved Lists
  socialScenarios();

  // F06 — Content Creation
  creationScenarios();

  // F07 — User Profile  |  F09 — Creator Studio
  profileScenarios();
  studioScenarios();

  // F10 — Experience Booking
  bookingScenarios();

  // F11 — KYC Verification
  kycScenarios();
}
