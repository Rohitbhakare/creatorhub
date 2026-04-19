import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:creatorhub/features/onboarding/components/onboarding_progress_bar.dart';
import 'package:creatorhub/shared/theme/colors.dart';

Widget _wrap(Widget child) =>
    MaterialApp(home: Scaffold(body: SizedBox(width: 400, child: child)));

void main() {
  group('OnboardingProgressBar', () {
    testWidgets('renders totalSteps segments and (totalSteps-1) gaps',
        (tester) async {
      await tester.pumpWidget(_wrap(const OnboardingProgressBar(
        currentStep: 1,
        totalSteps: 4,
      )));

      // 4 segments, each is an Expanded; 3 gaps are SizedBox(width: 4).
      expect(find.byType(Expanded), findsNWidgets(4));
    });

    testWidgets('all segments up to currentStep use coral fill',
        (tester) async {
      await tester.pumpWidget(_wrap(const OnboardingProgressBar(
        currentStep: 3,
        totalSteps: 4,
      )));

      // Let AnimatedContainer settle.
      await tester.pump(const Duration(milliseconds: 250));

      final animated = tester
          .widgetList<AnimatedContainer>(find.byType(AnimatedContainer))
          .toList();
      expect(animated.length, 4);

      // Segments 1, 2, 3 filled; 4 unfilled.
      double widthOf(int i) {
        final c = animated[i].constraints;
        return c == null ? double.nan : (c.maxWidth);
      }

      expect(widthOf(0), double.infinity);
      expect(widthOf(1), double.infinity);
      expect(widthOf(2), double.infinity);
      expect(widthOf(3), 0);

      // All animated containers use coral.
      for (final a in animated) {
        final d = a.decoration as BoxDecoration;
        expect(d.color, AppColors.coral);
      }
    });

    testWidgets('totalSteps defaults to 4 when omitted', (tester) async {
      await tester.pumpWidget(
          _wrap(const OnboardingProgressBar(currentStep: 1)));
      expect(find.byType(Expanded), findsNWidgets(4));
    });
  });
}
