import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

import 'package:creatorhub/features/itineraries/widgets/itinerary_feed_card.dart';
import 'package:creatorhub/shared/theme/colors.dart';

Widget _wrap(Widget child) {
  final router = GoRouter(
    initialLocation: '/',
    routes: [
      GoRoute(
        path: '/',
        builder: (_, _) => Scaffold(body: child),
      ),
      GoRoute(
        path: '/itineraries/:id',
        builder: (_, _) => const Scaffold(body: Text('Itinerary detail')),
      ),
    ],
  );
  return MaterialApp.router(routerConfig: router);
}

void main() {
  group('ItineraryFeedCard', () {
    testWidgets('renders title', (tester) async {
      await tester.pumpWidget(_wrap(
        const ItineraryFeedCard(
          id: 'it1',
          title: 'Rajasthan Heritage Circuit',
          dayCount: 5,
          totalSpots: 12,
          pricingModel: 'free',
          pricePaisa: 0,
          creatorName: 'Arjun Patel',
        ),
      ));
      await tester.pump();

      expect(find.text('Rajasthan Heritage Circuit'), findsOneWidget);
    });

    testWidgets('renders creator name', (tester) async {
      await tester.pumpWidget(_wrap(
        const ItineraryFeedCard(
          id: 'it2',
          title: 'Goa Coastal Drive',
          dayCount: 3,
          totalSpots: 8,
          pricingModel: 'free',
          pricePaisa: 0,
          creatorName: 'Meera Nair',
        ),
      ));
      await tester.pump();

      expect(find.text('Meera Nair'), findsOneWidget);
    });

    testWidgets('shows ITINERARY badge', (tester) async {
      await tester.pumpWidget(_wrap(
        const ItineraryFeedCard(
          id: 'it3',
          title: 'Himachal Adventure',
          dayCount: 7,
          totalSpots: 15,
          pricingModel: 'free',
          pricePaisa: 0,
          creatorName: 'Creator',
        ),
      ));
      await tester.pump();

      expect(find.text('ITINERARY'), findsOneWidget);
    });

    testWidgets('shows singular "day" for dayCount == 1', (tester) async {
      await tester.pumpWidget(_wrap(
        const ItineraryFeedCard(
          id: 'it4',
          title: 'Quick Mumbai Tour',
          dayCount: 1,
          totalSpots: 4,
          pricingModel: 'free',
          pricePaisa: 0,
          creatorName: 'Creator',
        ),
      ));
      await tester.pump();

      expect(find.text('1 day'), findsOneWidget);
    });

    testWidgets('shows plural "days" for dayCount > 1', (tester) async {
      await tester.pumpWidget(_wrap(
        const ItineraryFeedCard(
          id: 'it5',
          title: 'Kerala Backwaters',
          dayCount: 4,
          totalSpots: 6,
          pricingModel: 'free',
          pricePaisa: 0,
          creatorName: 'Creator',
        ),
      ));
      await tester.pump();

      expect(find.text('4 days'), findsOneWidget);
    });

    testWidgets('shows FREE badge for free itineraries', (tester) async {
      await tester.pumpWidget(_wrap(
        const ItineraryFeedCard(
          id: 'it6',
          title: 'Free Route',
          dayCount: 2,
          totalSpots: 5,
          pricingModel: 'free',
          pricePaisa: 0,
          creatorName: 'Creator',
        ),
      ));
      await tester.pump();

      expect(find.text('FREE'), findsOneWidget);

      // Price badge container should use successSurface (green) background
      final hasGreenBadge = tester.widgetList<Container>(find.byType(Container)).any(
        (c) {
          final deco = c.decoration;
          if (deco is BoxDecoration) {
            return deco.color == AppColors.successSurface;
          }
          return false;
        },
      );
      expect(hasGreenBadge, isTrue);
    });

    testWidgets('shows formatted price for paid itineraries', (tester) async {
      await tester.pumpWidget(_wrap(
        const ItineraryFeedCard(
          id: 'it7',
          title: 'Premium Route',
          dayCount: 3,
          totalSpots: 8,
          pricingModel: 'paid',
          pricePaisa: 199900, // ₹1,999
          creatorName: 'Creator',
        ),
      ));
      await tester.pump();

      expect(find.text('₹1,999'), findsOneWidget);
    });

    testWidgets('shows spot count in stats', (tester) async {
      await tester.pumpWidget(_wrap(
        const ItineraryFeedCard(
          id: 'it8',
          title: 'Multi-spot Tour',
          dayCount: 2,
          totalSpots: 7,
          pricingModel: 'free',
          pricePaisa: 0,
          creatorName: 'Creator',
        ),
      ));
      await tester.pump();

      expect(find.text('7 spots'), findsOneWidget);
    });

    testWidgets('shows distance in stats when provided', (tester) async {
      await tester.pumpWidget(_wrap(
        const ItineraryFeedCard(
          id: 'it9',
          title: 'Long Drive',
          dayCount: 3,
          totalSpots: 5,
          totalDistanceKm: 250,
          pricingModel: 'free',
          pricePaisa: 0,
          creatorName: 'Creator',
        ),
      ));
      await tester.pump();

      // Stats text is "5 spots · 250 km"
      expect(find.textContaining('250 km'), findsOneWidget);
    });

    testWidgets('omits distance when not provided', (tester) async {
      await tester.pumpWidget(_wrap(
        const ItineraryFeedCard(
          id: 'it10',
          title: 'No Distance',
          dayCount: 2,
          totalSpots: 3,
          pricingModel: 'free',
          pricePaisa: 0,
          creatorName: 'Creator',
        ),
      ));
      await tester.pump();

      // Stats text should be just "3 spots" with no "km"
      expect(find.textContaining('km'), findsNothing);
      expect(find.text('3 spots'), findsOneWidget);
    });

    testWidgets('shows singular "spot" for totalSpots == 1', (tester) async {
      await tester.pumpWidget(_wrap(
        const ItineraryFeedCard(
          id: 'it11',
          title: 'Single Spot',
          dayCount: 1,
          totalSpots: 1,
          pricingModel: 'free',
          pricePaisa: 0,
          creatorName: 'Creator',
        ),
      ));
      await tester.pump();

      expect(find.text('1 spot'), findsOneWidget);
    });

    testWidgets('navigates to itinerary detail on tap', (tester) async {
      await tester.pumpWidget(_wrap(
        const ItineraryFeedCard(
          id: 'itin-xyz',
          title: 'Tappable Itinerary',
          dayCount: 2,
          totalSpots: 4,
          pricingModel: 'free',
          pricePaisa: 0,
          creatorName: 'Creator',
        ),
      ));
      await tester.pump();

      await tester.tap(find.byType(ItineraryFeedCard));
      await tester.pumpAndSettle();

      expect(find.text('Itinerary detail'), findsOneWidget);
    });
  });
}
