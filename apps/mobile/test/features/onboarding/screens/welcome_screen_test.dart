import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

import 'package:creatorhub/features/auth/providers/auth_provider.dart';
import 'package:creatorhub/features/onboarding/screens/welcome_screen.dart';
import 'package:creatorhub/shared/theme/colors.dart';

/// Stub notifier that skips the real `_checkAuthState` network call and
/// starts in `unauthenticated`. Preserves `enterGuestMode()` behavior.
class _TestAuthNotifier extends AuthNotifier {
  @override
  AuthState build() => const AuthState(status: AuthStatus.unauthenticated);
}

Future<void> _setPhoneSize(WidgetTester tester) async {
  tester.view.physicalSize = const Size(390 * 3.0, 844 * 3.0);
  tester.view.devicePixelRatio = 3.0;
  addTearDown(() {
    tester.view.resetPhysicalSize();
    tester.view.resetDevicePixelRatio();
  });
}

Widget _wrap({String? initialLocation, ProviderContainer? container}) {
  final router = GoRouter(
    initialLocation: initialLocation ?? '/',
    routes: [
      GoRoute(path: '/', builder: (_, _) => const WelcomeScreen()),
      GoRoute(
        path: '/auth',
        builder: (_, _) =>
            const Scaffold(body: Center(child: Text('AUTH_SCREEN'))),
      ),
    ],
  );
  return UncontrolledProviderScope(
    container: container ?? ProviderContainer(overrides: [
      authProvider.overrideWith(_TestAuthNotifier.new),
    ]),
    child: MaterialApp.router(routerConfig: router),
  );
}

void main() {
  group('WelcomeScreen — Pack A / S_Welcome (IAM-FR-001)', () {
    testWidgets('renders eyebrow, both headline lines, body, and footer',
        (tester) async {
      await _setPhoneSize(tester);
      await tester.pumpWidget(_wrap());
      await tester.pumpAndSettle();

      expect(find.text('CREATORHUB'), findsOneWidget);
      expect(
        find.textContaining('Every journey', findRichText: true),
        findsOneWidget,
      );
      expect(
        find.textContaining('is a chapter.', findRichText: true),
        findsOneWidget,
      );
      expect(
        find.textContaining('Follow Indian creators'),
        findsOneWidget,
      );
      expect(
        find.textContaining('By continuing you agree to Terms & Privacy.'),
        findsOneWidget,
      );
      expect(
        find.textContaining('हिंदी · मराठी · தமிழ் · বাংলা coming soon'),
        findsOneWidget,
      );
    });

    testWidgets('renders primary Get started + ghost I already have an account',
        (tester) async {
      await _setPhoneSize(tester);
      await tester.pumpWidget(_wrap());
      await tester.pumpAndSettle();

      expect(find.text('Get started'), findsOneWidget);
      expect(find.text('I already have an account'), findsOneWidget);
    });

    testWidgets('renders Browse as guest tertiary link (ONB-FR-001)',
        (tester) async {
      await _setPhoneSize(tester);
      await tester.pumpWidget(_wrap());
      await tester.pumpAndSettle();

      expect(find.text('Browse as guest'), findsOneWidget);
    });

    testWidgets('tap Browse as guest puts auth state into guest mode',
        (tester) async {
      await _setPhoneSize(tester);
      final container = ProviderContainer(overrides: [
        authProvider.overrideWith(_TestAuthNotifier.new),
      ]);
      addTearDown(container.dispose);

      await tester.pumpWidget(_wrap(container: container));
      await tester.pumpAndSettle();

      expect(container.read(authProvider).isGuest, isFalse);

      await tester.ensureVisible(find.text('Browse as guest'));
      await tester.tap(find.text('Browse as guest'));
      await tester.pumpAndSettle();

      expect(container.read(authProvider).isGuest, isTrue);
    });

    testWidgets('hero uses coral→coralDeep gradient (no Image widget)',
        (tester) async {
      await _setPhoneSize(tester);
      await tester.pumpWidget(_wrap());
      await tester.pumpAndSettle();

      expect(find.byType(Image), findsNothing);

      final containers = tester.widgetList<Container>(find.byType(Container));
      final hasCoralGradient = containers.any((c) {
        final deco = c.decoration;
        if (deco is! BoxDecoration) return false;
        final g = deco.gradient;
        if (g is! LinearGradient) return false;
        return g.colors.contains(AppColors.coral) &&
            g.colors.contains(AppColors.coralDeep);
      });
      expect(hasCoralGradient, isTrue,
          reason: 'Hero must render with the coral→coralDeep gradient');
    });

    testWidgets('tap Get started navigates to /auth', (tester) async {
      await _setPhoneSize(tester);
      await tester.pumpWidget(_wrap());
      await tester.pumpAndSettle();

      await tester.ensureVisible(find.text('Get started'));
      await tester.tap(find.text('Get started'));
      await tester.pumpAndSettle();

      expect(find.text('AUTH_SCREEN'), findsOneWidget);
    });

    testWidgets('tap I already have an account navigates to /auth',
        (tester) async {
      await _setPhoneSize(tester);
      await tester.pumpWidget(_wrap());
      await tester.pumpAndSettle();

      await tester.ensureVisible(find.text('I already have an account'));
      await tester.tap(find.text('I already have an account'));
      await tester.pumpAndSettle();

      expect(find.text('AUTH_SCREEN'), findsOneWidget);
    });
  });
}
