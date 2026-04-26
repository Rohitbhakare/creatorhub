import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../theme/colors.dart';
import '../theme/spacing.dart';
import '../theme/typography.dart';

/// Pill that informs users when the exact pickup point is unlocked.
/// Strictly informational — never coral.
class RevealCountdownBadge extends StatelessWidget {
  /// Hours-before-start that the location is revealed (12, 24, or 48).
  final int revealHoursBefore;

  const RevealCountdownBadge({
    super.key,
    required this.revealHoursBefore,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: Spacing.sm,
        vertical: Spacing.xs,
      ),
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border.all(color: AppColors.hairline),
        borderRadius: BorderRadius.circular(99),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            PhosphorIcons.lockKey(),
            size: 14,
            color: AppColors.ink,
          ),
          const SizedBox(width: Spacing.xs),
          Flexible(
            child: Text(
              'Exact pickup point shared ${revealHoursBefore}h before start',
              style: AppTypography.caption.copyWith(color: AppColors.ink),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}
