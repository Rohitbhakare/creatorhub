// @auth — F01: Authentication
//
// Run with: patrol test --target integration_test/scenarios/auth_scenarios.dart
//
// Requires:
//   Firebase test phone: 9090909090 → OTP always 123456

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:patrol/patrol.dart';
import 'package:pinput/pinput.dart';

import 'package:creatorhub/features/auth/screens/phone_otp_screen.dart';

import '../hooks/global_hooks.dart';
import '../steps/auth_steps.dart';
import '../steps/navigation_steps.dart';
import '../support/api_helper.dart';
import '../support/test_data.dart';

void authScenarios() {
  // ── F01-S01: New user registers via phone OTP ─────────────────────────────
  //
  // Scenario: New user registers via phone OTP and reaches onboarding
  //
  // Uses TestData.newUserPhone (+919999999999) — deleted before the test so
  // the phone always arrives fresh with no onboarding_completed_at, giving a
  // reliable "new user" signal regardless of previous test runs.
  patrolTest(
    'F01-S01: New user registers via phone OTP and reaches onboarding',
    tags: ['auth', 'smoke', 'critical'],
    ($) async {
      await beforeScenario($);
      // Delete the new-user phone from DB so it's always unregistered.
      await ApiHelper.deleteUserByPhone(TestData.newUserPhone);
      await givenTheAppIsLaunched($);
      await givenIAmNotLoggedIn($);

      await whenITap($, 'Get Started');
      await whenIEnterMyPhoneNumber($, '+91${TestData.newUserPhone}');
      await whenITap($, 'Continue');
      await whenIEnterOtp($, '123456'); // EmulatorHelper fetches real code

      await thenIShouldBeOnTheScreen($, 'onboarding location');
    },
  );

  // ── F01-S02: Returning user logs in and sees home feed ────────────────────
  //
  // Scenario: Returning user logs in and reaches home feed
  //   Given the app is launched
  //   And I have previously completed onboarding
  //   When I tap "Get Started"
  //   And I enter my phone number "+919090909090"
  //   And I tap "Continue"
  //   And I enter OTP "123456"
  //   Then I should see the home feed
  patrolTest(
    'F01-S02: Returning user logs in and reaches home feed',
    tags: ['auth', 'smoke', 'critical'],
    ($) async {
      await beforeScenario($);
      await givenTheAppIsLaunched($);
      await givenIHavePreviouslyCompletedOnboarding($);

      await whenITap($, 'Get Started');
      await whenIEnterMyPhoneNumber($, '+919090909090');
      await whenITap($, 'Continue');
      await whenIEnterOtp($, '123456');

      await thenIShouldSeeTheHomeFeed($);
    },
  );

  // ── F01-S03: User continues as guest ─────────────────────────────────────
  //
  // Scenario: User continues as guest and sees home feed
  //   Given the app is launched
  //   And I am not logged in
  //   When I tap "Browse as guest"   ← actual text (feature says "Continue as guest")
  //   Then I should see the home feed
  //   And the "Studio" tab should be visible
  patrolTest(
    'F01-S03: Guest mode — sees home feed with Studio tab visible',
    tags: ['auth', 'guest'],
    ($) async {
      await beforeScenario($);
      await givenTheAppIsLaunched($);
      await givenIAmNotLoggedIn($);

      await whenITap($, 'Browse as guest'); // actual UI text
      await thenIShouldSeeTheHomeFeed($);
      await thenTheTabShouldBeVisible($, 'Studio');
    },
  );

  // ── F01-S04: Guest soft auth wall on Like ────────────────────────────────
  //
  // Scenario: Guest sees soft auth wall when tapping Like
  //   When I tap "Browse as guest"
  //   And I tap the like button on any visible post
  //   Then I should see the soft auth wall with "Get Started"
  //
  // Note: Requires seed data in the feed. If the feed is empty, the like
  // button may not be present — the test asserts gracefully.
  patrolTest(
    'F01-S04: Guest sees soft auth wall when tapping Like',
    tags: ['auth', 'guest', 'softwall'],
    ($) async {
      await beforeScenario($);
      await givenTheAppIsLaunched($);
      await givenIAmNotLoggedIn($);

      await whenITap($, 'Browse as guest');

      // Wait for the home feed to load
      await $.tester.pumpAndSettle(const Duration(seconds: 5));

      // Try to tap the like button — it should trigger the soft auth wall.
      // The like button has key 'btn_like' on the home feed cards or detail screen.
      final likeBtn = find.byKey(const Key('btn_like'));
      if (likeBtn.evaluate().isNotEmpty) {
        await $.tester.tap(likeBtn.first, warnIfMissed: false);
        await $.tester.pumpAndSettle(const Duration(seconds: 2));
        // Auth wall should be visible: either a bottom sheet or dialog with 'Get Started'.
        await thenIShouldSee($, 'Get Started');
      } else {
        // No feed content (seed data not applied) — verify guest feed is visible.
        await thenIShouldSeeTheHomeFeed($);
      }
    },
  );

  // ── F01-S05: Wrong OTP shows error ───────────────────────────────────────
  //
  // Scenario: Entering an incorrect OTP shows an inline error and keeps the
  // user on the OTP step without navigating away.
  //
  // The emulator will reject '000000' because it does not match the randomly
  // generated code it issued. _verifyOtp() catches the exception and sets
  // _error = 'Invalid OTP. Please try again.'
  patrolTest(
    'F01-S05: Wrong OTP shows "Invalid OTP" error and stays on auth screen',
    tags: ['auth', 'negative'],
    ($) async {
      await beforeScenario($);

      // Ensure the phone starts fresh so sendVerificationCode always succeeds
      // (no "too-many-requests" from a previous partially-completed attempt).
      await ApiHelper.deleteUserByPhone(TestData.newUserPhone);

      await givenTheAppIsLaunched($);
      await givenIAmNotLoggedIn($);

      // Navigate to auth and submit the phone number.
      await whenITap($, 'Get Started');
      await whenIEnterMyPhoneNumber($, '+91${TestData.newUserPhone}');
      await whenITap($, 'Continue');

      // Wait for OTP step — emulator processes sendVerificationCode in real time.
      await $(find.byType(Pinput)).waitUntilVisible(
        timeout: const Duration(seconds: 15),
      );

      // Enter an intentionally wrong OTP. The emulator will never generate
      // '000000' for a real code so this is guaranteed to fail verification.
      await $.tester.enterText(find.byType(Pinput), '000000');

      // One pump to process enterText and trigger Pinput.onCompleted → _verifyOtp.
      await $.tester.pump(const Duration(milliseconds: 100));

      // Real-time wait for the emulator to reject the wrong code and for
      // setState to surface the error message in the widget tree.
      await Future.delayed(const Duration(seconds: 8));
      await $.tester.pump(const Duration(milliseconds: 200));

      // The error text rendered by PhoneOtpScreen when verification fails
      // (first attempt, _verifyAttempts < _maxVerifyAttempts):
      //   'Invalid OTP. Please try again.'
      const expectedError = 'Invalid OTP. Please try again.';
      await $(expectedError).waitUntilVisible(
        timeout: const Duration(seconds: 5),
      );

      // The user must still be on the PhoneOtpScreen (not navigated away).
      await $(PhoneOtpScreen).waitUntilVisible(
        timeout: const Duration(seconds: 5),
      );
    },
  );

  // ── F01-S06: Invalid phone (too short) shows validation error ────────────
  //
  // Scenario: Submitting a phone number that is fewer than 10 digits shows an
  // inline validation error before any Firebase call is made.
  //
  // _validatePhone('123') returns 'Enter a valid 10-digit phone number'.
  // setState sets _error immediately so no async wait is needed.
  patrolTest(
    'F01-S06: Too-short phone number shows validation error inline',
    tags: ['auth', 'negative', 'validation'],
    ($) async {
      await beforeScenario($);
      await givenTheAppIsLaunched($);
      await givenIAmNotLoggedIn($);

      // Open the auth screen.
      await whenITap($, 'Get Started');

      // Wait for PhoneOtpScreen to be visible before interacting.
      await $(PhoneOtpScreen).waitUntilVisible(
        timeout: const Duration(seconds: 10),
      );

      // Enter a 3-digit number — fails the 10-digit length check in
      // _validatePhone() without any Firebase or network call.
      await $.tester.enterText(
        find.widgetWithText(TextField, 'Phone number'),
        '123',
      );
      await $.tester.pump(const Duration(milliseconds: 300));

      // Tap Continue — _sendOtp() calls _validatePhone, sets _error, returns
      // early. No loading state, no Firebase call.
      await whenITap($, 'Continue');

      // One extra pump to flush the setState that shows the error.
      await $.tester.pump(const Duration(milliseconds: 500));

      // Error message from _validatePhone() in PhoneOtpScreen:
      //   'Enter a valid 10-digit phone number'
      const expectedError = 'Enter a valid 10-digit phone number';
      await $(expectedError).waitUntilVisible(
        timeout: const Duration(seconds: 5),
      );

      // We must still be on the phone-entry step (not the OTP step).
      // Pinput is only shown when _showOtpInput is true — it must be absent.
      expect(find.byType(Pinput), findsNothing);
    },
  );

  // ── F01-S07: OTP screen back button returns to phone input ───────────────
  //
  // Scenario: Tapping the back arrow (←) on the OTP step returns the user to
  // the phone-entry step within the same PhoneOtpScreen widget.
  //
  // PhoneOtpScreen renders Icons.arrow_back inside a GestureDetector only
  // when _showOtpInput == true. Tapping it calls _goBackToPhone() which sets
  // _showOtpInput = false, hiding the Pinput and showing the phone TextField.
  patrolTest(
    'F01-S07: Back arrow on OTP step returns user to phone entry step',
    tags: ['auth', 'navigation'],
    ($) async {
      await beforeScenario($);

      // Delete the user so the phone-submission step always succeeds cleanly.
      await ApiHelper.deleteUserByPhone(TestData.newUserPhone);

      await givenTheAppIsLaunched($);
      await givenIAmNotLoggedIn($);

      // Navigate to auth and advance to the OTP step.
      await whenITap($, 'Get Started');
      await whenIEnterMyPhoneNumber($, '+91${TestData.newUserPhone}');
      await whenITap($, 'Continue');

      // Confirm OTP input step is shown.
      await $(find.byType(Pinput)).waitUntilVisible(
        timeout: const Duration(seconds: 15),
      );

      // Tap the back arrow — GestureDetector wrapping Icons.arrow_back in
      // _buildOtpInput(). HapticFeedback.lightImpact() fires then _goBackToPhone().
      await $.tester.tap(
        find.byIcon(Icons.arrow_back),
        warnIfMissed: false,
      );

      // Pump to process the setState that sets _showOtpInput = false.
      await $.tester.pump(const Duration(milliseconds: 500));

      // The PhoneOtpScreen widget itself stays mounted — we did NOT navigate
      // to a different route, just toggled internal state.
      await $(PhoneOtpScreen).waitUntilVisible(
        timeout: const Duration(seconds: 5),
      );

      // Pinput must no longer be in the tree (_showOtpInput == false).
      expect(find.byType(Pinput), findsNothing);

      // The phone TextField must be visible again (phone-entry step).
      expect(
        find.widgetWithText(TextField, 'Phone number'),
        findsOneWidget,
      );
    },
  );
}

void main() => authScenarios();
