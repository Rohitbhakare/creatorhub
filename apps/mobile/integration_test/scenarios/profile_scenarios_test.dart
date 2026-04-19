// @profile — F07: User Profile  |  @studio — F09: Creator Studio
//
// Run with: patrol test --target integration_test/scenarios/profile_scenarios.dart

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:patrol/patrol.dart';

import '../hooks/global_hooks.dart';
import '../steps/auth_steps.dart';
import '../steps/content_steps.dart';
import '../steps/navigation_steps.dart';
import '../steps/profile_steps.dart';

void profileScenarios() {
  // ── F07-S01: User views own profile ──────────────────────────────────────
  patrolTest(
    'F07-S01: User views their own profile on the You tab',
    tags: ['profile', 'smoke', 'critical'],
    ($) async {
      await beforeScenario($);
      await givenTheAppIsLaunched($);
      await givenIAmLoggedInAsTraveler($);

      await whenITapTheTab($, 'You');
      await thenIShouldBeOnProfileScreen($);
      await thenIShouldSeeFollowerCount($);
      await thenIShouldSeeFollowingCount($);
      await thenIShouldSeeEditProfileButton($);
    },
  );

  // ── F07-S02: User updates display name ───────────────────────────────────
  patrolTest(
    'F07-S02: User updates their display name',
    tags: ['profile', 'edit'],
    ($) async {
      await beforeScenario($);
      await givenTheAppIsLaunched($);
      await givenIAmLoggedInAsTraveler($);

      await whenITapTheTab($, 'You');

      // Post-E0.4c: YouTabScreen is a SingleChildScrollView with the
      // _SettingsCard (which contains 'Edit Profile') below a HeroCard and
      // an optional completion card. On smaller screens the 'Edit Profile'
      // row can be offstage, so scroll it into view before tapping.
      await $.tester.scrollUntilVisible(
        find.text('Edit Profile'),
        200.0,
        scrollable: find.byType(Scrollable).first,
      );
      await $.tester.pump(const Duration(milliseconds: 200));

      await whenITap($, 'Edit Profile');
      await thenIShouldBeOnEditProfileScreen($);

      await whenIClearDisplayNameField($);
      await whenIEnterDisplayName($, 'E2E Updated Name');
      await whenITap($, 'Save');

      await thenIShouldBeOnProfileScreen($);
      await thenIShouldSee($, 'E2E Updated Name');
    },
  );

  // ── F07-S03: User views another creator's public profile ──────────────────
  patrolTest(
    'F07-S03: User views another creator\'s public profile',
    tags: ['profile', 'other_user'],
    ($) async {
      await beforeScenario($);
      await givenTheAppIsLaunched($);
      await givenIAmLoggedInAsTraveler($);
      await givenIAmOnSeedPostDetail($);

      await whenITapCreatorNameInHeader($);
      await thenIShouldSeeFollowButtonInCreatorHeader($);
      await thenIShouldSeeCreatorContentList($);
      await thenIShouldNotSeeEditProfileButton($);
    },
  );
}

void studioScenarios() {
  // ── F09-S01: Creator views Studio tab with published content ─────────────
  patrolTest(
    'F09-S01: Creator views the Studio tab with published content',
    tags: ['studio', 'smoke', 'critical'],
    ($) async {
      await beforeScenario($);
      await givenTheAppIsLaunched($);
      await givenIAmLoggedInAsCreator($);

      await whenITapTheTab($, 'Studio');
      await thenIShouldSee($, 'Studio');
    },
  );
}

void main() { profileScenarios(); studioScenarios(); }
