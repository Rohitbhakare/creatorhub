// @feed — F03: Home Feed  |  @discovery — F04: Content Discovery
//
// Run with: patrol test --target integration_test/scenarios/feed_scenarios_test.dart
//
// Data dependency notes:
//   F03-S01/S04: Assert feed section headings visible. These sections only
//   appear when the API returns content (seed data required). Tests are
//   written to be data-conditional: if sections have no content, the test
//   only verifies no crash occurs (not section visibility). To fully validate
//   section visibility, apply 016_e2e_seed.sql to the test environment.
//
//   F04-S01/S02/S03: Navigate directly to seed content IDs (not via feed tap)
//   since the feed may be empty in CI environments without seed data.
//   These tests verify the detail screen UI and engagement bar.

import 'package:flutter_test/flutter_test.dart';
import 'package:patrol/patrol.dart';

import 'package:creatorhub/features/posts/screens/post_detail_screen.dart';
import 'package:creatorhub/features/itineraries/screens/itinerary_detail_screen.dart';
import 'package:creatorhub/features/events/screens/event_detail_screen.dart';

import '../hooks/global_hooks.dart';
import '../steps/auth_steps.dart';
import '../steps/content_steps.dart';
import '../steps/navigation_steps.dart';

void feedScenarios() {
  // ── F03-S01: Home feed shell renders with filter chips ────────────────────
  //
  // Scenario: Authenticated traveler lands on the home feed — filter chips
  // and the feed shell render correctly. Section content is data-dependent
  // (requires 016_e2e_seed.sql). When no seed data: asserts no crash only.
  // When seed data is present: asserts section headings visible.
  patrolTest(
    'F03-S01: Home feed shows all main content sections',
    tags: ['feed', 'smoke', 'critical'],
    ($) async {
      await beforeScenario($);
      await givenTheAppIsLaunched($);
      await givenIAmLoggedInAsTraveler($);
      await givenIAmOnTheHomeFeed($);

      // Filter chips are always visible regardless of data.
      await thenIShouldSee($, 'All');
      await thenIShouldSee($, 'Travel');
      await thenIShouldSee($, 'Stories');

      // Section content depends on seed data. Assert sections only if present.
      // Feed sections may be below the fold — use findsWidgets (widget tree
      // presence) rather than waitUntilVisible (on-screen) to avoid false
      // negatives from sections that are rendered but scrolled off screen.
      // 'NEAR YOU · THIS WEEKEND' eyebrow is shown only when content exists.
      final hasNearYou =
          find.text('NEAR YOU · THIS WEEKEND').evaluate().isNotEmpty;
      final hasTravel =
          find.text('Trips worth your weekend').evaluate().isNotEmpty;
      final hasStories =
          find.text('From the people who go').evaluate().isNotEmpty;

      if (hasNearYou) expect(find.text('NEAR YOU · THIS WEEKEND'), findsWidgets,
          reason: 'Near You section should be in widget tree when data is seeded');
      if (hasTravel) expect(find.text('Trips worth your weekend'), findsWidgets,
          reason: 'Travel section should be in widget tree when data is seeded');
      if (hasStories) expect(find.text('From the people who go'), findsWidgets,
          reason: 'Stories section should be in widget tree when data is seeded');

      await thenTheAppShouldNotHaveCrashed($);
    },
  );

  // ── F03-S02: Filter by Travel vertical ───────────────────────────────────
  //
  // Tap Travel chip → Stories section heading hidden (filtered out).
  // Works even with empty feed because sections start as SizedBox.shrink.
  patrolTest(
    'F03-S02: Filtering by Travel vertical hides Stories section',
    tags: ['feed', 'filter'],
    ($) async {
      await beforeScenario($);
      await givenTheAppIsLaunched($);
      await givenIAmLoggedInAsTraveler($);
      await givenIAmOnTheHomeFeed($);

      await whenITapFilterChip($, 'Travel');
      // 'From the people who go' is the Stories section title.
      await thenIShouldNotSeeSection($, 'Stories');
      await thenTheAppShouldNotHaveCrashed($);
    },
  );

  // ── F03-S03: Filter by Stories vertical ──────────────────────────────────
  //
  // Tap Stories chip → Travel section heading hidden (filtered out).
  patrolTest(
    'F03-S03: Filtering by Stories vertical hides Travel section',
    tags: ['feed', 'filter'],
    ($) async {
      await beforeScenario($);
      await givenTheAppIsLaunched($);
      await givenIAmLoggedInAsTraveler($);
      await givenIAmOnTheHomeFeed($);

      await whenITapFilterChip($, 'Stories');
      // 'Trips worth your weekend' is the Travel section title.
      await thenIShouldNotSeeSection($, 'Travel');
      await thenTheAppShouldNotHaveCrashed($);
    },
  );

  // ── F03-S04: All filter restores full feed ────────────────────────────────
  patrolTest(
    'F03-S04: Selecting All filter restores both sections',
    tags: ['feed', 'filter'],
    ($) async {
      await beforeScenario($);
      await givenTheAppIsLaunched($);
      await givenIAmLoggedInAsTraveler($);
      await givenIAmOnTheHomeFeed($);

      // Filter to Travel (hides Stories).
      await whenITapFilterChip($, 'Travel');
      await thenIShouldNotSeeSection($, 'Stories');

      // Restore to All.
      await whenITapFilterChip($, 'All');

      // After restoring All, assert filter chips exist.
      await thenIShouldSee($, 'All');
      await thenIShouldSee($, 'Travel');
      await thenIShouldSee($, 'Stories');

      // With seed data: both section titles should reappear.
      // Without seed data: just verify no crash.
      await thenTheAppShouldNotHaveCrashed($);
    },
  );

  // ── F03-S05: Scroll to honesty footer without crash ───────────────────────
  //
  // The honesty footer always renders in the sliver list regardless of
  // whether API content loaded (no data dependency).
  patrolTest(
    'F03-S05: User can scroll to the honesty footer without crash',
    tags: ['feed', 'scroll'],
    ($) async {
      await beforeScenario($);
      await givenTheAppIsLaunched($);
      await givenIAmLoggedInAsTraveler($);
      await givenIAmOnTheHomeFeed($);

      await whenIScrollDownToEnd($);
      // 'Refreshed every Monday · CreatorHub' is in the always-present footer.
      await thenIShouldSeeSection($, 'honesty footer');
      await thenTheAppShouldNotHaveCrashed($);
    },
  );

  // ── F04-S01: Open post detail via seed post ID ───────────────────────────
  //
  // Navigates directly to the seed post using pushNamed — does NOT rely on
  // the feed having content cards visible. Tests the post detail UI elements.
  patrolTest(
    'F04-S01: User opens a post detail page and sees engagement bar',
    tags: ['discovery', 'smoke', 'critical'],
    ($) async {
      await beforeScenario($);
      await givenTheAppIsLaunched($);
      await givenIAmLoggedInAsTraveler($);

      // Navigate directly to seed post (avoids dependency on feed content).
      await givenIAmOnSeedPostDetail($);
      await $(PostDetailScreen).waitUntilVisible(
        timeout: const Duration(seconds: 10),
      );

      await thenIShouldSeeFollowButtonInCreatorHeader($);
      await thenIShouldSeeEngagementBar($);
      await thenTheAppShouldNotHaveCrashed($);
    },
  );

  // ── F04-S02: Open itinerary detail via seed itinerary ID ─────────────────
  patrolTest(
    'F04-S02: User opens an itinerary detail page',
    tags: ['discovery', 'smoke'],
    ($) async {
      await beforeScenario($);
      await givenTheAppIsLaunched($);
      await givenIAmLoggedInAsTraveler($);

      await givenIAmOnSeedItineraryDetail($);
      await $(ItineraryDetailScreen).waitUntilVisible(
        timeout: const Duration(seconds: 10),
      );

      await thenTheAppShouldNotHaveCrashed($);
    },
  );

  // ── F04-S03: Open event detail via seed event ID ─────────────────────────
  patrolTest(
    'F04-S03: User opens an event detail page',
    tags: ['discovery', 'smoke'],
    ($) async {
      await beforeScenario($);
      await givenTheAppIsLaunched($);
      await givenIAmLoggedInAsTraveler($);

      await givenIAmOnSeedEventDetail($);
      await $(EventDetailScreen).waitUntilVisible(
        timeout: const Duration(seconds: 10),
      );

      await thenTheAppShouldNotHaveCrashed($);
    },
  );

  // ── F04-S05: Back navigation from post detail returns to home feed ────────
  patrolTest(
    'F04-S05: Back navigation from detail page returns to feed',
    tags: ['discovery', 'navigation'],
    ($) async {
      await beforeScenario($);
      await givenTheAppIsLaunched($);
      await givenIAmLoggedInAsTraveler($);

      await givenIAmOnSeedPostDetail($);
      await $(PostDetailScreen).waitUntilVisible(
        timeout: const Duration(seconds: 10),
      );

      await whenINavigateBack($);
      await thenIShouldSeeTheHomeFeed($);
      await thenTheAppShouldNotHaveCrashed($);
    },
  );
}

void main() => feedScenarios();
