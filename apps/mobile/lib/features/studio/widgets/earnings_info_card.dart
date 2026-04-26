import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../../../shared/components/skeleton.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/spacing.dart';
import '../../../shared/theme/typography.dart';
import '../../../shared/utils/format.dart';
import '../../kyc/providers/kyc_provider.dart';
import '../providers/earnings_provider.dart';

/// Earnings info card for the Studio dashboard.
///
/// Per DD-027 (no KYC anxiety for Stories-only creators):
///   - No paid content → informational copy, no payout/KYC pressure.
///   - Paid content + KYC verified → pending payout + arrival date + Verified badge.
///   - Paid content + KYC not verified → "Verify identity to receive payouts" CTA.
///
/// "Has paid content" is inferred from earnings data: any payout row OR any
/// non-zero pending/processing/paid total means the creator sells paid content.
class EarningsInfoCard extends ConsumerWidget {
  const EarningsInfoCard({super.key});

  bool _hasPaidContent(EarningsState earnings) {
    if (earnings.items.isNotEmpty) return true;
    final t = earnings.totals;
    return t.pendingPaisa > 0 ||
        t.processingPaisa > 0 ||
        t.paidLast30dPaisa > 0;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final earnings = ref.watch(earningsProvider);
    final kycAsync = ref.watch(kycStatusProvider);

    final hasPaid = _hasPaidContent(earnings);
    final kycVerified =
        kycAsync.asData?.value.status == 'verified';

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: Spacing.mlg),
      child: GestureDetector(
        onTap: hasPaid
            ? () {
                HapticFeedback.lightImpact();
                context.push('/studio/earnings');
              }
            : null,
        behavior: HitTestBehavior.opaque,
        child: Container(
          padding: const EdgeInsets.all(Spacing.lg),
          decoration: BoxDecoration(
            color: AppColors.surface,
            border: Border.all(color: AppColors.hairline),
            borderRadius: BorderRadius.circular(14),
          ),
          child: !hasPaid
              ? const _NoPaidContentBlock()
              : kycVerified
                  ? _VerifiedPayoutBlock(earnings: earnings)
                  : _VerifyKycCta(
                      isLoading: kycAsync.isLoading,
                    ),
        ),
      ),
    );
  }
}

// ── Block: no paid content ─────────────────────────────────────────────

class _NoPaidContentBlock extends StatelessWidget {
  const _NoPaidContentBlock();

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(
          PhosphorIcons.info(PhosphorIconsStyle.regular),
          size: 18,
          color: AppColors.ink,
        ),
        const SizedBox(width: Spacing.md),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Payouts',
                style: AppTypography.label.copyWith(color: AppColors.ink),
              ),
              const SizedBox(height: 2),
              Text(
                'You only need payouts when you publish paid content.',
                style: AppTypography.bodySmall
                    .copyWith(color: AppColors.inkSoft),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

// ── Block: KYC verified, paid content present ─────────────────────────

class _VerifiedPayoutBlock extends StatelessWidget {
  final EarningsState earnings;

  const _VerifiedPayoutBlock({required this.earnings});

  @override
  Widget build(BuildContext context) {
    final totals = earnings.totals;
    final pendingPaisa = totals.pendingPaisa + totals.processingPaisa;
    final hasPending = pendingPaisa > 0;

    final nextPayoutItem = earnings.items
        .where((i) =>
            i.status == PayoutStatus.pending ||
            i.status == PayoutStatus.scheduled)
        .fold<PayoutSummary?>(
          null,
          (acc, i) => acc == null || i.scheduledAt.isBefore(acc.scheduledAt)
              ? i
              : acc,
        );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        const _VerifiedBadge(),
        const SizedBox(height: Spacing.md),
        Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'Pending Payout',
                    style: AppTypography.caption
                        .copyWith(color: AppColors.inkSoft),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    hasPending ? formatPrice(pendingPaisa) : '—',
                    style: AppTypography.h4,
                  ),
                  if (nextPayoutItem != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      'Transfer · ${_fmtDate(nextPayoutItem.scheduledAt)}',
                      style: AppTypography.caption
                          .copyWith(color: AppColors.inkSoft),
                    ),
                  ] else if (!hasPending) ...[
                    const SizedBox(height: 2),
                    Text(
                      'Appears after your first booking completes',
                      style: AppTypography.caption
                          .copyWith(color: AppColors.inkFaint),
                    ),
                  ],
                ],
              ),
            ),
            Icon(
              PhosphorIcons.caretRight(),
              size: 16,
              color: AppColors.inkSoft,
            ),
          ],
        ),
      ],
    );
  }

  static String _fmtDate(DateTime dt) {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return '${dt.day} ${months[dt.month - 1]}';
  }
}

class _VerifiedBadge extends StatelessWidget {
  const _VerifiedBadge();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border.all(color: AppColors.hairline),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            PhosphorIcons.sealCheck(PhosphorIconsStyle.fill),
            size: 14,
            color: AppColors.ink,
          ),
          const SizedBox(width: 5),
          Text(
            'Verified',
            style: AppTypography.caption.copyWith(
              fontWeight: FontWeight.w600,
              color: AppColors.ink,
            ),
          ),
        ],
      ),
    );
  }
}

// ── Block: KYC required ─────────────────────────────────────────────────

class _VerifyKycCta extends ConsumerWidget {
  final bool isLoading;

  const _VerifyKycCta({required this.isLoading});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (isLoading) {
      return const SkeletonRect(height: 48, borderRadius: 8);
    }
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(
          PhosphorIcons.warning(PhosphorIconsStyle.regular),
          size: 18,
          color: AppColors.ink,
        ),
        const SizedBox(width: Spacing.md),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Verify identity to receive payouts',
                style: AppTypography.bodySmall.copyWith(
                  color: AppColors.ink,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                'KYC takes about 2 minutes. Required before your first transfer.',
                style: AppTypography.caption
                    .copyWith(color: AppColors.inkSoft),
              ),
              const SizedBox(height: Spacing.sm),
              GestureDetector(
                onTap: () {
                  HapticFeedback.lightImpact();
                  context.push('/kyc');
                },
                child: Text(
                  'Verify now →',
                  style: AppTypography.bodySmall.copyWith(
                    color: AppColors.ink,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
