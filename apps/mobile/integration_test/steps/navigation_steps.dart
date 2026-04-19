import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:patrol/patrol.dart';

import 'package:creatorhub/features/feed/screens/home_feed_screen.dart';

// ── Tab navigation ────────────────────────────────────────────────

/// Tap a bottom nav tab by its visible label.
/// Labels: "Home", "Search", "Studio", "You".
/// Maps to: "When I tap the {string} tab".
///
/// Uses $.tester.tap with bounded pump instead of $(label).tap() / pumpAndSettle.
/// GoRouter tab switches re-check auth state via the Firebase stream which
/// keeps frames scheduled indefinitely — pumpAndSettle deadlocks on it.
/// Bounded pump(500ms) flushes navigation frames without blocking on the stream.
Future<void> whenITapTheTab(PatrolIntegrationTester $, String tabLabel) async {
  await $.tester.pump(const Duration(milliseconds: 100));
  final labelFinder = find.text(tabLabel);
  expect(labelFinder, findsWidgets, reason: 'Expected tab "$tabLabel" in nav bar');
  await $.tester.tap(labelFinder.first, warnIfMissed: false);
  await $.tester.pump(const Duration(milliseconds: 500));
}

/// Tap the Create+ tab (the raised coral button in the centre of the nav bar).
/// The tab label text is "Create" in the production UI.
/// Maps to: "When I tap the Create+ tab".
Future<void> whenITapTheCreateTab(PatrolIntegrationTester $) async {
  await $.tester.tap(find.text('Create').first, warnIfMissed: false);
  await $.tester.pump(const Duration(milliseconds: 500));
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

/// Scroll the home feed CustomScrollView to the bottom until the honesty
/// footer is visible.
/// Maps to: "When I scroll down to the end of the feed".
///
/// The honesty footer always renders regardless of whether API content loaded.
/// Text: '"Hand-picked by our team this week. No algorithm, no infinite scroll."'
Future<void> whenIScrollDownToEnd(PatrolIntegrationTester $) async {
  // scrollUntilVisible requires a Scrollable finder (not CustomScrollView which
  // is not itself a Scrollable — it contains one internally).
  await $.tester.scrollUntilVisible(
    find.text('Refreshed every Monday · CreatorHub'),
    500.0,
    scrollable: find.byType(Scrollable).first,
  );
  await $.tester.pump(const Duration(milliseconds: 300));
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
  await $(tabLabel).waitUntilVisible(timeout: const Duration(seconds: 5));
}

/// Assert no ErrorWidget is shown — the app has not crashed.
/// Maps to: "And the app should not have crashed".
Future<void> thenTheAppShouldNotHaveCrashed(PatrolIntegrationTester $) async {
  expect(find.byType(ErrorWidget), findsNothing);
}
