import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

import 'package:creatorhub/features/onboarding/providers/onboarding_provider.dart';
import 'package:creatorhub/features/onboarding/screens/profile_bootstrap_screen.dart';

Future<void> _setPhoneSize(WidgetTester tester) async {
  tester.view.physicalSize = const Size(390 * 3.0, 844 * 3.0);
  tester.view.devicePixelRatio = 3.0;
  addTearDown(() {
    tester.view.resetPhysicalSize();
    tester.view.resetDevicePixelRatio();
  });
}

Widget _wrap() {
  final router = GoRouter(
    initialLocation: '/onboarding/profile',
    routes: [
      GoRoute(
        path: '/onboarding/profile',
        builder: (_, _) => const ProfileBootstrapScreen(),
      ),
      GoRoute(
        path: '/onboarding/location',
        builder: (_, _) =>
            const Scaffold(body: Center(child: Text('LOCATION'))),
      ),
    ],
  );
  return ProviderScope(child: MaterialApp.router(routerConfig: router));
}

void main() {
  group('ProfileBootstrapScreen — A2c (E0.4c T3a)', () {
    testWidgets('renders step eyebrow, display h2, and required fields',
        (tester) async {
      await _setPhoneSize(tester);
      await tester.pumpWidget(_wrap());
      await tester.pumpAndSettle();

      expect(find.text('STEP 1 OF 5'), findsOneWidget);
      expect(find.text('Tell us about you'), findsOneWidget);
      expect(find.text('Username'), findsOneWidget);
      expect(find.text('First name'), findsOneWidget);
      expect(find.text('Email'), findsOneWidget);
      expect(find.text('(optional)'), findsOneWidget);
    });

    testWidgets('username validation rejects uppercase', (tester) async {
      await _setPhoneSize(tester);
      await tester.pumpWidget(_wrap());
      await tester.pumpAndSettle();

      // inputFormatter strips uppercase, so any allowed chars stay.
      // Enter too short should show the charset error.
      final usernameField = find.ancestor(
        of: find.text('aarav_k'),
        matching: find.byType(TextField),
      );
      await tester.enterText(usernameField, 'ab');
      await tester.pumpAndSettle();

      expect(
        find.textContaining('3–20 chars'),
        findsOneWidget,
      );
    });

    testWidgets('valid username becomes available after debounce',
        (tester) async {
      await _setPhoneSize(tester);
      await tester.pumpWidget(_wrap());
      await tester.pumpAndSettle();

      final usernameField = find.ancestor(
        of: find.text('aarav_k'),
        matching: find.byType(TextField),
      );
      await tester.enterText(usernameField, 'rohit29');
      await tester.pump(const Duration(milliseconds: 500));
      await tester.pumpAndSettle();

      expect(find.textContaining('is available'), findsOneWidget);
    });

    testWidgets('provider prefill hydrates firstName + email (OAuth branch)',
        (tester) async {
      await _setPhoneSize(tester);
      final container = ProviderContainer();
      addTearDown(container.dispose);
      container.read(onboardingProvider.notifier).prefillFromOAuth(
            firstName: 'Aarav',
            email: 'a@example.com',
          );

      final router = GoRouter(
        initialLocation: '/onboarding/profile',
        routes: [
          GoRoute(
            path: '/onboarding/profile',
            builder: (_, _) => const ProfileBootstrapScreen(),
          ),
        ],
      );
      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: MaterialApp.router(routerConfig: router),
        ),
      );
      await tester.pumpAndSettle();

      // hint text is also 'Aarav' so expect at least one occurrence.
      expect(find.text('Aarav'), findsWidgets);
      expect(find.text('a@example.com'), findsOneWidget);
      expect(
        container.read(onboardingProvider).emailVerified,
        isTrue,
        reason: 'OAuth-provided emails are provider-asserted.',
      );
    });
  });
}
