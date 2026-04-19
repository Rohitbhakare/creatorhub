// @creation — F06: Content Creation
//
// Run with: patrol test --target integration_test/scenarios/creation_scenarios_test.dart

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
  // Scenario: Creator publishes a minimal free itinerary.
  //
  // Wizard flow (itinerary, 6 steps):
  //   1. Basics         → title (required, ≥5 chars)
  //   2. Trip overview  → all fields optional at wizard level
  //   3. Day builder    → spots optional
  //   4. Media          → optional (skipped via MediaStep)
  //   5. Pricing        → defaults to free
  //   6. Review         → accept T&C + tap Publish
  //
  // Expectation: 'Itinerary published!' success snackbar after publish call.
  patrolTest(
    'F06-S02: Creator creates and publishes an itinerary',
    tags: ['creation', 'itinerary', 'smoke'],
    ($) async {
      await beforeScenario($);
      await givenTheAppIsLaunched($);
      await givenIAmLoggedInAsCreator($);
      await givenIAmOnTheHomeFeed($);

      await whenITapTheCreateTab($);
      await thenIShouldSeeContentTypePicker($);
      await whenITap($, 'Itinerary');
      await thenIShouldBeOnItineraryCreationWizard($);

      await whenIEnterTitle($, 'E2E Test Itinerary — 3 Days in Hampi');

      // Step through Basics → Overview → Days → Media → Pricing → Review.
      for (var i = 0; i < 5; i++) {
        await whenITap($, 'Next');
      }

      await whenITap($, 'Terms & Conditions');
      await whenITap($, 'Publish');

      await thenIShouldSee($, 'Itinerary published!');
    },
  );

  // ── F06-S03: Creator creates a free event ────────────────────────────────
  //
  // Scenario: Creator publishes a minimal free event.
  //
  // Wizard flow (event, 5 steps):
  //   1. Basics   → title (required, ≥5 chars)
  //   2. Details  → venue/capacity/dates optional at wizard level
  //   3. Media    → optional
  //   4. Pricing  → locked to 'free' (M1)
  //   5. Review   → accept T&C + tap Publish
  //
  // Expectation: 'Event published!' success snackbar after publish call.
  patrolTest(
    'F06-S03: Creator creates and publishes a free event',
    tags: ['creation', 'event', 'smoke'],
    ($) async {
      await beforeScenario($);
      await givenTheAppIsLaunched($);
      await givenIAmLoggedInAsCreator($);
      await givenIAmOnTheHomeFeed($);

      await whenITapTheCreateTab($);
      await thenIShouldSeeContentTypePicker($);
      await whenITap($, 'Event');
      await thenIShouldBeOnEventCreationWizard($);

      await whenIEnterTitle($, 'E2E Test Event — Sunrise Hike');

      // Step through Basics → Details → Media → Pricing → Review.
      for (var i = 0; i < 4; i++) {
        await whenITap($, 'Next');
      }

      await whenITap($, 'Terms & Conditions');
      await whenITap($, 'Publish');

      await thenIShouldSee($, 'Event published!');
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
