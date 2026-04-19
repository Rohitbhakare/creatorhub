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
import 'package:creatorhub/features/onboarding/screens/celebration_screen.dart';

/// Auth service backed by a Dio configured with a MockAdapter so no real
/// network calls (or secure storage reads) are attempted in widget tests.
class _FakeAuthService extends AuthService {
  _FakeAuthService()
      : super(
          baseUrl: 'http://test.local',
          firebaseAuth: null,
        ) {
    // Replace the real adapter with one that always errors out immediately.
    dio.httpClientAdapter = _ImmediateErrorAdapter();
    dio.interceptors.clear();
  }
}

class _ImmediateErrorAdapter implements HttpClientAdapter {
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
    initialLocation: '/onboarding/celebration',
    routes: [
      GoRoute(
        path: '/onboarding/celebration',
        builder: (_, _) => const CelebrationScreen(),
      ),
      GoRoute(
        path: '/home',
        builder: (_, _) => const Scaffold(body: Center(child: Text('HOME'))),
      ),
    ],
  );
  return UncontrolledProviderScope(
    container: container,
    child: MaterialApp.router(routerConfig: router),
  );
}

ProviderContainer _buildContainer() {
  return ProviderContainer(overrides: [
    authServiceProvider.overrideWithValue(_FakeAuthService()),
  ]);
}

void main() {
  setUpAll(() {
    // Prevent google_fonts from attempting network fetches in tests.
    GoogleFonts.config.allowRuntimeFetching = false;
  });

  group('CelebrationScreen — A6 (E0.4c T7)', () {
    testWidgets('renders chapter pill, welcome H1, and Open my feed CTA',
        (tester) async {
      await _setPhoneSize(tester);
      final container = _buildContainer();
      addTearDown(container.dispose);
      container.read(onboardingProvider.notifier).setFirstName('Aarav');

      await tester.pumpWidget(_wrap(container));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 50));

      expect(find.text('CHAPTER 1 · YOU'), findsOneWidget);
      expect(
        find.textContaining('Aarav', findRichText: true),
        findsWidgets,
      );
      expect(find.text("Today's read"), findsOneWidget);
      expect(find.text('Open my feed'), findsOneWidget);
    });

    testWidgets('falls back to "traveller" when no firstName set',
        (tester) async {
      await _setPhoneSize(tester);
      final container = _buildContainer();
      addTearDown(container.dispose);

      await tester.pumpWidget(_wrap(container));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 50));

      expect(
        find.textContaining('traveller', findRichText: true),
        findsWidgets,
      );
    });
  });
}
