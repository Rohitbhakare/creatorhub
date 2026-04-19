import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../../../shared/theme/colors.dart';
import '../../../shared/theme/spacing.dart';
import '../../../shared/theme/typography.dart';
import '../providers/linked_account_provider.dart';

/// Top-of-screen banner showing the creator's bank account status.
/// Activated → muted confirmation row.
/// Needs action / pending / missing → coral-outlined prompt.
class LinkedAccountBanner extends StatelessWidget {
  final LinkedAccount account;
  final VoidCallback? onTapLearnMore;

  const LinkedAccountBanner({
    super.key,
    required this.account,
    this.onTapLearnMore,
  });

  @override
  Widget build(BuildContext context) {
    if (account.isActivated) return _ActivatedBanner(account: account);
    if (account.needsAction) {
      return _AttentionBanner(
        title: 'Your bank account needs attention',
        body: 'Complete or correct your KYC to keep receiving payouts.',
        onTap: onTapLearnMore,
      );
    }
    if (account.isPending) {
      return const _InfoBanner(
        title: 'Bank setup in progress',
        body:
            'Razorpay is verifying your details. This usually takes 1–2 business days.',
      );
    }
    // isMissing
    return _AttentionBanner(
      title: 'Set up your bank account',
      body: 'Complete KYC to start receiving payouts for paid bookings.',
      onTap: onTapLearnMore,
    );
  }
}

class _ActivatedBanner extends StatelessWidget {
  final LinkedAccount account;

  const _ActivatedBanner({required this.account});

  @override
  Widget build(BuildContext context) {
    final masked = account.bankAccountMasked;
    final ifsc = account.bankIfsc;
    final hasBank = masked != null && ifsc != null;
    final title = hasBank ? 'Payouts to $masked' : 'Bank account active';

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: Spacing.mlg),
      padding: const EdgeInsets.symmetric(
        horizontal: Spacing.lg,
        vertical: Spacing.md,
      ),
      decoration: BoxDecoration(
        color: AppColors.surfaceAlt,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Icon(
            PhosphorIcons.bank(PhosphorIconsStyle.regular),
            size: 18,
            color: AppColors.inkSoft,
          ),
          const SizedBox(width: Spacing.sm),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  title,
                  style: AppTypography.bodySmall.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                if (hasBank) ...[
                  const SizedBox(height: 2),
                  Text(
                    'IFSC $ifsc',
                    style: AppTypography.caption,
                  ),
                ],
              ],
            ),
          ),
          Icon(
            PhosphorIcons.checkCircle(PhosphorIconsStyle.fill),
            size: 16,
            color: AppColors.success,
          ),
        ],
      ),
    );
  }
}

class _AttentionBanner extends StatelessWidget {
  final String title;
  final String body;
  final VoidCallback? onTap;

  const _AttentionBanner({
    required this.title,
    required this.body,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap == null
          ? null
          : () {
              HapticFeedback.lightImpact();
              onTap!();
            },
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: Spacing.mlg),
        padding: const EdgeInsets.all(Spacing.lg),
        decoration: BoxDecoration(
          color: const Color(0xFFFFF5F1),
          border: Border.all(color: const Color(0xFFF8C2B0)),
          borderRadius: BorderRadius.circular(14),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(
              PhosphorIcons.warningCircle(PhosphorIconsStyle.regular),
              size: 18,
              color: AppColors.coral,
            ),
            const SizedBox(width: Spacing.sm),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: AppTypography.bodySmall.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    body,
                    style: AppTypography.caption
                        .copyWith(color: AppColors.inkSoft),
                  ),
                ],
              ),
            ),
            if (onTap != null)
              Icon(
                PhosphorIcons.caretRight(),
                size: 16,
                color: AppColors.inkSoft,
              ),
          ],
        ),
      ),
    );
  }
}

class _InfoBanner extends StatelessWidget {
  final String title;
  final String body;

  const _InfoBanner({required this.title, required this.body});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: Spacing.mlg),
      padding: const EdgeInsets.all(Spacing.lg),
      decoration: BoxDecoration(
        color: AppColors.infoSurface,
        border: Border.all(color: AppColors.info.withValues(alpha: 0.35)),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            PhosphorIcons.hourglassMedium(),
            size: 18,
            color: AppColors.info,
          ),
          const SizedBox(width: Spacing.sm),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: AppTypography.bodySmall.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  body,
                  style:
                      AppTypography.caption.copyWith(color: AppColors.inkSoft),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
