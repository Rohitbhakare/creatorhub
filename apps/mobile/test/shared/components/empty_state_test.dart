import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:creatorhub/shared/components/button.dart';
import 'package:creatorhub/shared/components/empty_state.dart';

Widget _wrap(Widget child) => MaterialApp(home: Scaffold(body: child));

void main() {
  group('EmptyState', () {
    testWidgets('renders title and description', (tester) async {
      await tester.pumpWidget(_wrap(const EmptyState(
        title: 'Nothing here yet',
        description: 'Be the first to post.',
      )));

      expect(find.text('Nothing here yet'), findsOneWidget);
      expect(find.text('Be the first to post.'), findsOneWidget);
    });

    testWidgets('renders a default icon when no illustration or icon is provided',
        (tester) async {
      await tester.pumpWidget(_wrap(const EmptyState(
        title: 't',
        description: 'd',
      )));

      expect(find.byType(Icon), findsOneWidget);
    });

    testWidgets('uses the provided icon', (tester) async {
      await tester.pumpWidget(_wrap(const EmptyState(
        icon: Icons.error_outline,
        title: 't',
        description: 'd',
      )));

      expect(find.byIcon(Icons.error_outline), findsOneWidget);
    });

    testWidgets('prefers illustration over icon when both are set', (tester) async {
      await tester.pumpWidget(_wrap(EmptyState(
        icon: Icons.error_outline,
        illustration: Container(
          key: const Key('illustration'),
          width: 80,
          height: 80,
          color: Colors.red,
        ),
        title: 't',
        description: 'd',
      )));

      expect(find.byKey(const Key('illustration')), findsOneWidget);
      // The Icon path is skipped when illustration is provided.
      expect(find.byIcon(Icons.error_outline), findsNothing);
    });

    testWidgets('CTA button appears only when both ctaLabel and onCtaPressed are set',
        (tester) async {
      await tester.pumpWidget(_wrap(const EmptyState(
        title: 't',
        description: 'd',
        ctaLabel: 'Try again', // no handler → no CTA
      )));

      expect(find.byType(AppButton), findsNothing);

      await tester.pumpWidget(_wrap(EmptyState(
        title: 't',
        description: 'd',
        ctaLabel: 'Try again',
        onCtaPressed: () {},
      )));

      expect(find.byType(AppButton), findsOneWidget);
      expect(find.text('Try again'), findsOneWidget);
    });

    testWidgets('CTA onTap fires the provided callback', (tester) async {
      var taps = 0;
      await tester.pumpWidget(_wrap(EmptyState(
        title: 't',
        description: 'd',
        ctaLabel: 'Retry',
        onCtaPressed: () => taps++,
      )));

      await tester.tap(find.text('Retry'));
      await tester.pumpAndSettle();

      expect(taps, 1);
    });
  });
}
