import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../../../shared/theme/colors.dart';
import '../../../shared/theme/spacing.dart';
import '../../../shared/theme/typography.dart';
import '../../../shared/utils/format.dart';
import '../providers/earnings_provider.dart';

/// Three-tile summary at the top of the Earnings screen.
/// Pending · Processing · Paid (last 30 days).
class PayoutSummaryCard extends StatelessWidget {
  final PayoutTotals totals;

  const PayoutSummaryCard({super.key, required this.totals});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: Spacing.mlg),
      padding: const EdgeInsets.all(Spacing.lg),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.hairline),
      ),
      child: Row(
        children: [
          _SummaryTile(
            label: 'Pending',
            amountPaisa: totals.pendingPaisa,
            icon: PhosphorIcons.hourglass(PhosphorIconsStyle.regular),
            color: AppColors.inkSoft,
          ),
          const _VerticalRule(),
          _SummaryTile(
            label: 'Processing',
            amountPaisa: totals.processingPaisa,
            icon: PhosphorIcons.arrowsClockwise(PhosphorIconsStyle.regular),
            color: AppColors.info,
          ),
          const _VerticalRule(),
          _SummaryTile(
            label: 'Paid · 30d',
            amountPaisa: totals.paidLast30dPaisa,
            icon: PhosphorIcons.checkCircle(PhosphorIconsStyle.regular),
            color: AppColors.success,
          ),
        ],
      ),
    );
  }
}

class _SummaryTile extends StatelessWidget {
  final String label;
  final int amountPaisa;
  final IconData icon;
  final Color color;

  const _SummaryTile({
    required this.label,
    required this.amountPaisa,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    final display = amountPaisa > 0 ? formatPrice(amountPaisa) : '₹0';
    return Expanded(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Icon(icon, size: 16, color: color),
          const SizedBox(height: Spacing.xs),
          Text(
            display,
            style: GoogleFonts.fraunces(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: AppColors.ink,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: AppTypography.caption,
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

class _VerticalRule extends StatelessWidget {
  const _VerticalRule();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 1,
      height: 48,
      color: AppColors.hairline,
      margin: const EdgeInsets.symmetric(horizontal: Spacing.sm),
    );
  }
}
