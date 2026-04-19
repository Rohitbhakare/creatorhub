import 'dart:async' show unawaited;
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
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

/// Wait until the home feed is visible after login/navigation settles.
/// Maps to: "Given I am on the home feed".
///
/// Uses waitUntilVisible (real-time polling) instead of pumpAndSettle to avoid
/// deadlocking on the Firebase auth stream which keeps frames scheduled
/// indefinitely after login (same pattern as navigation_steps.dart tab taps).
Future<void> givenIAmOnTheHomeFeed(PatrolIntegrationTester $) async {
  await $(HomeFeedScreen).waitUntilVisible(
    timeout: const Duration(seconds: 15),
  );
  // Give feed API providers 2s to load content before step assertions run.
  await Future.delayed(const Duration(seconds: 2));
  await $.tester.pump(const Duration(milliseconds: 200));
}

/// Navigate to the seed post detail page via GoRouter push.
/// Maps to: "Given I am on the post detail screen for the seed post".
///
/// Uses GoRouter.of(context).push() instead of navigator.pushNamed() because
/// GoRouter apps don't register routes in the standard Flutter named-route map.
/// pushNamed() would silently fail to navigate in a GoRouter app.
Future<void> givenIAmOnSeedPostDetail(PatrolIntegrationTester $) async {
  // GoRouter.of() needs a context that is a DESCENDANT of InheritedGoRouter.
  // InheritedGoRouter is mounted below MaterialApp (not above it), so using
  // MaterialApp as the element context always fails with "No GoRouter found".
  // HomeFeedScreen is rendered by GoRouter so it has InheritedGoRouter above it.
  await $(HomeFeedScreen).waitUntilVisible(timeout: const Duration(seconds: 15));
  unawaited(
    Future.microtask(() {
      final element = $.tester.element(find.byType(HomeFeedScreen).first);
      GoRouter.of(element).push('/posts/${TestData.seedPostId}');
    }),
  );
  // Real-time wait: GoRouter push fires the redirect + builds PostDetailScreen.
  await Future.delayed(const Duration(seconds: 3));
  await $.tester.pump(const Duration(milliseconds: 200));
}

/// Navigate to the seed itinerary detail page via GoRouter push.
/// Maps to: "Given I am on the itinerary detail screen for the seed itinerary".
Future<void> givenIAmOnSeedItineraryDetail(PatrolIntegrationTester $) async {
  await $(HomeFeedScreen).waitUntilVisible(timeout: const Duration(seconds: 15));
  unawaited(
    Future.microtask(() {
      final element = $.tester.element(find.byType(HomeFeedScreen).first);
      GoRouter.of(element).push('/itineraries/${TestData.seedItineraryId}');
    }),
  );
  await Future.delayed(const Duration(seconds: 3));
  await $.tester.pump(const Duration(milliseconds: 200));
}

/// Navigate to the seed event detail page via GoRouter push.
/// Maps to: "Given I am on the event detail screen for the seed event".
Future<void> givenIAmOnSeedEventDetail(PatrolIntegrationTester $) async {
  await $(HomeFeedScreen).waitUntilVisible(timeout: const Duration(seconds: 15));
  unawaited(
    Future.microtask(() {
      final element = $.tester.element(find.byType(HomeFeedScreen).first);
      GoRouter.of(element).push('/events/${TestData.seedEventId}');
    }),
  );
  await Future.delayed(const Duration(seconds: 3));
  await $.tester.pump(const Duration(milliseconds: 200));
}

/// Navigate to the seed experience detail page via GoRouter push.
/// Maps to: "Given I am on the experience detail screen for the seed experience".
Future<void> givenIAmOnSeedExperienceDetail(PatrolIntegrationTester $) async {
  await $(HomeFeedScreen).waitUntilVisible(timeout: const Duration(seconds: 15));
  unawaited(
    Future.microtask(() {
      final element = $.tester.element(find.byType(HomeFeedScreen).first);
      GoRouter.of(element).push('/experiences/${TestData.seedExperienceId}');
    }),
  );
  await Future.delayed(const Duration(seconds: 3));
  await $.tester.pump(const Duration(milliseconds: 200));
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
///
/// Uses bounded pump instead of pumpAndSettle. The chip triggers a setState
/// in _HomeFeedScreenState which re-renders the slivers — no streams involved,
/// but consistency with the rest of the step library avoids any future issues.
Future<void> whenITapFilterChip(
  PatrolIntegrationTester $,
  String label,
) async {
  await $.tester.pump(const Duration(milliseconds: 100));
  final chipFinder = find.text(label);
  expect(chipFinder, findsWidgets, reason: 'Expected filter chip "$label"');
  await $.tester.tap(chipFinder.first, warnIfMissed: false);
  await $.tester.pump(const Duration(milliseconds: 300));
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
///
/// Near You: the section title is dynamic (result.label from API — e.g. 'Near Mumbai').
///   We match the always-present eyebrow 'NEAR YOU · THIS WEEKEND' instead.
///   Note: this eyebrow only appears when the section has content loaded.
///
/// Honesty footer: always present at the bottom of the feed sliver list.
///   Text is '"Hand-picked by our team this week. No algorithm, no infinite scroll."'
///   We use the caption line 'Refreshed every Monday · CreatorHub' as it is
///   less likely to wrap on small screens.
String _sectionUiText(String name) => switch (name.toLowerCase()) {
      'near you' => 'NEAR YOU · THIS WEEKEND',
      'travel' => 'Trips worth your weekend',
      'stories' => 'From the people who go',
      'discover creators' => 'Discover Creators',
      'honesty footer' => 'Refreshed every Monday · CreatorHub',
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
  final hasBar = find.byKey(const Key('engagement_bar')).evaluate().isNotEmpty;
  expect(hasBar, isTrue, reason: 'Engagement bar should be visible');
}

/// Assert the follow button is visible in the creator header.
/// Accepts either "Follow" or "Following" — the seed traveler may already
/// follow the seed creator, in which case the button label is "Following".
///
/// The PostDetailScreen becomes visible while still in skeleton/loading state.
/// The Follow button only renders after the API call completes (loaded state).
/// We poll up to 20 seconds to allow the API response to arrive.
/// Maps to: "And I should see the Follow button in the creator header".
Future<void> thenIShouldSeeFollowButtonInCreatorHeader(
  PatrolIntegrationTester $,
) async {
  bool found = false;
  for (var i = 0; i < 40 && !found; i++) {
    found = find.text('Follow').evaluate().isNotEmpty ||
        find.text('Following').evaluate().isNotEmpty;
    if (!found) {
      await Future.delayed(const Duration(milliseconds: 500));
      // Use pump(500ms) to advance the rendering clock and allow Riverpod
      // state updates (from the async API call) to propagate to the widget tree.
      await $.tester.pump(const Duration(milliseconds: 500));
    }
  }
  // Diagnostic info to understand failure state
  final isError = find.text('Something went wrong').evaluate().isNotEmpty ||
      find.text('Failed to load post').evaluate().isNotEmpty;
  final titleVisible = find.text('Dawn at Pangong Lake').evaluate().isNotEmpty;
  expect(found, isTrue,
      reason: 'Expected Follow or Following button in creator header. '
          'isError=$isError, titleVisible=$titleVisible. '
          '(Post detail API did not reach loaded state in time)');
}

/// Assert the price label starts with the rupee symbol.
/// Maps to: "And I should see the price formatted as ₹".
Future<void> thenIShouldSeePriceFormatted(PatrolIntegrationTester $) async {
  expect(find.textContaining('₹'), findsWidgets);
}
