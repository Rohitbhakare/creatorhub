import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:creatorhub/shared/components/avatar.dart';

Widget _wrap(Widget child) => MaterialApp(home: Scaffold(body: child));

void main() {
  group('AppAvatar', () {
    testWidgets('renders first initial when no imageUrl is provided', (tester) async {
      await tester.pumpWidget(_wrap(const AppAvatar(name: 'Rohit')));
      expect(find.text('R'), findsOneWidget);
    });

    testWidgets('uppercases the first letter of the name', (tester) async {
      await tester.pumpWidget(_wrap(const AppAvatar(name: 'priya')));
      expect(find.text('P'), findsOneWidget);
    });

    testWidgets('falls back to "?" when name is empty', (tester) async {
      await tester.pumpWidget(_wrap(const AppAvatar(name: '')));
      expect(find.text('?'), findsOneWidget);
    });

    testWidgets('does not show a verified badge by default', (tester) async {
      await tester.pumpWidget(_wrap(const AppAvatar(name: 'x')));
      expect(find.byIcon(Icons.check), findsNothing);
    });

    testWidgets('shows a verified badge check icon when showVerified=true',
        (tester) async {
      await tester.pumpWidget(_wrap(const AppAvatar(
        name: 'x',
        showVerified: true,
      )));
      expect(find.byIcon(Icons.check), findsOneWidget);
    });

    testWidgets('reserves extra space for the verified badge', (tester) async {
      const size = 40.0;

      await tester.pumpWidget(_wrap(const AppAvatar(name: 'x', size: size)));
      final unverifiedSize = tester.getSize(find.byType(AppAvatar));

      await tester.pumpWidget(_wrap(const AppAvatar(
        name: 'x',
        size: size,
        showVerified: true,
      )));
      final verifiedSize = tester.getSize(find.byType(AppAvatar));

      expect(verifiedSize.width, greaterThan(unverifiedSize.width));
    });
  });
}
