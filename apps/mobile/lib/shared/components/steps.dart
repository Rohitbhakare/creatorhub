import 'package:flutter/material.dart';

import '../theme/colors.dart';

/// Horizontal "X of N" progress stepper used in onboarding flows.
/// Filled coral segments show completed + current steps.
class StepsBar extends StatelessWidget {
  final int current;
  final int total;

  const StepsBar({
    super.key,
    required this.current,
    required this.total,
  }) : assert(current >= 1 && total >= 1);

  @override
  Widget build(BuildContext context) {
    return Row(
      children: List.generate(total, (i) {
        final filled = i < current;
        return Expanded(
          child: Padding(
            padding: EdgeInsets.only(right: i == total - 1 ? 0 : 6),
            child: Container(
              height: 3,
              decoration: BoxDecoration(
                color: filled ? AppColors.coral : AppColors.hairlineStrong,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
        );
      }),
    );
  }
}
