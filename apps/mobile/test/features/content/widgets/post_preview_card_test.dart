import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:creatorhub/features/content/providers/wizard_provider.dart';
import 'package:creatorhub/features/content/widgets/post_preview_card.dart';

Widget _wrap({required ProviderContainer container}) {
  return UncontrolledProviderScope(
    container: container,
    child: const MaterialApp(
      home: Scaffold(body: PostPreviewCard()),
    ),
  );
}

WizardNotifier _prime(ProviderContainer container) {
  final notifier = container.read(wizardProvider.notifier);
  notifier.initWizard(ContentType.post, 'travel');
  return notifier;
}

void main() {
  group('PostPreviewCard', () {
    testWidgets('renders title and body when state has them', (tester) async {
      final container = ProviderContainer();
      addTearDown(container.dispose);
      _prime(container)
        ..setTitle('A night in Hampi')
        ..setBody('Boulders under a moon like a dropped coin.');

      await tester.pumpWidget(_wrap(container: container));
      await tester.pump();

      expect(find.text('A night in Hampi'), findsOneWidget);
      expect(
        find.text('Boulders under a moon like a dropped coin.'),
        findsOneWidget,
      );
    });

    testWidgets('shows empty-state hint when body is blank',
        (tester) async {
      final container = ProviderContainer();
      addTearDown(container.dispose);
      _prime(container).setTitle('Just a title');

      await tester.pumpWidget(_wrap(container: container));
      await tester.pump();

      expect(
        find.text('Your story preview will appear here.'),
        findsOneWidget,
      );
    });

    testWidgets('renders city chip when startingCityName is set',
        (tester) async {
      final container = ProviderContainer();
      addTearDown(container.dispose);
      _prime(container)
        ..setTitle('Mumbai in the rain')
        ..setBody('Chai steam against a salt wind.')
        ..setStartingCity('mum-1', cityName: 'Mumbai');

      await tester.pumpWidget(_wrap(container: container));
      await tester.pump();

      expect(find.text('Mumbai'), findsOneWidget);
    });

    testWidgets('shows placeholder title when title is empty',
        (tester) async {
      final container = ProviderContainer();
      addTearDown(container.dispose);
      _prime(container);

      await tester.pumpWidget(_wrap(container: container));
      await tester.pump();

      expect(find.text('Your title'), findsOneWidget);
    });
  });
}
