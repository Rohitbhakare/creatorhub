import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart' show PhosphorIconsFill;
import '../theme/colors.dart';
import '../theme/spacing.dart';
import '../theme/typography.dart' as typ;
import 'button.dart';

/// Empty state component.
/// Always: icon/illustration + title + description + optional CTA.
/// Never: just gray text or blank screen.
class EmptyState extends StatelessWidget {
  final IconData? icon;
  final Widget? illustration;
  final String title;
  final String description;
  final String? ctaLabel;
  final VoidCallback? onCtaPressed;

  const EmptyState({
    super.key,
    this.icon,
    this.illustration,
    required this.title,
    required this.description,
    this.ctaLabel,
    this.onCtaPressed,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: Spacing.xxl),
        child: Transform.translate(
          // Slight upward offset (-10%) for visual balance
          offset: Offset(0, -MediaQuery.of(context).size.height * 0.05),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Illustration or icon
              if (illustration != null)
                Semantics(
                  excludeSemantics: true, // Decorative
                  child: illustration!,
                )
              else
                Icon(
                  icon ?? PhosphorIconsFill.mountains,
                  size: 64,
                  color: AppColors.softInk,
                ),
              const SizedBox(height: Spacing.xl),

              // Title
              Text(
                title,
                style: typ.AppTypography.h3,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: Spacing.sm),

              // Description (max 2 lines)
              Text(
                description,
                style: typ.AppTypography.body.copyWith(
                  color: AppColors.muted,
                ),
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),

              // CTA button
              if (ctaLabel != null && onCtaPressed != null) ...[
                const SizedBox(height: Spacing.xl),
                AppButton(
                  label: ctaLabel!,
                  onPressed: onCtaPressed,
                  variant: AppButtonVariant.primary,
                  size: AppButtonSize.medium,
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
