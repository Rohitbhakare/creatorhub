import 'package:flutter/material.dart';

import '../../../shared/theme/colors.dart';
import '../../../shared/theme/typography.dart' as typ;
import '../../../shared/theme/spacing.dart';
import '../../../shared/theme/layout.dart';
import '../../../shared/theme/animations.dart';

/// Horizontal progress bar for the content creation wizard.
///
/// Shows completed steps as coral-filled segments, the current step as
/// outlined/partial fill, and future steps as sunken segments.
/// Displays a label below: "Step {current} of {total}: {stepName}".
class WizardStepIndicator extends StatelessWidget {
  final int currentStep; // 1-based
  final int totalSteps;
  final String stepName;

  const WizardStepIndicator({
    super.key,
    required this.currentStep,
    required this.totalSteps,
    required this.stepName,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        // Progress bar segments
        Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: Layout.screenPaddingH,
          ),
          child: Row(
            children: List.generate(totalSteps * 2 - 1, (i) {
              // Odd indices are gaps between segments.
              if (i.isOdd) return const SizedBox(width: 4);

              final stepNumber = i ~/ 2 + 1;
              return Expanded(
                child: _Segment(
                  stepNumber: stepNumber,
                  currentStep: currentStep,
                ),
              );
            }),
          ),
        ),
        const SizedBox(height: Spacing.sm),

        // Step label
        Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: Layout.screenPaddingH,
          ),
          child: Text(
            'Step $currentStep of $totalSteps: $stepName',
            style: typ.AppTypography.caption.copyWith(
              color: AppColors.inkSoft,
            ),
          ),
        ),
      ],
    );
  }
}

class _Segment extends StatelessWidget {
  final int stepNumber;
  final int currentStep;

  const _Segment({
    required this.stepNumber,
    required this.currentStep,
  });

  @override
  Widget build(BuildContext context) {
    final isCompleted = stepNumber < currentStep;
    final isCurrent = stepNumber == currentStep;

    return SizedBox(
      height: 4,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(2),
        child: Stack(
          children: [
            // Background track
            Container(
              decoration: BoxDecoration(
                color: AppColors.surfaceAlt,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            // Animated fill
            AnimatedFractionallySizedBox(
              duration: Anim.tabSwitchDuration,
              curve: Anim.defaultCurve,
              widthFactor: isCompleted ? 1.0 : (isCurrent ? 0.5 : 0.0),
              child: Container(
                decoration: BoxDecoration(
                  color: AppColors.coral,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// AnimatedFractionallySizedBox with implicit animation on widthFactor.
class AnimatedFractionallySizedBox extends ImplicitlyAnimatedWidget {
  final double widthFactor;
  final Widget child;

  const AnimatedFractionallySizedBox({
    super.key,
    required this.widthFactor,
    required this.child,
    required super.duration,
    super.curve = Curves.linear,
  });

  @override
  AnimatedWidgetBaseState<AnimatedFractionallySizedBox> createState() =>
      _AnimatedFractionallySizedBoxState();
}

class _AnimatedFractionallySizedBoxState
    extends AnimatedWidgetBaseState<AnimatedFractionallySizedBox> {
  Tween<double>? _widthFactor;

  @override
  void forEachTween(TweenVisitor<dynamic> visitor) {
    _widthFactor = visitor(
      _widthFactor,
      widget.widthFactor,
      (dynamic value) => Tween<double>(begin: value as double),
    ) as Tween<double>?;
  }

  @override
  Widget build(BuildContext context) {
    return FractionallySizedBox(
      widthFactor: _widthFactor?.evaluate(animation) ?? widget.widthFactor,
      alignment: Alignment.centerLeft,
      child: widget.child,
    );
  }
}
