import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:creatorhub/features/content/providers/wizard_provider.dart';
import 'package:creatorhub/features/content/widgets/ai_helper_chip.dart';
import 'package:creatorhub/features/content/widgets/steps/basics_step.dart';

Widget _wrap(ProviderContainer container) {
  return UncontrolledProviderScope(
    container: container,
    child: const MaterialApp(
      home: Scaffold(body: BasicsStep()),
    ),
  );
}

void main() {
  group('BasicsStep (post)', () {
    testWidgets('renders editorial intro for posts', (tester) async {
      final container = ProviderContainer();
      addTearDown(container.dispose);
      container.read(wizardProvider.notifier).initWizard(
            ContentType.post,
            'travel',
          );

      await tester.pumpWidget(_wrap(container));
      await tester.pump();

      expect(find.text('STEP 1 OF 3'), findsOneWidget);
      expect(find.text('Start with a spark.'), findsOneWidget);
      expect(find.text('Give this story a name.'), findsOneWidget);
    });

    testWidgets('does NOT render a Body field (only Title + Description)',
        (tester) async {
      final container = ProviderContainer();
      addTearDown(container.dispose);
      container.read(wizardProvider.notifier).initWizard(
            ContentType.post,
            'travel',
          );

      await tester.pumpWidget(_wrap(container));
      await tester.pump();

      expect(find.text('Title'), findsOneWidget);
      expect(find.text('Description'), findsOneWidget);
      expect(find.text('Body'), findsNothing);
      expect(find.text('Tell your story...'), findsNothing);
    });

    testWidgets('renders the AI helper chip on the post flow',
        (tester) async {
      final container = ProviderContainer();
      addTearDown(container.dispose);
      container.read(wizardProvider.notifier).initWizard(
            ContentType.post,
            'travel',
          );

      await tester.pumpWidget(_wrap(container));
      await tester.pump();

      expect(find.byType(AiHelperChip), findsOneWidget);
    });

    testWidgets('renders microtips under the fields', (tester) async {
      final container = ProviderContainer();
      addTearDown(container.dispose);
      container.read(wizardProvider.notifier).initWizard(
            ContentType.post,
            'travel',
          );

      await tester.pumpWidget(_wrap(container));
      await tester.pump();

      expect(
        find.text('A great title makes readers stop scrolling.'),
        findsOneWidget,
      );
      expect(
        find.text('One line that tells people why this matters.'),
        findsOneWidget,
      );
    });
  });

  group('BasicsStep (non-post)', () {
    testWidgets('renders itinerary headline and total steps', (tester) async {
      final container = ProviderContainer();
      addTearDown(container.dispose);
      container.read(wizardProvider.notifier).initWizard(
            ContentType.selfPacedItinerary,
            'travel',
          );

      await tester.pumpWidget(_wrap(container));
      await tester.pump();

      expect(find.text('STEP 1 OF 6'), findsOneWidget);
      expect(find.text('Name your itinerary.'), findsOneWidget);
      expect(find.byType(AiHelperChip), findsNothing);
    });
  });
}
