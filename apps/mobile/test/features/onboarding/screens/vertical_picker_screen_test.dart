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
  group('VerticalPickerScreen — Travel-only launch (v1.3)', () {
    testWidgets('renders step eyebrow, display h2 and 4 travel sub-categories',
        (tester) async {
      await _setPhoneSize(tester);
      await tester.pumpWidget(_wrap());
      await tester.pumpAndSettle();

      expect(find.text('STEP 3 OF 5'), findsOneWidget);
      expect(find.text("Pick the trips you'd like to see"), findsOneWidget);
      expect(find.textContaining('Choose at least 2'), findsOneWidget);

      // 4 active travel sub-categories per SRS v1.3 ONB-FR-008 (R).
      for (final name in ['Road Trips', 'Biking', 'Trekking', 'Food Trails']) {
        expect(find.text(name), findsOneWidget, reason: 'category $name');
      }
    });

    testWidgets('counter reflects selection count', (tester) async {
      await _setPhoneSize(tester);
      await tester.pumpWidget(_wrap());
      await tester.pumpAndSettle();

      expect(find.textContaining('0 of 4 selected'), findsOneWidget);

      await tester.tap(find.text('Road Trips'));
      await tester.pumpAndSettle();
      expect(find.textContaining('1 of 4 selected'), findsOneWidget);

      await tester.tap(find.text('Trekking'));
      await tester.pumpAndSettle();
      expect(find.textContaining('2 of 4 selected'), findsOneWidget);
    });
  });
}
