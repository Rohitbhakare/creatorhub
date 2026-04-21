// Screenshots capture test — NOT a correctness test.
//
// Usage (from apps/mobile/):
//   bash ../../scripts/take_screenshots.sh
//
// How it works:
//   1. This test navigates to every key screen and signals a TCP listener
//      (take_screenshots.sh) via Socket.connect('127.0.0.1', 9999).
//   2. The iOS simulator shares networking with the Mac (same loopback — proven
//      by Patrol's own use of localhost:8081/8082 for test server comms).
//   3. take_screenshots.sh runs `nc -l 9999` in a loop; each connection
//      delivers the screen name (including subdirectory) and triggers
//      xcrun screenshot. The shell script mkdir -p's the subdirectory.
//   4. Screenshots land in creatorhub/screenshots/<cluster>/<sequence>.png.
//
// Screens captured (grouped by cluster, numbered by sequence within cluster):
//
//   01_onboarding/
//     01_welcome                WelcomeScreen (before login)
//     02_phone_otp              PhoneOtpScreen — enter phone
//     03_profile_bootstrap      ProfileBootstrapScreen (A2c)
//     04_location               LocationScreen
//     05_verticals              VerticalPickerScreen
//     06_creators               SuggestedCreatorsScreen
//     07_celebration            CelebrationScreen
//
//   02_feed/
//     01_home_feed              HomeFeedScreen after traveler login
//
//   03_content/
//     01_post_detail            PostDetailScreen (seed post)
//     02_itinerary_detail       ItineraryDetailScreen (seed itinerary)
//     03_event_detail           EventDetailScreen (seed event)
//     04_experience_detail      ExperienceDetailScreen (seed experience)
//     05_content_type_picker    Content type picker
//     06_save_to_list_sheet     Save-to-list bottom sheet
//
//   04_studio/
//     01_studio_tab             StudioTabScreen
//
//   05_profile/
//     01_profile_you            YouTabScreen (own profile)
//     02_creator_profile        Public creator profile (/profile/:id)
//
//   06_saved/
//     01_saved_lists            SavedListsScreen

import 'dart:async' show unawaited;
import 'dart:io' show Socket;
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:patrol/patrol.dart';
import 'package:pinput/pinput.dart';

import 'package:creatorhub/features/feed/screens/home_feed_screen.dart';
import 'package:creatorhub/features/onboarding/screens/location_screen.dart';
import 'package:creatorhub/features/onboarding/screens/profile_bootstrap_screen.dart';
import 'package:creatorhub/features/onboarding/screens/vertical_picker_screen.dart';
import 'package:creatorhub/features/onboarding/screens/suggested_creators_screen.dart';
import 'package:creatorhub/features/onboarding/screens/celebration_screen.dart';

import '../hooks/global_hooks.dart';
import '../steps/auth_steps.dart';
import '../support/api_helper.dart';
import '../support/app_driver.dart';
import '../support/emulator_helper.dart';
import '../support/test_data.dart';

// ── Screenshot helper ─────────────────────────────────────────────

/// Signal the host capture script via TCP, wait 10 s on the screen, then
/// flush any pending frames.
///
/// The iOS simulator shares networking with the Mac host (proven by Patrol's
/// own use of localhost:8081/8082). This connect triggers the nc listener in
/// take_screenshots.sh which immediately runs `xcrun simctl io screenshot`.
/// If no listener is running (e.g. standalone test run), the connect fails
/// silently and the test continues normally after the 10-second pause.
///
/// The [name] may include a forward slash (e.g. `01_onboarding/01_welcome`).
/// The shell script creates the subdirectory before writing the PNG.
Future<void> _ss(PatrolIntegrationTester $, String name) async {
  // Let the screen fully render.
  await $.tester.pump(const Duration(milliseconds: 400));
  // Wait 800ms before connecting — gives the nc listener time to restart
  // between back-to-back screenshots (nc exits after each connection,
  // takes ~600ms to restart in the shell loop).
  await Future.delayed(const Duration(milliseconds: 800));
  // Signal host via TCP — fire and forget.
  try {
    final socket = await Socket.connect('127.0.0.1', 9999)
        .timeout(const Duration(milliseconds: 1000));
    socket.write('$name\n');
    await socket.flush();
    socket.destroy();
  } catch (_) {
    // No capture script running — that's fine.
  }
  // Wait 10 s on the screen so the state can settle (images load, animations
  // finish) before the simulator capture fires. xcrun runs mid-way, but the
  // full 10 s keeps the screen up so reviewers can eyeball it during capture.
  await Future.delayed(const Duration(seconds: 10));
  await $.tester.pump(const Duration(milliseconds: 200));
}

// ── Scenario 1: Logged-in screens ────────────────────────────────

void _loggedInScreens() {
  patrolTest(
    'SCR-01: Capture all logged-in screens',
    tags: ['screenshots'],
    ($) async {
      await beforeScenario($);

      // ── 01 Welcome ────────────────────────────────────────────────
      await bootstrapApp($);
      await _ss($, '01_onboarding/01_welcome');

      // ── 02 Phone OTP ──────────────────────────────────────────────
      // Tap "Get Started" if visible to reach PhoneOtpScreen.
      final getStartedFinder = find.text('Get started');
      if (getStartedFinder.evaluate().isNotEmpty) {
        await $.tester.tap(getStartedFinder.first, warnIfMissed: false);
        await $.tester.pump(const Duration(milliseconds: 400));
      }
      await _ss($, '01_onboarding/02_phone_otp');

      // ── Login as traveler ─────────────────────────────────────────
      final digits = TestData.travelerPhone.replaceAll(RegExp(r'[^\d]'), '');
      final number = digits.length == 12 ? digits.substring(2) : digits;
      final e164 = '+91$number';

      await $.tester.enterText(
        find.widgetWithText(TextField, '98765 43210'),
        number,
      );
      await $.tester.pump(const Duration(milliseconds: 300));
      await $.tester.tap(find.text('Send code').first, warnIfMissed: false);
      await $.tester.pump(const Duration(milliseconds: 300));

      await $(find.byType(Pinput)).waitUntilVisible(
        timeout: const Duration(seconds: 15),
      );
      final otp =
          await EmulatorHelper.getLastOtpForPhone(e164) ?? TestData.testOtp;
      await $.tester.enterText(find.byType(Pinput), otp);
      await $.tester.pump(const Duration(milliseconds: 100));
      await Future.delayed(const Duration(seconds: 8));
      await $.tester.pump(const Duration(milliseconds: 200));

      // ── 03 Home Feed ──────────────────────────────────────────────
      await $(HomeFeedScreen).waitUntilVisible(
        timeout: const Duration(seconds: 15),
      );
      await Future.delayed(const Duration(seconds: 2)); // let feed load
      await _ss($, '02_feed/01_home_feed');

      // Helper: navigate to a route and capture a screenshot.
      Future<void> pushAndCapture(String route, String ssName) async {
        unawaited(
          Future.microtask(() {
            final element =
                $.tester.element(find.byType(HomeFeedScreen).first);
            GoRouter.of(element).push(route);
          }),
        );
        await Future.delayed(const Duration(seconds: 3));
        await $.tester.pump(const Duration(milliseconds: 200));
        await _ss($, ssName);
        // Pop back to home feed.
        unawaited(
          Future.microtask(() {
            final nav = $.tester.state<NavigatorState>(
              find.byType(Navigator).first,
            );
            if (nav.canPop()) nav.pop();
          }),
        );
        await Future.delayed(const Duration(seconds: 2));
        await $.tester.pump(const Duration(milliseconds: 200));
      }

      // ── 04 Post Detail ────────────────────────────────────────────
      await pushAndCapture(
          '/posts/${TestData.seedPostId}', '03_content/01_post_detail');

      // ── 05 Itinerary Detail ───────────────────────────────────────
      await pushAndCapture(
          '/itineraries/${TestData.seedItineraryId}',
          '03_content/02_itinerary_detail');

      // ── 06 Event Detail ───────────────────────────────────────────
      await pushAndCapture(
          '/events/${TestData.seedEventId}', '03_content/03_event_detail');

      // ── 07 Experience Detail ──────────────────────────────────────
      await pushAndCapture(
          '/experiences/${TestData.seedExperienceId}',
          '03_content/04_experience_detail');

      // ── 08 Save-to-list sheet ─────────────────────────────────────
      // Navigate to post detail and wait for the engagement bar to load.
      unawaited(
        Future.microtask(() {
          final element =
              $.tester.element(find.byType(HomeFeedScreen).first);
          GoRouter.of(element).push('/posts/${TestData.seedPostId}');
        }),
      );
      // IMPORTANT: await a real-time delay BEFORE calling any guarded
      // WidgetTester method. Dart microtasks run before timer callbacks,
      // so the microtask above fires during this delay and completes
      // before the first pump() call — preventing "guarded function conflict".
      await Future.delayed(const Duration(milliseconds: 500));
      // Poll for the engagement bar key (up to 10s).
      bool engagementBarFound = false;
      for (var i = 0; i < 40 && !engagementBarFound; i++) {
        await $.tester.pump(const Duration(milliseconds: 250));
        engagementBarFound =
            find.byKey(const Key('engagement_bar')).evaluate().isNotEmpty;
      }
      await $.tester.pump(const Duration(milliseconds: 200));
      // Find and tap the save button (either state).
      final saveInactive = find.byKey(const Key('btn_save'));
      final saveActive = find.byKey(const Key('btn_save_active'));
      final saveTarget =
          saveInactive.evaluate().isNotEmpty ? saveInactive : saveActive;
      if (saveTarget.evaluate().isNotEmpty) {
        await $.tap(
          saveTarget,
          settlePolicy: SettlePolicy.noSettle,
          visibleTimeout: const Duration(seconds: 10),
        );
        await $.tester.pump(const Duration(milliseconds: 600));
        await _ss($, '03_content/06_save_to_list_sheet');
        // Dismiss sheet.
        await $.tester.pump(const Duration(milliseconds: 200));
        final closeFinder = find.byIcon(Icons.close);
        if (closeFinder.evaluate().isNotEmpty) {
          await $.tester.tap(closeFinder.first, warnIfMissed: false);
        }
        await $.tester.pump(const Duration(milliseconds: 300));
      }
      // Pop back to home feed.
      unawaited(
        Future.microtask(() {
          final nav = $.tester.state<NavigatorState>(
            find.byType(Navigator).first,
          );
          if (nav.canPop()) nav.pop();
        }),
      );
      await Future.delayed(const Duration(seconds: 2));
      await $.tester.pump(const Duration(milliseconds: 200));

      // ── 09 Studio Tab ─────────────────────────────────────────────
      final studioTabFinder = find.text('Studio');
      if (studioTabFinder.evaluate().isNotEmpty) {
        await $.tester.tap(studioTabFinder.first, warnIfMissed: false);
        await $.tester.pump(const Duration(milliseconds: 500));
        await Future.delayed(const Duration(seconds: 2));
        await _ss($, '04_studio/01_studio_tab');
      }

      // ── 10 Profile / You Tab ──────────────────────────────────────
      final youTabFinder = find.text('You');
      if (youTabFinder.evaluate().isNotEmpty) {
        await $.tester.tap(youTabFinder.first, warnIfMissed: false);
        await $.tester.pump(const Duration(milliseconds: 500));
        await Future.delayed(const Duration(seconds: 2));
        await _ss($, '05_profile/01_profile_you');
      }

      // ── 11 Saved Lists ────────────────────────────────────────────
      // Navigate to /saved from home tab.
      await $.tester.tap(find.text('Home').first, warnIfMissed: false);
      await $.tester.pump(const Duration(milliseconds: 500));
      unawaited(
        Future.microtask(() {
          final element =
              $.tester.element(find.byType(HomeFeedScreen).first);
          GoRouter.of(element).push('/saved');
        }),
      );
      await Future.delayed(const Duration(seconds: 2));
      await $.tester.pump(const Duration(milliseconds: 200));
      await _ss($, '06_saved/01_saved_lists');
      unawaited(
        Future.microtask(() {
          final nav = $.tester.state<NavigatorState>(
            find.byType(Navigator).first,
          );
          if (nav.canPop()) nav.pop();
        }),
      );
      await Future.delayed(const Duration(seconds: 1));
      await $.tester.pump(const Duration(milliseconds: 200));

      // ── 12 Creator Profile ────────────────────────────────────────
      await pushAndCapture(
          '/profile/${TestData.seedCreatorId}',
          '05_profile/02_creator_profile');

      // ── 13 Content Type Picker ────────────────────────────────────
      // Tap the Create "+" FAB in the bottom nav (no text label — keyed).
      final createFabFinder = find.byKey(const ValueKey('nav_fab_create'));
      if (createFabFinder.evaluate().isNotEmpty) {
        await $.tester.tap(createFabFinder.first, warnIfMissed: false);
        await $.tester.pump(const Duration(milliseconds: 500));
        await Future.delayed(const Duration(seconds: 2));
        await _ss($, '03_content/05_content_type_picker');
        // Dismiss the picker sheet.
        final nav = $.tester.state<NavigatorState>(
          find.byType(Navigator).first,
        );
        if (nav.canPop()) nav.pop();
        await $.tester.pump(const Duration(milliseconds: 300));
      }
    },
  );
}

// ── Scenario 2: Onboarding screens (new user) ─────────────────────

void _onboardingScreens() {
  patrolTest(
    'SCR-02: Capture onboarding screens',
    tags: ['screenshots'],
    ($) async {
      await beforeScenario($);
      await ApiHelper.deleteUserByPhone(TestData.newUserPhone);

      await bootstrapApp($);
      await givenIAmNotLoggedIn($);

      // Navigate to phone OTP screen.
      // clearAuthState() → GoRouter redirects to WelcomeScreen.
      // Wait for WelcomeScreen then tap "Get Started".
      bool onWelcome = false;
      for (var i = 0; i < 30 && !onWelcome; i++) {
        onWelcome = find.text('Get started').evaluate().isNotEmpty;
        if (!onWelcome) {
          await Future.delayed(const Duration(milliseconds: 300));
          await $.tester.pump(const Duration(milliseconds: 300));
        }
      }
      if (find.text('Get started').evaluate().isNotEmpty) {
        await $.tester.tap(find.text('Get started').first, warnIfMissed: false);
        await $.tester.pump(const Duration(milliseconds: 500));
      }

      // Wait for PhoneOtpScreen to appear before entering number.
      for (var i = 0; i < 20; i++) {
        if (find.widgetWithText(TextField, '98765 43210').evaluate().isNotEmpty) break;
        await Future.delayed(const Duration(milliseconds: 300));
        await $.tester.pump(const Duration(milliseconds: 300));
      }

      final digits =
          TestData.newUserPhone.replaceAll(RegExp(r'[^\d]'), '');
      final number =
          digits.length == 12 ? digits.substring(2) : digits;
      final e164 = '+91$number';

      await $.tester.enterText(
        find.widgetWithText(TextField, '98765 43210'),
        number,
      );
      await $.tester.pump(const Duration(milliseconds: 300));
      await $.tester.tap(find.text('Send code').first, warnIfMissed: false);
      await $.tester.pump(const Duration(milliseconds: 300));

      await $(find.byType(Pinput)).waitUntilVisible(
        timeout: const Duration(seconds: 20),
      );
      final otp =
          await EmulatorHelper.getLastOtpForPhone(e164) ?? TestData.testOtp;
      await $.tester.enterText(find.byType(Pinput), otp);
      await $.tester.pump(const Duration(milliseconds: 100));
      await Future.delayed(const Duration(seconds: 8));
      await $.tester.pump(const Duration(milliseconds: 200));

      // ── 13a Onboarding: Profile bootstrap (A2c, post-E0.4c) ───────
      await $(ProfileBootstrapScreen).waitUntilVisible(
        timeout: const Duration(seconds: 15),
      );
      await _ss($, '01_onboarding/03_profile_bootstrap');

      // Username + first name (hint texts per E0.4c A2c).
      final stamp = DateTime.now().millisecondsSinceEpoch
          .toString()
          .substring(6);
      final usernameField = find.widgetWithText(TextField, 'aarav_k');
      if (usernameField.evaluate().isNotEmpty) {
        await $.tester.enterText(usernameField, 'e2e_$stamp');
        await $.tester.pump(const Duration(milliseconds: 400));
      }
      final firstNameField = find.widgetWithText(TextField, 'Aarav');
      if (firstNameField.evaluate().isNotEmpty) {
        await $.tester.enterText(firstNameField, 'Aarav');
        await $.tester.pump(const Duration(milliseconds: 200));
      }
      await Future.delayed(const Duration(milliseconds: 600));
      await $.tester.pump(const Duration(milliseconds: 200));
      await $.tester.tap(find.text('Continue').first, warnIfMissed: false);
      await $.tester.pump(const Duration(milliseconds: 300));
      await Future.delayed(const Duration(seconds: 3));
      await $.tester.pump(const Duration(milliseconds: 200));

      // ── 14 Onboarding: Location ───────────────────────────────────
      await $(LocationScreen).waitUntilVisible(
        timeout: const Duration(seconds: 15),
      );
      await _ss($, '01_onboarding/04_location');

      // Select a city to continue.
      await $.tester.enterText(
        find.widgetWithText(TextField, 'City or state'),
        'Mumbai',
      );
      await $.tester.pump(const Duration(milliseconds: 500));
      await Future.delayed(const Duration(seconds: 3));
      await $.tester.pump(const Duration(milliseconds: 200));
      final cityResults = find.text('Mumbai');
      if (cityResults.evaluate().length >= 2) {
        await $.tester.tap(cityResults.last, warnIfMissed: false);
        await $.tester.pump(const Duration(milliseconds: 300));
      }
      await $.tester.tap(find.text('Continue').first, warnIfMissed: false);
      await $.tester.pump(const Duration(milliseconds: 300));
      await Future.delayed(const Duration(seconds: 3));
      await $.tester.pump(const Duration(milliseconds: 200));

      // ── 15 Onboarding: Verticals ──────────────────────────────────
      await $(VerticalPickerScreen).waitUntilVisible(
        timeout: const Duration(seconds: 10),
      );
      await Future.delayed(const Duration(seconds: 2));
      await _ss($, '01_onboarding/05_verticals');

      // Select 3 verticals to enable Continue. The picker exposes:
      // Travel, Food, Culture, Adventure, Wildlife, Music, Photography, Learning
      // (see vertical_picker_screen.dart) — 'Stories' is NOT in this list.
      for (final name in ['Travel', 'Food', 'Culture']) {
        final t = find.text(name);
        if (t.evaluate().isNotEmpty) {
          await $.tester.tap(t.first, warnIfMissed: false);
          await $.tester.pump(const Duration(milliseconds: 200));
        }
      }
      await $.tester.tap(find.text('Continue').first, warnIfMissed: false);
      await $.tester.pump(const Duration(milliseconds: 300));
      await Future.delayed(const Duration(seconds: 3));
      await $.tester.pump(const Duration(milliseconds: 200));

      // ── 16 Onboarding: Suggested Creators ────────────────────────
      await $(SuggestedCreatorsScreen).waitUntilVisible(
        timeout: const Duration(seconds: 10),
      );
      await _ss($, '01_onboarding/06_creators');

      // Without following the minimum creators, the primary CTA is
      // "Follow N & continue" (disabled); tap "Skip" instead to finish
      // onboarding and reach the celebration screen.
      await $.tester.tap(find.text('Skip').first, warnIfMissed: false);
      await $.tester.pump(const Duration(milliseconds: 300));
      await Future.delayed(const Duration(seconds: 2));
      await $.tester.pump(const Duration(milliseconds: 200));

      // ── 17 Onboarding: Celebration ───────────────────────────────
      await $(CelebrationScreen).waitUntilVisible(
        timeout: const Duration(seconds: 10),
      );
      await _ss($, '01_onboarding/07_celebration');
    },
  );
}

// ── Entry point ───────────────────────────────────────────────────

void screenshotsScenarios() {
  _loggedInScreens();
  _onboardingScreens();
}

void main() => screenshotsScenarios();
