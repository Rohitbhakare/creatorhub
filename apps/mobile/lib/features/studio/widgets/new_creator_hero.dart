import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../../../shared/components/button.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/spacing.dart';
import '../../../shared/theme/typography.dart';

/// First-publish hero shown when the creator has no content yet.
///
/// Replaces the stats grid + content list + earnings card so a new creator
/// sees one focused next-step instead of empty placeholders.
class NewCreatorHero extends StatelessWidget {
  const NewCreatorHero({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: Spacing.mlg),
      child: Container(
        padding: const EdgeInsets.all(Spacing.xl),
        decoration: BoxDecoration(
          color: AppColors.surface,
          border: Border.all(color: AppColors.hairline),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              PhosphorIcons.feather(PhosphorIconsStyle.fill),
              size: 48,
              color: AppColors.ink,
            ),
            const SizedBox(height: Spacing.lg),
            Text(
              'Start your first piece',
              style: AppTypography.h4,
            ),
            const SizedBox(height: Spacing.xs),
            Text(
              'Post a story, share an itinerary, or host an experience.',
              style: AppTypography.body.copyWith(color: AppColors.inkSoft),
            ),
            const SizedBox(height: Spacing.lg),
            Row(
              children: [
                Expanded(
                  child: AppButton(
                    label: 'Create',
                    variant: AppButtonVariant.primary,
                    size: AppButtonSize.medium,
                    onPressed: () {
                      HapticFeedback.lightImpact();
                      context.push('/content/create');
                    },
                  ),
                ),
                const SizedBox(width: Spacing.sm),
                Expanded(
                  child: AppButton(
                    label: 'See examples',
                    variant: AppButtonVariant.outline,
                    size: AppButtonSize.medium,
                    onPressed: () {
                      HapticFeedback.lightImpact();
                      context.push('/discover');
                    },
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
