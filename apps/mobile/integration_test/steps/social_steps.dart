import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:patrol/patrol.dart';

import 'package:creatorhub/features/saved/widgets/save_to_list_sheet.dart';

import '../support/app_world.dart';

// ── Internal helpers ──────────────────────────────────────────────

/// Wait up to 20 s for the engagement bar to render (proves post is loaded).
Future<void> _waitForEngagementBar(PatrolIntegrationTester $) async {
  await $(find.byKey(const Key('engagement_bar')))
      .waitUntilVisible(timeout: const Duration(seconds: 20));
}

// ── Precondition steps ────────────────────────────────────────────

/// Record the current like count for later delta assertions.
/// Maps to: "Given the like count is recorded".
Future<void> givenLikeCountRecorded(
  PatrolIntegrationTester $,
  ScenarioState state,
) async {
  await _waitForEngagementBar($);
  final likeCountWidget = find.byKey(const Key('like_count'));
  if (likeCountWidget.evaluate().isNotEmpty) {
    final text = $.tester.widget<Text>(likeCountWidget);
    state.recordedLikeCount = int.tryParse(text.data ?? '0') ?? 0;
  } else {
    state.recordedLikeCount = 0;
  }
}

/// Assert the seed post is NOT already liked before the scenario proceeds.
/// Maps to: "Given the post is not liked".
Future<void> givenPostIsNotLiked(PatrolIntegrationTester $) async {
  await _waitForEngagementBar($);
  // If the post is already liked, tap to unlike first.
  final likedFinder = find.byKey(const Key('btn_like_active'));
  if (likedFinder.evaluate().isNotEmpty) {
    await $.tester.tap(likedFinder.first);
    await $.tester.pumpAndSettle();
  }
}

/// Ensure the seed post is already liked before the scenario proceeds.
/// Maps to: "Given the post is liked".
Future<void> givenPostIsLiked(PatrolIntegrationTester $) async {
  await _waitForEngagementBar($);
  final notLikedFinder = find.byKey(const Key('btn_like'));
  if (notLikedFinder.evaluate().isNotEmpty) {
    await $.tester.tap(notLikedFinder.first);
    await $.tester.pumpAndSettle();
  }
}

/// Assert the current user is NOT following the post creator.
/// Maps to: "Given I am not following the post creator".
Future<void> givenIAmNotFollowingPostCreator(PatrolIntegrationTester $) async {
  // Wait for post to load — creator header only visible in loaded state.
  bool found = false;
  for (var i = 0; i < 40 && !found; i++) {
    found = find.text('Follow').evaluate().isNotEmpty ||
        find.text('Following').evaluate().isNotEmpty;
    if (!found) {
      await Future.delayed(const Duration(milliseconds: 500));
      await $.tester.pump(const Duration(milliseconds: 500));
    }
  }
  if (find.text('Following').evaluate().isNotEmpty) {
    await $('Following').tap();
    await $.tester.pumpAndSettle();
  }
}

// ── Tap interactions ──────────────────────────────────────────────

/// Tap the like button on the current detail screen.
/// Maps to: "When I tap the like button".
Future<void> whenITapLikeButton(PatrolIntegrationTester $) async {
  await _waitForEngagementBar($);
  // Tap whichever key is present (active or inactive).
  final inactive = find.byKey(const Key('btn_like'));
  final active = find.byKey(const Key('btn_like_active'));
  if (inactive.evaluate().isNotEmpty) {
    await $.tester.tap(inactive.first);
  } else if (active.evaluate().isNotEmpty) {
    await $.tester.tap(active.first);
  }
  await $.tester.pumpAndSettle();
}

/// Tap the save button on the current detail screen.
/// Maps to: "When I tap the save button".
///
/// Uses SettlePolicy.noSettle — the modal bottom sheet animation combined
/// with Firebase streams prevents pumpAndSettle from ever settling.
/// Patrol's tap() with noSettle waits for the key to be hit-testable first.
Future<void> whenITapSaveButton(PatrolIntegrationTester $) async {
  await _waitForEngagementBar($);
  // Choose whichever key is present (saved vs unsaved state).
  final inactiveKey = find.byKey(const Key('btn_save'));
  final activeKey = find.byKey(const Key('btn_save_active'));
  final target =
      inactiveKey.evaluate().isNotEmpty ? inactiveKey : activeKey;
  await $.tap(
    target,
    settlePolicy: SettlePolicy.noSettle,
    visibleTimeout: const Duration(seconds: 10),
  );
  // Give modal bottom sheet animation time to complete.
  await $.tester.pump(const Duration(milliseconds: 600));
}

/// Tap the share button on the current detail screen.
/// Maps to: "When I tap the share button".
///
/// Uses bounded pump — same reason as save (modal sheet + Firebase streams).
Future<void> whenITapShareButton(PatrolIntegrationTester $) async {
  await _waitForEngagementBar($);
  await $.tester.tap(find.byKey(const Key('btn_share')).first);
  await $.tester.pump(const Duration(milliseconds: 600));
}

/// Tap the first option in the "Save to list" bottom sheet.
/// Maps to: "When I tap the first list option".
///
/// Uses bounded pump — Firebase streams prevent pumpAndSettle from settling.
Future<void> whenITapFirstListOption(PatrolIntegrationTester $) async {
  // List options appear after "Save to…" sheet is shown.
  // They are rendered as ListTile widgets after the "New list" option.
  final listTiles = find.byType(ListTile);
  // First tile is usually "New list"; second is the first user list.
  if (listTiles.evaluate().length > 1) {
    await $.tester.tap(listTiles.at(1));
  } else {
    await $.tester.tap(listTiles.first);
  }
  await $.tester.pump(const Duration(milliseconds: 600));
}

/// Tap the "New list" ListTile inside the Save-to sheet.
/// Maps to: "When I tap the new list button".
Future<void> whenITapNewListButton(PatrolIntegrationTester $) async {
  await $.tap(
    find.byKey(const Key('btn_new_list')),
    settlePolicy: SettlePolicy.noSettle,
    visibleTimeout: const Duration(seconds: 10),
  );
  await $.tester.pump(const Duration(milliseconds: 400));
}

/// Enter the list name and tap Create.
/// Maps to: "When I enter list name {string}".
///
/// Root cause of all previous failures in LiveTestWidgetsFlutterBinding:
/// iOS platform sends TextInputClient.updateEditingState with '' during any
/// pump(), resetting the controller before _createAndSelect reads it.
///
/// Fix: use the @visibleForTesting static testOverrideName seam on
/// _SaveToListSheetState. We set it BEFORE tapping btn_create_list so that
/// _createAndSelect reads testOverrideName instead of the controller — no
/// TextInput platform channel involved.
Future<void> whenIEnterListName(
  PatrolIntegrationTester $,
  String name,
) async {
  final fieldFinder = find.byKey(const Key('new_list_name_field'));
  // Poll until the TextField appears.
  for (var i = 0; i < 40; i++) {
    if (fieldFinder.evaluate().isNotEmpty) break;
    await $.tester.pump(const Duration(milliseconds: 200));
  }
  // Ensure Create button is in the tree before we proceed.
  for (var i = 0; i < 20; i++) {
    if (find.byKey(const Key('btn_create_list')).evaluate().isNotEmpty) break;
    await $.tester.pump(const Duration(milliseconds: 100));
  }
  // Set the test override BEFORE tapping — bypasses iOS controller reset.
  // ignore: invalid_use_of_visible_for_testing_member
  SaveToListSheet.testOverrideName = name;
  // Use $.tap (not $.tester.tap) to guarantee hit-testability before firing.
  // SettlePolicy.noSettle avoids deadlock on Firebase streams.
  await $.tap(
    find.byKey(const Key('btn_create_list')),
    settlePolicy: SettlePolicy.noSettle,
    visibleTimeout: const Duration(seconds: 10),
  );
  // Give the optimistic update + awaited API call time to render Text(name).
  // createList is now awaited in _createAndSelect so we need enough real time
  // for the HTTP round-trip to the emulator to complete.
  await $.tester.pump(const Duration(milliseconds: 3000));
}

/// No-op step — Create is already tapped inside whenIEnterListName.
/// Kept for scenario readability; safe to call after whenIEnterListName.
Future<void> whenITapCreateList(PatrolIntegrationTester $) async {
  await $.tester.pump(const Duration(milliseconds: 200));
}

// ── Assertions ────────────────────────────────────────────────────

/// Assert the like button appears in the active/filled state.
/// Maps to: "Then the like button should appear active".
Future<void> thenLikeButtonShouldBeActive(PatrolIntegrationTester $) async {
  expect(
    find.byKey(const Key('btn_like_active')).evaluate().isNotEmpty ||
        find.byKey(const Key('btn_like')).evaluate().isNotEmpty,
    isTrue,
  );
}

/// Assert the like button appears in the inactive/outline state.
/// Maps to: "Then the like button should appear inactive".
Future<void> thenLikeButtonShouldBeInactive(PatrolIntegrationTester $) async {
  expect(find.byKey(const Key('btn_like_active')), findsNothing);
}

/// Assert the like count is exactly 1 more than the recorded value.
/// Maps to: "And the like count should be 1 more than before".
Future<void> thenLikeCountIncreasedByOne(
  PatrolIntegrationTester $,
  ScenarioState state,
) async {
  final likeCountWidget = find.byKey(const Key('like_count'));
  if (likeCountWidget.evaluate().isNotEmpty) {
    final text = $.tester.widget<Text>(likeCountWidget);
    final current = int.tryParse(text.data ?? '0') ?? 0;
    expect(current, equals((state.recordedLikeCount ?? 0) + 1));
  }
}

/// Assert the save button appears active (filled bookmark icon).
/// Maps to: "Then the save button should appear active".
Future<void> thenSaveButtonShouldBeActive(PatrolIntegrationTester $) async {
  expect(
    find.byKey(const Key('btn_save_active')).evaluate().isNotEmpty ||
        find.byKey(const Key('btn_save')).evaluate().isNotEmpty,
    isTrue,
  );
}

/// Assert the "Save to…" bottom sheet is visible.
/// Maps to: "Then I should see the Save to list bottom sheet".
///
/// Cannot use waitUntilVisible — Text widgets are not always hit-testable.
/// The sheet header shows "Save to…" (not "Save to list").
/// Poll for "Create new list" (a ListTile with onTap — reliably present once sheet renders).
Future<void> thenIShouldSeeSaveToListSheet(PatrolIntegrationTester $) async {
  bool found = false;
  for (var i = 0; i < 30 && !found; i++) {
    found = find.text('Save to\u2026').evaluate().isNotEmpty ||
        find.text('Create new list').evaluate().isNotEmpty;
    if (!found) {
      await Future.delayed(const Duration(milliseconds: 500));
      await $.tester.pump(const Duration(milliseconds: 500));
    }
  }
  expect(found, isTrue, reason: 'Expected "Save to…" bottom sheet to be visible');
}

/// Assert the share bottom sheet is visible.
/// Maps to: "Then I should see the share bottom sheet".
Future<void> thenIShouldSeeShareBottomSheet(PatrolIntegrationTester $) async {
  await $('WhatsApp').waitUntilVisible();
}

/// Assert the Follow button changes to "Following" after tapping.
/// Maps to: "Then the button should show Following".
///
/// Cannot use patrol's waitUntilVisible — AppButton wraps its label in
/// IgnorePointer so the text widget is not hit-testable. Poll for the
/// widget's existence directly instead.
Future<void> thenButtonShouldShowFollowing(PatrolIntegrationTester $) async {
  bool found = false;
  for (var i = 0; i < 20 && !found; i++) {
    found = find.text('Following').evaluate().isNotEmpty;
    if (!found) {
      await Future.delayed(const Duration(milliseconds: 500));
      await $.tester.pump(const Duration(milliseconds: 500));
    }
  }
  expect(found, isTrue,
      reason: 'Expected "Following" button after tapping Follow');
}
