import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:patrol/patrol.dart';
import 'package:pinput/pinput.dart';

import 'package:creatorhub/features/auth/providers/auth_provider.dart';
import 'package:creatorhub/features/feed/screens/home_feed_screen.dart';
import 'package:creatorhub/features/onboarding/screens/location_screen.dart';
import 'package:creatorhub/features/auth/screens/phone_otp_screen.dart';

import '../support/app_driver.dart';
import '../support/test_data.dart';

// ── App bootstrap ─────────────────────────────────────────────────

/// Boot the app. Maps to: "Given the app is launched".
Future<void> givenTheAppIsLaunched(PatrolIntegrationTester $) async {
  await bootstrapApp($);
}

// ── Auth state setup ─────────────────────────────────────────────

/// Ensure no session exists. Maps to: "Given I am not logged in".
Future<void> givenIAmNotLoggedIn(PatrolIntegrationTester $) async {
  const storage = FlutterSecureStorage();
  await storage.deleteAll();
  await $.tester.pump();

  final element = $.tester.element(find.byType(ProviderScope));
  final container = ProviderScope.containerOf(element);
  try {
    await container.read(authProvider.notifier).signOut();
  } catch (_) {}
  await $.tester.pumpAndSettle();
}

// ── Internal OTP login helper ─────────────────────────────────────

/// Perform full phone OTP login with [phone] (10-digit, no country code).
///
/// Matches the actual PhoneOtpScreen UI:
/// - "Continue" sends the OTP (screen labels it "Continue", not "Send OTP")
/// - Pinput auto-verifies when all 6 digits are entered
///
/// Firebase Auth test number 9090909090 always accepts OTP 123456 without SMS.
Future<void> loginWithOtp(PatrolIntegrationTester $, String phone) async {
  // Strip +91 prefix if provided
  final digits = phone.replaceAll(RegExp(r'[^\d]'), '');
  final number = digits.length == 12 ? digits.substring(2) : digits;

  // From WelcomeScreen, navigate to auth
  if (find.text('Get Started').evaluate().isNotEmpty) {
    await $('Get Started').tap();
    await $.tester.pumpAndSettle();
  }

  // Enter phone number into the TextField (hint: "Phone number")
  await $.tester.enterText(
    find.widgetWithText(TextField, 'Phone number'),
    number,
  );
  await $.tester.pumpAndSettle();

  // Tap "Continue" to trigger sendOtp
  await $('Continue').tap();
  await $.tester.pumpAndSettle(const Duration(seconds: 3));

  // Enter OTP into Pinput — it auto-calls _verifyOtp on complete
  await $.tester.enterText(find.byType(Pinput), TestData.testOtp);
  await $.tester.pumpAndSettle(const Duration(seconds: 5));
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

/// Tap a visible text label anywhere on screen.
/// Maps to: "When I tap {string}".
Future<void> whenITap(PatrolIntegrationTester $, String label) async {
  await $(label).tap();
  await $.tester.pumpAndSettle();
}

/// Enter phone number on the PhoneOtpScreen.
/// Maps to: "When I enter my phone number {string}".
Future<void> whenIEnterMyPhoneNumber(
  PatrolIntegrationTester $,
  String phone,
) async {
  final digits = phone.replaceAll(RegExp(r'[^\d]'), '');
  final number = digits.length == 12 ? digits.substring(2) : digits;
  await $.tester.enterText(
    find.widgetWithText(TextField, 'Phone number'),
    number,
  );
  await $.tester.pumpAndSettle();
}

/// Enter a 6-digit OTP into the Pinput widget.
/// Maps to: "When I enter OTP {string}".
/// Note: Pinput auto-verifies when all 6 digits are entered.
Future<void> whenIEnterOtp(PatrolIntegrationTester $, String otp) async {
  await $.tester.enterText(find.byType(Pinput), otp);
  await $.tester.pumpAndSettle(const Duration(seconds: 5));
}

// ── Assertion steps ───────────────────────────────────────────────

/// Assert a text string is visible on screen.
/// Maps to: "Then I should see {string}".
Future<void> thenIShouldSee(PatrolIntegrationTester $, String text) async {
  await $(text).waitUntilVisible();
}

/// Assert a text string is NOT visible on screen.
/// Maps to: "Then I should not see {string}".
Future<void> thenIShouldNotSee(PatrolIntegrationTester $, String text) async {
  expect(find.text(text), findsNothing);
}

/// Assert the home feed screen is rendered.
/// Maps to: "Then I should see the home feed".
Future<void> thenIShouldSeeTheHomeFeed(PatrolIntegrationTester $) async {
  await $(HomeFeedScreen).waitUntilVisible();
}

/// Assert the app landed on a named screen.
/// Maps to: "Then I should be on the {string} screen".
Future<void> thenIShouldBeOnTheScreen(
  PatrolIntegrationTester $,
  String screenName,
) async {
  final finder = switch (screenName.toLowerCase()) {
    'auth' || 'phone otp' => find.byType(PhoneOtpScreen),
    'onboarding location' => find.byType(LocationScreen),
    'home feed' || 'home' => find.byType(HomeFeedScreen),
    _ => find.text(screenName),
  };
  expect(finder, findsOneWidget);
}
