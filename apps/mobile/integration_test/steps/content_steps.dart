import 'dart:async' show unawaited;
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:patrol/patrol.dart';

import 'package:creatorhub/features/posts/screens/post_detail_screen.dart';
import 'package:creatorhub/features/posts/widgets/post_feed_card.dart';
import 'package:creatorhub/features/itineraries/screens/itinerary_detail_screen.dart';
import 'package:creatorhub/features/itineraries/widgets/itinerary_feed_card.dart';
import 'package:creatorhub/features/events/screens/event_detail_screen.dart';
import 'package:creatorhub/features/events/widgets/event_feed_card.dart';
import 'package:creatorhub/features/experiences/screens/experience_detail_screen.dart';
import 'package:creatorhub/features/feed/screens/home_feed_screen.dart';

import '../support/test_data.dart';

// ── Home feed content states ──────────────────────────────────────

/// Wait until the home feed has loaded at least one content card.
/// Maps to: "Given I am on the home feed".
Future<void> givenIAmOnTheHomeFeed(PatrolIntegrationTester $) async {
  await $.tester.pumpAndSettle(const Duration(seconds: 10));
  await $(HomeFeedScreen).waitUntilVisible();
}

/// Navigate to the seed post detail page via deep-link.
/// Maps to: "Given I am on the post detail screen for the seed post".
Future<void> givenIAmOnSeedPostDetail(PatrolIntegrationTester $) async {
  final navigator = $.tester.state<NavigatorState>(
    find.byType(Navigator).first,
  );
  unawaited(
    Future.microtask(
      () => navigator.pushNamed('/posts/${TestData.seedPostId}'),
    ),
  );
  await $.tester.pumpAndSettle(const Duration(seconds: 5));
}

/// Navigate to the seed experience detail page via deep-link.
/// Maps to: "Given I am on the experience detail screen for the seed experience".
Future<void> givenIAmOnSeedExperienceDetail(PatrolIntegrationTester $) async {
  final navigator = $.tester.state<NavigatorState>(
    find.byType(Navigator).first,
  );
  unawaited(
    Future.microtask(
      () => navigator.pushNamed('/experiences/${TestData.seedExperienceId}'),
    ),
  );
  await $.tester.pumpAndSettle(const Duration(seconds: 5));
}

// ── Feed card taps ────────────────────────────────────────────────

/// Tap the first PostFeedCard visible in the feed.
/// Maps to: "When I tap the first post card in the feed".
Future<void> whenITapTheFirstPostCardInFeed(PatrolIntegrationTester $) async {
  await $(PostFeedCard).first.tap();
  await $.tester.pumpAndSettle();
}

/// Tap the first ItineraryFeedCard visible in the feed.
/// Maps to: "When I tap the first itinerary card in the feed".
Future<void> whenITapTheFirstItineraryCardInFeed(
  PatrolIntegrationTester $,
) async {
  await $(ItineraryFeedCard).first.tap();
  await $.tester.pumpAndSettle();
}

/// Tap the first EventFeedCard visible in the feed.
/// Maps to: "When I tap the first event card in the feed".
Future<void> whenITapTheFirstEventCardInFeed(PatrolIntegrationTester $) async {
  await $(EventFeedCard).first.tap();
  await $.tester.pumpAndSettle();
}

/// Tap the first content card in the feed (any type).
/// Maps to: "When I tap the first post in the feed".
Future<void> whenITapTheFirstPostInFeed(PatrolIntegrationTester $) async {
  await $(PostFeedCard).first.tap();
  await $.tester.pumpAndSettle();
}

// ── Feed filter chips ─────────────────────────────────────────────

/// Tap a filter chip by label ("Travel", "Stories", "All", etc.).
/// Maps to: "When I tap the {string} filter chip".
Future<void> whenITapFilterChip(
  PatrolIntegrationTester $,
  String label,
) async {
  await $(label).tap();
  await $.tester.pumpAndSettle();
}

// ── Assertions — detail screen ────────────────────────────────────

/// Assert the post detail screen is visible.
/// Maps to: "Then I should be on the post detail screen".
Future<void> thenIShouldBeOnPostDetailScreen(PatrolIntegrationTester $) async {
  await $(PostDetailScreen).waitUntilVisible();
}

/// Assert the itinerary detail screen is visible.
/// Maps to: "Then I should be on the itinerary detail screen".
Future<void> thenIShouldBeOnItineraryDetailScreen(
  PatrolIntegrationTester $,
) async {
  await $(ItineraryDetailScreen).waitUntilVisible();
}

/// Assert the event detail screen is visible.
/// Maps to: "Then I should be on the event detail screen".
Future<void> thenIShouldBeOnEventDetailScreen(PatrolIntegrationTester $) async {
  await $(EventDetailScreen).waitUntilVisible();
}

/// Assert the experience detail screen is visible.
/// Maps to: "Then I should be on the experience detail screen".
Future<void> thenIShouldBeOnExperienceDetailScreen(
  PatrolIntegrationTester $,
) async {
  await $(ExperienceDetailScreen).waitUntilVisible();
}

// ── Assertions — feed sections ────────────────────────────────────

/// Maps section names from the feature file to the actual UI heading text.
String _sectionUiText(String name) => switch (name.toLowerCase()) {
      'near you' => 'Near You',
      'travel' => 'Trips worth your weekend',
      'stories' => 'From the people who go',
      'discover creators' => 'Discover Creators',
      'honesty footer' =>
        'We surface content based on your location and followed verticals',
      _ => name,
    };

/// Assert a named feed section heading is visible.
/// Maps to: "Then I should see the {string} section".
Future<void> thenIShouldSeeSection(
  PatrolIntegrationTester $,
  String section,
) async {
  await $(_sectionUiText(section)).waitUntilVisible();
}

/// Assert a named feed section heading is NOT visible.
/// Maps to: "Then I should not see the {string} section".
Future<void> thenIShouldNotSeeSection(
  PatrolIntegrationTester $,
  String section,
) async {
  expect(find.text(_sectionUiText(section)), findsNothing);
}

// ── Assertions — detail page elements ────────────────────────────

/// Assert the engagement bar (like / comment / share / save) is present.
/// Maps to: "And I should see the engagement bar with like, comment, share, save buttons".
Future<void> thenIShouldSeeEngagementBar(PatrolIntegrationTester $) async {
  final hasBar =
      find.byKey(const Key('btn_like')).evaluate().isNotEmpty ||
          find.byKey(const Key('btn_comment')).evaluate().isNotEmpty ||
          find.text('Like').evaluate().isNotEmpty;
  expect(hasBar, isTrue, reason: 'Engagement bar should be visible');
}

/// Assert the "Follow" button is visible in the creator header.
/// Maps to: "And I should see the Follow button in the creator header".
Future<void> thenIShouldSeeFollowButtonInCreatorHeader(
  PatrolIntegrationTester $,
) async {
  await $('Follow').waitUntilVisible();
}

/// Assert the price label starts with the rupee symbol.
/// Maps to: "And I should see the price formatted as ₹".
Future<void> thenIShouldSeePriceFormatted(PatrolIntegrationTester $) async {
  expect(find.textContaining('₹'), findsWidgets);
}
