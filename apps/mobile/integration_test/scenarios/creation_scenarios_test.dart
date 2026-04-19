// @creation — F06: Content Creation
//
// Run with: patrol test --target integration_test/scenarios/creation_scenarios.dart

import 'package:patrol/patrol.dart';

import '../hooks/global_hooks.dart';
import '../steps/auth_steps.dart';
import '../steps/content_steps.dart';
import '../steps/creation_steps.dart';
import '../steps/navigation_steps.dart';

void creationScenarios() {
  // ── F06-S01: Creator publishes a text post ────────────────────────────────
  //
  // Scenario: Creator creates and publishes a text post
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
      await whenITap($, 'Next');
      await whenITap($, 'Publish');

      await thenIShouldSee($, 'Post published!');
      await thenPostShouldShowTitle($, 'E2E Test Post — Leh Ladakh');
    },
  );

  // ── F06-S02: Creator creates an itinerary ────────────────────────────────
  patrolTest(
    'F06-S02: Creator creates an itinerary with one spot',
    tags: ['creation', 'itinerary'],
    ($) async {
      await beforeScenario($);
      await givenTheAppIsLaunched($);
      await givenIAmLoggedInAsCreator($);
      await givenIAmOnTheHomeFeed($);

      await whenITapTheCreateTab($);
      await whenITap($, 'Itinerary');
      await thenIShouldBeOnItineraryCreationWizard($);

      await whenIEnterTitle($, 'Golden Triangle — E2E Test');
      await whenITapAddSpot($);
      await whenISearchForPlace($, 'Taj Mahal, Agra');
      await whenISelectFirstPlaceResult($);
      await whenIEnterSpotNote($, 'Arrive at sunrise for the best light');
      await whenITapSaveSpot($);
      await whenITap($, 'Next');
      await whenITap($, 'Publish');

      await thenIShouldSee($, 'Itinerary published!');
      await thenIShouldSee($, '1 spot');
    },
  );

  // ── F06-S03: Creator creates a free event ────────────────────────────────
  patrolTest(
    'F06-S03: Creator creates a free event',
    tags: ['creation', 'event'],
    ($) async {
      await beforeScenario($);
      await givenTheAppIsLaunched($);
      await givenIAmLoggedInAsCreator($);
      await givenIAmOnTheHomeFeed($);

      await whenITapTheCreateTab($);
      await whenITap($, 'Event');
      await thenIShouldBeOnEventCreationWizard($);

      await whenIEnterTitle($, 'Sunset Hike Meetup — E2E');
      await whenIEnterVenueName($, 'Sanjay Gandhi National Park, Mumbai');
      await whenISetEventDateToTomorrow($);
      await whenISetCapacity($, '20');
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

      await whenITap($, 'Browse as guest');
      await givenIAmOnTheHomeFeed($);
      await whenITapTheCreateTab($);

      await thenIShouldBeOnTheScreen($, 'auth');
      await thenIShouldSee($, 'Get Started');
    },
  );
}

void main() => creationScenarios();
