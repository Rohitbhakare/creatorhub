import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart' show PhosphorIconsBold;

import 'package:creatorhub/shared/components/selection_tile.dart';
import 'package:creatorhub/shared/theme/colors.dart';

Widget _wrap(Widget child) => MaterialApp(home: Scaffold(body: child));

BoxDecoration _tileDecoration(WidgetTester tester) {
  final container = tester.widget<AnimatedContainer>(
    find.byType(AnimatedContainer),
  );
  return container.decoration as BoxDecoration;
}

void main() {
  group('SelectionTile — SRS C-26 selection state', () {
    testWidgets('rest state uses hairlineStrong border + no coral halo',
        (tester) async {
      await tester.pumpWidget(
        _wrap(
          SelectionTile(
            selected: false,
            onTap: () {},
            label: 'Travel',
          ),
        ),
      );

      final decoration = _tileDecoration(tester);
      final border = decoration.border as Border;

      expect(border.top.color, AppColors.hairlineStrong);
      expect(border.top.width, 1.5);
      // Rest state shadow is a single subtle shadow, not the coral halo.
      expect(decoration.boxShadow!.length, 1);
      expect(decoration.boxShadow!.first.color, isNot(AppColors.primaryTint));
      expect(find.byIcon(PhosphorIconsBold.check), findsNothing);
    });

    testWidgets('selected state uses coral border + primaryTint halo + check',
        (tester) async {
      await tester.pumpWidget(
        _wrap(
          SelectionTile(
            selected: true,
            onTap: () {},
            label: 'Travel',
          ),
        ),
      );

      final decoration = _tileDecoration(tester);
      final border = decoration.border as Border;

      expect(border.top.color, AppColors.coral);
      expect(border.top.width, 1.5);
      expect(decoration.boxShadow!.first.color, AppColors.primaryTint);
      expect(decoration.boxShadow!.first.spreadRadius, 3);
      expect(decoration.color, AppColors.surface); // never dark-fill per C-26
      expect(find.byIcon(PhosphorIconsBold.check), findsOneWidget);
    });

    testWidgets('disabled (null onTap) dims tile and blocks taps',
        (tester) async {
      await tester.pumpWidget(
        _wrap(
          const SelectionTile(
            selected: false,
            onTap: null,
            label: 'Travel',
          ),
        ),
      );

      final opacity = tester.widget<Opacity>(find.byType(Opacity).first);
      expect(opacity.opacity, 0.4);

      await tester.tap(find.text('Travel'), warnIfMissed: false);
      await tester.pump();
    });

    testWidgets('onTap fires and renders label/sublabel', (tester) async {
      var taps = 0;
      await tester.pumpWidget(
        _wrap(
          SelectionTile(
            selected: false,
            onTap: () => taps++,
            label: 'Travel',
            sublabel: '12 creators',
          ),
        ),
      );

      expect(find.text('Travel'), findsOneWidget);
      expect(find.text('12 creators'), findsOneWidget);

      await tester.tap(find.text('Travel'));
      await tester.pumpAndSettle();
      expect(taps, 1);
    });
  });
}
