// @feed — F03: Home Feed  |  @discovery — F04: Content Discovery
//
// Run with: patrol test --target integration_test/scenarios/feed_scenarios.dart

import 'package:patrol/patrol.dart';

import '../hooks/global_hooks.dart';
import '../steps/auth_steps.dart';
import '../steps/content_steps.dart';
import '../steps/navigation_steps.dart';

void feedScenarios() {
  // ── F03-S01: Home feed shows all main sections ────────────────────────────
  patrolTest(
    'F03-S01: Home feed shows all main content sections',
    tags: ['feed', 'smoke', 'critical'],
    ($) async {
      await beforeScenario($);
      await givenTheAppIsLaunched($);
      await givenIAmLoggedInAsTraveler($);
      await givenIAmOnTheHomeFeed($);

      await thenIShouldSeeSection($, 'Near You');
      await thenIShouldSeeSection($, 'Travel');
      await thenIShouldSeeSection($, 'Stories');
      await thenIShouldSeeSection($, 'Discover Creators');
    },
  );

  // ── F03-S02: Filter by Travel vertical ───────────────────────────────────
  patrolTest(
    'F03-S02: Filtering by Travel vertical shows only travel content',
    tags: ['feed', 'filter'],
    ($) async {
      await beforeScenario($);
      await givenTheAppIsLaunched($);
      await givenIAmLoggedInAsTraveler($);
      await givenIAmOnTheHomeFeed($);

      await whenITapFilterChip($, 'Travel');
      await thenIShouldNotSeeSection($, 'Stories');
    },
  );

  // ── F03-S03: Filter by Stories vertical ──────────────────────────────────
  patrolTest(
    'F03-S03: Filtering by Stories vertical shows only stories content',
    tags: ['feed', 'filter'],
    ($) async {
      await beforeScenario($);
      await givenTheAppIsLaunched($);
      await givenIAmLoggedInAsTraveler($);
      await givenIAmOnTheHomeFeed($);

      await whenITapFilterChip($, 'Stories');
      await thenIShouldNotSeeSection($, 'Travel');
    },
  );

  // ── F03-S04: All filter restores full feed ────────────────────────────────
  patrolTest(
    'F03-S04: Selecting All filter shows all sections again',
    tags: ['feed', 'filter'],
    ($) async {
      await beforeScenario($);
      await givenTheAppIsLaunched($);
      await givenIAmLoggedInAsTraveler($);
      await givenIAmOnTheHomeFeed($);

      await whenITapFilterChip($, 'Travel');
      await whenITapFilterChip($, 'All');
      await thenIShouldSeeSection($, 'Near You');
      await thenIShouldSeeSection($, 'Travel');
      await thenIShouldSeeSection($, 'Stories');
    },
  );

  // ── F03-S05: Scroll to end without crash ─────────────────────────────────
  patrolTest(
    'F03-S05: User can scroll through the full feed without crash',
    tags: ['feed', 'scroll'],
    ($) async {
      await beforeScenario($);
      await givenTheAppIsLaunched($);
      await givenIAmLoggedInAsTraveler($);
      await givenIAmOnTheHomeFeed($);

      await whenIScrollDownToEnd($);
      await thenIShouldSeeSection($, 'honesty footer');
      await thenTheAppShouldNotHaveCrashed($);
    },
  );

  // ── F04-S01: Open post detail from feed ──────────────────────────────────
  patrolTest(
    'F04-S01: User opens a post detail page from the feed',
    tags: ['discovery', 'smoke', 'critical'],
    ($) async {
      await beforeScenario($);
      await givenTheAppIsLaunched($);
      await givenIAmLoggedInAsTraveler($);
      await givenIAmOnTheHomeFeed($);

      await whenITapTheFirstPostCardInFeed($);
      await thenIShouldBeOnPostDetailScreen($);
      await thenIShouldSee($, 'POST');
      await thenIShouldSeeFollowButtonInCreatorHeader($);
      await thenIShouldSeeEngagementBar($);
    },
  );

  // ── F04-S02: Open itinerary detail from feed ──────────────────────────────
  patrolTest(
    'F04-S02: User opens an itinerary detail page from the feed',
    tags: ['discovery', 'smoke'],
    ($) async {
      await beforeScenario($);
      await givenTheAppIsLaunched($);
      await givenIAmLoggedInAsTraveler($);
      await givenIAmOnTheHomeFeed($);

      await whenITapTheFirstItineraryCardInFeed($);
      await thenIShouldBeOnItineraryDetailScreen($);
      await thenIShouldSee($, 'ITINERARY');
    },
  );

  // ── F04-S03: Open event detail from feed ──────────────────────────────────
  patrolTest(
    'F04-S03: User opens an event detail page from the feed',
    tags: ['discovery', 'smoke'],
    ($) async {
      await beforeScenario($);
      await givenTheAppIsLaunched($);
      await givenIAmLoggedInAsTraveler($);
      await givenIAmOnTheHomeFeed($);

      await whenITapTheFirstEventCardInFeed($);
      await thenIShouldBeOnEventDetailScreen($);
    },
  );

  // ── F04-S05: Back navigation from detail ──────────────────────────────────
  patrolTest(
    'F04-S05: Back navigation from detail page returns to feed',
    tags: ['discovery', 'navigation'],
    ($) async {
      await beforeScenario($);
      await givenTheAppIsLaunched($);
      await givenIAmLoggedInAsTraveler($);
      await givenIAmOnTheHomeFeed($);

      await whenITapTheFirstPostCardInFeed($);
      await thenIShouldBeOnPostDetailScreen($);
      await whenINavigateBack($);
      await thenIShouldSeeTheHomeFeed($);
    },
  );
}
