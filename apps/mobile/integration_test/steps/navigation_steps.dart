import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:patrol/patrol.dart';

import 'package:creatorhub/features/feed/screens/home_feed_screen.dart';

// ── Tab navigation ────────────────────────────────────────────────

/// Tap a bottom nav tab by its visible label.
/// Labels: "Home", "Search", "Studio", "You".
/// Maps to: "When I tap the {string} tab".
Future<void> whenITapTheTab(PatrolIntegrationTester $, String tabLabel) async {
  await $(tabLabel).tap();
  await $.tester.pumpAndSettle();
}

/// Tap the Create+ tab (the raised coral button in the centre of the nav bar).
/// The tab label text is "Create" in the production UI.
/// Maps to: "When I tap the Create+ tab".
Future<void> whenITapTheCreateTab(PatrolIntegrationTester $) async {
  await $('Create').tap();
  await $.tester.pumpAndSettle();
}

// ── Back navigation ───────────────────────────────────────────────

/// Pop the current route.
/// Maps to: "When I navigate back".
Future<void> whenINavigateBack(PatrolIntegrationTester $) async {
  final NavigatorState navigator = $.tester.state(
    find.byType(Navigator).first,
  );
  navigator.pop();
  await $.tester.pumpAndSettle();
}

// ── Feed interactions ─────────────────────────────────────────────

/// Scroll the home feed CustomScrollView to the bottom.
/// Maps to: "When I scroll down to the end of the feed".
Future<void> whenIScrollDownToEnd(PatrolIntegrationTester $) async {
  await $.tester.scrollUntilVisible(
    find.text(
      'We surface content based on your location and followed verticals',
    ),
    500.0,
    scrollable: find.byType(CustomScrollView),
  );
  await $.tester.pumpAndSettle();
}

/// Drag the home feed downward to trigger a pull-to-refresh.
/// Maps to: "When I pull down to refresh the feed".
Future<void> whenIPullDownToRefresh(PatrolIntegrationTester $) async {
  await $.tester.drag(find.byType(HomeFeedScreen), const Offset(0, 300));
  await $.tester.pumpAndSettle(const Duration(seconds: 3));
}

/// Navigate to the Saved Lists screen from a given tab.
/// Maps to: "When I navigate to saved lists from the {string} tab".
Future<void> whenINavigateToSavedListsFromTab(
  PatrolIntegrationTester $,
  String tab,
) async {
  await $(tab).tap();
  await $.tester.pumpAndSettle();
  await $('Saved').tap();
  await $.tester.pumpAndSettle();
}

// ── Assertions ────────────────────────────────────────────────────

/// Assert a tab label is visible in the bottom nav.
/// Maps to: "Then the {string} tab should be visible".
Future<void> thenTheTabShouldBeVisible(
  PatrolIntegrationTester $,
  String tabLabel,
) async {
  await $(tabLabel).waitUntilVisible();
}

/// Assert no ErrorWidget is shown — the app has not crashed.
/// Maps to: "And the app should not have crashed".
Future<void> thenTheAppShouldNotHaveCrashed(PatrolIntegrationTester $) async {
  expect(find.byType(ErrorWidget), findsNothing);
}
