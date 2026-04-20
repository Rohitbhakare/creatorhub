import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:patrol/patrol.dart';

import 'package:creatorhub/features/profile/screens/you_tab_screen.dart';

// ── Profile screen setup ──────────────────────────────────────────

// Tap "You" tab is handled by navigation_steps.dart: whenITapTheTab($, 'You')

// ── Assertions — own profile ──────────────────────────────────────

/// Assert the "You" tab / profile screen is visible.
/// Maps to: "Then I should be on the profile screen".
///
/// Uses a generous timeout because this is called after operations that round-trip
/// to the API (e.g. save display name → PUT /users/me → GET /users/me → pop).
Future<void> thenIShouldBeOnProfileScreen(PatrolIntegrationTester $) async {
  await $(YouTabScreen).waitUntilVisible(
    timeout: const Duration(seconds: 20),
  );
}

/// Tap the Save button on the Edit Profile AppBar by stable key.
/// The generic whenITap($, 'Save') resolves to `find.text('Save').first` which
/// can miss the TextButton when the AppBar action's hitbox is small; the
/// explicit key guarantees the correct widget.
Future<void> whenITapSaveOnEditProfile(PatrolIntegrationTester $) async {
  await $.tester.tap(find.byKey(const Key('edit_profile_save')));
  await $.tester.pumpAndSettle();
}

/// Assert "Edit Profile" button is visible (own profile only).
/// Maps to: "And I should see Edit Profile button".
Future<void> thenIShouldSeeEditProfileButton(PatrolIntegrationTester $) async {
  await $('Edit Profile').waitUntilVisible();
}

/// Assert "Edit Profile" is NOT visible (other user's profile).
/// Maps to: "And I should not see Edit Profile".
Future<void> thenIShouldNotSeeEditProfileButton(
  PatrolIntegrationTester $,
) async {
  expect(find.text('Edit Profile'), findsNothing);
}

/// Assert the follower count label is visible.
/// Maps to: "And I should see my follower count".
Future<void> thenIShouldSeeFollowerCount(PatrolIntegrationTester $) async {
  await $('Followers').waitUntilVisible();
}

/// Assert the following count label is visible.
/// Maps to: "And I should see my following count".
Future<void> thenIShouldSeeFollowingCount(PatrolIntegrationTester $) async {
  await $('Following').waitUntilVisible();
}

// ── Edit profile ──────────────────────────────────────────────────

/// Assert the edit profile screen is visible.
/// Maps to: "Then I should be on the edit profile screen".
Future<void> thenIShouldBeOnEditProfileScreen(PatrolIntegrationTester $) async {
  await $('Edit Profile').waitUntilVisible();
}

/// Targets the Display Name TextField on the Edit Profile screen by stable key.
/// The label 'Display Name' is a sibling Text widget (not part of TextField),
/// so find.widgetWithText() does not match — use ValueKey instead.
final Finder _displayNameField =
    find.byKey(const ValueKey('edit_profile_display_name'));

/// Clear the display name field.
/// Maps to: "When I clear the display name field".
Future<void> whenIClearDisplayNameField(PatrolIntegrationTester $) async {
  await $.tester.tap(_displayNameField);
  await $.tester.pumpAndSettle();
  final editableText = $.tester.widget<EditableText>(
    find.descendant(of: _displayNameField, matching: find.byType(EditableText)),
  );
  editableText.controller.clear();
  await $.tester.pumpAndSettle();
}

/// Enter a new display name.
/// Maps to: "When I enter display name {string}".
Future<void> whenIEnterDisplayName(
  PatrolIntegrationTester $,
  String name,
) async {
  await $.tester.enterText(_displayNameField, name);
  await $.tester.pumpAndSettle();
}

// ── Creator profile (other user) ──────────────────────────────────

/// Tap the creator name link in a content detail header.
/// Maps to: "When I tap the creator name in the header".
///
/// Waits for the creator_name_link ValueKey to appear because the post detail
/// screen renders a skeleton first; the real [_CreatorHeader] only mounts after
/// [postDetailProvider] resolves.
Future<void> whenITapCreatorNameInHeader(PatrolIntegrationTester $) async {
  await $(const Key('creator_name_link')).waitUntilVisible(
    timeout: const Duration(seconds: 15),
  );
  await $.tester.tap(find.byKey(const Key('creator_name_link')));
  await $.tester.pumpAndSettle();
}

/// Assert the creator's published content list is visible.
/// Maps to: "And I should see their published content list".
Future<void> thenIShouldSeeCreatorContentList(PatrolIntegrationTester $) async {
  expect(
    find.byKey(const Key('creator_content_list')).evaluate().isNotEmpty ||
        find.byType(ListView).evaluate().isNotEmpty,
    isTrue,
  );
}
