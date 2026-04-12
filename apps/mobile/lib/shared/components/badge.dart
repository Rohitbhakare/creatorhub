import 'package:flutter/material.dart';
import '../theme/colors.dart';
import '../theme/typography.dart' as typ;

/// Category badge with category-specific colors.
/// Never gray — always use the vertical/sub-category color.
class CategoryBadge extends StatelessWidget {
  final String label;
  final String slug;

  const CategoryBadge({
    super.key,
    required this.label,
    required this.slug,
  });

  @override
  Widget build(BuildContext context) {
    final color = _colorForSlug(slug);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        label,
        style: typ.AppTypography.label.copyWith(
          color: color,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }

  Color _colorForSlug(String slug) {
    return AppColors.verticalColors[slug] ??
        AppColors.storyColors[slug] ??
        AppColors.muted;
  }
}

/// Status badge (draft, published, under_review, etc.)
class StatusBadge extends StatelessWidget {
  final String label;
  final StatusBadgeType type;

  const StatusBadge({
    super.key,
    required this.label,
    this.type = StatusBadgeType.neutral,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: type.backgroundColor,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        label,
        style: typ.AppTypography.label.copyWith(
          color: type.textColor,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

enum StatusBadgeType {
  neutral(AppColors.sunken, AppColors.muted),
  success(AppColors.successSurface, AppColors.success),
  warning(AppColors.warningSurface, AppColors.warning),
  danger(AppColors.dangerSurface, AppColors.danger),
  info(AppColors.infoSurface, AppColors.info),
  coral(AppColors.coralSurface, AppColors.coral);

  final Color backgroundColor;
  final Color textColor;
  const StatusBadgeType(this.backgroundColor, this.textColor);
}

/// Notification dot — coral circle (8dp).
class NotificationDot extends StatelessWidget {
  final double size;

  const NotificationDot({super.key, this.size = 8});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: const BoxDecoration(
        color: AppColors.coral,
        shape: BoxShape.circle,
      ),
    );
  }
}

/// Count badge — number inside a pill (for notification counts).
class CountBadge extends StatelessWidget {
  final int count;

  const CountBadge({super.key, required this.count});

  @override
  Widget build(BuildContext context) {
    if (count <= 0) return const SizedBox.shrink();

    final display = count > 99 ? '99+' : count.toString();

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      constraints: const BoxConstraints(minWidth: 20),
      decoration: BoxDecoration(
        color: AppColors.coral,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Text(
        display,
        style: typ.AppTypography.label.copyWith(
          color: AppColors.white,
          fontSize: 10,
        ),
        textAlign: TextAlign.center,
      ),
    );
  }
}
