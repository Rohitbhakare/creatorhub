import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:creatorhub/shared/components/content_card.dart';
import 'package:creatorhub/shared/components/creator_card.dart';

Widget _wrap(Widget child) =>
    MaterialApp(home: Scaffold(body: SingleChildScrollView(child: child)));

void main() {
  group('ContentCard', () {
    testWidgets('renders title and creator name', (tester) async {
      await tester.pumpWidget(_wrap(const ContentCard(
        title: 'A weekend in Kasol',
        creatorName: 'Priya',
      )));

      expect(find.text('A weekend in Kasol'), findsOneWidget);
      expect(find.text('Priya'), findsOneWidget);
    });

    testWidgets('shows FREE when priceInPaisa is 0', (tester) async {
      await tester.pumpWidget(_wrap(const ContentCard(
        title: 't',
        creatorName: 'c',
      )));

      expect(find.text('FREE'), findsOneWidget);
    });

    testWidgets('shows formatted rupee price when priceInPaisa is positive',
        (tester) async {
      // 650000 paisa = ₹6,500 (Indian grouping)
      await tester.pumpWidget(_wrap(const ContentCard(
        title: 't',
        creatorName: 'c',
        priceInPaisa: 650000,
      )));

      expect(find.textContaining('₹'), findsWidgets);
    });

    testWidgets('fires onTap when the card is tapped', (tester) async {
      var taps = 0;
      await tester.pumpWidget(_wrap(ContentCard(
        title: 't',
        creatorName: 'c',
        onTap: () => taps++,
      )));

      await tester.tap(find.byType(ContentCard));
      await tester.pumpAndSettle();

      expect(taps, 1);
    });
  });

  group('CreatorCard', () {
    testWidgets('renders creator name', (tester) async {
      await tester.pumpWidget(_wrap(const CreatorCard(name: 'Alex')));
      expect(find.text('Alex'), findsOneWidget);
    });

    testWidgets('shows "Follow" label when not following', (tester) async {
      await tester.pumpWidget(_wrap(CreatorCard(
        name: 'Alex',
        isFollowing: false,
        onFollow: () {},
      )));

      expect(find.text('Follow'), findsOneWidget);
    });

    testWidgets('shows "Following" label when isFollowing=true', (tester) async {
      await tester.pumpWidget(_wrap(CreatorCard(
        name: 'Alex',
        isFollowing: true,
        onFollow: () {},
      )));

      expect(find.text('Following'), findsOneWidget);
    });

    testWidgets('fires onFollow when follow button is tapped', (tester) async {
      var taps = 0;
      await tester.pumpWidget(_wrap(CreatorCard(
        name: 'Alex',
        onFollow: () => taps++,
      )));

      await tester.tap(find.text('Follow'));
      await tester.pumpAndSettle();

      expect(taps, 1);
    });
  });
}
