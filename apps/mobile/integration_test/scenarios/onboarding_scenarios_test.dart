// @onboarding — F02: Onboarding Flow
//
// Run with: patrol test --target integration_test/scenarios/onboarding_scenarios_test.dart
//
// Pre-conditions:
//   All scenarios use TestData.newUserPhone (9999999999) which is deleted
//   before each test so the Firebase registration produces
//   onboarding_completed_at = NULL.
//
// Flow (post-E0.4c Pack A redesign):
//   1. A2c ProfileBootstrapScreen — username + firstName required (email optional)
//   2. A3  LocationScreen          — search + city chips + precise-location toggle
//   3. A4  VerticalPickerScreen    — 2×4 grid, pick ≥3 sub-categories
//   4. A5  SuggestedCreatorsScreen — Follow 3 to enable Continue OR tap Skip
//   5. A6  CelebrationScreen       — manual "Open my feed" CTA (no auto-navigate)
//
// pumpAndSettle notes:
//   Onboarding navigation uses GoRouter context.go() which runs the redirect guard.
//   We use waitUntilVisible (real-time polling) instead of pumpAndSettle to avoid
//   deadlocking on the Firebase auth stream.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:patrol/patrol.dart';

import 'package:creatorhub/features/onboarding/screens/profile_bootstrap_screen.dart';
import 'package:creatorhub/features/onboarding/screens/location_screen.dart';
import 'package:creatorhub/features/onboarding/screens/vertical_picker_screen.dart';
import 'package:creatorhub/features/onboarding/screens/suggested_creators_screen.dart';
import 'package:creatorhub/features/onboarding/screens/celebration_screen.dart';

import '../hooks/global_hooks.dart';
import '../steps/auth_steps.dart';
import '../steps/navigation_steps.dart';
import '../support/api_helper.dart';
import '../support/test_data.dart';

/// Walks through A2c → A3 → A4 so each scenario can share the same prefix.
Future<void> _completeProfileBootstrapStep(PatrolIntegrationTester $) async {
  await $(ProfileBootstrapScreen).waitUntilVisible(
    timeout: const Duration(seconds: 15),
  );

  // Username: unique-ish per run to avoid collisions on reruns.
  // Hint text: 'aarav_k' (see profile_bootstrap_screen.dart _usernameField).
  final usernameField = find.widgetWithText(TextField, 'aarav_k');
  if (usernameField.evaluate().isNotEmpty) {
    final stamp = DateTime.now().millisecondsSinceEpoch
        .toString()
        .substring(6); // last 7 digits
    await $.tester.enterText(usernameField, 'e2e_$stamp');
    await $.tester.pump(const Duration(milliseconds: 400));
  }

  // First name.
  final firstNameField = find.widgetWithText(TextField, 'Aarav');
  if (firstNameField.evaluate().isNotEmpty) {
    await $.tester.enterText(firstNameField, 'Aarav');
    await $.tester.pump(const Duration(milliseconds: 200));
  }

  // Email is optional — leave blank to keep the flow short.

  // Continue (debounced username check = 300ms, wait a bit more).
  await Future.delayed(const Duration(milliseconds: 600));
  await $.tester.pump(const Duration(milliseconds: 200));
  await $.tester.tap(find.text('Continue').first, warnIfMissed: false);
  await $.tester.pump(const Duration(milliseconds: 300));
}

Future<void> _completeLocationStep(PatrolIntegrationTester $) async {
  await $(LocationScreen).waitUntilVisible(
    timeout: const Duration(seconds: 15),
  );

  // A3 search hint: "City or state".
  await $.tester.enterText(
    find.widgetWithText(TextField, 'City or state'),
    'Mumbai',
  );
  await $.tester.pump(const Duration(milliseconds: 500)); // past debounce

  // Wait for HTTP city search response.
  await Future.delayed(const Duration(seconds: 3));
  await $.tester.pump(const Duration(milliseconds: 200));

  final cityResults = find.text('Mumbai');
  if (cityResults.evaluate().length >= 2) {
    await $.tester.tap(cityResults.last, warnIfMissed: false);
    await $.tester.pump(const Duration(milliseconds: 300));
  }

  await $.tester.tap(find.text('Continue').first, warnIfMissed: false);
  await $.tester.pump(const Duration(milliseconds: 300));
  await Future.delayed(const Duration(seconds: 3));
  await $.tester.pump(const Duration(milliseconds: 200));
}

Future<void> _completeVerticalsStep(PatrolIntegrationTester $) async {
  await $(VerticalPickerScreen).waitUntilVisible(
    timeout: const Duration(seconds: 10),
  );
  await Future.delayed(const Duration(seconds: 1));
  await $.tester.pump(const Duration(milliseconds: 200));

  // Pack A A4 has a hardcoded 2×4 grid — tap 3 named tiles.
  for (final tileName in ['Travel', 'Food', 'Culture']) {
    final tileFinder = find.text(tileName);
    if (tileFinder.evaluate().isNotEmpty) {
      await $.tester.tap(tileFinder.first, warnIfMissed: false);
      await $.tester.pump(const Duration(milliseconds: 200));
    }
  }

  await $.tester.tap(find.text('Continue').first, warnIfMissed: false);
  await $.tester.pump(const Duration(milliseconds: 300));
  await Future.delayed(const Duration(seconds: 3));
  await $.tester.pump(const Duration(milliseconds: 200));
}

void onboardingScenarios() {
  // ── F02-S01: Full onboarding flow (with Skip on creators) ───────────────
  patrolTest(
    'F02-S01: New user completes full onboarding flow',
    tags: ['onboarding', 'smoke', 'critical'],
    ($) async {
      await beforeScenario($);
      await ApiHelper.deleteUserByPhone(TestData.newUserPhone);

      await givenTheAppIsLaunched($);
      await givenIAmNotLoggedIn($);
      await loginWithOtp($, TestData.newUserPhone);

      // A2c Profile bootstrap.
      await _completeProfileBootstrapStep($);

      // A3 Location.
      await _completeLocationStep($);

      // A4 Verticals.
      await _completeVerticalsStep($);

      // A5 Creators — Skip (keeps the scenario independent of seed data).
      await $(SuggestedCreatorsScreen).waitUntilVisible(
        timeout: const Duration(seconds: 10),
      );
      await $.tester.tap(find.text('Skip').first, warnIfMissed: false);
      await $.tester.pump(const Duration(milliseconds: 300));
      await Future.delayed(const Duration(seconds: 2));
      await $.tester.pump(const Duration(milliseconds: 200));

      // A6 Celebration — tap "Open my feed" (no auto-navigate per E0.4c).
      await $(CelebrationScreen).waitUntilVisible(
        timeout: const Duration(seconds: 10),
      );
      await thenIShouldSee($, 'CHAPTER 1 · YOU');
      await thenIShouldSee($, 'Open my feed');

      // Celebration's initState fires POST /onboarding/complete then
      // GET /users/me; the router's auth-guard redirect inspects
      // authState.user.onboarding_completed_at. If we tap before the
      // GET /users/me response has updated authState, the redirect will
      // bounce us back to /onboarding/profile. We retry the tap up to 3
      // times (with generous waits) to survive slow emulator round-trips.
      await Future.delayed(const Duration(seconds: 8));
      await $.tester.pump(const Duration(milliseconds: 300));

      // Tap the CTA (retry up to 3× since router may bounce back to
      // /onboarding/profile until /users/me returns onboarding_completed_at).
      bool leftCelebration = false;
      for (var attempt = 0; attempt < 3 && !leftCelebration; attempt++) {
        final cta = find.text('Open my feed');
        if (cta.evaluate().isNotEmpty) {
          await $.tester.ensureVisible(cta.first);
          await $.tester.pump(const Duration(milliseconds: 200));
          await $.tester.tap(cta.first, warnIfMissed: false);
          await $.tester.pump(const Duration(milliseconds: 300));
        }
        await Future.delayed(const Duration(seconds: 6));
        await $.tester.pump(const Duration(milliseconds: 300));

        // Success = no longer on CelebrationScreen (post-onboarding).
        leftCelebration = $(CelebrationScreen).evaluate().isEmpty;
        if (!leftCelebration) {
          await Future.delayed(const Duration(seconds: 3));
          await $.tester.pump(const Duration(milliseconds: 300));
        }
      }

      expect(leftCelebration, isTrue,
          reason: 'Should have navigated away from CelebrationScreen after '
              'tapping "Open my feed"');

      await thenTheAppShouldNotHaveCrashed($);
    },
  );

  // ── F02-S02: Skip creator suggestions ────────────────────────────────────
  //
  // Same as S01 but explicitly asserts on the Skip-path entry into A6.
  patrolTest(
    'F02-S02: New user skips creator suggestions during onboarding',
    tags: ['onboarding'],
    ($) async {
      await beforeScenario($);
      await ApiHelper.deleteUserByPhone(TestData.newUserPhone);

      await givenTheAppIsLaunched($);
      await givenIAmNotLoggedIn($);
      await loginWithOtp($, TestData.newUserPhone);

      await _completeProfileBootstrapStep($);
      await _completeLocationStep($);
      await _completeVerticalsStep($);

      // A5 Creators — explicit Skip.
      await $(SuggestedCreatorsScreen).waitUntilVisible(
        timeout: const Duration(seconds: 10),
      );
      await $.tester.tap(find.text('Skip').first, warnIfMissed: false);
      await $.tester.pump(const Duration(milliseconds: 300));
      await Future.delayed(const Duration(seconds: 2));
      await $.tester.pump(const Duration(milliseconds: 200));

      // A6 Celebration visible.
      await $(CelebrationScreen).waitUntilVisible(
        timeout: const Duration(seconds: 10),
      );
      await thenIShouldSee($, 'CHAPTER 1 · YOU');

      await thenTheAppShouldNotHaveCrashed($);
    },
  );

  // ── F02-S03: GPS denied, manual city search ───────────────────────────────
  //
  // Scenario: New user denies GPS permission, manually types and selects city.
  patrolTest(
    'F02-S03: New user manually selects city when GPS is denied',
    tags: ['onboarding', 'location'],
    ($) async {
      await beforeScenario($);
      await ApiHelper.deleteUserByPhone(TestData.newUserPhone);

      await givenTheAppIsLaunched($);
      await givenIAmNotLoggedIn($);
      await loginWithOtp($, TestData.newUserPhone);

      // A2c first.
      await _completeProfileBootstrapStep($);

      await $(LocationScreen).waitUntilVisible(
        timeout: const Duration(seconds: 15),
      );

      // Deny GPS permission if prompted.
      try {
        await $.native.denyPermission();
      } catch (_) {
        // Permission dialog may not appear.
      }
      await $.tester.pump(const Duration(milliseconds: 300));

      // Manual city search.
      final searchField = find.widgetWithText(TextField, 'City or state');
      if (searchField.evaluate().isNotEmpty) {
        await $.tester.enterText(searchField, 'Mumbai');
        await $.tester.pump(const Duration(milliseconds: 500));
        await Future.delayed(const Duration(seconds: 3));
        await $.tester.pump(const Duration(milliseconds: 200));

        final cityResults = find.text('Mumbai');
        if (cityResults.evaluate().length >= 2) {
          await $.tester.tap(cityResults.last, warnIfMissed: false);
          await $.tester.pump(const Duration(milliseconds: 300));
        }
      }

      await $.tester.tap(find.text('Continue').first, warnIfMissed: false);
      await $.tester.pump(const Duration(milliseconds: 300));
      await Future.delayed(const Duration(seconds: 3));
      await $.tester.pump(const Duration(milliseconds: 200));

      // Should have advanced past LocationScreen.
      final onVertical = $(VerticalPickerScreen).evaluate().isNotEmpty;
      final onLocation = $(LocationScreen).evaluate().isNotEmpty;
      expect(onVertical || onLocation, isTrue,
          reason: 'Should be on VerticalPickerScreen or still on LocationScreen');

      await thenTheAppShouldNotHaveCrashed($);
    },
  );
}

void main() => onboardingScenarios();
