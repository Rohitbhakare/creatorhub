import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:creatorhub/features/content/providers/wizard_provider.dart';
import 'package:creatorhub/features/content/services/draft_auto_save_service.dart';

/// Like itineraries, the event wizard's discoverability facets are held on
/// the shared `wizardProvider`. `_saveEventDetails` in the wizard shell reads
/// them via `buildFacetsPayload` and merges the result into the
/// `PUT /api/v1/events/:id` body. These tests cover that contract.
void main() {
  group('Event wizard facets', () {
    ProviderContainer makeContainer() => ProviderContainer();

    test('a fresh event draft has null facets', () {
      final c = makeContainer();
      addTearDown(c.dispose);
      c.read(wizardProvider.notifier).initWizard(ContentType.event, 'travel');

      final s = c.read(wizardProvider);
      expect(s.contentType, ContentType.event);
      expect(s.season, isNull);
      expect(s.tripStyle, isNull);
      expect(s.audience, isNull);
    });

    test('setTripStyle("nightlife") updates state and marks dirty', () {
      final c = makeContainer();
      addTearDown(c.dispose);
      c.read(wizardProvider.notifier).initWizard(ContentType.event, 'travel');

      c.read(wizardProvider.notifier).setTripStyle('nightlife');
      final s = c.read(wizardProvider);

      expect(s.tripStyle, 'nightlife');
      expect(s.season, isNull);
      expect(s.audience, isNull);
      expect(s.isDirty, isTrue);
    });

    test('setAudience(null) clears a previously-set audience', () {
      final c = makeContainer();
      addTearDown(c.dispose);
      c.read(wizardProvider.notifier).initWizard(ContentType.event, 'travel');

      c.read(wizardProvider.notifier).setAudience('friends');
      expect(c.read(wizardProvider).audience, 'friends');

      c.read(wizardProvider.notifier).setAudience(null);
      expect(c.read(wizardProvider).audience, isNull);
    });

    test(
        'buildFacetsPayload serializes the wizard facets with snake_case keys',
        () {
      final c = makeContainer();
      addTearDown(c.dispose);
      c.read(wizardProvider.notifier).initWizard(ContentType.event, 'travel');

      final notifier = c.read(wizardProvider.notifier);
      notifier.setSeason('summer');
      notifier.setTripStyle('nightlife');
      notifier.setAudience('friends');

      final payload = buildFacetsPayload(c.read(wizardProvider));
      expect(payload, <String, dynamic>{
        'season': 'summer',
        'trip_style': 'nightlife',
        'audience': 'friends',
      });
    });
  });
}
