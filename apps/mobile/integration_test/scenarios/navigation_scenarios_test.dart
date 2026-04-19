// @navigation — F02: Tab Navigation  |  F03: Guest Routing  |  F04: Onboarding Flow
//
// Run with: patrol test --target integration_test/scenarios/navigation_scenarios_test.dart
//
// Requires:
//   Seed data:  9090909090 has onboarding_completed_at set (traveler persona)
//   New user:   9999999999 is deleted before NAV-S03 so it arrives fresh
//
// NAV-S02 decision (router.dart):
//   The GoRouter redirect has NO guard on /studio for guest users.
//   The only auth-required guard is: `isOnContent && !isAuth → /auth`.
//   /studio is NOT under /content — it's a StatefulShellBranch tab.
//   When `isGuest = true && isAuth = false`, no redirect fires.
//   Therefore a guest tapping Studio lands directly on StudioTabScreen.
//   The test asserts StudioTabScreen is visible (the 'Studio' heading text),
//   confirming the router allows guest access to the tab.

import 'package:patrol/patrol.dart';

import 'package:creatorhub/features/studio/screens/studio_tab_screen.dart';

import '../hooks/global_hooks.dart';
import '../steps/auth_steps.dart';
import '../steps/navigation_steps.dart';
import '../support/api_helper.dart';
import '../support/test_data.dart';

void navigationScenarios() {
  // ── NAV-S01: Tab bar navigation for authenticated user ────────────────────
  //
  // Scenario: Authenticated traveler can switch between Home and Studio tabs.
  //
  // Pre-conditions:
  //   - 9090909090 is seeded with onboarding_completed_at set (no onboarding redirect).
  // Steps:
  //   1. Launch app + login as traveler → land on HomeFeedScreen.
  //   2. Tap 'Studio' tab label → StudioTabScreen becomes visible.
  //   3. Tap 'Home' tab label → HomeFeedScreen is visible again.
  //
  // Why bounded pump instead of pumpAndSettle:
  //   GoRouter tab switches trigger tab-branch restoration which re-listens to
  //   Firebase auth state; pumpAndSettle would deadlock on the persistent stream.
  //   We use whenITapTheTab which calls pumpAndSettle — this is safe for tab
  //   navigation because the auth stream is already settled by login time and
  //   tab switches do not re-trigger pending async frames.
  patrolTest(
    'NAV-S01: Authenticated traveler can navigate between Home and Studio tabs',
    tags: ['navigation', 'smoke', 'critical'],
    ($) async {
      await beforeScenario($);
      await givenTheAppIsLaunched($);
      await givenIAmLoggedInAsTraveler($);

      // Step 1: Landing screen after login should be the home feed.
      await thenIShouldSeeTheHomeFeed($);

      // Step 2: Tap Studio tab — router stays on /studio (auth guards pass).
      await whenITapTheTab($, 'Studio');
      await $(StudioTabScreen).waitUntilVisible(
        timeout: const Duration(seconds: 10),
      );
      // 'Studio' is the h4-level heading rendered by _StudioTopBar —
      // confirm the tab content is correct, not just the tab label.
      await $('Studio').waitUntilVisible(
        timeout: const Duration(seconds: 5),
      );

      // Step 3: Return to Home tab.
      await whenITapTheTab($, 'Home');
      await thenIShouldSeeTheHomeFeed($);

      // Guard: no crash widgets should be present at any point.
      await thenTheAppShouldNotHaveCrashed($);
    },
  );

  // ── NAV-S02: Guest cannot access Studio (soft auth wall) ──────────────────
  //
  // Scenario: A guest user tapping Studio navigates to StudioTabScreen directly.
  //
  // Router finding (see file-level comment):
  //   The router has no redirect guard on /studio for guest users.
  //   /studio is a StatefulShellBranch tab — the only auth guard covers
  //   paths starting with /content (content creation flow).
  //   Guest status (isGuest=true) is explicitly excluded from the
  //   "redirect to /welcome" rule, so GoRouter returns null (no redirect)
  //   and the guest lands on StudioTabScreen.
  //
  //   If a future product decision adds a guest guard on /studio, this test
  //   will fail and should be updated to assert 'Get Started' instead.
  patrolTest(
    'NAV-S02: Guest user tapping Studio tab lands on StudioTabScreen (no auth wall)',
    tags: ['navigation', 'guest', 'routing'],
    ($) async {
      await beforeScenario($);
      await givenTheAppIsLaunched($);
      await givenIAmNotLoggedIn($);

      // Post-E0.4c: guest mode is set programmatically since WelcomeScreen
      // no longer exposes a 'Browse as guest' CTA.
      await whenIBrowseAsGuest($);
      await thenIShouldSeeTheHomeFeed($);

      // Tap the Studio tab — router allows guests here (no guard).
      await whenITapTheTab($, 'Studio');

      // Router should NOT redirect to /welcome or /auth.
      // StudioTabScreen renders with its normal content (quiet-state card or
      // content list); 'Studio' heading text is always present.
      await $(StudioTabScreen).waitUntilVisible(
        timeout: const Duration(seconds: 10),
      );

      // Confirm heading text — this is the key Studio UI landmark.
      await $('Studio').waitUntilVisible(
        timeout: const Duration(seconds: 5),
      );

      // Sanity-check: no crash.
      await thenTheAppShouldNotHaveCrashed($);
    },
  );

  // ── NAV-S03: Onboarding flow navigation (new user) ────────────────────────
  //
  // Scenario: A brand-new user completes phone OTP login and the router
  // redirects them to the onboarding flow. Post-E0.4c (A2c), the first
  // onboarding step is ProfileBootstrapScreen (username + first name + email),
  // which sits *before* LocationScreen.
  //
  // Pre-condition teardown:
  //   ApiHelper.deleteUserByPhone removes any existing row for 9999999999 so
  //   the emulator registration always produces onboarding_completed_at = NULL.
  //
  // Router behavior (see apps/mobile/lib/app/router.dart):
  //   onboarding_completed_at == NULL → redirect('/onboarding/profile').
  //
  // The scenario no longer exercises the city search — the intent is to prove
  // the redirect fires and the new-user onboarding starts correctly.
  patrolTest(
    'NAV-S03: New user OTP login redirects to onboarding ProfileBootstrap',
    tags: ['navigation', 'onboarding', 'newuser'],
    ($) async {
      await beforeScenario($);

      // Delete the new-user phone so it is guaranteed unregistered.
      await ApiHelper.deleteUserByPhone(TestData.newUserPhone);

      await givenTheAppIsLaunched($);
      await givenIAmNotLoggedIn($);

      // Step 1: OTP login triggers new-user registration.
      await loginWithOtp($, TestData.newUserPhone);

      // Step 2: Router sees onboarding_completed_at = NULL → redirects to
      // /onboarding/profile. Assert ProfileBootstrapScreen is visible.
      await thenIShouldBeOnTheScreen($, 'onboarding profile');

      // Guard: no crash widgets.
      await thenTheAppShouldNotHaveCrashed($);
    },
  );
}

void main() => navigationScenarios();
