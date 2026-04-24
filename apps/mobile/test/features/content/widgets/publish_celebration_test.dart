import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:creatorhub/features/content/providers/wizard_provider.dart';
import 'package:creatorhub/features/content/widgets/publish_celebration.dart';

Widget _harness({
  required ContentType contentType,
  bool disableAnimations = false,
}) {
  return MaterialApp(
    builder: (context, child) => MediaQuery(
      data: MediaQuery.of(context)
          .copyWith(disableAnimations: disableAnimations),
      child: child!,
    ),
    home: Scaffold(
      body: Builder(
        builder: (context) => Center(
          child: TextButton(
            onPressed: () => PublishCelebration.show(
              context,
              contentType: contentType,
            ),
            child: const Text('Go'),
          ),
        ),
      ),
    ),
  );
}

void main() {
  group('PublishCelebration', () {
    testWidgets('shows post headline', (tester) async {
      await tester.pumpWidget(_harness(contentType: ContentType.post));
      await tester.tap(find.text('Go'));
      await tester.pump(); // start route transition
      await tester.pump(const Duration(milliseconds: 300));

      expect(find.text('Your story is live.'), findsOneWidget);

      // Let the auto-dismiss timer fire + transition complete.
      await tester.pump(const Duration(milliseconds: 2000));
      await tester.pumpAndSettle();
    });

    testWidgets('shows itinerary headline for selfPacedItinerary',
        (tester) async {
      await tester.pumpWidget(
        _harness(contentType: ContentType.selfPacedItinerary),
      );
      await tester.tap(find.text('Go'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      expect(find.text('Ready for travelers.'), findsOneWidget);

      await tester.pump(const Duration(milliseconds: 2000));
      await tester.pumpAndSettle();
    });

    testWidgets('auto-dismisses after ~1.6s', (tester) async {
      await tester.pumpWidget(_harness(contentType: ContentType.post));
      await tester.tap(find.text('Go'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      expect(find.text('Your story is live.'), findsOneWidget);

      await tester.pump(const Duration(milliseconds: 1800));
      await tester.pumpAndSettle();

      expect(find.text('Your story is live.'), findsNothing);
    });

    testWidgets('with disableAnimations, celebration still shows and dismisses',
        (tester) async {
      await tester.pumpWidget(_harness(
        contentType: ContentType.post,
        disableAnimations: true,
      ));
      await tester.tap(find.text('Go'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      expect(find.text('Your story is live.'), findsOneWidget);

      await tester.pump(const Duration(milliseconds: 2000));
      await tester.pumpAndSettle();

      expect(find.text('Your story is live.'), findsNothing);
    });
  });
}
