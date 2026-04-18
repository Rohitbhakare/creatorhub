import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:creatorhub/shared/components/card.dart';
import 'package:creatorhub/shared/theme/colors.dart';

Widget _wrap(Widget child) => MaterialApp(home: Scaffold(body: child));

void main() {
  group('AppCard — SRS C-27 elevation default', () {
    testWidgets('raised by default renders layered shadow', (tester) async {
      await tester.pumpWidget(
        _wrap(const AppCard(child: Text('hello'))),
      );

      final decoratedBox = tester.widget<DecoratedBox>(
        find.ancestor(
          of: find.text('hello'),
          matching: find.byType(DecoratedBox),
        ).first,
      );

      final decoration = decoratedBox.decoration as BoxDecoration;
      expect(decoration.boxShadow, isNotNull);
      expect(decoration.boxShadow!.length, AppColors.cardRaisedShadow.length);
      expect(decoration.border, isNull);
      expect(decoration.color, AppColors.surface);
    });

    testWidgets('flat variant renders hairline border, no shadow',
        (tester) async {
      await tester.pumpWidget(
        _wrap(const AppCard(flat: true, child: Text('hello'))),
      );

      final decoratedBox = tester.widget<DecoratedBox>(
        find.ancestor(
          of: find.text('hello'),
          matching: find.byType(DecoratedBox),
        ).first,
      );

      final decoration = decoratedBox.decoration as BoxDecoration;
      expect(decoration.boxShadow, isNull);
      expect(decoration.border, isNotNull);
    });

    testWidgets('onTap makes the card tappable', (tester) async {
      var taps = 0;
      await tester.pumpWidget(
        _wrap(
          AppCard(
            onTap: () => taps++,
            child: const Text('hello'),
          ),
        ),
      );

      await tester.tap(find.text('hello'));
      await tester.pumpAndSettle();

      expect(taps, 1);
    });
  });
}
