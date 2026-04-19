// E2E Test Runner — run all scenarios from one entry point
//
//   patrol test \
//     --target integration_test/integration_test_runner.dart \
//     --dart-define STAGING_API_URL=http://localhost:3001
//
// Run one feature:
//   patrol test --target integration_test/scenarios/auth_scenarios_test.dart
//
// Smoke only:
//   patrol test --target integration_test/integration_test_runner.dart --tags smoke

import 'scenarios/auth_scenarios_test.dart' as auth;
import 'scenarios/onboarding_scenarios_test.dart' as onboarding;
import 'scenarios/feed_scenarios_test.dart' as feed;
import 'scenarios/social_scenarios_test.dart' as social;
import 'scenarios/creation_scenarios_test.dart' as creation;
import 'scenarios/profile_scenarios_test.dart' as profile;
import 'scenarios/booking_scenarios_test.dart' as booking;
import 'scenarios/kyc_scenarios_test.dart' as kyc;

void main() {
  auth.authScenarios();
  onboarding.onboardingScenarios();
  feed.feedScenarios();
  social.socialScenarios();
  creation.creationScenarios();
  profile.profileScenarios();
  profile.studioScenarios();
  booking.bookingScenarios();
  kyc.kycScenarios();
}
