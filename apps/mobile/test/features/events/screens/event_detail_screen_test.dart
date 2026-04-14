import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

import 'package:creatorhub/features/auth/providers/auth_provider.dart';
import 'package:creatorhub/features/events/providers/event_detail_provider.dart';
import 'package:creatorhub/features/events/screens/event_detail_screen.dart';

// ── Fake auth notifier ────────────────────────────────────────────

class _FakeAuthNotifier extends AuthNotifier {
  @override
  AuthState build() => const AuthState(status: AuthStatus.unauthenticated);
}

// ── Helpers ───────────────────────────────────────────────────────

EventDetail _makeEvent({
  String id = 'ev-1',
  String title = 'Mumbai Photography Walk',
  String description = 'Join us for an evening golden-hour walk.',
  DateTime? startAt,
  String? venueName,
  String? venueAddress,
  int attendeeCount = 0,
  int? capacity,
  bool isFree = true,
  List<String> whatToBring = const [],
  bool hasRsvpd = false,
}) {
  return EventDetail(
    id: id,
    title: title,
    description: description,
    vertical: 'travel',
    status: 'published',
    startAt: startAt,
    isFree: isFree,
    whatToBring: whatToBring,
    attendeeCount: attendeeCount,
    capacity: capacity,
    hasRsvpd: hasRsvpd,
    venueName: venueName,
    venueAddress: venueAddress,
    creator: const EventCreator(
      id: 'creator-1',
      displayName: 'Arjun Mehta',
      username: 'arjun',
    ),
  );
}

Widget _wrap(String eventId, EventDetail event) {
  final router = GoRouter(
    initialLocation: '/events/$eventId',
    routes: [
      GoRoute(
        path: '/events/:id',
        builder: (_, state) => EventDetailScreen(
          eventId: state.pathParameters['id']!,
        ),
      ),
    ],
  );

  return ProviderScope(
    overrides: [
      eventDetailProvider(eventId).overrideWith(
        (ref) async => event,
      ),
      authProvider.overrideWith(() => _FakeAuthNotifier()),
    ],
    child: MaterialApp.router(routerConfig: router),
  );
}

// ── Tests ─────────────────────────────────────────────────────────

void main() {
  group('EventDetailScreen', () {
    testWidgets('renders event title', (tester) async {
      final event = _makeEvent(title: 'Mumbai Photography Walk');
      await tester.pumpWidget(_wrap('ev-1', event));
      await tester.pump();

      expect(find.text('Mumbai Photography Walk'), findsOneWidget);
    });

    testWidgets('renders event description', (tester) async {
      final event = _makeEvent(description: 'A beautiful sunset walk.');
      await tester.pumpWidget(_wrap('ev-1', event));
      await tester.pump();

      expect(find.text('A beautiful sunset walk.'), findsOneWidget);
    });

    testWidgets('renders creator name', (tester) async {
      final event = _makeEvent();
      await tester.pumpWidget(_wrap('ev-1', event));
      await tester.pump();

      expect(find.text('Arjun Mehta'), findsOneWidget);
    });

    testWidgets('shows DateBlock when startAt is provided', (tester) async {
      final event = _makeEvent(startAt: DateTime(2026, 8, 15, 10, 0));
      await tester.pumpWidget(_wrap('ev-1', event));
      await tester.pump();

      expect(find.text('15 Aug 2026'), findsOneWidget);
    });

    testWidgets('omits DateBlock when startAt is null', (tester) async {
      final event = _makeEvent();
      await tester.pumpWidget(_wrap('ev-1', event));
      await tester.pump();

      expect(find.textContaining('2026'), findsNothing);
    });

    testWidgets('shows meeting point when venue provided', (tester) async {
      final event = _makeEvent(
        venueName: 'Gateway of India',
        venueAddress: 'Apollo Bandar, Mumbai',
      );
      await tester.pumpWidget(_wrap('ev-1', event));
      await tester.pump();

      expect(find.text('Meeting point'), findsOneWidget);
      expect(find.text('Gateway of India'), findsOneWidget);
    });

    testWidgets('omits meeting point when no venue', (tester) async {
      final event = _makeEvent();
      await tester.pumpWidget(_wrap('ev-1', event));
      await tester.pump();

      expect(find.text('Meeting point'), findsNothing);
    });

    testWidgets('shows "What to bring" section when list is non-empty',
        (tester) async {
      final event = _makeEvent(whatToBring: ['Water bottle', 'Sunscreen']);
      await tester.pumpWidget(_wrap('ev-1', event));
      await tester.pump();

      expect(find.text('What to bring'), findsOneWidget);
      expect(find.text('Water bottle'), findsOneWidget);
      expect(find.text('Sunscreen'), findsOneWidget);
    });

    testWidgets('omits "What to bring" when list is empty', (tester) async {
      final event = _makeEvent();
      await tester.pumpWidget(_wrap('ev-1', event));
      await tester.pump();

      expect(find.text('What to bring'), findsNothing);
    });

    testWidgets('shows error view on provider failure', (tester) async {
      const eventId = 'ev-bad';
      final router = GoRouter(
        initialLocation: '/events/$eventId',
        routes: [
          GoRoute(
            path: '/events/:id',
            builder: (_, state) => EventDetailScreen(
              eventId: state.pathParameters['id']!,
            ),
          ),
        ],
      );

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            eventDetailProvider(eventId).overrideWith(
              (ref) async => throw Exception('Network error'),
            ),
            authProvider.overrideWith(() => _FakeAuthNotifier()),
          ],
          child: MaterialApp.router(routerConfig: router),
        ),
      );

      // Pump until the async provider resolves to error state
      await tester.pumpAndSettle();

      expect(find.text('Failed to load event'), findsOneWidget);
    });
  });
}
