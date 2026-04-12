import 'package:flutter/material.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/layout.dart';

/// Horizontal segmented progress bar for onboarding.
///
/// Shows [totalSteps] segments. Completed segments are solid coral,
/// the current segment has an animated coral fill, and upcoming
/// segments use [AppColors.sunken].
class OnboardingProgressBar extends StatelessWidget {
  final int currentStep; // 1-based
  final int totalSteps;

  const OnboardingProgressBar({
    super.key,
    required this.currentStep,
    this.totalSteps = 4,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding:
          const EdgeInsets.symmetric(horizontal: Layout.screenPaddingH),
      child: Row(
        children: List.generate(totalSteps * 2 - 1, (i) {
          // Odd indices are 4px gaps between segments.
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
                color: AppColors.sunken,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            // Animated fill
            AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              curve: Curves.easeOut,
              width: isCompleted || isCurrent ? double.infinity : 0,
              decoration: BoxDecoration(
                color: AppColors.coral,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
