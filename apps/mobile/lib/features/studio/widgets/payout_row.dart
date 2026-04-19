import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../../../shared/theme/colors.dart';
import '../../../shared/theme/spacing.dart';
import '../../../shared/theme/typography.dart';
import '../../../shared/utils/format.dart';
import '../providers/earnings_provider.dart';

/// A single row in the Earnings list: one payout line item.
/// Shows: status pill, booking title, net amount (after TDS), secondary meta.
class PayoutRow extends StatelessWidget {
  final PayoutSummary payout;

  const PayoutRow({super.key, required this.payout});

  @override
  Widget build(BuildContext context) {
    final netPaisa = payout.amountPaisa - payout.tdsPaisa;
    final (statusLabel, statusColor, statusIcon) = _statusPresentation();
    final dateLabel = payout.processedAt != null
        ? formatDate(payout.processedAt!)
        : formatDate(payout.scheduledAt);

    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: Spacing.mlg,
        vertical: Spacing.md,
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Leading status icon
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: statusColor.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(statusIcon, size: 18, color: statusColor),
          ),
          const SizedBox(width: Spacing.md),

          // Title + sub-label
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  payout.bookingTitle ?? 'Booking payout',
                  style: AppTypography.bodySmall.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Row(
                  children: [
                    Text(statusLabel, style: AppTypography.caption),
                    Text(' · ', style: AppTypography.caption),
                    Text(dateLabel, style: AppTypography.caption),
                  ],
                ),
                if (payout.status == PayoutStatus.failed &&
                    payout.failureReason != null) ...[
                  const SizedBox(height: 2),
                  Text(
                    payout.failureReason!,
                    style: AppTypography.caption.copyWith(
                      color: AppColors.danger,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(width: Spacing.sm),

          // Amount
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                formatPrice(netPaisa),
                style: AppTypography.bodySmall.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
              if (payout.tdsPaisa > 0) ...[
                const SizedBox(height: 2),
                Text(
                  'after TDS ${formatPrice(payout.tdsPaisa)}',
                  style: AppTypography.caption,
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }

  (String, Color, IconData) _statusPresentation() {
    switch (payout.status) {
      case PayoutStatus.pending:
        return (
          'Pending',
          AppColors.inkSoft,
          PhosphorIcons.hourglass(PhosphorIconsStyle.regular),
        );
      case PayoutStatus.scheduled:
        return (
          'Scheduled',
          AppColors.info,
          PhosphorIcons.clockCountdown(PhosphorIconsStyle.regular),
        );
      case PayoutStatus.processing:
        return (
          'Processing',
          AppColors.info,
          PhosphorIcons.arrowsClockwise(PhosphorIconsStyle.regular),
        );
      case PayoutStatus.completed:
        return (
          'Paid',
          AppColors.success,
          PhosphorIcons.checkCircle(PhosphorIconsStyle.regular),
        );
      case PayoutStatus.failed:
        return (
          'Failed',
          AppColors.danger,
          PhosphorIcons.xCircle(PhosphorIconsStyle.regular),
        );
    }
  }
}
