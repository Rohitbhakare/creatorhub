import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:creatorhub/features/feed/screens/home_feed_screen.dart';
import 'package:creatorhub/features/feed/models/feed_models.dart';
import 'package:creatorhub/features/feed/providers/near_you_provider.dart';
import 'package:creatorhub/features/feed/providers/vertical_section_provider.dart';
import 'package:creatorhub/features/feed/providers/discover_provider.dart';
import 'package:creatorhub/features/feed/providers/for_you_provider.dart';
import 'package:creatorhub/features/feed/providers/following_provider.dart';
import 'package:creatorhub/features/feed/providers/hero_provider.dart';
import 'package:creatorhub/features/feed/providers/user_city_provider.dart';
import 'package:creatorhub/features/auth/providers/auth_provider.dart';

class _FakeUserCityNotifier extends UserCityNotifier {
  final UserCityState _state;
  _FakeUserCityNotifier(this._state);

  @override
  UserCityState build() => _state;
}

class _FakeAuthNotifier extends AuthNotifier {
  @override
  AuthState build() => const AuthState(
        status: AuthStatus.authenticated,
        user: {'id': 'u1'},
      );
}

FeedContentItem _item({String id = 'c1', String title = 'Spiti trip', String type = 'post'}) =>
    FeedContentItem(
      id: id,
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
  FeedContentItem? heroForYou,
  FeedContentItem? heroFollowing,
  FeedContentItem? heroNearYou,
  List<FeedContentItem> forYou = const [],
  List<FeedContentItem> following = const [],
  NearYouResult nearYou = _emptyNearYou,
  List<FeedContentItem> travel = const [],
  List<FeedContentItem> stories = const [],
  List<DiscoverCreator> discover = const [],
  UserCityState city = const UserCityState(cityId: 'in.mh.pune', cityName: 'Pune'),
}) {
  return ProviderScope(
    overrides: [
      authProvider.overrideWith(_FakeAuthNotifier.new),
      userCityProvider.overrideWith(() => _FakeUserCityNotifier(city)),
      heroProvider('for_you').overrideWith((ref) async => heroForYou),
      heroProvider('following').overrideWith((ref) async => heroFollowing),
      heroProvider('near_you').overrideWith((ref) async => heroNearYou),
      forYouProvider.overrideWith((ref) async => forYou),
      followingProvider.overrideWith((ref) async => following),
      nearYouProvider.overrideWith((ref) async => nearYou),
      verticalSectionProvider('travel').overrideWith((ref) async => travel),
      verticalSectionProvider('stories').overrideWith((ref) async => stories),
      discoverProvider.overrideWith((ref) async => discover),
    ],
    child: const MaterialApp(home: HomeFeedScreen()),
  );
}

void main() {
  group('HomeFeedScreen', () {
    testWidgets('renders location chip with city name', (tester) async {
      await tester.pumpWidget(_wrap());
      await tester.pump();
      expect(find.text('Pune'), findsOneWidget);
    });

    testWidgets('renders fallback label when no city set', (tester) async {
      await tester.pumpWidget(_wrap(city: const UserCityState(cityName: null)));
      await tester.pump();
      expect(find.text('Set location'), findsOneWidget);
    });

    testWidgets('renders segmented tabs — For you, Following, Near you', (tester) async {
      await tester.pumpWidget(_wrap());
      await tester.pumpAndSettle();
      expect(find.text('For you'), findsOneWidget);
      expect(find.text('Following'), findsOneWidget);
      expect(find.text('Near you'), findsOneWidget);
    });

    testWidgets('renders hero when forYou tab has a hero item', (tester) async {
      await tester.pumpWidget(_wrap(heroForYou: _item(title: 'Big trip')));
      await tester.pumpAndSettle();
      expect(find.text('Big trip'), findsOneWidget);
    });

    testWidgets('hides hero when for-you hero is null', (tester) async {
      await tester.pumpWidget(_wrap());
      await tester.pumpAndSettle();
      expect(find.text('Featured for you'), findsNothing);
    });

    testWidgets('renders travel section title under For-you when items present', (tester) async {
      await tester.pumpWidget(_wrap(travel: [_item()]));
      await tester.pumpAndSettle();
      expect(find.text('Trips worth your weekend', skipOffstage: false), findsOneWidget);
    });

    testWidgets('shows empty state on Following tab when follows list is empty', (tester) async {
      await tester.pumpWidget(_wrap());
      await tester.pumpAndSettle();
      await tester.tap(find.text('Following'));
      await tester.pumpAndSettle();
      expect(find.text('Your follows live here'), findsOneWidget);
    });

    testWidgets('shows follows content on Following tab when items present', (tester) async {
      await tester.pumpWidget(_wrap(following: [_item(title: 'From creator Riya')]));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Following'));
      await tester.pumpAndSettle();
      expect(find.text('From creator Riya'), findsOneWidget);
    });

    testWidgets('shows near-you section label on Near you tab when items present', (tester) async {
      final result = NearYouResult(
        items: [_item()],
        fallbackLevel: 0,
        label: 'Weekend trips from Pune',
        fallbackCities: const [],
      );
      await tester.pumpWidget(_wrap(nearYou: result));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Near you'));
      await tester.pumpAndSettle();
      expect(find.text('Weekend trips from Pune', skipOffstage: false), findsOneWidget);
    });

    testWidgets('renders discover section on For-you tab when creators present', (tester) async {
      const creator = DiscoverCreator(
        id: 'u2',
        displayName: 'Aditya',
        username: 'aditya',
        vertical: 'stories',
      );
      await tester.pumpWidget(_wrap(discover: [creator]));
      await tester.pumpAndSettle();
      expect(find.text('Creators we like this month', skipOffstage: false), findsOneWidget);
    });
  });
}
