import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:creatorhub/features/content/widgets/ai_helper_chip.dart';

Widget _wrap(Widget child) {
  return MaterialApp(
    home: Scaffold(body: Center(child: child)),
  );
}

void main() {
  group('AiHelperChip', () {
    testWidgets('renders label and soon badge', (tester) async {
      await tester.pumpWidget(_wrap(const AiHelperChip()));
      await tester.pump();

      expect(find.text('Draft with AI'), findsOneWidget);
      expect(find.text('SOON'), findsOneWidget);
    });

    testWidgets('default tap shows "coming soon" toast', (tester) async {
      await tester.pumpWidget(_wrap(const AiHelperChip()));
      await tester.pump();

      await tester.tap(find.byType(AiHelperChip));
      await tester.pump(); // show snackbar

      expect(
        find.text("We're cooking this up — coming soon."),
        findsOneWidget,
      );
    });

    testWidgets('custom onTap takes precedence', (tester) async {
      var tapped = false;
      await tester.pumpWidget(
        _wrap(AiHelperChip(onTap: () => tapped = true)),
      );
      await tester.pump();

      await tester.tap(find.byType(AiHelperChip));
      await tester.pump();

      expect(tapped, isTrue);
      expect(
        find.text("We're cooking this up — coming soon."),
        findsNothing,
      );
    });
  });
}
