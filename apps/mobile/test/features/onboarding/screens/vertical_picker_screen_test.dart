import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

import 'package:creatorhub/features/onboarding/screens/vertical_picker_screen.dart';

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
    initialLocation: '/onboarding/verticals',
    routes: [
      GoRoute(
        path: '/onboarding/verticals',
        builder: (_, _) => const VerticalPickerScreen(),
      ),
      GoRoute(
        path: '/onboarding/creators',
        builder: (_, _) =>
            const Scaffold(body: Center(child: Text('CREATORS'))),
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
  group('VerticalPickerScreen — A4 (E0.4c T5)', () {
    testWidgets('renders step eyebrow, display h2 and 8 categories',
        (tester) async {
      await _setPhoneSize(tester);
      await tester.pumpWidget(_wrap());
      await tester.pumpAndSettle();

      expect(find.text('STEP 3 OF 5'), findsOneWidget);
      expect(find.text('What pulls you in?'), findsOneWidget);
      expect(find.textContaining('Pick at least 3'), findsOneWidget);

      // Must match API VERTICALS whitelist (packages/shared/src/constants).
      for (final name in [
        'Travel',
        'Stories',
        'Food',
        'Fitness',
        'Education',
        'Photography',
        'Music',
        'Wellness',
      ]) {
        expect(find.text(name), findsOneWidget, reason: 'category $name');
      }
    });

    testWidgets('counter reflects selection count', (tester) async {
      await _setPhoneSize(tester);
      await tester.pumpWidget(_wrap());
      await tester.pumpAndSettle();

      expect(find.textContaining('0 of 8 selected'), findsOneWidget);

      await tester.tap(find.text('Travel'));
      await tester.pumpAndSettle();
      expect(find.textContaining('1 of 8 selected'), findsOneWidget);

      await tester.tap(find.text('Food'));
      await tester.pumpAndSettle();
      expect(find.textContaining('2 of 8 selected'), findsOneWidget);
    });
  });
}
