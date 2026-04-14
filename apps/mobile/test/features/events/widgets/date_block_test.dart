import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:creatorhub/features/events/widgets/date_block.dart';

Widget _wrap(Widget child) {
  return MaterialApp(
    home: Scaffold(
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: child,
      ),
    ),
  );
}

void main() {
  group('DateBlock', () {
    testWidgets('renders formatted date string', (tester) async {
      final date = DateTime(2026, 6, 20, 9, 0);
      await tester.pumpWidget(_wrap(DateBlock(startAt: date)));
      await tester.pump();

      // Full date: "20 Jun 2026"
      expect(find.text('20 Jun 2026'), findsOneWidget);
    });

    testWidgets('renders day-of-week abbreviated + uppercased', (tester) async {
      // Saturday
      final date = DateTime(2026, 6, 20, 9, 0);
      await tester.pumpWidget(_wrap(DateBlock(startAt: date)));
      await tester.pump();

      expect(find.text('SAT'), findsOneWidget);
    });

    testWidgets('renders day number', (tester) async {
      final date = DateTime(2026, 6, 20, 9, 0);
      await tester.pumpWidget(_wrap(DateBlock(startAt: date)));
      await tester.pump();

      expect(find.text('20'), findsOneWidget);
    });

    testWidgets('renders start time only when endAt is null', (tester) async {
      final date = DateTime(2026, 6, 20, 10, 30);
      await tester.pumpWidget(_wrap(DateBlock(startAt: date)));
      await tester.pump();

      // Shows "10:30 AM" with no dash
      expect(find.text('10:30 AM'), findsOneWidget);
      expect(find.textContaining('–'), findsNothing);
    });

    testWidgets('renders time range when endAt is provided', (tester) async {
      final start = DateTime(2026, 6, 20, 10, 0);
      final end = DateTime(2026, 6, 20, 13, 0);
      await tester.pumpWidget(_wrap(DateBlock(startAt: start, endAt: end)));
      await tester.pump();

      expect(find.text('10:00 AM – 1:00 PM'), findsOneWidget);
    });

    testWidgets('renders correctly for midnight (12:00 AM)', (tester) async {
      final date = DateTime(2026, 12, 31, 0, 0);
      await tester.pumpWidget(_wrap(DateBlock(startAt: date)));
      await tester.pump();

      expect(find.text('12:00 AM'), findsOneWidget);
    });

    testWidgets('renders correctly for noon (12:00 PM)', (tester) async {
      final date = DateTime(2026, 8, 15, 12, 0);
      await tester.pumpWidget(_wrap(DateBlock(startAt: date)));
      await tester.pump();

      expect(find.text('12:00 PM'), findsOneWidget);
    });
  });
}
