// @creation — F06: Content Creation
//
// Run with: patrol test --target integration_test/scenarios/creation_scenarios_test.dart

import 'package:flutter_test/flutter_test.dart';
import 'package:patrol/patrol.dart';

import '../hooks/global_hooks.dart';
import '../steps/auth_steps.dart';
import '../steps/content_steps.dart';
import '../steps/creation_steps.dart';
import '../steps/navigation_steps.dart';

void creationScenarios() {
  // ── F06-S01: Creator publishes a text post ────────────────────────────────
  //
  // Scenario: Creator creates and publishes a text post.
  //
  // Wizard flow (post, 3 steps):
  //   1. Basics  → title + description + body
  //   2. Media   → optional (skipped)
  //   3. Review  → accept T&C + tap Publish
  //
  // Expectation: 'Post published!' success snackbar appears after POST /content.
  patrolTest(
    'F06-S01: Creator creates and publishes a text post',
    tags: ['creation', 'smoke', 'critical'],
    ($) async {
      await beforeScenario($);
      await givenTheAppIsLaunched($);
      await givenIAmLoggedInAsCreator($);
      await givenIAmOnTheHomeFeed($);

      await whenITapTheCreateTab($);
      await thenIShouldSeeContentTypePicker($);
      await whenITap($, 'Post');
      await thenIShouldBeOnPostCreationWizard($);

      await whenIEnterTitle($, 'E2E Test Post — Leh Ladakh');
      await whenIEnterBodyText(
        $,
        'The mountains were absolutely breathtaking. A journey worth every rupee.',
      );
      // Basics → Media (optional) → Review.
      await whenITap($, 'Next');
      await whenITap($, 'Next');
      // Accept the Terms & Conditions checkbox (required for Publish).
      await whenITap($, 'Terms & Conditions');
      await whenITap($, 'Publish');

      await thenIShouldSee($, 'Post published!');
    },
  );

  // ── F06-S02: Creator creates an itinerary ────────────────────────────────
  //
  // SKIPPED until E1.3 itinerary wizard Media/Pricing steps are real (they
  // are currently placeholder stubs built into wizard_shell_screen).
  // See TRACKING.md — itinerary full-flow E2E is deferred to M2.
  patrolTest(
    'F06-S02: Creator creates an itinerary with one spot',
    tags: ['creation', 'itinerary'],
    ($) async {
      markTestSkipped(
        'Deferred to M2: itinerary Media/Pricing steps are placeholder stubs '
        'in wizard_shell_screen._buildPlaceholderStep. Full flow requires '
        'replacing both step UIs.',
      );
    },
  );

  // ── F06-S03: Creator creates a free event ────────────────────────────────
  //
  // SKIPPED until event wizard Media/Pricing placeholder steps are replaced
  // with real UIs. The Details step also uses a `_CapacityStepper` (+/- buttons)
  // instead of a 'Max capacity' TextField, so whenISetCapacity cannot work
  // without UI change. See TRACKING.md.
  patrolTest(
    'F06-S03: Creator creates a free event',
    tags: ['creation', 'event'],
    ($) async {
      markTestSkipped(
        'Deferred to M2: event wizard has placeholder Media/Pricing steps '
        'and a CapacityStepper (not a TextField). Scenario cannot exercise '
        'the full publish flow until both are addressed.',
      );
    },
  );

  // ── F06-S04: Guest redirected to auth when tapping Create+ ───────────────
  patrolTest(
    'F06-S04: Guest is redirected to auth screen when tapping Create+',
    tags: ['creation', 'guest', 'redirect'],
    ($) async {
      await beforeScenario($);
      await givenTheAppIsLaunched($);
      await givenIAmNotLoggedIn($);

      await whenIBrowseAsGuest($);
      await givenIAmOnTheHomeFeed($);
      await whenITapTheCreateTab($);

      // Post-E0.4c: Create+ for guests routes to /auth (PhoneOtpScreen) which
      // shows the 'Send code' CTA (the A2 phone entry screen).
      await thenIShouldBeOnTheScreen($, 'auth');
      await thenIShouldSee($, 'Send code');
    },
  );
}

void main() => creationScenarios();
