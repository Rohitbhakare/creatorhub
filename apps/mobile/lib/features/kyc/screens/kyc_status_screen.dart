import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../../../shared/components/button.dart';
import '../../../shared/components/skeleton.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/spacing.dart';
import '../../../shared/theme/typography.dart' as typ;
import '../providers/kyc_provider.dart';

/// Entry point for KYC — shown when user navigates to /kyc.
/// Displays different UI based on KYC status: none | pending | verified | rejected.
class KycStatusScreen extends ConsumerWidget {
  const KycStatusScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final statusAsync = ref.watch(kycStatusProvider);

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: AppColors.bg,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        leading: GestureDetector(
          onTap: () {
            HapticFeedback.lightImpact();
            context.pop();
          },
          child: const Icon(PhosphorIconsFill.arrowLeft, color: AppColors.ink),
        ),
        title: Text('Identity Verification', style: typ.AppTypography.h4),
        centerTitle: false,
      ),
      body: SafeArea(
        child: statusAsync.when(
          loading: () => const _KycStatusSkeleton(),
          error: (error, _) => _KycErrorView(
            message: error.toString(),
            onRetry: () => ref.invalidate(kycStatusProvider),
          ),
          data: (info) => _KycStatusBody(info: info),
        ),
      ),
    );
  }
}

// ── Status Body ───────────────────────────────────────────────────

class _KycStatusBody extends StatelessWidget {
  final KycStatusInfo info;

  const _KycStatusBody({required this.info});

  @override
  Widget build(BuildContext context) {
    return switch (info.status) {
      'pending' => _PendingView(info: info),
      'verified' => const _VerifiedView(),
      'rejected' => _RejectedView(info: info),
      _ => const _NoneView(), // 'none' or any unknown state
    };
  }
}

// ── None State ────────────────────────────────────────────────────

class _NoneView extends StatelessWidget {
  const _NoneView();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: Spacing.xl),
      child: Column(
        children: [
          const Spacer(flex: 2),
          // Hero illustration
          Container(
            width: 120,
            height: 120,
            decoration: const BoxDecoration(
              color: AppColors.surfaceAlt,
              shape: BoxShape.circle,
            ),
            child: const Icon(
              PhosphorIconsFill.identificationCard,
              size: 56,
              color: AppColors.inkSoft,
            ),
          ),
          const SizedBox(height: Spacing.lg),
          Container(
            padding: const EdgeInsets.symmetric(
              horizontal: Spacing.md,
              vertical: 6,
            ),
            decoration: BoxDecoration(
              color: AppColors.surfaceAlt,
              borderRadius: BorderRadius.circular(999),
              border: Border.all(color: AppColors.hairline),
            ),
            child: Text(
              'Not Started',
              style: typ.AppTypography.caption.copyWith(
                color: AppColors.inkSoft,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          const SizedBox(height: Spacing.lg),
          Text(
            'Verify Your Identity',
            style: typ.AppTypography.h1,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: Spacing.lg),
          Text(
            'Complete a one-time KYC verification to start publishing paid experiences and earning on CreatorHub.',
            style: typ.AppTypography.body.copyWith(color: AppColors.inkSoft),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: Spacing.lg),
          Row(
            key: const Key('kyc_progress'),
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(5, (i) {
              return Container(
                margin: const EdgeInsets.symmetric(horizontal: 3),
                width: 36,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.hairline,
                  borderRadius: BorderRadius.circular(2),
                ),
              );
            }),
          ),
          const SizedBox(height: Spacing.xl),
          // Info bullets
          const _InfoRow(
            icon: PhosphorIconsFill.shieldCheck,
            text: 'Your data is encrypted and stored securely',
          ),
          const SizedBox(height: Spacing.md),
          const _InfoRow(
            icon: PhosphorIconsFill.clock,
            text: 'Review typically takes 1–2 business days',
          ),
          const SizedBox(height: Spacing.md),
          const _InfoRow(
            icon: PhosphorIconsFill.checkCircle,
            text: 'One-time process — no repeat verification',
          ),
          const Spacer(flex: 3),
          AppButton(
            label: 'Start KYC',
            fullWidth: true,
            size: AppButtonSize.large,
            onPressed: () {
              HapticFeedback.lightImpact();
              context.push('/kyc/wizard');
            },
          ),
          const SizedBox(height: Spacing.xxl),
        ],
      ),
    );
  }
}

// ── Pending State ─────────────────────────────────────────────────

class _PendingView extends StatelessWidget {
  final KycStatusInfo info;

  const _PendingView({required this.info});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: Spacing.xl),
      child: Column(
        children: [
          const Spacer(flex: 2),
          Container(
            width: 120,
            height: 120,
            decoration: const BoxDecoration(
              color: AppColors.warningSurface,
              shape: BoxShape.circle,
            ),
            child: const Icon(
              PhosphorIconsFill.clockCountdown,
              size: 56,
              color: AppColors.warning,
            ),
          ),
          const SizedBox(height: Spacing.xxl),
          Text(
            'Under Review',
            style: typ.AppTypography.h1,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: Spacing.lg),
          Text(
            'Your documents are being reviewed. Usually takes 1–2 business days.',
            style: typ.AppTypography.body.copyWith(color: AppColors.inkSoft),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: Spacing.xl),
          if (info.submittedAt != null)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(Spacing.lg),
              decoration: BoxDecoration(
                color: AppColors.surfaceAlt,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.hairline),
              ),
              child: Column(
                children: [
                  Text(
                    'Submitted',
                    style: typ.AppTypography.caption,
                  ),
                  const SizedBox(height: Spacing.xs),
                  Text(
                    _formatDate(info.submittedAt!),
                    style: typ.AppTypography.bodySmall.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          const Spacer(flex: 3),
          Text(
            "We'll notify you once the review is complete.",
            style: typ.AppTypography.bodySmall.copyWith(color: AppColors.inkMuted),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: Spacing.xxl),
        ],
      ),
    );
  }

  String _formatDate(DateTime date) {
    final months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    return '${date.day} ${months[date.month - 1]} ${date.year}';
  }
}

// ── Verified State ────────────────────────────────────────────────

class _VerifiedView extends StatelessWidget {
  const _VerifiedView();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: Spacing.xl),
      child: Column(
        children: [
          const Spacer(flex: 2),
          Container(
            width: 120,
            height: 120,
            decoration: const BoxDecoration(
              color: AppColors.successSurface,
              shape: BoxShape.circle,
            ),
            child: const Icon(
              PhosphorIconsFill.checkCircle,
              size: 56,
              color: AppColors.success,
            ),
          ),
          const SizedBox(height: Spacing.xxl),
          Text(
            'Verified',
            style: typ.AppTypography.h1.copyWith(color: AppColors.success),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: Spacing.lg),
          Text(
            'You can now publish paid experiences and earn on CreatorHub.',
            style: typ.AppTypography.body.copyWith(color: AppColors.inkSoft),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: Spacing.xxl),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(Spacing.lg),
            decoration: BoxDecoration(
              color: AppColors.successSurface,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: AppColors.success.withValues(alpha: 0.2),
              ),
            ),
            child: const Row(
              children: [
                Icon(
                  PhosphorIconsFill.shieldCheck,
                  size: 20,
                  color: AppColors.success,
                ),
                SizedBox(width: Spacing.md),
                Expanded(
                  child: Text(
                    'Your identity has been verified by our team.',
                    style: TextStyle(
                      fontSize: 13,
                      color: AppColors.success,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const Spacer(flex: 3),
          AppButton(
            label: 'Go to Studio',
            fullWidth: true,
            size: AppButtonSize.large,
            onPressed: () {
              HapticFeedback.lightImpact();
              context.go('/studio');
            },
          ),
          const SizedBox(height: Spacing.xxl),
        ],
      ),
    );
  }
}

// ── Rejected State ────────────────────────────────────────────────

class _RejectedView extends StatelessWidget {
  final KycStatusInfo info;

  const _RejectedView({required this.info});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: Spacing.xl),
      child: Column(
        children: [
          const Spacer(flex: 2),
          Container(
            width: 120,
            height: 120,
            decoration: const BoxDecoration(
              color: AppColors.dangerSurface,
              shape: BoxShape.circle,
            ),
            child: const Icon(
              PhosphorIconsFill.xCircle,
              size: 56,
              color: AppColors.danger,
            ),
          ),
          const SizedBox(height: Spacing.xxl),
          Text(
            'Verification Failed',
            style: typ.AppTypography.h1.copyWith(color: AppColors.danger),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: Spacing.lg),
          if (info.rejectionReason != null) ...[
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(Spacing.lg),
              decoration: BoxDecoration(
                color: AppColors.dangerSurface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: AppColors.danger.withValues(alpha: 0.2),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Reason',
                    style: typ.AppTypography.caption.copyWith(
                      color: AppColors.danger,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: Spacing.xs),
                  Text(
                    info.rejectionReason!,
                    style: typ.AppTypography.body.copyWith(
                      color: AppColors.danger,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: Spacing.lg),
          ],
          Text(
            'Please correct the issues above and resubmit your documents.',
            style: typ.AppTypography.body.copyWith(color: AppColors.inkSoft),
            textAlign: TextAlign.center,
          ),
          const Spacer(flex: 3),
          AppButton(
            label: 'Resubmit Documents',
            fullWidth: true,
            size: AppButtonSize.large,
            onPressed: () {
              HapticFeedback.lightImpact();
              context.push('/kyc/wizard', extra: {'resubmit': true});
            },
          ),
          const SizedBox(height: Spacing.xxl),
        ],
      ),
    );
  }
}

// ── Skeleton ──────────────────────────────────────────────────────

class _KycStatusSkeleton extends StatelessWidget {
  const _KycStatusSkeleton();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: Spacing.xl),
      child: SkeletonLoader(
        child: Column(
          children: [
            const Spacer(flex: 2),
            Center(
              child: Container(
                width: 120,
                height: 120,
                decoration: const BoxDecoration(
                  color: AppColors.shimmerBase,
                  shape: BoxShape.circle,
                ),
              ),
            ),
            const SizedBox(height: Spacing.xxl),
            Container(
              height: 28,
              width: 200,
              decoration: BoxDecoration(
                color: AppColors.shimmerBase,
                borderRadius: BorderRadius.circular(4),
              ),
            ),
            const SizedBox(height: Spacing.lg),
            Container(
              height: 16,
              decoration: BoxDecoration(
                color: AppColors.shimmerBase,
                borderRadius: BorderRadius.circular(4),
              ),
            ),
            const SizedBox(height: Spacing.sm),
            Container(
              height: 16,
              width: 240,
              decoration: BoxDecoration(
                color: AppColors.shimmerBase,
                borderRadius: BorderRadius.circular(4),
              ),
            ),
            const Spacer(flex: 3),
            Container(
              height: 52,
              decoration: BoxDecoration(
                color: AppColors.shimmerBase,
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            const SizedBox(height: Spacing.xxl),
          ],
        ),
      ),
    );
  }
}

// ── Error View ────────────────────────────────────────────────────

class _KycErrorView extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;

  const _KycErrorView({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(Spacing.xl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              PhosphorIconsFill.wifiSlash,
              size: 48,
              color: AppColors.inkMuted,
            ),
            const SizedBox(height: Spacing.lg),
            Text(
              'Could not load KYC status',
              style: typ.AppTypography.h4,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: Spacing.sm),
            Text(
              message,
              style: typ.AppTypography.bodySmall.copyWith(color: AppColors.inkSoft),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: Spacing.xl),
            AppButton(
              label: 'Retry',
              variant: AppButtonVariant.secondary,
              onPressed: onRetry,
            ),
          ],
        ),
      ),
    );
  }
}

// ── Info Row ──────────────────────────────────────────────────────

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String text;

  const _InfoRow({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 18, color: AppColors.inkSoft),
        const SizedBox(width: Spacing.md),
        Expanded(
          child: Text(
            text,
            style: typ.AppTypography.bodySmall.copyWith(color: AppColors.inkSoft),
          ),
        ),
      ],
    );
  }
}
