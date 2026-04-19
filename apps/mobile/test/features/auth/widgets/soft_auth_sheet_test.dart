import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import 'package:creatorhub/features/auth/providers/auth_provider.dart';
import 'package:creatorhub/features/auth/services/auth_service.dart';
import 'package:creatorhub/features/auth/widgets/soft_auth_sheet.dart';

/// AuthService backed by a Dio with a MockAdapter so no real network
/// calls are attempted in widget tests.
class _FakeAuthService extends AuthService {
  _FakeAuthService()
      : super(
          baseUrl: 'http://test.local',
          firebaseAuth: null,
        ) {
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

Widget _host(
  ProviderContainer container,
  SoftAuthTrigger trigger, {
  SoftAuthItem? item,
}) {
  final router = GoRouter(
    initialLocation: '/host',
    routes: [
      GoRoute(
        path: '/host',
        builder: (_, _) => _Host(trigger: trigger, item: item),
      ),
      GoRoute(
        path: '/auth',
        builder: (_, _) => const Scaffold(body: Center(child: Text('AUTH'))),
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

class _Host extends ConsumerWidget {
  final SoftAuthTrigger trigger;
  final SoftAuthItem? item;

  const _Host({required this.trigger, this.item});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      body: Center(
        child: Builder(
          builder: (ctx) => TextButton(
            onPressed: () =>
                showSoftAuthSheet(ctx, ref, trigger: trigger, item: item),
            child: const Text('TRIGGER'),
          ),
        ),
      ),
    );
  }
}

void main() {
  setUpAll(() {
    GoogleFonts.config.allowRuntimeFetching = false;
  });

  group('SoftAuthSheet — A7 (E0.4c T8)', () {
    testWidgets('save trigger shows "Save this postcard?" and all 4 CTAs',
        (tester) async {
      await _setPhoneSize(tester);
      final container = _buildContainer();
      addTearDown(container.dispose);

      await tester.pumpWidget(_host(container, SoftAuthTrigger.save));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 50));

      await tester.tap(find.text('TRIGGER'));
      await tester.pumpAndSettle();

      expect(find.text('Save this postcard?'), findsOneWidget);
      expect(find.text('Continue with phone'), findsOneWidget);
      expect(find.text('Continue with Google'), findsOneWidget);
      expect(find.text('Continue with Apple'), findsOneWidget);
      expect(find.text('Keep browsing as guest'), findsOneWidget);
      expect(
        find.textContaining('30 seconds.', findRichText: true),
        findsOneWidget,
      );
    });

    testWidgets('comment trigger shows "Join the conversation?"',
        (tester) async {
      await _setPhoneSize(tester);
      final container = _buildContainer();
      addTearDown(container.dispose);

      await tester.pumpWidget(_host(container, SoftAuthTrigger.comment));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 50));

      await tester.tap(find.text('TRIGGER'));
      await tester.pumpAndSettle();

      expect(find.text('Join the conversation?'), findsOneWidget);
    });

    testWidgets('item card renders title + subtitle', (tester) async {
      await _setPhoneSize(tester);
      final container = _buildContainer();
      addTearDown(container.dispose);

      await tester.pumpWidget(_host(
        container,
        SoftAuthTrigger.save,
        item: const SoftAuthItem(
          title: 'Abbi Falls at dawn',
          subtitle: 'from Coorg in 3 acts · Ananya',
        ),
      ));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 50));

      await tester.tap(find.text('TRIGGER'));
      await tester.pumpAndSettle();

      expect(find.text('Abbi Falls at dawn'), findsOneWidget);
      expect(find.text('from Coorg in 3 acts · Ananya'), findsOneWidget);
    });

    testWidgets('Keep browsing as guest dismisses sheet and returns false',
        (tester) async {
      await _setPhoneSize(tester);
      final container = _buildContainer();
      addTearDown(container.dispose);

      await tester.pumpWidget(_host(container, SoftAuthTrigger.like));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 50));

      await tester.tap(find.text('TRIGGER'));
      await tester.pumpAndSettle();

      expect(find.text('Like this postcard?'), findsOneWidget);

      await tester.tap(find.text('Keep browsing as guest'));
      await tester.pumpAndSettle();

      expect(find.text('Like this postcard?'), findsNothing);
    });
  });
}
