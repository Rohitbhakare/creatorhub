import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:patrol/patrol.dart';

import 'package:creatorhub/features/content/screens/content_type_picker_screen.dart';
import 'package:creatorhub/features/content/screens/wizard_shell_screen.dart';

// ── Content type picker ───────────────────────────────────────────

/// Assert the content type picker sheet is visible.
/// Maps to: "Then I should see the content type picker".
Future<void> thenIShouldSeeContentTypePicker(PatrolIntegrationTester $) async {
  await $(ContentTypePickerScreen).waitUntilVisible();
}

// ── Post creation ─────────────────────────────────────────────────

/// Assert the post creation wizard is on screen.
/// Maps to: "Then I should be on the post creation wizard".
///
/// The wizard has no "Create Post" title — instead it shows a step indicator
/// "Step 1 of 3: Basics". We wait for the WizardShellScreen widget and then
/// verify the step indicator.
Future<void> thenIShouldBeOnPostCreationWizard(
  PatrolIntegrationTester $,
) async {
  await $(WizardShellScreen).waitUntilVisible(
    timeout: const Duration(seconds: 10),
  );
  await $('Step 1 of 3: Basics').waitUntilVisible(
    timeout: const Duration(seconds: 5),
  );
}

/// Enter the post title.
/// Maps to: "When I enter title {string}".
Future<void> whenIEnterTitle(PatrolIntegrationTester $, String title) async {
  await $.tester.enterText(
    find.widgetWithText(TextField, 'Title'),
    title,
  );
  await $.tester.pumpAndSettle();
}

/// Enter body text for a post.
/// Maps to: "When I enter body text {string}".
Future<void> whenIEnterBodyText(PatrolIntegrationTester $, String body) async {
  // The post body editor uses a TextField with hint "Write your post here…"
  final bodyField = find.widgetWithText(TextField, 'Write your post here…');
  if (bodyField.evaluate().isNotEmpty) {
    await $.tester.enterText(bodyField, body);
  } else {
    // Fallback: use the last visible TextField
    await $.tester.enterText(find.byType(TextField).last, body);
  }
  await $.tester.pumpAndSettle();
}

// ── Itinerary creation ────────────────────────────────────────────

/// Assert the itinerary creation wizard is on screen.
/// Maps to: "Then I should be on the itinerary creation wizard".
///
/// Itinerary wizard has 6 steps — first step label: "Step 1 of 6: Basics".
Future<void> thenIShouldBeOnItineraryCreationWizard(
  PatrolIntegrationTester $,
) async {
  await $(WizardShellScreen).waitUntilVisible(
    timeout: const Duration(seconds: 10),
  );
  await $('Step 1 of 6: Basics').waitUntilVisible(
    timeout: const Duration(seconds: 5),
  );
}

/// Tap "Add spot" in the itinerary builder.
/// Maps to: "When I tap Add spot".
Future<void> whenITapAddSpot(PatrolIntegrationTester $) async {
  await $('Add spot').tap();
  await $.tester.pumpAndSettle();
}

/// Type into the place search field.
/// Maps to: "When I search for place {string}".
Future<void> whenISearchForPlace(
  PatrolIntegrationTester $,
  String place,
) async {
  await $.tester.enterText(
    find.widgetWithText(TextField, 'Search for a place'),
    place,
  );
  await $.tester.pumpAndSettle(const Duration(seconds: 2));
}

/// Tap the first result in the place search list.
/// Maps to: "When I select the first place result".
Future<void> whenISelectFirstPlaceResult(PatrolIntegrationTester $) async {
  await $(ListTile).first.tap();
  await $.tester.pumpAndSettle();
}

/// Enter a note for the current spot.
/// Maps to: "When I enter spot note {string}".
Future<void> whenIEnterSpotNote(PatrolIntegrationTester $, String note) async {
  await $.tester.enterText(
    find.widgetWithText(TextField, 'Add a note (optional)'),
    note,
  );
  await $.tester.pumpAndSettle();
}

/// Tap "Save spot" to confirm adding the current spot.
/// Maps to: "When I tap Save spot".
Future<void> whenITapSaveSpot(PatrolIntegrationTester $) async {
  await $('Save spot').tap();
  await $.tester.pumpAndSettle();
}

// ── Event creation ────────────────────────────────────────────────

/// Assert the event creation wizard is on screen.
/// Maps to: "Then I should be on the event creation wizard".
///
/// Event wizard has 5 steps — first step label: "Step 1 of 5: Basics".
Future<void> thenIShouldBeOnEventCreationWizard(
  PatrolIntegrationTester $,
) async {
  await $(WizardShellScreen).waitUntilVisible(
    timeout: const Duration(seconds: 10),
  );
  await $('Step 1 of 5: Basics').waitUntilVisible(
    timeout: const Duration(seconds: 5),
  );
}

/// Enter the venue name field.
/// Maps to: "When I enter venue name {string}".
Future<void> whenIEnterVenueName(
  PatrolIntegrationTester $,
  String venue,
) async {
  await $.tester.enterText(
    find.widgetWithText(TextField, 'Venue name'),
    venue,
  );
  await $.tester.pumpAndSettle();
}

/// Set the event capacity.
/// Maps to: "When I set capacity to {string}".
Future<void> whenISetCapacity(
  PatrolIntegrationTester $,
  String capacity,
) async {
  await $.tester.enterText(
    find.widgetWithText(TextField, 'Max capacity'),
    capacity,
  );
  await $.tester.pumpAndSettle();
}

/// Set event date to tomorrow using the date picker.
/// Maps to: "When I set event date to tomorrow".
Future<void> whenISetEventDateToTomorrow(PatrolIntegrationTester $) async {
  // Open the date picker
  await $('Set date').tap();
  await $.tester.pumpAndSettle();
  // Tap the "next day" button in the calendar
  final now = DateTime.now();
  final tomorrow = now.add(const Duration(days: 1));
  await $(tomorrow.day.toString()).tap();
  await $('OK').tap();
  await $.tester.pumpAndSettle();
}

// ── Common creation assertions ────────────────────────────────────

/// Assert a creation success toast/screen shows a specific message.
/// Maps to: "Then I should see {string}" (reused from auth_steps).
/// These are covered by the generic thenIShouldSee step.

/// Assert the post detail page shows a specific title after publishing.
/// Maps to: "And the post should show title {string}".
Future<void> thenPostShouldShowTitle(
  PatrolIntegrationTester $,
  String title,
) async {
  await $(title).waitUntilVisible();
}
