import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

import 'package:creatorhub/features/itineraries/providers/itinerary_detail_provider.dart';
import 'package:creatorhub/features/itineraries/providers/itinerary_wizard_provider.dart';
import 'package:creatorhub/features/itineraries/screens/itinerary_detail_screen.dart';

// ── Helpers ───────────────────────────────────────────────────────

ItineraryDetail _makeItinerary({
  String id = 'itin-1',
  String title = 'Kerala Backwaters',
  String description = 'A serene journey through Kerala.',
  int dayCount = 3,
  List<DayState> days = const [],
  String pricingModel = 'free',
  int pricePaisa = 0,
  String? startingCityName,
}) {
  return ItineraryDetail(
    id: id,
    title: title,
    description: description,
    vertical: 'travel',
    pricingModel: pricingModel,
    pricePaisa: pricePaisa,
    dayCount: dayCount,
    days: days,
    mediaUrls: const [],
    creator: const ItineraryCreator(
      id: 'creator-1',
      displayName: 'Anjali Sharma',
    ),
    startingCityName: startingCityName,
  );
}

Widget _wrap(String itineraryId, ItineraryDetail detail) {
  final router = GoRouter(
    initialLocation: '/itineraries/$itineraryId',
    routes: [
      GoRoute(
        path: '/itineraries/:id',
        builder: (_, state) => ItineraryDetailScreen(
          itineraryId: state.pathParameters['id']!,
        ),
      ),
    ],
  );

  return ProviderScope(
    overrides: [
      itineraryDetailProvider(itineraryId).overrideWith(
        (ref) async => detail,
      ),
    ],
    child: MaterialApp.router(routerConfig: router),
  );
}

// ── Tests ─────────────────────────────────────────────────────────

void main() {
  group('ItineraryDetailScreen', () {
    testWidgets('renders itinerary title', (tester) async {
      final detail = _makeItinerary(title: 'Kerala Backwaters');
      await tester.pumpWidget(_wrap('itin-1', detail));
      await tester.pump();

      expect(find.text('Kerala Backwaters'), findsOneWidget);
    });

    testWidgets('renders description', (tester) async {
      final detail = _makeItinerary(description: 'A serene journey through Kerala.');
      await tester.pumpWidget(_wrap('itin-1', detail));
      await tester.pump();

      expect(find.text('A serene journey through Kerala.'), findsOneWidget);
    });

    testWidgets('renders creator display name', (tester) async {
      final detail = _makeItinerary();
      await tester.pumpWidget(_wrap('itin-1', detail));
      await tester.pump();

      expect(find.text('Anjali Sharma'), findsOneWidget);
    });

    testWidgets('shows Follow button in creator header', (tester) async {
      final detail = _makeItinerary();
      await tester.pumpWidget(_wrap('itin-1', detail));
      await tester.pump();

      expect(find.text('Follow'), findsOneWidget);
    });

    testWidgets('renders day count stat chip', (tester) async {
      final detail = _makeItinerary(dayCount: 3);
      await tester.pumpWidget(_wrap('itin-1', detail));
      await tester.pump();

      expect(find.text('3 days'), findsOneWidget);
    });

    testWidgets('renders singular "day" when dayCount is 1', (tester) async {
      final detail = _makeItinerary(dayCount: 1);
      await tester.pumpWidget(_wrap('itin-1', detail));
      await tester.pump();

      expect(find.text('1 day'), findsOneWidget);
    });

    testWidgets('shows FREE price badge for free itinerary', (tester) async {
      final detail = _makeItinerary(pricingModel: 'free', pricePaisa: 0);
      await tester.pumpWidget(_wrap('itin-1', detail));
      await tester.pump();

      expect(find.text('FREE'), findsOneWidget);
    });

    testWidgets('renders day tabs when days are provided', (tester) async {
      final days = [
        const DayState(dayNumber: 1, title: 'Day 1', spots: []),
        const DayState(dayNumber: 2, title: 'Day 2', spots: []),
      ];
      final detail = _makeItinerary(dayCount: 2, days: days);
      await tester.pumpWidget(_wrap('itin-1', detail));
      await tester.pump();

      expect(find.text('Day 1'), findsOneWidget);
      expect(find.text('Day 2'), findsOneWidget);
    });

    testWidgets('shows empty-day message when selected day has no spots',
        (tester) async {
      final days = [
        const DayState(dayNumber: 1, title: 'Day 1', spots: []),
      ];
      final detail = _makeItinerary(dayCount: 1, days: days);
      await tester.pumpWidget(_wrap('itin-1', detail));
      await tester.pump();

      expect(find.text('No spots for this day', skipOffstage: false), findsOneWidget);
    });

    testWidgets('shows error view on provider failure', (tester) async {
      const itineraryId = 'itin-bad';
      final router = GoRouter(
        initialLocation: '/itineraries/$itineraryId',
        routes: [
          GoRoute(
            path: '/itineraries/:id',
            builder: (_, state) => ItineraryDetailScreen(
              itineraryId: state.pathParameters['id']!,
            ),
          ),
        ],
      );

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            itineraryDetailProvider(itineraryId).overrideWith(
              (ref) async => throw Exception('Network error'),
            ),
          ],
          child: MaterialApp.router(routerConfig: router),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Failed to load itinerary'), findsOneWidget);
      expect(find.text('Retry'), findsOneWidget);
    });
  });
}
