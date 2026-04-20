import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:patrol/patrol.dart';

import 'package:creatorhub/features/auth/providers/auth_provider.dart';
import 'package:creatorhub/features/content/providers/wizard_provider.dart';
import 'package:creatorhub/features/content/screens/content_type_picker_screen.dart';
import 'package:creatorhub/features/content/screens/wizard_shell_screen.dart';
import '../support/finders.dart';

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
///
/// AppInput renders its 'Title' label as a sibling Text of the TextField,
/// so `find.widgetWithText(TextField, 'Title')` returns nothing. Use the
/// shared [findInputByLabel] helper instead.
Future<void> whenIEnterTitle(PatrolIntegrationTester $, String title) async {
  await $.tester.enterText(findInputByLabel('Title'), title);
  await $.tester.pumpAndSettle();
}

/// Enter body text for a post.
/// Maps to: "When I enter body text {string}".
///
/// The post body AppInput has label 'Body' and hint 'Tell your story...'.
Future<void> whenIEnterBodyText(PatrolIntegrationTester $, String body) async {
  final bodyField = findInputByLabel('Body');
  if (bodyField.evaluate().isNotEmpty) {
    await $.tester.enterText(bodyField, body);
  } else {
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
  await $.tester.enterText(findInputByLabel('Venue name'), venue);
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

// ── Common creation actions ───────────────────────────────────────

/// Accept the Terms & Conditions checkbox on the Review step.
/// Maps to: "When I accept Terms and Conditions".
///
/// The label is rendered via `Text.rich` with "Terms & Conditions" as a
/// TextSpan inside the full string "I agree to the Terms & Conditions".
/// Flutter's `find.text` matches a RichText's plain text as a whole, so
/// matching the TextSpan alone returns 0 widgets. Tap the full combined
/// string — the parent Row has a GestureDetector (HitTestBehavior.opaque)
/// that toggles tncAccepted.
Future<void> whenIAcceptTermsAndConditions(
  PatrolIntegrationTester $,
) async {
  final tnc = find.textContaining('Terms & Conditions');
  expect(tnc, findsWidgets, reason: 'Expected T&C checkbox label on Review step');
  await $.tester.tap(tnc.first, warnIfMissed: false);
  await $.tester.pump(const Duration(milliseconds: 400));
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

// ── Publish prerequisites (API-driven seeding) ────────────────────
//
// The content-creation wizards in E1.2/E1.3/E1.5 render file pickers,
// Google Places autocomplete, and calendar widgets that can't be
// exercised reliably in Patrol (native pickers, paid API, flaky).
// The publish validators on the API still require the artifacts those
// pickers produce — ≥1 image for posts, ≥1 spot per day for itineraries,
// full venue + dates for events. These helpers POST/PUT those records
// directly via the user's already-authenticated Dio, so F06 scenarios
// can focus on wizard navigation + publish wiring.

/// Read the running app's authenticated Dio, current draft contentId, and
/// wizard notifier — the notifier lets seed helpers set wizard state
/// fields (e.g. description) so the pre-publish flushNow() in
/// `wizard_shell_screen._onPublish` doesn't overwrite them back to defaults.
({Dio dio, String contentId, WizardNotifier notifier}) _wizardDraftHandle(
  PatrolIntegrationTester $,
) {
  final element = $.tester.element(find.byType(MaterialApp).first);
  final container = ProviderScope.containerOf(element, listen: false);
  final dio = container.read(authServiceProvider).dio;
  final contentId = container.read(wizardProvider).contentId;
  final notifier = container.read(wizardProvider.notifier);
  if (contentId == null) {
    fail('Wizard draft has not been created yet — contentId is null.');
  }
  return (dio: dio, contentId: contentId, notifier: notifier);
}

/// Seed one image media record on the current post draft.
/// Required because publishPost rejects drafts with 0 images. The wizard's
/// Media step uses a native file picker that Patrol can't drive.
Future<void> whenISeedPostImage(PatrolIntegrationTester $) async {
  final handle = _wizardDraftHandle($);
  await handle.dio.post<dynamic>(
    '/api/v1/media/content/${handle.contentId}',
    data: <String, dynamic>{
      'media_type': 'image',
      'url': 'https://placehold.co/1080x1080/png',
      'alt_text': 'E2E test image',
      'display_order': 0,
    },
  );
}

/// Seed one spot on day 1 of the current itinerary draft.
/// Required because publishItinerary rejects any day with 0 spots. The
/// wizard's day builder drives Google Places Autocomplete which needs a
/// paid API key (disabled in test envs).
Future<void> whenISeedItineraryFirstDaySpot(
  PatrolIntegrationTester $,
) async {
  final handle = _wizardDraftHandle($);
  final detail = await handle.dio.get<Map<String, dynamic>>(
    '/api/v1/itineraries/${handle.contentId}',
  );
  final data = detail.data?['data'] as Map<String, dynamic>?;
  final days = (data?['days'] as List<dynamic>?) ?? const <dynamic>[];
  if (days.isEmpty) {
    fail('Itinerary draft has no days — createItineraryDraft default broke.');
  }
  final dayOne = days.first as Map<String, dynamic>;
  final dayId = dayOne['id'] as String;

  await handle.dio.post<dynamic>(
    '/api/v1/itineraries/${handle.contentId}/days/$dayId/spots',
    data: <String, dynamic>{
      'name': 'Virupaksha Temple',
      'lat': 15.3350,
      'lng': 76.4600,
      'stop_type': 'regular',
    },
  );
}

/// Seed venue, dates, city, and capacity on the current event draft.
/// Required because publishEvent rejects drafts missing any of these. The
/// wizard's details step uses Google Places Autocomplete + native date
/// picker, neither of which is driveable in Patrol.
Future<void> whenISeedEventDetails(PatrolIntegrationTester $) async {
  final handle = _wizardDraftHandle($);

  // Description must go through wizard state — the pre-publish flushNow()
  // in wizard_shell_screen._onPublish re-PUTs /content with wizard.description,
  // which clobbers any value our direct PUT wrote to the content table.
  handle.notifier.setDescription(
    'An E2E test event exercising the publish flow.',
  );

  // Start the event tomorrow at 10:00 IST, 2-hour duration (same day in IST).
  final tomorrow = DateTime.now().toUtc().add(const Duration(days: 1));
  final startUtc = DateTime.utc(
    tomorrow.year,
    tomorrow.month,
    tomorrow.day,
    4,
    30,
  );
  final endUtc = startUtc.add(const Duration(hours: 2));
  String iso(DateTime d) => '${d.toIso8601String().split('.').first}+00:00';

  await handle.dio.put<dynamic>(
    '/api/v1/events/${handle.contentId}',
    data: <String, dynamic>{
      'venue_name': 'Test Venue',
      'venue_address': '1 Marine Drive, Mumbai, Maharashtra',
      'venue_lat': 18.9432,
      'venue_lng': 72.8234,
      'city_id': 'in.mh.mumbai',
      'capacity': 20,
      'start_at': iso(startUtc),
      'end_at': iso(endUtc),
      'timezone': 'Asia/Kolkata',
    },
  );
}
