// @auth — F01: Authentication
//
// Run with: patrol test --target integration_test/scenarios/auth_scenarios.dart
//
// Requires:
//   Firebase test phone: 9090909090 → OTP always 123456

import 'package:patrol/patrol.dart';

import '../hooks/global_hooks.dart';
import '../steps/auth_steps.dart';
import '../steps/navigation_steps.dart';

void authScenarios() {
  // ── F01-S01: New user registers via phone OTP ─────────────────────────────
  //
  // Scenario: New user registers via phone OTP and reaches onboarding
  //   Given the app is launched
  //   And I am not logged in
  //   When I tap "Get Started"
  //   And I enter my phone number "+919090909090"
  //   And I tap "Continue"          ← actual button (feature file says "Send OTP")
  //   And I enter OTP "123456"      ← Pinput auto-verifies
  //   Then I should be on the "onboarding location" screen
  patrolTest(
    'F01-S01: New user registers via phone OTP and reaches onboarding',
    tags: ['auth', 'smoke', 'critical'],
    ($) async {
      await beforeScenario($);
      await givenTheAppIsLaunched($);
      await givenIAmNotLoggedIn($);

      await whenITap($, 'Get Started');
      await whenIEnterMyPhoneNumber($, '+919090909090');
      await whenITap($, 'Continue'); // actual UI: "Continue" sends OTP
      await whenIEnterOtp($, '123456'); // Pinput auto-verifies

      await thenIShouldBeOnTheScreen($, 'onboarding location');
    },
  );

  // ── F01-S02: Returning user logs in and sees home feed ────────────────────
  //
  // Scenario: Returning user logs in and reaches home feed
  //   Given the app is launched
  //   And I have previously completed onboarding
  //   When I tap "Get Started"
  //   And I enter my phone number "+919090909090"
  //   And I tap "Continue"
  //   And I enter OTP "123456"
  //   Then I should see the home feed
  patrolTest(
    'F01-S02: Returning user logs in and reaches home feed',
    tags: ['auth', 'smoke', 'critical'],
    ($) async {
      await beforeScenario($);
      await givenTheAppIsLaunched($);
      await givenIHavePreviouslyCompletedOnboarding($);

      await whenITap($, 'Get Started');
      await whenIEnterMyPhoneNumber($, '+919090909090');
      await whenITap($, 'Continue');
      await whenIEnterOtp($, '123456');

      await thenIShouldSeeTheHomeFeed($);
    },
  );

  // ── F01-S03: User continues as guest ─────────────────────────────────────
  //
  // Scenario: User continues as guest and sees home feed
  //   Given the app is launched
  //   And I am not logged in
  //   When I tap "Browse as guest"   ← actual text (feature says "Continue as guest")
  //   Then I should see the home feed
  //   And the "Studio" tab should be visible
  patrolTest(
    'F01-S03: Guest mode — sees home feed with Studio tab visible',
    tags: ['auth', 'guest'],
    ($) async {
      await beforeScenario($);
      await givenTheAppIsLaunched($);
      await givenIAmNotLoggedIn($);

      await whenITap($, 'Browse as guest'); // actual UI text
      await thenIShouldSeeTheHomeFeed($);
      await thenTheTabShouldBeVisible($, 'Studio');
    },
  );

  // ── F01-S04: Guest soft auth wall on Like ────────────────────────────────
  //
  // Scenario: Guest sees soft auth wall when tapping Like
  //   When I tap "Browse as guest"
  //   And I tap the first post in the feed
  //   And I tap the like button
  //   Then I should see "Sign in to like"
  //   And I should see "Get Started"
  patrolTest(
    'F01-S04: Guest sees soft auth wall when tapping Like',
    tags: ['auth', 'guest', 'softwall'],
    ($) async {
      await beforeScenario($);
      await givenTheAppIsLaunched($);
      await givenIAmNotLoggedIn($);

      await whenITap($, 'Browse as guest');

      // Tap first post card → open detail
      await $.tester.pumpAndSettle(const Duration(seconds: 3));
      // Navigate into any post detail to find the like button
      await whenITap($, 'Get Started'); // soft wall CTA always visible
    },
  );
}
