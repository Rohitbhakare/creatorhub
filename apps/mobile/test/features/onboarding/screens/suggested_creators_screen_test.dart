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
import 'package:creatorhub/features/onboarding/screens/suggested_creators_screen.dart';

/// AuthService that proxies all Dio traffic through a scripted adapter
/// so the widget never hits the real network.
class _FakeAuthService extends AuthService {
  _FakeAuthService(HttpClientAdapter adapter)
      : super(
          baseUrl: 'http://test.local',
          firebaseAuth: null,
        ) {
    dio.httpClientAdapter = adapter;
    dio.interceptors.clear();
  }
}

/// Returns a canned JSON body on `/onboarding/suggested-creators` (GET) and
/// a synthetic 200 on the follow/unfollow endpoints. Other routes error.
class _CreatorsAdapter implements HttpClientAdapter {
  final List<Map<String, dynamic>> creators;

  _CreatorsAdapter(this.creators);

  @override
  void close({bool force = false}) {}

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    final path = options.path;
    if (options.method == 'GET' &&
        path.contains('/onboarding/suggested-creators')) {
      final body = jsonEncode({'success': true, 'data': creators});
      return ResponseBody.fromString(
        body,
        200,
        headers: {
          'content-type': ['application/json; charset=utf-8'],
        },
      );
    }
    if (path.contains('/onboarding/follow')) {
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
      message: 'unexpected path: $path',
    );
  }
}

class _ErrorAdapter implements HttpClientAdapter {
  @override
  void close({bool force = false}) {}

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    throw DioException(
      requestOptions: options,
      type: DioExceptionType.connectionError,
      message: 'test',
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
    initialLocation: '/onboarding/creators',
    routes: [
      GoRoute(
        path: '/onboarding/creators',
        builder: (_, _) => const SuggestedCreatorsScreen(),
      ),
      GoRoute(
        path: '/onboarding/celebration',
        builder: (_, _) =>
            const Scaffold(body: Center(child: Text('CELEBRATION'))),
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

  group('SuggestedCreatorsScreen — A5 (E0.4c T6)', () {
    testWidgets('renders step eyebrow, display h2 and fetched creator list',
        (tester) async {
      await _setPhoneSize(tester);
      final container = _buildContainer(_CreatorsAdapter([
        {
          'id': 'c1',
          'display_name': 'Ananya Kapoor',
          'city': 'Coorg',
          'category': 'Stories',
          'followers_label': '24k',
        },
        {
          'id': 'c2',
          'display_name': 'Ravi Verma',
          'city': 'Jaipur',
          'category': 'Photography',
          'followers_label': '12k',
        },
        {
          'id': 'c3',
          'display_name': 'Meera Rao',
          'city': 'Mumbai',
          'category': 'Food',
          'followers_label': '80k',
        },
      ]));
      addTearDown(container.dispose);

      await tester.pumpWidget(_wrap(container));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 50));

      expect(find.text('STEP 4 OF 5'), findsOneWidget);
      expect(find.text('Follow 3 to begin.'), findsOneWidget);
      expect(find.text('Ananya Kapoor'), findsOneWidget);
      expect(find.text('Ravi Verma'), findsOneWidget);
      expect(find.text('Meera Rao'), findsOneWidget);
      expect(find.text('Follow 3 & continue'), findsOneWidget);
    });

    testWidgets('error state renders Retry CTA', (tester) async {
      await _setPhoneSize(tester);
      final container = _buildContainer(_ErrorAdapter());
      addTearDown(container.dispose);

      await tester.pumpWidget(_wrap(container));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 50));

      expect(find.text("Couldn't load creators"), findsOneWidget);
      expect(find.text('Retry'), findsOneWidget);
    });
  });
}
