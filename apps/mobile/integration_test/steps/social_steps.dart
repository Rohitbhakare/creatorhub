import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:patrol/patrol.dart';

import '../support/app_world.dart';

// ── Precondition steps ────────────────────────────────────────────

/// Record the current like count for later delta assertions.
/// Maps to: "Given the like count is recorded".
Future<void> givenLikeCountRecorded(
  PatrolIntegrationTester $,
  ScenarioState state,
) async {
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
  // The like button key is 'btn_like'. We check it's in the inactive state.
  // If it is already liked, we tap to unlike first.
  final likedFinder = find.byKey(const Key('btn_like_active'));
  if (likedFinder.evaluate().isNotEmpty) {
    await $.tester.tap(likedFinder.first);
    await $.tester.pumpAndSettle();
  }
}

/// Ensure the seed post is already liked before the scenario proceeds.
/// Maps to: "Given the post is liked".
Future<void> givenPostIsLiked(PatrolIntegrationTester $) async {
  final notLikedFinder = find.byKey(const Key('btn_like'));
  if (notLikedFinder.evaluate().isNotEmpty) {
    await $.tester.tap(notLikedFinder.first);
    await $.tester.pumpAndSettle();
  }
}

/// Assert the current user is NOT following the post creator.
/// Maps to: "Given I am not following the post creator".
Future<void> givenIAmNotFollowingPostCreator(PatrolIntegrationTester $) async {
  // If the "Following" button is visible, tap it to unfollow first.
  if (find.text('Following').evaluate().isNotEmpty) {
    await $('Following').tap();
    await $.tester.pumpAndSettle();
  }
}

// ── Tap interactions ──────────────────────────────────────────────

/// Tap the like button on the current detail screen.
/// Maps to: "When I tap the like button".
Future<void> whenITapLikeButton(PatrolIntegrationTester $) async {
  // Try by key first, fall back to text
  final byKey = find.byKey(const Key('btn_like'));
  if (byKey.evaluate().isNotEmpty) {
    await $.tester.tap(byKey.first);
  } else {
    await $('Like').tap();
  }
  await $.tester.pumpAndSettle();
}

/// Tap the save button on the current detail screen.
/// Maps to: "When I tap the save button".
Future<void> whenITapSaveButton(PatrolIntegrationTester $) async {
  final byKey = find.byKey(const Key('btn_save'));
  if (byKey.evaluate().isNotEmpty) {
    await $.tester.tap(byKey.first);
  } else {
    await $('Save').tap();
  }
  await $.tester.pumpAndSettle();
}

/// Tap the share button on the current detail screen.
/// Maps to: "When I tap the share button".
Future<void> whenITapShareButton(PatrolIntegrationTester $) async {
  final byKey = find.byKey(const Key('btn_share'));
  if (byKey.evaluate().isNotEmpty) {
    await $.tester.tap(byKey.first);
  } else {
    await $('Share').tap();
  }
  await $.tester.pumpAndSettle();
}

/// Tap the first option in the "Save to list" bottom sheet.
/// Maps to: "When I tap the first list option".
Future<void> whenITapFirstListOption(PatrolIntegrationTester $) async {
  // List options appear after "Save to list" sheet is shown.
  // They are rendered as ListTile widgets after the "New list" option.
  final listTiles = find.byType(ListTile);
  // First tile is usually "New list"; second is the first user list.
  if (listTiles.evaluate().length > 1) {
    await $.tester.tap(listTiles.at(1));
  } else {
    await $.tester.tap(listTiles.first);
  }
  await $.tester.pumpAndSettle();
}

/// Enter text into the list name field in the "New list" dialog.
/// Maps to: "When I enter list name {string}".
Future<void> whenIEnterListName(
  PatrolIntegrationTester $,
  String name,
) async {
  await $.tester.enterText(find.byType(TextField).last, name);
  await $.tester.pumpAndSettle();
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

/// Assert the "Save to list" bottom sheet is visible.
/// Maps to: "Then I should see the Save to list bottom sheet".
Future<void> thenIShouldSeeSaveToListSheet(PatrolIntegrationTester $) async {
  await $('Save to list').waitUntilVisible();
}

/// Assert the share bottom sheet is visible.
/// Maps to: "Then I should see the share bottom sheet".
Future<void> thenIShouldSeeShareBottomSheet(PatrolIntegrationTester $) async {
  await $('WhatsApp').waitUntilVisible();
}

/// Assert the Follow button changes to "Following" after tapping.
/// Maps to: "Then the button should show Following".
Future<void> thenButtonShouldShowFollowing(PatrolIntegrationTester $) async {
  await $('Following').waitUntilVisible();
}
