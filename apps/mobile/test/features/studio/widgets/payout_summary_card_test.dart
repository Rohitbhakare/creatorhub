import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:creatorhub/features/studio/providers/earnings_provider.dart';
import 'package:creatorhub/features/studio/widgets/payout_summary_card.dart';

Widget _wrap(Widget child) {
  return MaterialApp(
    home: Scaffold(body: child),
  );
}

void main() {
  group('PayoutSummaryCard', () {
    testWidgets('shows three tiles with labels', (tester) async {
      await tester.pumpWidget(_wrap(
        const PayoutSummaryCard(
          totals: PayoutTotals(
            pendingPaisa: 150000,
            processingPaisa: 0,
            paidLast30dPaisa: 450000,
          ),
        ),
      ));
      await tester.pump();

      expect(find.text('Pending'), findsOneWidget);
      expect(find.text('Processing'), findsOneWidget);
      expect(find.text('Paid · 30d'), findsOneWidget);
    });

    testWidgets('formats pending amount as rupees', (tester) async {
      await tester.pumpWidget(_wrap(
        const PayoutSummaryCard(
          totals: PayoutTotals(
            pendingPaisa: 150000,
            processingPaisa: 0,
            paidLast30dPaisa: 0,
          ),
        ),
      ));
      await tester.pump();

      // ₹1,500 for 150000 paisa
      expect(find.text('₹1,500'), findsOneWidget);
    });

    testWidgets('shows ₹0 when amount is zero', (tester) async {
      await tester.pumpWidget(_wrap(
        const PayoutSummaryCard(
          totals: PayoutTotals(
            pendingPaisa: 0,
            processingPaisa: 0,
            paidLast30dPaisa: 0,
          ),
        ),
      ));
      await tester.pump();

      // All three tiles show ₹0
      expect(find.text('₹0'), findsNWidgets(3));
    });
  });
}
