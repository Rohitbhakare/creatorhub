import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:creatorhub/features/content/providers/wizard_provider.dart';
import 'package:creatorhub/features/content/widgets/post_preview_card.dart';
import 'package:creatorhub/features/content/widgets/steps/review_step.dart';

Widget _wrap(ProviderContainer container) {
  return UncontrolledProviderScope(
    container: container,
    child: const MaterialApp(
      home: Scaffold(body: ReviewStep()),
    ),
  );
}

void main() {
  group('ReviewStep (post)', () {
    testWidgets('renders editorial intro and live preview', (tester) async {
      final container = ProviderContainer();
      addTearDown(container.dispose);
      container.read(wizardProvider.notifier)
        ..initWizard(ContentType.post, 'travel')
        ..setTitle('Quiet Hampi')
        ..setBody('Boulders and a dropped-coin moon.');

      await tester.pumpWidget(_wrap(container));
      await tester.pump();

      expect(find.text('One last look.'), findsOneWidget);
      expect(find.byType(PostPreviewCard), findsOneWidget);
      expect(find.text('Quiet Hampi'), findsWidgets);
    });

    testWidgets('does not render the deleted "Content type" chip',
        (tester) async {
      final container = ProviderContainer();
      addTearDown(container.dispose);
      container.read(wizardProvider.notifier).initWizard(
            ContentType.post,
            'travel',
          );

      await tester.pumpWidget(_wrap(container));
      await tester.pump();

      expect(find.text('Content type'), findsNothing);
    });

    testWidgets('renders T&C row', (tester) async {
      final container = ProviderContainer();
      addTearDown(container.dispose);
      container.read(wizardProvider.notifier).initWizard(
            ContentType.post,
            'travel',
          );

      await tester.pumpWidget(_wrap(container));
      await tester.pump();

      expect(find.byType(Checkbox), findsOneWidget);
      expect(
        find.byWidgetPredicate(
          (w) => w is RichText &&
              w.text.toPlainText().contains('Terms & Conditions'),
        ),
        findsOneWidget,
      );
    });
  });

  group('ReviewStep (itinerary)', () {
    testWidgets('keeps Pricing block for non-post content', (tester) async {
      final container = ProviderContainer();
      addTearDown(container.dispose);
      container.read(wizardProvider.notifier).initWizard(
            ContentType.selfPacedItinerary,
            'travel',
          );

      await tester.pumpWidget(_wrap(container));
      await tester.pump();

      expect(find.text('Pricing'), findsOneWidget);
      expect(find.byType(PostPreviewCard), findsNothing);
    });
  });
}
