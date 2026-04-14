import 'package:flutter/material.dart';
import 'package:intl/intl.dart' show DateFormat;
import 'package:phosphor_flutter/phosphor_flutter.dart' show PhosphorIconsFill;

import '../../../shared/theme/colors.dart';
import '../../../shared/theme/layout.dart';
import '../../../shared/theme/spacing.dart';
import '../../../shared/theme/typography.dart' as typ;

/// Compact date/time block shown on the event detail page.
///
/// Displays: day-of-week, date, and time range.
/// e.g.  SAT   15 Apr   10:00 AM – 12:00 PM
class DateBlock extends StatelessWidget {
  final DateTime startAt;
  final DateTime? endAt;

  const DateBlock({
    super.key,
    required this.startAt,
    this.endAt,
  });

  @override
  Widget build(BuildContext context) {
    final dayOfWeek = DateFormat('EEE').format(startAt).toUpperCase();
    final dateStr = DateFormat('d MMM y').format(startAt);
    final startTime = DateFormat('h:mm a').format(startAt);
    final endTime = endAt != null ? DateFormat('h:mm a').format(endAt!) : null;

    return Container(
      padding: const EdgeInsets.all(Layout.cardPadding),
      decoration: BoxDecoration(
        color: AppColors.sunken,
        borderRadius: BorderRadius.circular(Layout.cardRadius),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          // Calendar icon block
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: AppColors.coral,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  dayOfWeek,
                  style: typ.AppTypography.label.copyWith(
                    color: AppColors.white.withValues(alpha: 0.8),
                    fontSize: 9,
                  ),
                ),
                Text(
                  DateFormat('d').format(startAt),
                  style: typ.AppTypography.h3.copyWith(
                    color: AppColors.white,
                    height: 1.1,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: Spacing.md),

          // Date + time details
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  dateStr,
                  style: typ.AppTypography.body
                      .copyWith(fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: Spacing.xs),
                Row(
                  children: [
                    const Icon(
                      PhosphorIconsFill.clock,
                      size: 14,
                      color: AppColors.muted,
                    ),
                    const SizedBox(width: Spacing.xs),
                    Text(
                      endTime != null
                          ? '$startTime – $endTime'
                          : startTime,
                      style: typ.AppTypography.bodySmall
                          .copyWith(color: AppColors.muted),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // "Add to calendar" icon (placeholder)
          const Icon(
            PhosphorIconsFill.calendarPlus,
            size: 20,
            color: AppColors.softInk,
          ),
        ],
      ),
    );
  }
}
