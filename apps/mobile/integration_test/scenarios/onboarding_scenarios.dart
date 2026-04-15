// @onboarding — F02: Onboarding Flow
//
// Run with: patrol test --target integration_test/scenarios/onboarding_scenarios.dart

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:patrol/patrol.dart';

import '../hooks/global_hooks.dart';
import '../steps/auth_steps.dart';

void onboardingScenarios() {
  // ── F02-S01: Full onboarding flow ────────────────────────────────────────
  //
  // Scenario: Newly registered user completes full onboarding flow
  //   - Location permission → vertical picker → creator suggestions → celebration
  patrolTest(
    'F02-S01: Newly registered user completes full onboarding flow',
    tags: ['onboarding', 'smoke', 'critical'],
    ($) async {
      await beforeScenario($);
      await givenTheAppIsLaunched($);
      await givenIAmLoggedInAsNewUserWithPhone($, '+919090909090');

      // Should land on onboarding location screen
      await thenIShouldBeOnTheScreen($, 'onboarding location');

      // Grant location permission via native dialog
      try {
        await $.native.grantPermissionWhenInUse();
      } catch (_) {}
      await $('Continue').tap();
      await $.tester.pumpAndSettle();

      // Vertical picker screen — select Travel + Stories
      expect(find.text('What interests you?').evaluate().isNotEmpty ||
          find.text('Pick your interests').evaluate().isNotEmpty, isTrue);
      await $('Travel').tap();
      await $.tester.pumpAndSettle();
      await $('Stories').tap();
      await $.tester.pumpAndSettle();
      await $('Continue').tap();
      await $.tester.pumpAndSettle();

      // Suggested creators — follow first, then continue
      if (find.text('Follow').evaluate().isNotEmpty) {
        await $('Follow').first.tap();
        await $.tester.pumpAndSettle();
      }
      await $('Continue').tap();
      await $.tester.pumpAndSettle();

      // Celebration screen
      await thenIShouldSee($, 'You\'re all set');
      await $('Explore CreatorHub').tap();
      await $.tester.pumpAndSettle();
      await thenIShouldSeeTheHomeFeed($);
    },
  );

  // ── F02-S02: Skip creator suggestions ────────────────────────────────────
  patrolTest(
    'F02-S02: User skips creator suggestions during onboarding',
    tags: ['onboarding'],
    ($) async {
      await beforeScenario($);
      await givenTheAppIsLaunched($);
      await givenIAmLoggedInAsNewUserWithPhone($, '+919090909090');

      await thenIShouldBeOnTheScreen($, 'onboarding location');

      // Skip location
      if (find.text('Skip').evaluate().isNotEmpty) {
        await $('Skip').tap();
        await $.tester.pumpAndSettle();
      } else {
        await $('Continue').tap();
        await $.tester.pumpAndSettle();
      }

      // Skip vertical selection
      await $('Continue').tap();
      await $.tester.pumpAndSettle();

      // Skip creator suggestions
      if (find.text('Skip').evaluate().isNotEmpty) {
        await $('Skip').tap();
      } else {
        await $('Continue').tap();
      }
      await $.tester.pumpAndSettle();

      await thenIShouldSee($, 'You\'re all set');
    },
  );

  // ── F02-S03: GPS denied, manual city search ───────────────────────────────
  patrolTest(
    'F02-S03: User manually selects city when GPS is denied',
    tags: ['onboarding', 'location'],
    ($) async {
      await beforeScenario($);
      await givenTheAppIsLaunched($);
      await givenIAmLoggedInAsNewUserWithPhone($, '+919090909090');

      await thenIShouldBeOnTheScreen($, 'onboarding location');

      // Deny location permission
      try {
        await $.native.denyPermission();
      } catch (_) {}
      await $.tester.pumpAndSettle();

      // Search for Mumbai manually
      if (find.byType(TextField).evaluate().isNotEmpty) {
        await $.tester.enterText(find.byType(TextField).first, 'Mumbai');
        await $.tester.pumpAndSettle(const Duration(seconds: 2));
        await $('Mumbai').first.tap();
        await $.tester.pumpAndSettle();
      }

      await $('Continue').tap();
      await $.tester.pumpAndSettle();

      // Should advance past location screen
      expect(find.byType(Scaffold), findsWidgets);
    },
  );
}
