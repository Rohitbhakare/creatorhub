import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../shared/components/avatar.dart';
import '../../../shared/components/empty_state.dart';
import '../../../shared/components/skeleton.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/layout.dart';
import '../../../shared/theme/spacing.dart';
import '../../../shared/theme/typography.dart' as typ;
import '../providers/review_provider.dart';
import 'rating_stars.dart';

/// Displays the full reviews section for a content piece.
///
/// Renders:
/// - Average rating badge + count
/// - List of review tiles (revealed reviews only for public)
/// - Skeleton shimmer while loading
/// - Empty state when no reviews
class ReviewsList extends ConsumerWidget {
  final String contentId;

  const ReviewsList({super.key, required this.contentId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final reviewsAsync = ref.watch(reviewsProvider(contentId));

    return reviewsAsync.when(
      loading: () => const _ReviewsListSkeleton(),
      error: (e, s) => const _ReviewsErrorState(),
      data: (result) => _ReviewsContent(result: result),
    );
  }
}

// ── Content ──────────────────────────────────────────────────────

class _ReviewsContent extends StatelessWidget {
  final ReviewsResult result;

  const _ReviewsContent({required this.result});

  @override
  Widget build(BuildContext context) {
    if (result.items.isEmpty) {
      return const EmptyState(
        title: 'No reviews yet',
        description: 'Reviews appear 14 days after each completed experience.',
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Header: average rating + count
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: Layout.screenPaddingH),
          child: Row(
            children: [
              Text('Reviews', style: typ.AppTypography.h3),
              const Spacer(),
              RatingBadge(
                rating: result.averageRating,
                reviewCount: result.items.length,
              ),
            ],
          ),
        ),
        const SizedBox(height: Spacing.md),

        // Review tiles
        ListView.separated(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: result.items.length,
          separatorBuilder: (context, index) => const Divider(
            height: 1,
            color: AppColors.border,
            indent: Layout.screenPaddingH,
            endIndent: Layout.screenPaddingH,
          ),
          itemBuilder: (context, i) => _ReviewTile(review: result.items[i]),
        ),
      ],
    );
  }
}

// ── Review Tile ───────────────────────────────────────────────────

class _ReviewTile extends StatelessWidget {
  final Review review;

  const _ReviewTile({required this.review});

  @override
  Widget build(BuildContext context) {
    final displayName = review.reviewer?.displayName ?? 'Traveler';
    final avatarUrl = review.reviewer?.avatarUrl;

    return InkWell(
      onTap: () => context.push('/reviews/${review.id}'),
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: Layout.screenPaddingH,
          vertical: Spacing.md,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Reviewer row
            Row(
              children: [
                AppAvatar(
                  imageUrl: avatarUrl,
                  name: displayName,
                  size: 36,
                ),
                const SizedBox(width: Spacing.sm),
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
                      const SizedBox(height: 2),
                      RatingStars(rating: review.rating.toDouble(), size: 14),
                    ],
                  ),
                ),

                // Reveal badge if not revealed
                if (!review.isRevealed)
                  _RevealBadge(daysRemaining: review.daysUntilReveal),
              ],
            ),

            // Review text
            if (review.reviewerText != null) ...[
              const SizedBox(height: Spacing.sm),
              Text(
                review.reviewerText!,
                style: typ.AppTypography.body.copyWith(color: AppColors.muted),
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
              ),
            ] else if (!review.isRevealed) ...[
              const SizedBox(height: Spacing.sm),
              Text(
                'Review pending reveal',
                style: typ.AppTypography.bodySmall.copyWith(
                  color: AppColors.softInk,
                  fontStyle: FontStyle.italic,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

// ── Reveal Badge ─────────────────────────────────────────────────

class _RevealBadge extends StatelessWidget {
  final int daysRemaining;

  const _RevealBadge({required this.daysRemaining});

  @override
  Widget build(BuildContext context) {
    final label = daysRemaining == 0 ? 'Revealing soon' : 'Reveals in $daysRemaining d';
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.infoSurface,
        borderRadius: BorderRadius.circular(Layout.chipRadius),
      ),
      child: Text(
        label,
        style: const TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: AppColors.info,
        ),
      ),
    );
  }
}

// ── Skeleton ─────────────────────────────────────────────────────

class _ReviewsListSkeleton extends StatelessWidget {
  const _ReviewsListSkeleton();

  @override
  Widget build(BuildContext context) {
    return SkeletonLoader(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: List.generate(3, (_) => const _ReviewTileSkeleton()),
      ),
    );
  }
}

class _ReviewTileSkeleton extends StatelessWidget {
  const _ReviewTileSkeleton();

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.symmetric(
        horizontal: Layout.screenPaddingH,
        vertical: Spacing.md,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              SkeletonCircle(size: 36),
              SizedBox(width: Spacing.sm),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SkeletonLine(width: 120, height: 14),
                  SizedBox(height: 4),
                  SkeletonLine(width: 80, height: 10),
                ],
              ),
            ],
          ),
          SizedBox(height: Spacing.sm),
          SkeletonLine(height: 13),
          SizedBox(height: 4),
          SkeletonLine(width: 200, height: 13),
        ],
      ),
    );
  }
}

// ── Error State ───────────────────────────────────────────────────

class _ReviewsErrorState extends StatelessWidget {
  const _ReviewsErrorState();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(Layout.screenPaddingH),
      child: Text(
        'Unable to load reviews.',
        style: typ.AppTypography.bodySmall.copyWith(color: AppColors.softInk),
      ),
    );
  }
}
