import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:creatorhub/features/studio/providers/earnings_provider.dart';
import 'package:creatorhub/features/studio/widgets/payout_row.dart';

Widget _wrap(Widget child) {
  return MaterialApp(
    home: Scaffold(
      body: SingleChildScrollView(child: child),
    ),
  );
}

PayoutSummary _build({
  PayoutStatus status = PayoutStatus.scheduled,
  String? title = 'Sunset Kayak in Alibaug',
  int amountPaisa = 500000,
  int tdsPaisa = 5000,
  String? failureReason,
  DateTime? processedAt,
}) {
  return PayoutSummary(
    id: 'payout-1',
    bookingId: 'booking-1',
    amountPaisa: amountPaisa,
    tdsPaisa: tdsPaisa,
    status: status,
    scheduledAt: DateTime(2026, 4, 10, 10),
    processedAt: processedAt,
    bookingTitle: title,
    failureReason: failureReason,
  );
}

void main() {
  group('PayoutRow', () {
    testWidgets('shows booking title and status label', (tester) async {
      await tester.pumpWidget(_wrap(PayoutRow(payout: _build())));
      await tester.pump();

      expect(find.text('Sunset Kayak in Alibaug'), findsOneWidget);
      expect(find.text('Scheduled'), findsOneWidget);
    });

    testWidgets('shows net amount after TDS', (tester) async {
      // amount 500000 - tds 5000 = 495000 paisa = ₹4,950
      await tester.pumpWidget(_wrap(PayoutRow(payout: _build())));
      await tester.pump();

      expect(find.text('₹4,950'), findsOneWidget);
      expect(find.text('after TDS ₹50'), findsOneWidget);
    });

    testWidgets('shows failure reason in red for failed payouts', (tester) async {
      await tester.pumpWidget(_wrap(PayoutRow(
        payout: _build(
          status: PayoutStatus.failed,
          failureReason: 'Bank account inactive',
        ),
      )));
      await tester.pump();

      expect(find.text('Failed'), findsOneWidget);
      expect(find.text('Bank account inactive'), findsOneWidget);
    });

    testWidgets('shows Paid label for completed payouts', (tester) async {
      await tester.pumpWidget(_wrap(PayoutRow(
        payout: _build(
          status: PayoutStatus.completed,
          processedAt: DateTime(2026, 4, 12, 14),
        ),
      )));
      await tester.pump();

      expect(find.text('Paid'), findsOneWidget);
    });

    testWidgets('hides TDS subline when tds is zero', (tester) async {
      await tester.pumpWidget(_wrap(PayoutRow(payout: _build(tdsPaisa: 0))));
      await tester.pump();

      expect(find.textContaining('after TDS'), findsNothing);
    });

    testWidgets('fallback title when bookingTitle is null', (tester) async {
      await tester.pumpWidget(
        _wrap(PayoutRow(payout: _build(title: null))),
      );
      await tester.pump();

      expect(find.text('Booking payout'), findsOneWidget);
    });
  });
}
