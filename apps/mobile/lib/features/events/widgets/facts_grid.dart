import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart' show PhosphorIconsFill;

import '../../../shared/theme/colors.dart';
import '../../../shared/theme/layout.dart';
import '../../../shared/theme/spacing.dart';
import '../../../shared/theme/typography.dart' as typ;
import '../providers/event_detail_provider.dart';

/// Compact facts row: free badge, city, capacity ("X going / Y max").
class FactsGrid extends StatelessWidget {
  final EventDetail event;

  const FactsGrid({super.key, required this.event});

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: Spacing.sm,
      runSpacing: Spacing.sm,
      children: [
        // Free badge
        if (event.isFree)
          const _FactChip(
            icon: PhosphorIconsFill.tag,
            label: 'FREE',
            color: AppColors.success,
          ),

        // Capacity: "X going / Y max"
        _FactChip(
          icon: PhosphorIconsFill.users,
          label: event.capacityLabel,
          color: _capacityColor(event),
        ),
      ],
    );
  }

  Color _capacityColor(EventDetail event) {
    if (event.capacity == null) return AppColors.muted;
    final remaining = event.capacity! - event.spotsBooked;
    if (remaining <= 0) return AppColors.danger;
    if (remaining <= 5) return AppColors.warning;
    return AppColors.muted;
  }
}

class _FactChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;

  const _FactChip({
    required this.icon,
    required this.label,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: Spacing.md,
        vertical: Spacing.sm,
      ),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(Layout.chipRadius),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: Spacing.xs),
          Text(
            label,
            style: typ.AppTypography.bodySmall.copyWith(
              color: color,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}
