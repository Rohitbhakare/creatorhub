import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../shared/components/avatar.dart';
import '../../../shared/components/skeleton.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/layout.dart';
import '../../../shared/theme/spacing.dart';
import '../../../shared/theme/typography.dart' as typ;
import '../providers/review_provider.dart';
import '../widgets/rating_stars.dart';

/// Detail screen for a single review.
///
/// Layout:
/// - Reviewer avatar + name
/// - Star rating display (read-only)
/// - Review text (if revealed) or "Review pending reveal" placeholder
/// - Creator response card (if present and revealed)
/// - Reveal countdown badge if not yet revealed
class ReviewDetailScreen extends ConsumerWidget {
  final String reviewId;

  const ReviewDetailScreen({super.key, required this.reviewId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final reviewAsync = ref.watch(reviewDetailProvider(reviewId));

    return SafeArea(
      child: Scaffold(
        backgroundColor: AppColors.bg,
        appBar: AppBar(
          backgroundColor: AppColors.bg,
          elevation: 0,
          title: Text('Review', style: typ.AppTypography.h3),
          leading: IconButton(
            icon: const Icon(Icons.arrow_back, color: AppColors.ink),
            onPressed: () {
              HapticFeedback.lightImpact();
              context.pop();
            },
          ),
        ),
        body: reviewAsync.when(
          loading: () => const _ReviewDetailSkeleton(),
          error: (error, _) => _ReviewDetailError(message: error.toString()),
          data: (review) => _ReviewDetailContent(review: review),
        ),
      ),
    );
  }
}

// ── Content ──────────────────────────────────────────────────────

class _ReviewDetailContent extends StatelessWidget {
  final Review review;

  const _ReviewDetailContent({required this.review});

  @override
  Widget build(BuildContext context) {
    final displayName = review.reviewer?.displayName ?? 'Traveler';
    final avatarUrl = review.reviewer?.avatarUrl;

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(
        horizontal: Layout.screenPaddingH,
        vertical: Spacing.xl,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Reveal badge ─────────────────────────────────────
          if (!review.isRevealed)
            _RevealCountdownBanner(daysRemaining: review.daysUntilReveal),

          if (!review.isRevealed) const SizedBox(height: Spacing.lg),

          // ── Reviewer info ─────────────────────────────────────
          Row(
            children: [
              AppAvatar(
                imageUrl: avatarUrl,
                name: displayName,
                size: 48,
              ),
              const SizedBox(width: Spacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      displayName,
                      style: typ.AppTypography.h4,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: Spacing.xs),
                    RatingStars(
                      rating: review.rating.toDouble(),
                      size: 18,
                    ),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: Spacing.lg),
          const Divider(color: AppColors.hairline),
          const SizedBox(height: Spacing.lg),

          // ── Review text ───────────────────────────────────────
          Text('Review', style: typ.AppTypography.h4),
          const SizedBox(height: Spacing.sm),

          if (review.reviewerText != null)
            Text(
              review.reviewerText!,
              style: typ.AppTypography.body,
            )
          else
            const _PendingRevealPlaceholder(
              label: 'The reviewer\'s text will appear after reveal.',
            ),

          // ── Creator response ──────────────────────────────────
          if (review.isRevealed && review.creatorResponse != null) ...[
            const SizedBox(height: Spacing.xl),
            _CreatorResponseCard(response: review.creatorResponse!),
          ] else if (!review.isRevealed && review.creatorResponse != null) ...[
            const SizedBox(height: Spacing.xl),
            const _PendingRevealPlaceholder(
              label: 'Creator\'s response will appear after reveal.',
            ),
          ],

          const SizedBox(height: Spacing.xl),

          // ── Metadata ──────────────────────────────────────────
          Text(
            'Submitted ${_formatDate(review.createdAt)}',
            style: typ.AppTypography.caption,
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime dt) {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return '${months[dt.month - 1]} ${dt.day}, ${dt.year}';
  }
}

// ── Creator Response Card ─────────────────────────────────────────

class _CreatorResponseCard extends StatelessWidget {
  final String response;

  const _CreatorResponseCard({required this.response});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(Spacing.md),
      decoration: BoxDecoration(
        color: AppColors.surfaceAlt,
        borderRadius: BorderRadius.circular(Layout.cardRadius),
        border: Border.all(color: AppColors.hairline),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Creator response',
            style: typ.AppTypography.label.copyWith(color: AppColors.inkSoft),
          ),
          const SizedBox(height: Spacing.sm),
          Text(response, style: typ.AppTypography.body),
        ],
      ),
    );
  }
}

// ── Pending Reveal Placeholder ────────────────────────────────────

class _PendingRevealPlaceholder extends StatelessWidget {
  final String label;

  const _PendingRevealPlaceholder({required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(Spacing.md),
      decoration: BoxDecoration(
        color: AppColors.surfaceAlt,
        borderRadius: BorderRadius.circular(Layout.cardRadius),
        border: Border.all(
          color: AppColors.hairline,
          style: BorderStyle.solid,
        ),
      ),
      child: Text(
        label,
        style: typ.AppTypography.bodySmall.copyWith(
          color: AppColors.inkMuted,
          fontStyle: FontStyle.italic,
        ),
      ),
    );
  }
}

// ── Reveal Countdown Banner ───────────────────────────────────────

class _RevealCountdownBanner extends StatelessWidget {
  final int daysRemaining;

  const _RevealCountdownBanner({required this.daysRemaining});

  @override
  Widget build(BuildContext context) {
    final label = daysRemaining <= 0
        ? 'Revealing soon'
        : 'Reveals in $daysRemaining day${daysRemaining == 1 ? '' : 's'}';

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(
        horizontal: Spacing.md,
        vertical: Spacing.sm,
      ),
      decoration: BoxDecoration(
        color: AppColors.infoSurface,
        borderRadius: BorderRadius.circular(Layout.cardRadius),
        border: Border.all(color: AppColors.info.withValues(alpha: 0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.lock_clock, size: 16, color: AppColors.info),
          const SizedBox(width: Spacing.sm),
          Text(
            label,
            style: typ.AppTypography.bodySmall.copyWith(
              color: AppColors.info,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

// ── Skeleton ─────────────────────────────────────────────────────

class _ReviewDetailSkeleton extends StatelessWidget {
  const _ReviewDetailSkeleton();

  @override
  Widget build(BuildContext context) {
    return const SkeletonLoader(
      child: Padding(
        padding: EdgeInsets.symmetric(
          horizontal: Layout.screenPaddingH,
          vertical: Spacing.xl,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                SkeletonCircle(size: 48),
                SizedBox(width: Spacing.md),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SkeletonLine(width: 140, height: 16),
                    SizedBox(height: Spacing.xs),
                    SkeletonLine(width: 100, height: 12),
                  ],
                ),
              ],
            ),
            SizedBox(height: Spacing.lg),
            SkeletonLine(height: 1),
            SizedBox(height: Spacing.lg),
            SkeletonLine(width: 80, height: 14),
            SizedBox(height: Spacing.sm),
            SkeletonTextBlock(lines: 4),
          ],
        ),
      ),
    );
  }
}

// ── Error ─────────────────────────────────────────────────────────

class _ReviewDetailError extends StatelessWidget {
  final String message;

  const _ReviewDetailError({required this.message});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(Layout.screenPaddingH),
        child: Text(
          'Unable to load review.',
          style: typ.AppTypography.body.copyWith(color: AppColors.inkMuted),
          textAlign: TextAlign.center,
        ),
      ),
    );
  }
}
