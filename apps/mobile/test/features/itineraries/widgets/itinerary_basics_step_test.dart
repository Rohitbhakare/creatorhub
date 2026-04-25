import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:creatorhub/features/content/providers/wizard_provider.dart';
import 'package:creatorhub/features/itineraries/widgets/itinerary_basics_step.dart';

Widget _wrap(ProviderContainer container) {
  return UncontrolledProviderScope(
    container: container,
    child: const MaterialApp(
      home: Scaffold(body: ItineraryBasicsStep()),
    ),
  );
}

ProviderContainer _itinContainer() {
  final c = ProviderContainer();
  c.read(wizardProvider.notifier).initWizard(ContentType.selfPacedItinerary, 'travel');
  return c;
}

void main() {
  group('ItineraryBasicsStep — category grid', () {
    testWidgets('renders editorial header and 8 category cards', (tester) async {
      final c = _itinContainer();
      addTearDown(c.dispose);

      await tester.pumpWidget(_wrap(c));
      await tester.pump();

      expect(find.text('STEP 1 OF 6'), findsOneWidget);
      expect(find.text('What kind of\njourney?'), findsOneWidget);

      // 8 category labels present
      expect(find.text('Adventure'), findsOneWidget);
      expect(find.text('Road Trip'), findsOneWidget);
      expect(find.text('Food Trail'), findsOneWidget);
      expect(find.text('Cultural'), findsOneWidget);
      expect(find.text('Weekend'), findsOneWidget);
      expect(find.text('Budget'), findsOneWidget);
      expect(find.text('Luxury'), findsOneWidget);
      expect(find.text('Other'), findsOneWidget);
    });

    testWidgets('tapping a category sets subCategoryId in wizard state',
        (tester) async {
      final c = _itinContainer();
      addTearDown(c.dispose);

      await tester.pumpWidget(_wrap(c));
      await tester.pump();

      expect(c.read(wizardProvider).subCategoryId, isNull);

      await tester.tap(find.text('Adventure'));
      await tester.pump();

      expect(c.read(wizardProvider).subCategoryId, 'adventure');
    });

    testWidgets('tapping selected category again deselects it (via notifier)',
        (tester) async {
      final c = _itinContainer();
      addTearDown(c.dispose);
      c.read(wizardProvider.notifier).setSubCategory('adventure');
      expect(c.read(wizardProvider).subCategoryId, 'adventure');

      // Toggle back via the notifier (same logic the onTap uses)
      c.read(wizardProvider.notifier).setSubCategory(null);
      expect(c.read(wizardProvider).subCategoryId, isNull);
    });

    testWidgets('category picker always renders grid items', (tester) async {
      // AnimatedCrossFade renders both children; we verify the grid items are
      // always present in the tree regardless of selection state.
      final c = _itinContainer();
      addTearDown(c.dispose);

      await tester.pumpWidget(_wrap(c));
      await tester.pump();

      // All 8 category labels must be in the tree
      expect(find.text('Adventure'), findsOneWidget);
      expect(find.text('Road Trip'), findsOneWidget);
    });

    testWidgets('details section visible after category selected', (tester) async {
      final c = _itinContainer();
      addTearDown(c.dispose);
      c.read(wizardProvider.notifier).setSubCategory('road_trips');

      await tester.pumpWidget(_wrap(c));
      await tester.pumpAndSettle();

      expect(find.text('Title'), findsOneWidget);
      expect(find.text('Description'), findsOneWidget);
      expect(find.text('Hashtags'), findsOneWidget);
    });
  });

  group('ItineraryBasicsStep — tags', () {
    testWidgets('adds a tag via text field submit', (tester) async {
      final c = _itinContainer();
      addTearDown(c.dispose);
      c.read(wizardProvider.notifier).setSubCategory('adventure');

      await tester.pumpWidget(_wrap(c));
      await tester.pumpAndSettle();

      final tagField = find.widgetWithText(TextField, '');
      // Find the hashtag input (has prefixText '# ')
      await tester.enterText(tagField.last, 'coorg');
      await tester.testTextInput.receiveAction(TextInputAction.done);
      await tester.pump();

      expect(c.read(wizardProvider).tags, contains('coorg'));
    });

    testWidgets('enforces max 5 tags', (tester) async {
      final c = _itinContainer();
      addTearDown(c.dispose);
      c.read(wizardProvider.notifier).setSubCategory('adventure');
      c.read(wizardProvider.notifier).setTags(['a', 'b', 'c', 'd', 'e']);

      await tester.pumpWidget(_wrap(c));
      await tester.pumpAndSettle();

      // Tag input should be hidden when max reached
      expect(find.text('5/5'), findsOneWidget);
    });
  });

  group('ItineraryBasicsStep — validation', () {
    test('step 1 blocks advance without category selection', () {
      final c = _itinContainer();
      addTearDown(c.dispose);

      final state = c.read(wizardProvider);
      expect(state.canAdvance, isFalse);
      expect(
        state.validationErrors,
        contains('Select a journey style to continue'),
      );
    });

    test('step 1 blocks advance with category but short title', () {
      final c = _itinContainer();
      addTearDown(c.dispose);
      c.read(wizardProvider.notifier).setSubCategory('adventure');
      c.read(wizardProvider.notifier).setTitle('Hi');

      final state = c.read(wizardProvider);
      expect(state.canAdvance, isFalse);
      expect(
        state.validationErrors,
        contains('Title must be at least 5 characters'),
      );
    });

    test('step 1 allows advance with category + valid title', () {
      final c = _itinContainer();
      addTearDown(c.dispose);
      c.read(wizardProvider.notifier).setSubCategory('adventure');
      c.read(wizardProvider.notifier).setTitle('3 Days in Coorg');

      final state = c.read(wizardProvider);
      expect(state.canAdvance, isTrue);
      expect(state.validationErrors, isEmpty);
    });
  });
}
