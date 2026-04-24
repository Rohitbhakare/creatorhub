import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart' show PhosphorIconsFill;

import '../../../../shared/theme/colors.dart';
import '../../../../shared/theme/typography.dart' as typ;
import '../../../../shared/theme/spacing.dart';
import '../../../../shared/theme/layout.dart';
import '../../../../shared/components/button.dart';
import '../../providers/wizard_provider.dart';
import '../post_preview_card.dart';

/// Review & Publish step — the final step in the wizard.
///
/// For posts: shows a live preview card above the checklist so creators
/// see roughly how the post will look. For paid content types, keeps the
/// pricing block.
class ReviewStep extends ConsumerWidget {
  /// Optional callback when the user presses Publish.
  final VoidCallback? onPublish;

  const ReviewStep({super.key, this.onPublish});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final wizard = ref.watch(wizardProvider);
    final isPost = wizard.contentType == ContentType.post;

    final items = _buildChecklistItems(wizard);
    final allPassed = items.every((item) => item.passed);

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(
        horizontal: Layout.screenPaddingH,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: Spacing.xl),

          _StepIntro(
            kicker: 'STEP ${wizard.totalSteps} OF ${wizard.totalSteps}',
            headline: 'One last look.',
            subhead: "Here's how it'll appear in the feed.",
          ),
          const SizedBox(height: Spacing.xl),

          if (isPost) ...[
            const PostPreviewCard(),
            const SizedBox(height: Spacing.xl),
          ],

          Container(
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(Layout.cardRadius),
              border: Border.all(color: AppColors.hairline),
            ),
            child: Column(
              children: [
                for (int i = 0; i < items.length; i++) ...[
                  _ChecklistRow(
                    item: items[i],
                    onTap: items[i].passed
                        ? null
                        : () {
                            HapticFeedback.lightImpact();
                            ref
                                .read(wizardProvider.notifier)
                                .goToStep(items[i].step);
                          },
                  ),
                  if (i < items.length - 1)
                    const Divider(
                      color: AppColors.hairline,
                      height: 1,
                      indent: Layout.cardPadding,
                      endIndent: Layout.cardPadding,
                    ),
                ],
              ],
            ),
          ),

          if (!isPost) ...[
            const SizedBox(height: Spacing.xl),
            Container(
              padding: const EdgeInsets.all(Layout.cardPadding),
              decoration: BoxDecoration(
                color: AppColors.surfaceAlt,
                borderRadius: BorderRadius.circular(Layout.cardRadius),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Pricing', style: typ.AppTypography.caption),
                  const SizedBox(height: Spacing.xs),
                  Text(
                    wizard.pricingModel == 'paid'
                        ? '\u20B9${(wizard.pricePaisa / 100).toStringAsFixed(0)}'
                        : 'FREE',
                    style: typ.AppTypography.h4.copyWith(
                      color: wizard.pricingModel == 'paid'
                          ? AppColors.ink
                          : AppColors.success,
                    ),
                  ),
                ],
              ),
            ),
          ],

          const SizedBox(height: Spacing.xl),

          GestureDetector(
            onTap: () {
              HapticFeedback.lightImpact();
              ref
                  .read(wizardProvider.notifier)
                  .setTncAccepted(!wizard.tncAccepted);
            },
            behavior: HitTestBehavior.opaque,
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: Spacing.sm),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SizedBox(
                    width: 24,
                    height: 24,
                    child: Checkbox(
                      value: wizard.tncAccepted,
                      onChanged: (value) {
                        HapticFeedback.lightImpact();
                        ref
                            .read(wizardProvider.notifier)
                            .setTncAccepted(value ?? false);
                      },
                      activeColor: AppColors.coral,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(4),
                      ),
                      side: const BorderSide(
                        color: AppColors.hairline,
                        width: 1.5,
                      ),
                    ),
                  ),
                  const SizedBox(width: Spacing.md),
                  Expanded(
                    child: Text.rich(
                      TextSpan(
                        text: 'I agree to the ',
                        style: typ.AppTypography.bodySmall,
                        children: [
                          TextSpan(
                            text: 'Terms & Conditions',
                            style: typ.AppTypography.bodySmall.copyWith(
                              color: AppColors.coral,
                              fontWeight: FontWeight.w600,
                              decoration: TextDecoration.underline,
                              decorationColor: AppColors.coral,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: Spacing.xl),

          AppButton(
            label: 'Publish',
            onPressed:
                allPassed && wizard.tncAccepted ? onPublish : null,
            variant: AppButtonVariant.primary,
            size: AppButtonSize.large,
            fullWidth: true,
            isLoading: wizard.isSaving,
          ),

          const SizedBox(height: Spacing.xxxl),
        ],
      ),
    );
  }

  List<_ChecklistItem> _buildChecklistItems(WizardState wizard) {
    final isPost = wizard.contentType == ContentType.post;
    final items = <_ChecklistItem>[];

    final titleMin = isPost ? 1 : 5;
    items.add(_ChecklistItem(
      label: 'Title',
      passed: wizard.title.trim().length >= titleMin &&
          wizard.title.trim().length <= 100,
      step: 1,
    ));

    items.add(_ChecklistItem(
      label: 'Description',
      passed: wizard.description.length <= 280,
      step: 1,
    ));

    if (isPost) {
      items.add(_ChecklistItem(
        label: 'Post body',
        passed: wizard.body.trim().isNotEmpty && wizard.body.length <= 1000,
        step: 2,
      ));
    }

    if (!isPost) {
      items.add(_ChecklistItem(
        label: 'Pricing set',
        passed: wizard.pricingModel == 'free' ||
            (wizard.pricingModel == 'paid' && wizard.pricePaisa > 0),
        step: wizard.contentType == ContentType.selfPacedItinerary ? 5 : 4,
      ));
    }

    return items;
  }
}

class _StepIntro extends StatelessWidget {
  final String kicker;
  final String headline;
  final String subhead;

  const _StepIntro({
    required this.kicker,
    required this.headline,
    required this.subhead,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          kicker,
          style: GoogleFonts.inter(
            fontSize: 11,
            fontWeight: FontWeight.w500,
            letterSpacing: 1.2,
            color: AppColors.coral,
          ),
        ),
        const SizedBox(height: Spacing.sm),
        Text(
          headline,
          style: GoogleFonts.fraunces(
            fontSize: 28,
            fontWeight: FontWeight.w500,
            height: 1.15,
            color: AppColors.ink,
          ),
        ),
        const SizedBox(height: Spacing.xs),
        Text(
          subhead,
          style: GoogleFonts.fraunces(
            fontSize: 18,
            fontStyle: FontStyle.italic,
            fontWeight: FontWeight.w400,
            height: 1.25,
            color: AppColors.inkSoft,
          ),
        ),
      ],
    );
  }
}

/// A single checklist item.
class _ChecklistItem {
  final String label;
  final bool passed;
  final int step;

  const _ChecklistItem({
    required this.label,
    required this.passed,
    required this.step,
  });
}

/// Row widget for a checklist item.
class _ChecklistRow extends StatelessWidget {
  final _ChecklistItem item;
  final VoidCallback? onTap;

  const _ChecklistRow({
    required this.item,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: Layout.cardPadding,
          vertical: Spacing.md,
        ),
        child: Row(
          children: [
            Icon(
              item.passed
                  ? PhosphorIconsFill.checkCircle
                  : PhosphorIconsFill.xCircle,
              size: 20,
              color: item.passed ? AppColors.coral : AppColors.danger,
            ),
            const SizedBox(width: Spacing.md),
            Expanded(
              child: Text(
                item.label,
                style: typ.AppTypography.body.copyWith(
                  color: item.passed ? AppColors.ink : AppColors.danger,
                ),
              ),
            ),
            if (!item.passed)
              const Icon(
                PhosphorIconsFill.arrowRight,
                size: 16,
                color: AppColors.inkSoft,
              ),
          ],
        ),
      ),
    );
  }
}
