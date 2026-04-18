import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

import 'package:creatorhub/features/events/widgets/event_feed_card.dart';
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
        path: '/events/:id',
        builder: (_, _) => const Scaffold(body: Text('Event detail')),
      ),
    ],
  );
  return MaterialApp.router(routerConfig: router);
}

void main() {
  group('EventFeedCard', () {
    testWidgets('renders title', (tester) async {
      await tester.pumpWidget(_wrap(
        const EventFeedCard(
          id: 'ev1',
          title: 'Mumbai Sunset Photography Walk',
          attendeeCount: 12,
          pricePaisa: 0,
          creatorName: 'Priya Sharma',
        ),
      ));
      await tester.pump();

      expect(find.text('Mumbai Sunset Photography Walk'), findsOneWidget);
    });

    testWidgets('renders creator name', (tester) async {
      await tester.pumpWidget(_wrap(
        const EventFeedCard(
          id: 'ev2',
          title: 'Goa Beach Bonfire',
          attendeeCount: 5,
          pricePaisa: 0,
          creatorName: 'Ravi Kumar',
        ),
      ));
      await tester.pump();

      expect(find.text('Ravi Kumar'), findsOneWidget);
    });

    testWidgets('shows EVENT badge', (tester) async {
      await tester.pumpWidget(_wrap(
        const EventFeedCard(
          id: 'ev3',
          title: 'Yoga Workshop',
          attendeeCount: 20,
          pricePaisa: 0,
          creatorName: 'Creator',
        ),
      ));
      await tester.pump();

      expect(find.text('EVENT'), findsOneWidget);
    });

    testWidgets('shows "X going / Y max" when capacity provided', (tester) async {
      await tester.pumpWidget(_wrap(
        const EventFeedCard(
          id: 'ev4',
          title: 'Cooking Class',
          attendeeCount: 8,
          capacity: 20,
          pricePaisa: 0,
          creatorName: 'Creator',
        ),
      ));
      await tester.pump();

      expect(find.text('8 going / 20 max'), findsOneWidget);
    });

    testWidgets('shows "X going" when no capacity', (tester) async {
      await tester.pumpWidget(_wrap(
        const EventFeedCard(
          id: 'ev5',
          title: 'Open Meetup',
          attendeeCount: 42,
          pricePaisa: 0,
          creatorName: 'Creator',
        ),
      ));
      await tester.pump();

      expect(find.text('42 going'), findsOneWidget);
    });

    testWidgets('shows "Be the first to RSVP" when 0 attendees and no capacity',
        (tester) async {
      await tester.pumpWidget(_wrap(
        const EventFeedCard(
          id: 'ev6',
          title: 'New Event',
          attendeeCount: 0,
          pricePaisa: 0,
          creatorName: 'Creator',
        ),
      ));
      await tester.pump();

      expect(find.text('Be the first to RSVP'), findsOneWidget);
    });

    testWidgets('shows FREE badge for free events', (tester) async {
      await tester.pumpWidget(_wrap(
        const EventFeedCard(
          id: 'ev7',
          title: 'Free Hike',
          attendeeCount: 3,
          pricePaisa: 0,
          creatorName: 'Creator',
        ),
      ));
      await tester.pump();

      expect(find.text('FREE'), findsOneWidget);

      // Badge container uses successSurface background
      final hasGreenBadge = tester
          .widgetList<Container>(find.byType(Container))
          .any((c) {
        final deco = c.decoration;
        if (deco is BoxDecoration) {
          return deco.color == AppColors.successSurface;
        }
        return false;
      });
      expect(hasGreenBadge, isTrue);
    });

    testWidgets('shows formatted price for paid events', (tester) async {
      await tester.pumpWidget(_wrap(
        const EventFeedCard(
          id: 'ev8',
          title: 'Paid Workshop',
          attendeeCount: 5,
          pricePaisa: 99900, // ₹999
          creatorName: 'Creator',
        ),
      ));
      await tester.pump();

      expect(find.text('₹999'), findsOneWidget);
    });

    testWidgets('shows date badge when startAt provided', (tester) async {
      final date = DateTime(2026, 6, 15, 10, 0);
      await tester.pumpWidget(_wrap(
        EventFeedCard(
          id: 'ev9',
          title: 'Dated Event',
          attendeeCount: 0,
          pricePaisa: 0,
          creatorName: 'Creator',
          startAt: date,
        ),
      ));
      await tester.pump();

      expect(find.text('15 Jun'), findsOneWidget);
    });

    testWidgets('omits date badge when startAt is null', (tester) async {
      await tester.pumpWidget(_wrap(
        const EventFeedCard(
          id: 'ev10',
          title: 'No Date Event',
          attendeeCount: 0,
          pricePaisa: 0,
          creatorName: 'Creator',
        ),
      ));
      await tester.pump();

      // No date badge — should not find a text like "Jun" or "Jan" etc.
      expect(
        find.byWidgetPredicate((w) =>
            w is Container &&
            w.decoration is BoxDecoration &&
            (w.decoration as BoxDecoration).color ==
                AppColors.surface.withValues(alpha: 0.9)),
        findsNothing,
      );
    });

    testWidgets('navigates to event detail on tap', (tester) async {
      await tester.pumpWidget(_wrap(
        const EventFeedCard(
          id: 'event-xyz',
          title: 'Tappable Event',
          attendeeCount: 0,
          pricePaisa: 0,
          creatorName: 'Creator',
        ),
      ));
      await tester.pump();

      await tester.tap(find.byType(EventFeedCard));
      await tester.pumpAndSettle();

      expect(find.text('Event detail'), findsOneWidget);
    });
  });
}
