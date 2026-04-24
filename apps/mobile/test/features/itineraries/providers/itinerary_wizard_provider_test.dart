import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:creatorhub/features/content/providers/wizard_provider.dart';
import 'package:creatorhub/features/content/services/draft_auto_save_service.dart';

/// Facets are held on the shared `wizardProvider` (not the itinerary-only
/// `itineraryWizardProvider`, which tracks day-plan state). These tests
/// therefore target the shared wizard provider with an itinerary content
/// type, covering the PATCH body that `/api/v1/content/:id` receives.
void main() {
  group('Itinerary wizard facets', () {
    ProviderContainer makeContainer() => ProviderContainer();

    test('a fresh itinerary draft has null facets', () {
      final c = makeContainer();
      addTearDown(c.dispose);
      c.read(wizardProvider.notifier).initWizard(
            ContentType.selfPacedItinerary,
            'travel',
          );

      final s = c.read(wizardProvider);
      expect(s.contentType, ContentType.selfPacedItinerary);
      expect(s.season, isNull);
      expect(s.tripStyle, isNull);
      expect(s.audience, isNull);
    });

    test('setSeason("monsoon") updates state and marks dirty', () {
      final c = makeContainer();
      addTearDown(c.dispose);
      c.read(wizardProvider.notifier).initWizard(
            ContentType.selfPacedItinerary,
            'travel',
          );

      c.read(wizardProvider.notifier).setSeason('monsoon');
      final s = c.read(wizardProvider);

      expect(s.season, 'monsoon');
      expect(s.tripStyle, isNull);
      expect(s.audience, isNull);
      expect(s.isDirty, isTrue);
    });

    test('setSeason(null) clears a previously-set season', () {
      final c = makeContainer();
      addTearDown(c.dispose);
      c.read(wizardProvider.notifier).initWizard(
            ContentType.selfPacedItinerary,
            'travel',
          );

      c.read(wizardProvider.notifier).setSeason('monsoon');
      expect(c.read(wizardProvider).season, 'monsoon');

      c.read(wizardProvider.notifier).setSeason(null);
      expect(c.read(wizardProvider).season, isNull);
    });

    test(
        'buildFacetsPayload serializes the wizard facets with snake_case keys',
        () {
      final c = makeContainer();
      addTearDown(c.dispose);
      c.read(wizardProvider.notifier).initWizard(
            ContentType.selfPacedItinerary,
            'travel',
          );

      final notifier = c.read(wizardProvider.notifier);
      notifier.setSeason('monsoon');
      notifier.setTripStyle('adventure');
      notifier.setAudience('solo');

      final payload = buildFacetsPayload(c.read(wizardProvider));
      expect(payload, <String, dynamic>{
        'season': 'monsoon',
        'trip_style': 'adventure',
        'audience': 'solo',
      });
    });

    test(
        'buildFacetsPayload omits keys whose values are null (partial selection)',
        () {
      final c = makeContainer();
      addTearDown(c.dispose);
      c.read(wizardProvider.notifier).initWizard(
            ContentType.selfPacedItinerary,
            'travel',
          );

      c.read(wizardProvider.notifier).setSeason('winter');
      // Leave tripStyle and audience unset.

      final payload = buildFacetsPayload(c.read(wizardProvider));
      expect(payload, <String, dynamic>{'season': 'winter'});
      expect(payload.containsKey('trip_style'), isFalse);
      expect(payload.containsKey('audience'), isFalse);
    });
  });
}
