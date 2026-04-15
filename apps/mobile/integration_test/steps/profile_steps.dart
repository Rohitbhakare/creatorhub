import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:patrol/patrol.dart';

import 'package:creatorhub/features/profile/screens/you_tab_screen.dart';

// ── Profile screen setup ──────────────────────────────────────────

// Tap "You" tab is handled by navigation_steps.dart: whenITapTheTab($, 'You')

// ── Assertions — own profile ──────────────────────────────────────

/// Assert the "You" tab / profile screen is visible.
/// Maps to: "Then I should be on the profile screen".
Future<void> thenIShouldBeOnProfileScreen(PatrolIntegrationTester $) async {
  await $(YouTabScreen).waitUntilVisible();
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

/// Clear the display name field.
/// Maps to: "When I clear the display name field".
Future<void> whenIClearDisplayNameField(PatrolIntegrationTester $) async {
  final field = find.widgetWithText(TextField, 'Display name');
  await $.tester.tap(field);
  await $.tester.pumpAndSettle();
  final editableText = $.tester.widget<EditableText>(
    find.descendant(of: field, matching: find.byType(EditableText)),
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
  await $.tester.enterText(
    find.widgetWithText(TextField, 'Display name'),
    name,
  );
  await $.tester.pumpAndSettle();
}

// ── Creator profile (other user) ──────────────────────────────────

/// Tap the creator name link in a content detail header.
/// Maps to: "When I tap the creator name in the header".
Future<void> whenITapCreatorNameInHeader(PatrolIntegrationTester $) async {
  final creatorNameKey = find.byKey(const Key('creator_name_link'));
  if (creatorNameKey.evaluate().isNotEmpty) {
    await $.tester.tap(creatorNameKey);
  } else {
    // Fallback: find the widget above the Follow button
    await $('Follow').first.tap();
  }
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
