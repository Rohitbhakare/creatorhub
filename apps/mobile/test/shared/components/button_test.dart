import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:creatorhub/shared/components/button.dart';
import 'package:creatorhub/shared/theme/colors.dart';

Widget _wrap(Widget child) => MaterialApp(home: Scaffold(body: Center(child: child)));

void main() {
  group('AppButton', () {
    testWidgets('renders label text', (tester) async {
      await tester.pumpWidget(_wrap(const AppButton(label: 'Continue')));
      expect(find.text('Continue'), findsOneWidget);
    });

    testWidgets('fires onPressed when tapped', (tester) async {
      var taps = 0;
      await tester.pumpWidget(
        _wrap(AppButton(label: 'Go', onPressed: () => taps++)),
      );

      await tester.tap(find.text('Go'));
      await tester.pumpAndSettle();

      expect(taps, 1);
    });

    testWidgets('does not fire onPressed when onPressed is null (disabled)',
        (tester) async {
      await tester.pumpWidget(_wrap(const AppButton(label: 'Disabled')));

      await tester.tap(find.text('Disabled'));
      await tester.pumpAndSettle();
      // Nothing to assert: the tap must not crash and no callback exists.
      expect(find.text('Disabled'), findsOneWidget);
    });

    testWidgets('does not fire onPressed when isLoading is true', (tester) async {
      var taps = 0;
      await tester.pumpWidget(
        _wrap(AppButton(
          label: 'Loading',
          isLoading: true,
          onPressed: () => taps++,
        )),
      );

      // When loading, a CircularProgressIndicator is shown instead of label text.
      expect(find.text('Loading'), findsNothing);
      expect(find.byType(CircularProgressIndicator), findsOneWidget);

      // Use pump() not pumpAndSettle() because the spinner animates forever.
      await tester.tap(find.byType(AppButton), warnIfMissed: false);
      await tester.pump();

      expect(taps, 0);
    });

    testWidgets('primary variant paints coral background', (tester) async {
      await tester.pumpWidget(
        _wrap(AppButton(label: 'Primary', onPressed: () {})),
      );

      final container = tester.widget<Container>(
        find.ancestor(of: find.text('Primary'), matching: find.byType(Container)).first,
      );
      final decoration = container.decoration as BoxDecoration;
      expect(decoration.color, AppColors.coral);
    });

    testWidgets('danger variant paints danger red background', (tester) async {
      await tester.pumpWidget(
        _wrap(AppButton(
          label: 'Delete',
          variant: AppButtonVariant.danger,
          onPressed: () {},
        )),
      );

      final container = tester.widget<Container>(
        find.ancestor(of: find.text('Delete'), matching: find.byType(Container)).first,
      );
      final decoration = container.decoration as BoxDecoration;
      expect(decoration.color, AppColors.danger);
    });

    testWidgets('secondary variant has a border and no filled background',
        (tester) async {
      await tester.pumpWidget(
        _wrap(AppButton(
          label: 'Outline',
          variant: AppButtonVariant.secondary,
          onPressed: () {},
        )),
      );

      final container = tester.widget<Container>(
        find.ancestor(of: find.text('Outline'), matching: find.byType(Container)).first,
      );
      final decoration = container.decoration as BoxDecoration;
      expect(decoration.border, isNotNull);
      expect(decoration.color, isNull);
    });

    testWidgets('fullWidth stretches button to full width', (tester) async {
      await tester.pumpWidget(
        _wrap(SizedBox(
          width: 320,
          child: AppButton(
            label: 'Full',
            fullWidth: true,
            onPressed: () {},
          ),
        )),
      );

      final buttonBox = tester.getSize(find.byType(AppButton));
      expect(buttonBox.width, 320);
    });

    testWidgets('respects size enum height', (tester) async {
      await tester.pumpWidget(
        _wrap(AppButton(
          label: 'Big',
          size: AppButtonSize.large,
          onPressed: () {},
        )),
      );

      final buttonBox = tester.getSize(find.byType(AppButton));
      expect(buttonBox.height, AppButtonSize.large.height);
    });

    testWidgets('renders leading icon when provided', (tester) async {
      await tester.pumpWidget(
        _wrap(AppButton(
          label: 'Back',
          leadingIcon: Icons.arrow_back,
          onPressed: () {},
        )),
      );

      expect(find.byIcon(Icons.arrow_back), findsOneWidget);
    });
  });
}
