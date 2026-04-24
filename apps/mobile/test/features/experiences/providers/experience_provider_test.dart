import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:creatorhub/features/experiences/providers/experience_provider.dart';

/// The scheduled-experience wizard owns its own Riverpod notifier (it
/// predates the shared wizard provider and has a bespoke day-plan API
/// surface). These tests cover the facet setters added for PR 2 and the
/// `buildUpdatePayload()` helper that `updateField()` POSTs to
/// `PUT /api/v1/experiences/:id`.
void main() {
  group('CreateExperienceNotifier facets', () {
    ProviderContainer makeContainer() => ProviderContainer();

    test('a fresh experience draft has null facets', () {
      final c = makeContainer();
      addTearDown(c.dispose);

      final s = c.read(createExperienceProvider);
      expect(s.season, isNull);
      expect(s.tripStyle, isNull);
      expect(s.audience, isNull);
    });

    test('setSeason("monsoon") updates state', () {
      final c = makeContainer();
      addTearDown(c.dispose);

      c.read(createExperienceProvider.notifier).setSeason('monsoon');
      final s = c.read(createExperienceProvider);

      expect(s.season, 'monsoon');
      expect(s.tripStyle, isNull);
      expect(s.audience, isNull);
    });

    test('setTripStyle(null) clears a previously-set trip style', () {
      final c = makeContainer();
      addTearDown(c.dispose);

      final notifier = c.read(createExperienceProvider.notifier);
      notifier.setTripStyle('wellness');
      expect(c.read(createExperienceProvider).tripStyle, 'wellness');

      notifier.setTripStyle(null);
      expect(c.read(createExperienceProvider).tripStyle, isNull);
    });

    test('buildUpdatePayload contains a facets map with snake_case keys', () {
      final c = makeContainer();
      addTearDown(c.dispose);

      final notifier = c.read(createExperienceProvider.notifier);
      notifier.setTitle('Himalayan wellness retreat');
      notifier.setDescription('5-day silent retreat in Dharamshala.');
      notifier.setSeason('monsoon');
      notifier.setTripStyle('wellness');
      notifier.setAudience('solo');

      final payload = notifier.buildUpdatePayload();
      expect(payload['title'], 'Himalayan wellness retreat');
      expect(payload['description'], '5-day silent retreat in Dharamshala.');
      expect(payload['price_paisa'], 0);
      expect(payload['facets'], <String, dynamic>{
        'season': 'monsoon',
        'trip_style': 'wellness',
        'audience': 'solo',
      });
    });

    test(
        'buildUpdatePayload facets map omits null facet keys (partial selection)',
        () {
      final c = makeContainer();
      addTearDown(c.dispose);

      final notifier = c.read(createExperienceProvider.notifier);
      notifier.setSeason('winter');
      // tripStyle + audience stay null.

      final payload = notifier.buildUpdatePayload();
      final facets = payload['facets'] as Map<String, dynamic>;
      expect(facets, <String, dynamic>{'season': 'winter'});
      expect(facets.containsKey('trip_style'), isFalse);
      expect(facets.containsKey('audience'), isFalse);
    });

    test('a fresh draft payload has an empty facets map (not null)', () {
      final c = makeContainer();
      addTearDown(c.dispose);

      final payload =
          c.read(createExperienceProvider.notifier).buildUpdatePayload();
      expect(payload['facets'], <String, dynamic>{});
    });
  });
}
