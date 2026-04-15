import 'dart:async' show unawaited;
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:patrol/patrol.dart';

import 'package:creatorhub/features/booking/screens/booking_confirmation_screen.dart';
import 'package:creatorhub/features/booking/screens/booking_detail_screen.dart';
import 'package:creatorhub/features/booking/screens/my_bookings_screen.dart';

import '../support/test_data.dart';

// ── Precondition steps ────────────────────────────────────────────

/// Assert the seed experience is not fully booked by checking "Book Now" is visible.
/// Maps to: "And the experience is not fully booked".
Future<void> givenExperienceIsNotFullyBooked(PatrolIntegrationTester $) async {
  await $('Book Now').waitUntilVisible();
}

/// Navigate to the booking detail for the existing confirmed booking.
/// Maps to: "Given I have an existing confirmed booking".
Future<void> givenIHaveExistingConfirmedBooking(
  PatrolIntegrationTester $,
) async {
  final navigator = $.tester.state<NavigatorState>(
    find.byType(Navigator).first,
  );
  unawaited(
    Future.microtask(
      () => navigator.pushNamed('/bookings/${TestData.seedBookingId}'),
    ),
  );
  await $.tester.pumpAndSettle(const Duration(seconds: 5));
}

/// Navigate to a cancellable booking detail screen.
/// Maps to: "Given I have a cancellable booking for the seed experience".
Future<void> givenIHaveCancellableBooking(PatrolIntegrationTester $) async {
  await givenIHaveExistingConfirmedBooking($);
}

/// Navigate to a completed booking detail screen.
/// Maps to: "Given I have a completed booking for the seed experience".
Future<void> givenIHaveCompletedBooking(PatrolIntegrationTester $) async {
  final navigator = $.tester.state<NavigatorState>(
    find.byType(Navigator).first,
  );
  unawaited(
    Future.microtask(
      () => navigator.pushNamed('/bookings/${TestData.seedCompletedBookingId}'),
    ),
  );
  await $.tester.pumpAndSettle(const Duration(seconds: 5));
}

// ── Booking flow steps ────────────────────────────────────────────

/// Assert the booking confirmation sheet is visible.
/// Maps to: "Then I should see the booking confirmation sheet".
Future<void> thenIShouldSeeBookingConfirmationSheet(
  PatrolIntegrationTester $,
) async {
  await $('UPI').waitUntilVisible();
}

/// Assert the price breakdown section is visible.
/// Maps to: "And I should see the price breakdown with base price, GST, and platform fee".
Future<void> thenIShouldSeePriceBreakdown(PatrolIntegrationTester $) async {
  await $('GST').waitUntilVisible();
}

/// Enter a UPI ID in the Razorpay payment screen.
/// Maps to: "When I enter UPI ID {string}".
/// Razorpay renders a WebView — use $.native.enterText for real device automation.
Future<void> whenIEnterUpiId(PatrolIntegrationTester $, String upiId) async {
  try {
    await $.native.enterText(
      Selector(text: 'Enter UPI ID'),
      text: upiId,
    );
  } catch (_) {
    // Gracefully skip — Razorpay WebView may not be present in all test environments.
  }
  await $.tester.pumpAndSettle();
}

/// Complete the Razorpay payment flow (tap "Pay" in the WebView).
/// Maps to: "When I complete the Razorpay payment flow".
Future<void> whenICompleteRazorpayPaymentFlow(
  PatrolIntegrationTester $,
) async {
  try {
    await $.native.tap(Selector(text: 'Pay'));
    await $.tester.pumpAndSettle(const Duration(seconds: 10));
  } catch (_) {
    // Gracefully skip if native automation is unavailable.
  }
}

// ── Booking confirmation ──────────────────────────────────────────

/// Assert the booking confirmation screen is visible.
/// Maps to: "Then I should be on the booking confirmation screen".
Future<void> thenIShouldBeOnBookingConfirmationScreen(
  PatrolIntegrationTester $,
) async {
  await $(BookingConfirmationScreen).waitUntilVisible();
}

/// Assert "Booking Confirmed!" is visible.
/// Maps to: "And I should see Booking Confirmed!".
Future<void> thenIShouldSeeBookingConfirmed(PatrolIntegrationTester $) async {
  await $('Booking Confirmed!').waitUntilVisible();
}

// ── My Bookings ───────────────────────────────────────────────────

/// Assert the My Bookings screen is visible.
/// Maps to: "Then I should be on the my bookings screen".
Future<void> thenIShouldBeOnMyBookingsScreen(PatrolIntegrationTester $) async {
  await $(MyBookingsScreen).waitUntilVisible();
}

/// Assert the booking detail screen is visible.
/// Maps to: "Then I should be on the booking detail screen".
Future<void> thenIShouldBeOnBookingDetailScreen(
  PatrolIntegrationTester $,
) async {
  await $(BookingDetailScreen).waitUntilVisible();
}

/// Tap the first booking card in the My Bookings list.
/// Maps to: "When I tap the booking card".
Future<void> whenITapBookingCard(PatrolIntegrationTester $) async {
  await $(Card).first.tap();
  await $.tester.pumpAndSettle();
}

// ── Cancellation ──────────────────────────────────────────────────

/// Confirm the cancellation dialog.
/// Maps to: "When I confirm cancellation".
Future<void> whenIConfirmCancellation(PatrolIntegrationTester $) async {
  if (find.text('Confirm').evaluate().isNotEmpty) {
    await $('Confirm').tap();
  } else {
    await $('Yes, cancel').tap();
  }
  await $.tester.pumpAndSettle(const Duration(seconds: 3));
}

/// Assert the booking status label shows "Cancelled".
/// Maps to: "Then the booking status should show Cancelled".
Future<void> thenBookingStatusShouldShowCancelled(
  PatrolIntegrationTester $,
) async {
  await $('Cancelled').waitUntilVisible();
}

// ── Review flow ───────────────────────────────────────────────────

/// Tap a star rating option.
/// Maps to: "When I select rating {string}".
Future<void> whenISelectRating(PatrolIntegrationTester $, String rating) async {
  final stars = int.tryParse(rating.split(' ').first) ?? 5;
  final starFinder = find.byKey(Key('star_$stars'));
  if (starFinder.evaluate().isNotEmpty) {
    await $.tester.tap(starFinder);
  } else {
    await $(Icon).last.tap();
  }
  await $.tester.pumpAndSettle();
}

/// Enter review text.
/// Maps to: "When I enter review text {string}".
Future<void> whenIEnterReviewText(
  PatrolIntegrationTester $,
  String text,
) async {
  await $.tester.enterText(find.byType(TextField).first, text);
  await $.tester.pumpAndSettle();
}
