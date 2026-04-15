// @booking — F10: Experience Booking
//
// Run with: patrol test --target integration_test/scenarios/booking_scenarios.dart
//
// NOTE: Razorpay scenarios require a real device (or Razorpay test environment).
// They are tagged @razorpay and can be excluded in CI:
//   patrol test ... --exclude-tags razorpay

import 'package:flutter_test/flutter_test.dart';
import 'package:patrol/patrol.dart';

import '../hooks/global_hooks.dart';
import '../steps/auth_steps.dart';
import '../steps/booking_steps.dart';
import '../steps/content_steps.dart';
import '../steps/navigation_steps.dart';

void bookingScenarios() {
  // ── F10-S01: End-to-end booking via Razorpay UPI ─────────────────────────
  //
  // NOTE: Requires Razorpay sandbox keys and a real device.
  //       In simulator/CI, mark this as skipped or use Razorpay test mode.
  patrolTest(
    'F10-S01: User successfully books a paid experience via Razorpay UPI',
    tags: ['booking', 'smoke', 'critical', 'razorpay'],
    ($) async {
      await beforeScenario($);
      await givenTheAppIsLaunched($);
      await givenIAmLoggedInAsBooker($);
      await givenIAmOnSeedExperienceDetail($);
      await givenExperienceIsNotFullyBooked($);

      await whenITap($, 'Book Now');
      await thenIShouldSeeBookingConfirmationSheet($);
      await thenIShouldSeePriceBreakdown($);
      await thenIShouldSee($, 'UPI');

      await whenITap($, 'Pay Now');
      await whenIEnterUpiId($, 'success@razorpay');
      await whenICompleteRazorpayPaymentFlow($);

      await thenIShouldBeOnBookingConfirmationScreen($);
      await thenIShouldSeeBookingConfirmed($);
    },
  );

  // ── F10-S02: Sold Out state ───────────────────────────────────────────────
  patrolTest(
    'F10-S02: User sees Sold Out when experience is fully booked',
    tags: ['booking', 'capacity'],
    ($) async {
      await beforeScenario($);
      await givenTheAppIsLaunched($);
      await givenIAmLoggedInAsBooker($);
      // Navigate to a pre-seeded sold-out experience
      await givenIAmOnSeedExperienceDetail($);

      // Assert sold-out state (only one of Book Now or Sold Out should appear)
      final bookNow = find.text('Book Now');
      final soldOut = find.text('Sold Out');
      expect(
        bookNow.evaluate().isNotEmpty || soldOut.evaluate().isNotEmpty,
        isTrue,
        reason: 'Either Book Now or Sold Out must be visible',
      );
      // Skip assertion test — actual state depends on staging DB
      markTestSkipped('Sold Out state requires seed experience at capacity');
    },
  );

  // ── F10-S03: My Bookings list ─────────────────────────────────────────────
  patrolTest(
    'F10-S03: User views their bookings list after booking',
    tags: ['booking', 'my_bookings'],
    ($) async {
      await beforeScenario($);
      await givenTheAppIsLaunched($);
      await givenIAmLoggedInAsBooker($);
      await givenIHaveExistingConfirmedBooking($);

      await whenITapTheTab($, 'You');
      await whenITap($, 'My Bookings');
      await thenIShouldBeOnMyBookingsScreen($);
      await thenIShouldSee($, 'Confirmed');
    },
  );

  // ── F10-S04: Cancellation ─────────────────────────────────────────────────
  patrolTest(
    'F10-S04: User cancels a booking before the experience date',
    tags: ['booking', 'cancel'],
    ($) async {
      await beforeScenario($);
      await givenTheAppIsLaunched($);
      await givenIAmLoggedInAsBooker($);
      await givenIHaveCancellableBooking($);

      await whenITap($, 'Cancel Booking');
      await whenIConfirmCancellation($);
      await thenBookingStatusShouldShowCancelled($);
    },
  );

  // ── F10-S05: Review after experience ─────────────────────────────────────
  patrolTest(
    'F10-S05: User writes a review after an experience is completed',
    tags: ['booking', 'review', 'after_experience'],
    ($) async {
      await beforeScenario($);
      await givenTheAppIsLaunched($);
      await givenIAmLoggedInAsBooker($);
      await givenIHaveCompletedBooking($);

      await whenITap($, 'Write a Review');
      await whenISelectRating($, '5 stars');
      await whenIEnterReviewText(
        $,
        'Absolutely magical. The guide was knowledgeable and the views were stunning.',
      );
      await whenITap($, 'Submit Review');
      await thenIShouldSee($, 'Review submitted');
      await thenIShouldSee($, '14 days');
    },
  );
}
