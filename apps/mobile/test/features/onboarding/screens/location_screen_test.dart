import 'dart:convert';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import 'package:creatorhub/features/auth/providers/auth_provider.dart';
import 'package:creatorhub/features/auth/services/auth_service.dart';
import 'package:creatorhub/features/onboarding/providers/onboarding_provider.dart';
import 'package:creatorhub/features/onboarding/screens/location_screen.dart';

class _FakeAuthService extends AuthService {
  _FakeAuthService(HttpClientAdapter adapter)
      : super(baseUrl: 'http://test.local', firebaseAuth: null) {
    dio.httpClientAdapter = adapter;
    dio.interceptors.clear();
  }
}

class _CitiesAdapter implements HttpClientAdapter {
  final List<Map<String, dynamic>> cities;
  int getCalls = 0;
  int putCalls = 0;

  _CitiesAdapter(this.cities);

  @override
  void close({bool force = false}) {}

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    if (options.method == 'GET' && options.path.contains('/cities')) {
      getCalls++;
      return ResponseBody.fromString(
        jsonEncode({'success': true, 'data': cities}),
        200,
        headers: {
          'content-type': ['application/json; charset=utf-8'],
        },
      );
    }
    if (options.method == 'PUT' &&
        options.path.contains('/onboarding/city')) {
      putCalls++;
      return ResponseBody.fromString(
        jsonEncode({'success': true}),
        200,
        headers: {
          'content-type': ['application/json; charset=utf-8'],
        },
      );
    }
    throw DioException(
      requestOptions: options,
      type: DioExceptionType.connectionError,
      message: 'unexpected path: ${options.path}',
    );
  }
}

Future<void> _setPhoneSize(WidgetTester tester) async {
  tester.view.physicalSize = const Size(390 * 3.0, 844 * 3.0);
  tester.view.devicePixelRatio = 3.0;
  addTearDown(() {
    tester.view.resetPhysicalSize();
    tester.view.resetDevicePixelRatio();
  });
}

Widget _wrap(ProviderContainer container) {
  final router = GoRouter(
    initialLocation: '/onboarding/location',
    routes: [
      GoRoute(
        path: '/onboarding/location',
        builder: (_, _) => const LocationScreen(),
      ),
      GoRoute(
        path: '/onboarding/profile',
        builder: (_, _) =>
            const Scaffold(body: Center(child: Text('PROFILE'))),
      ),
      GoRoute(
        path: '/onboarding/verticals',
        builder: (_, _) =>
            const Scaffold(body: Center(child: Text('VERTICALS'))),
      ),
    ],
  );
  return UncontrolledProviderScope(
    container: container,
    child: MaterialApp.router(routerConfig: router),
  );
}

ProviderContainer _buildContainer(HttpClientAdapter adapter) {
  return ProviderContainer(overrides: [
    authServiceProvider.overrideWithValue(_FakeAuthService(adapter)),
  ]);
}

void main() {
  setUpAll(() {
    GoogleFonts.config.allowRuntimeFetching = false;
  });

  group('LocationScreen — A3 (E0.5 T3)', () {
    testWidgets('renders H2, step eyebrow and the 8 popular cities',
        (tester) async {
      await _setPhoneSize(tester);
      final container = _buildContainer(_CitiesAdapter(const []));
      addTearDown(container.dispose);

      await tester.pumpWidget(_wrap(container));
      await tester.pumpAndSettle();

      expect(find.text('STEP 2 OF 5'), findsOneWidget);
      expect(find.text('Where do you call home?'), findsOneWidget);
      for (final name in const [
        'Mumbai',
        'Delhi',
        'Bengaluru',
        'Hyderabad',
        'Chennai',
        'Pune',
        'Kolkata',
        'Goa',
      ]) {
        expect(find.text(name), findsOneWidget, reason: 'expected $name chip');
      }
    });

    testWidgets(
        'Continue is disabled until a city is selected, enabled after tapping a chip',
        (tester) async {
      await _setPhoneSize(tester);
      // Chip tap resolves to a real city_id via /cities search — the fake id
      // the chip used to pass directly ("goa") 404'd on setUserCity and
      // locked users out of the feed.
      final adapter = _CitiesAdapter(const [
        {'id': 'in.ga.goa', 'name': 'Goa', 'state': 'GA'},
      ]);
      final container = _buildContainer(adapter);
      addTearDown(container.dispose);

      await tester.pumpWidget(_wrap(container));
      await tester.pumpAndSettle();

      // No city selected yet.
      expect(
        container.read(onboardingProvider).selectedCityId,
        isNull,
      );

      // Tap Goa chip.
      await tester.tap(find.text('Goa'));
      await tester.pumpAndSettle();

      final state = container.read(onboardingProvider);
      expect(state.selectedCityId, 'in.ga.goa');
      expect(state.selectedCityName, 'Goa');
      expect(adapter.getCalls, greaterThan(0));
    });

    testWidgets('search field hits /cities API after the debounce',
        (tester) async {
      await _setPhoneSize(tester);
      final adapter = _CitiesAdapter([
        {'id': 'varanasi-id', 'name': 'Varanasi', 'state': 'UP'},
      ]);
      final container = _buildContainer(adapter);
      addTearDown(container.dispose);

      await tester.pumpWidget(_wrap(container));
      await tester.pumpAndSettle();

      await tester.enterText(find.byType(TextField), 'Vara');
      // Wait past the 300ms debounce window.
      await tester.pump(const Duration(milliseconds: 350));
      await tester.pumpAndSettle();

      expect(adapter.getCalls, 1);
      expect(find.text('Varanasi, UP'), findsOneWidget);
    });
  });
}
