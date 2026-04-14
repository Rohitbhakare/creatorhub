import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:creatorhub/features/feed/screens/home_feed_screen.dart';
import 'package:creatorhub/features/feed/models/feed_models.dart';
import 'package:creatorhub/features/feed/providers/near_you_provider.dart';
import 'package:creatorhub/features/feed/providers/vertical_section_provider.dart';
import 'package:creatorhub/features/feed/providers/discover_provider.dart';
import 'package:creatorhub/features/feed/providers/user_city_provider.dart';

// ── Fake notifiers ─────────────────────────────────────────────

class _FakeUserCityNotifier extends UserCityNotifier {
  final UserCityState _state;
  _FakeUserCityNotifier(this._state);

  @override
  UserCityState build() => _state;
}

// ── Helpers ────────────────────────────────────────────────────

FeedContentItem _item({String title = 'Spiti trip', String type = 'post'}) =>
    FeedContentItem(
      id: 'c1',
      type: type,
      title: title,
      vertical: 'travel',
      pricingModel: 'free',
      pricePaisa: 0,
      likeCount: 3,
    );

const _emptyNearYou = NearYouResult(
  items: [],
  fallbackLevel: 0,
  label: 'Near you',
  fallbackCities: [],
);

Widget _wrap({
  NearYouResult nearYou = _emptyNearYou,
  List<FeedContentItem> travel = const [],
  List<FeedContentItem> stories = const [],
  List<DiscoverCreator> discover = const [],
  UserCityState city = const UserCityState(cityId: 'in.mh.pune', cityName: 'Pune'),
}) {
  return ProviderScope(
    overrides: [
      nearYouProvider.overrideWith((ref) async => nearYou),
      verticalSectionProvider('travel').overrideWith((ref) async => travel),
      verticalSectionProvider('stories').overrideWith((ref) async => stories),
      discoverProvider.overrideWith((ref) async => discover),
      userCityProvider.overrideWith(() => _FakeUserCityNotifier(city)),
    ],
    child: const MaterialApp(home: HomeFeedScreen()),
  );
}

// ── Tests ──────────────────────────────────────────────────────

void main() {
  group('HomeFeedScreen', () {
    testWidgets('renders location chip with city name', (tester) async {
      await tester.pumpWidget(_wrap());
      await tester.pump();

      expect(find.text('Pune'), findsOneWidget);
    });

    testWidgets('renders location chip with fallback label when no city', (tester) async {
      await tester.pumpWidget(
        _wrap(city: const UserCityState(cityName: null)),
      );
      await tester.pump();

      expect(find.text('Set location'), findsOneWidget);
    });

    testWidgets('renders vertical filter chips — All, Travel, Stories', (tester) async {
      await tester.pumpWidget(_wrap());
      await tester.pump();

      expect(find.text('All'), findsOneWidget);
      expect(find.text('Travel'), findsOneWidget);
      expect(find.text('Stories'), findsOneWidget);
    });

    testWidgets('shows near-you section label when items present', (tester) async {
      final result = NearYouResult(
        items: [_item()],
        fallbackLevel: 0,
        label: 'Weekend trips from Pune',
        fallbackCities: const [],
      );
      await tester.pumpWidget(_wrap(nearYou: result));
      await tester.pumpAndSettle();

      expect(find.text('Weekend trips from Pune', skipOffstage: false), findsOneWidget);
    });

    testWidgets('hides near-you section when items is empty', (tester) async {
      await tester.pumpWidget(_wrap());
      await tester.pumpAndSettle();

      // Section label should not appear when items = []
      expect(find.text('Weekend trips from Pune'), findsNothing);
      expect(find.text('NEAR YOU · THIS WEEKEND'), findsNothing);
    });

    testWidgets('shows fallback banner when fallback_level > 0', (tester) async {
      final result = NearYouResult(
        items: [_item()],
        fallbackLevel: 1,
        label: 'Trips around you',
        fallbackCities: const ['Nashik'],
      );
      await tester.pumpWidget(_wrap(nearYou: result));
      await tester.pumpAndSettle();

      expect(
        find.textContaining('Nothing nearby yet', skipOffstage: false),
        findsOneWidget,
      );
      expect(find.textContaining('Nashik', skipOffstage: false), findsOneWidget);
    });

    testWidgets('does not show fallback banner when fallback_level is 0', (tester) async {
      final result = NearYouResult(
        items: [_item()],
        fallbackLevel: 0,
        label: 'Weekend trips from Pune',
        fallbackCities: const [],
      );
      await tester.pumpWidget(_wrap(nearYou: result));
      await tester.pumpAndSettle();

      expect(find.textContaining('Nothing nearby yet'), findsNothing);
    });

    testWidgets('renders travel section title when items present', (tester) async {
      await tester.pumpWidget(_wrap(travel: [_item()]));
      await tester.pumpAndSettle();

      expect(find.text('Trips worth your weekend', skipOffstage: false), findsOneWidget);
    });

    testWidgets('hides travel section when items is empty', (tester) async {
      await tester.pumpWidget(_wrap());
      await tester.pumpAndSettle();

      expect(find.text('Trips worth your weekend'), findsNothing);
    });

    testWidgets('renders stories section title when items present', (tester) async {
      await tester.pumpWidget(_wrap(stories: [_item()]));
      await tester.pumpAndSettle();

      expect(find.text('From the people who go', skipOffstage: false), findsOneWidget);
    });

    testWidgets('renders discover section when creators present', (tester) async {
      const creator = DiscoverCreator(
        id: 'u2',
        displayName: 'Aditya',
        username: 'aditya',
        vertical: 'stories',
      );
      await tester.pumpWidget(_wrap(discover: [creator]));
      await tester.pumpAndSettle();

      expect(find.text('Creators we like this month', skipOffstage: false), findsOneWidget);
      expect(find.text('Aditya', skipOffstage: false), findsOneWidget);
    });

    testWidgets('shows honesty footer note', (tester) async {
      await tester.pumpWidget(_wrap());
      await tester.pumpAndSettle();

      expect(
        find.textContaining('Hand-picked by our team', skipOffstage: false),
        findsOneWidget,
      );
    });
  });
}
