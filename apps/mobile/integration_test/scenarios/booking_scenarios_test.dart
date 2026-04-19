// @booking — F10: Experience Booking
//
// Run with: patrol test --target integration_test/scenarios/booking_scenarios_test.dart
//
// NOTE: All scenarios require seeded experience data, paid-publish creators
// with completed KYC, and (for S01) a real Razorpay sandbox + device. The
// E2E harness on the iOS Simulator doesn't support Razorpay's UPI app
// intents, so S01 is permanently skipped there. S02-S05 are skipped until
// booking seed data + lifecycle hooks are added to the test DB.

import 'package:flutter_test/flutter_test.dart';
import 'package:patrol/patrol.dart';

import '../hooks/global_hooks.dart';

void bookingScenarios() {
  // ── F10-S01: End-to-end booking via Razorpay UPI ─────────────────────────
  patrolTest(
    'F10-S01: User successfully books a paid experience via Razorpay UPI',
    tags: ['booking', 'smoke', 'critical', 'razorpay'],
    ($) async {
      await beforeScenario($);
      markTestSkipped(
        'Razorpay UPI intent flow requires a real device + sandbox keys. '
        'Re-enable when staging env has Razorpay test env and booking seeds.',
      );
    },
  );

  // ── F10-S02: Sold Out state ───────────────────────────────────────────────
  patrolTest(
    'F10-S02: User sees Sold Out when experience is fully booked',
    tags: ['booking', 'capacity'],
    ($) async {
      await beforeScenario($);
      markTestSkipped(
        'Sold Out state requires a seed experience at capacity — add to '
        '016_e2e_seed.sql when the booking lifecycle fixtures land.',
      );
    },
  );

  // ── F10-S03: My Bookings list ─────────────────────────────────────────────
  patrolTest(
    'F10-S03: User views their bookings list after booking',
    tags: ['booking', 'my_bookings'],
    ($) async {
      await beforeScenario($);
      markTestSkipped(
        'Needs a seeded confirmed booking for the booker user — deferred '
        'until the bookings seed fixture ships.',
      );
    },
  );

  // ── F10-S04: Cancellation ─────────────────────────────────────────────────
  patrolTest(
    'F10-S04: User cancels a booking before the experience date',
    tags: ['booking', 'cancel'],
    ($) async {
      await beforeScenario($);
      markTestSkipped(
        'Needs a seeded cancellable booking + refund mock — deferred.',
      );
    },
  );

  // ── F10-S05: Review after experience ─────────────────────────────────────
  patrolTest(
    'F10-S05: User writes a review after an experience is completed',
    tags: ['booking', 'review', 'after_experience'],
    ($) async {
      await beforeScenario($);
      markTestSkipped(
        'Needs a seeded completed booking with review window open — deferred.',
      );
    },
  );
}

void main() => bookingScenarios();
