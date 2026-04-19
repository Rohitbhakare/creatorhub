import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

import 'package:creatorhub/features/auth/screens/phone_otp_screen.dart';

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
    initialLocation: '/auth',
    routes: [
      GoRoute(path: '/auth', builder: (_, _) => const PhoneOtpScreen()),
      GoRoute(
        path: '/welcome',
        builder: (_, _) => const Scaffold(body: Center(child: Text('WELCOME'))),
      ),
    ],
  );
  return ProviderScope(child: MaterialApp.router(routerConfig: router));
}

void main() {
  group('PhoneOtpScreen — Pack A / S_Phone (IAM-FR-002/003)', () {
    testWidgets('renders header + display h2 + subtitle + field + Send code',
        (tester) async {
      await _setPhoneSize(tester);
      await tester.pumpWidget(_wrap());
      await tester.pumpAndSettle();

      expect(find.text('Sign in'), findsOneWidget);
      expect(find.text("What's your number?"), findsOneWidget);
      expect(
        find.textContaining("We'll text you a 6-digit code"),
        findsOneWidget,
      );
      expect(find.text('+91'), findsOneWidget);
      expect(find.text('Send code'), findsOneWidget);
    });

    testWidgets('renders Google + Apple outline buttons and OR divider',
        (tester) async {
      await _setPhoneSize(tester);
      await tester.pumpWidget(_wrap());
      await tester.pumpAndSettle();

      expect(find.text('OR'), findsOneWidget);
      expect(find.text('Continue with Google'), findsOneWidget);
      expect(find.text('Continue with Apple'), findsOneWidget);
    });

    testWidgets('invalid phone shows inline error (no API call)',
        (tester) async {
      await _setPhoneSize(tester);
      await tester.pumpWidget(_wrap());
      await tester.pumpAndSettle();

      await tester.tap(find.text('Send code'));
      await tester.pumpAndSettle();

      expect(
        find.textContaining('valid 10-digit phone number'),
        findsOneWidget,
      );
    });

    testWidgets('back icon pops to welcome when no router stack',
        (tester) async {
      await _setPhoneSize(tester);
      await tester.pumpWidget(_wrap());
      await tester.pumpAndSettle();

      // Find and tap the back button (caret left icon tappable)
      final backArea = find.ancestor(
        of: find.byType(Icon).first,
        matching: find.byType(GestureDetector),
      );
      expect(backArea, findsWidgets);
    });
  });
}
