import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:patrol/patrol.dart';
import 'package:pinput/pinput.dart';

import 'package:creatorhub/features/feed/screens/home_feed_screen.dart';
import 'package:creatorhub/features/onboarding/screens/location_screen.dart';
import 'package:creatorhub/features/auth/screens/phone_otp_screen.dart';

import '../support/app_driver.dart';
import '../support/emulator_helper.dart';
import '../support/test_data.dart';

// ── Step-level phone tracker ──────────────────────────────────────
// Stores the most recently entered phone in E.164 format (+91XXXXXXXXXX).
// whenIEnterMyPhoneNumber sets it; whenIEnterOtp uses it so that
// EmulatorHelper.getLastOtpForPhone can look up the correct code even when
// many codes exist in the emulator (from previous scenarios).
String? _lastEnteredPhone;

// ── App bootstrap ─────────────────────────────────────────────────

/// Boot the app. Maps to: "Given the app is launched".
Future<void> givenTheAppIsLaunched(PatrolIntegrationTester $) async {
  await bootstrapApp($);
}

// ── Auth state setup ─────────────────────────────────────────────

/// Ensure no session exists. Maps to: "Given I am not logged in".
Future<void> givenIAmNotLoggedIn(PatrolIntegrationTester $) async {
  await clearAuthState($);
}

// ── Internal OTP login helper ─────────────────────────────────────

/// Perform full phone OTP login with [phone] (10-digit, no country code).
///
/// Uses bounded pump() calls instead of pumpAndSettle() to avoid deadlocking
/// on Firebase's persistent auth-state stream (which keeps frames scheduled
/// indefinitely and causes pumpAndSettle to never return).
///
/// In debug mode the app uses the Firebase Auth Emulator which generates
/// random OTPs (NOT '123456'). EmulatorHelper fetches the real code so
/// the test can enter the correct value, then falls back to TestData.testOtp
/// when the emulator is unreachable (e.g. on CI with real Firebase test phones).
Future<void> loginWithOtp(PatrolIntegrationTester $, String phone) async {
  final digits = phone.replaceAll(RegExp(r'[^\d]'), '');
  final number = digits.length == 12 ? digits.substring(2) : digits;
  final e164 = '+91$number';

  // Navigate to auth screen from WelcomeScreen if present.
  await _tapAppButton($, 'Get Started');

  // Wait for the phone input screen to appear (PhoneOtpScreen).
  await $(PhoneOtpScreen).waitUntilVisible(
    timeout: const Duration(seconds: 10),
  );

  // Enter phone number.
  await $.tester.enterText(
    find.widgetWithText(TextField, 'Phone number'),
    number,
  );
  await $.tester.pump(const Duration(milliseconds: 300));

  // Tap Continue — triggers Firebase sendVerificationCode.
  await _tapAppButton($, 'Continue');

  // Wait for Pinput to appear: the emulator's sendVerificationCode completes
  // in real time, setState sets _showOtpInput=true, Pinput becomes visible.
  // waitUntilVisible polls with Future.delayed(100ms) (real time) so it
  // correctly awaits the async HTTP call without deadlocking.
  await $(find.byType(Pinput)).waitUntilVisible(
    timeout: const Duration(seconds: 15),
  );

  // Fetch the actual OTP the emulator generated for this phone number.
  // The emulator generates random codes (e.g. '694263'), not '123456'.
  // Fall back to TestData.testOtp when running against real Firebase test phones.
  final otp =
      await EmulatorHelper.getLastOtpForPhone(e164) ?? TestData.testOtp;

  // Enter the 6-digit OTP — Pinput.onCompleted fires verifyOtp.
  await $.tester.enterText(find.byType(Pinput), otp);

  // One pump to process the enterText and trigger onCompleted.
  await $.tester.pump(const Duration(milliseconds: 100));

  // Real-time wait for the emulator to verify the OTP, the API to register
  // the user, and GoRouter to navigate. pumpAndSettle would deadlock on the
  // Firebase auth-state stream — use a bounded real-time delay instead.
  await Future.delayed(const Duration(seconds: 8));

  // Final pump to flush any pending navigation frames.
  await $.tester.pump(const Duration(milliseconds: 200));
}

/// Log in as the pre-seeded traveler account.
/// Maps to: "Given I am logged in as traveler".
Future<void> givenIAmLoggedInAsTraveler(PatrolIntegrationTester $) async {
  await loginWithOtp($, TestData.travelerPhone);
}

/// Log in as the pre-seeded creator account (KYC approved).
/// Maps to: "Given I am logged in as creator".
Future<void> givenIAmLoggedInAsCreator(PatrolIntegrationTester $) async {
  await loginWithOtp($, TestData.creatorPhone);
}

/// Log in as the pre-seeded creator account that has NOT completed KYC.
/// Maps to: "Given I am logged in as unkyc creator".
Future<void> givenIAmLoggedInAsUnkycCreator(PatrolIntegrationTester $) async {
  await loginWithOtp($, TestData.unKycPhone);
}

/// Log in as the pre-seeded booker account.
/// Maps to: "Given I am logged in as booker".
Future<void> givenIAmLoggedInAsBooker(PatrolIntegrationTester $) async {
  await loginWithOtp($, TestData.bookerPhone);
}

/// Log in with an arbitrary [phone] number.
/// Maps to: "Given I am logged in as a new user with phone {string}".
Future<void> givenIAmLoggedInAsNewUserWithPhone(
  PatrolIntegrationTester $,
  String phone,
) async {
  await loginWithOtp($, phone);
}

/// No-op — the seed user already has onboarding_completed_at set in staging.
/// Maps to: "Given I have previously completed onboarding".
Future<void> givenIHavePreviouslyCompletedOnboarding(
  PatrolIntegrationTester $,
) async {
  // Seed data handles this — the user's row has onboarding_completed_at set.
}

// ── Generic interaction steps ─────────────────────────────────────

/// Tap any text label on screen.
/// Maps to: "When I tap {string}".
///
/// Uses $.tester.tap (not Patrol's $(label).tap) because AppButton wraps its
/// label in IgnorePointer — Patrol's hitTestable() check fails on it.
/// Dispatching a tap at the text position still reaches the parent
/// GestureDetector(HitTestBehavior.opaque) which owns the onTap handler.
///
/// Uses bounded pump (not pumpAndSettle) to avoid deadlocking on Firebase
/// streams that keep frames scheduled indefinitely.
Future<void> whenITap(PatrolIntegrationTester $, String label) async {
  await $.tester.pump(const Duration(milliseconds: 200));
  final textFinder = find.text(label);
  expect(textFinder, findsWidgets, reason: 'Expected to find text "$label"');
  await $.tester.tap(textFinder.first, warnIfMissed: false);
  await $.tester.pump(const Duration(milliseconds: 500));
}

/// Enter phone number on the PhoneOtpScreen.
/// Maps to: "When I enter my phone number {string}".
///
/// Also tracks the phone in [_lastEnteredPhone] (E.164) so that
/// [whenIEnterOtp] can look up the correct emulator code for this specific
/// phone number (not just the latest code overall).
Future<void> whenIEnterMyPhoneNumber(
  PatrolIntegrationTester $,
  String phone,
) async {
  final digits = phone.replaceAll(RegExp(r'[^\d]'), '');
  final number = digits.length == 12 ? digits.substring(2) : digits;
  _lastEnteredPhone = '+91$number';
  await $(PhoneOtpScreen).waitUntilVisible(
    timeout: const Duration(seconds: 10),
  );
  await $.tester.enterText(
    find.widgetWithText(TextField, 'Phone number'),
    number,
  );
  await $.tester.pump(const Duration(milliseconds: 300));
}

/// Enter a 6-digit OTP into the Pinput widget.
/// Maps to: "When I enter OTP {string}".
///
/// Looks up the actual OTP from the Firebase Auth Emulator using the phone
/// that was entered in [whenIEnterMyPhoneNumber] (_lastEnteredPhone).
/// Falls back to getLatestOtp() and then to the provided [otp].
Future<void> whenIEnterOtp(PatrolIntegrationTester $, String otp) async {
  await $(find.byType(Pinput)).waitUntilVisible(
    timeout: const Duration(seconds: 15),
  );

  // Prefer phone-specific lookup to avoid getting a code for the wrong phone.
  final actualOtp = (_lastEnteredPhone != null
          ? await EmulatorHelper.getLastOtpForPhone(_lastEnteredPhone!)
          : null) ??
      await EmulatorHelper.getLatestOtp() ??
      otp;

  await $.tester.enterText(find.byType(Pinput), actualOtp);

  // One pump to process enterText + trigger Pinput.onCompleted.
  await $.tester.pump(const Duration(milliseconds: 100));

  // Real-time wait for emulator verification + API registration + navigation.
  await Future.delayed(const Duration(seconds: 8));
  await $.tester.pump(const Duration(milliseconds: 200));
}

// ── Assertion steps ───────────────────────────────────────────────

/// Assert a text string is visible on screen.
/// Maps to: "Then I should see {string}".
///
/// Polls instead of waitUntilVisible — avoids hit-testability requirement and
/// gives async operations (e.g. provider updates after API calls) time to settle.
Future<void> thenIShouldSee(PatrolIntegrationTester $, String text) async {
  bool found = false;
  for (var i = 0; i < 30 && !found; i++) {
    // find.text() only matches Text/RichText, not EditableText (TextField internals).
    // Add an explicit EditableText check so typed-but-not-yet-submitted text is found too.
    found = find.text(text, skipOffstage: false).evaluate().isNotEmpty ||
        find
            .byWidgetPredicate(
              (w) => w is EditableText && w.controller.value.text == text,
              skipOffstage: false,
            )
            .evaluate()
            .isNotEmpty;
    if (!found) {
      await Future.delayed(const Duration(milliseconds: 500));
      await $.tester.pump(const Duration(milliseconds: 500));
    }
  }
  expect(found, isTrue, reason: 'Expected to find text "$text" on screen');
}

/// Assert a text string is NOT visible on screen.
/// Maps to: "Then I should not see {string}".
Future<void> thenIShouldNotSee(PatrolIntegrationTester $, String text) async {
  expect(find.text(text), findsNothing);
}

/// Assert the home feed screen is rendered.
/// Maps to: "Then I should see the home feed".
Future<void> thenIShouldSeeTheHomeFeed(PatrolIntegrationTester $) async {
  await $(HomeFeedScreen).waitUntilVisible(
    timeout: const Duration(seconds: 15),
  );
}

/// Assert the app landed on a named screen.
/// Maps to: "Then I should be on the {string} screen".
Future<void> thenIShouldBeOnTheScreen(
  PatrolIntegrationTester $,
  String screenName,
) async {
  switch (screenName.toLowerCase()) {
    case 'auth':
    case 'phone otp':
      await $(PhoneOtpScreen).waitUntilVisible(
        timeout: const Duration(seconds: 10),
      );
    case 'onboarding location':
      await $(LocationScreen).waitUntilVisible(
        timeout: const Duration(seconds: 15),
      );
    case 'home feed':
    case 'home':
      await $(HomeFeedScreen).waitUntilVisible(
        timeout: const Duration(seconds: 15),
      );
    default:
      await $(find.text(screenName)).waitUntilVisible(
        timeout: const Duration(seconds: 10),
      );
  }
}

// ── Private helpers ───────────────────────────────────────────────

/// Tap an AppButton by its label text.
///
/// AppButton wraps label in IgnorePointer so Patrol's hitTestable check fails.
/// We use $.tester.tap at the text position — the GestureDetector(opaque)
/// ancestor catches it.
Future<void> _tapAppButton(PatrolIntegrationTester $, String label) async {
  final textFinder = find.text(label);
  if (textFinder.evaluate().isNotEmpty) {
    await $.tester.tap(textFinder.first, warnIfMissed: false);
    await $.tester.pump(const Duration(milliseconds: 300));
  }
}
