import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../features/reviews/widgets/rating_stars.dart';
import '../theme/colors.dart';
import '../theme/spacing.dart';
import '../theme/typography.dart';
import '../utils/format.dart';
import 'initial_avatar.dart';

/// One recent review summary entry shown in the block.
class RecentReview {
  final String reviewerName;
  final String? reviewerAvatarUrl;
  final double rating;
  final String body;
  final DateTime createdAt;

  const RecentReview({
    required this.reviewerName,
    this.reviewerAvatarUrl,
    required this.rating,
    required this.body,
    required this.createdAt,
  });
}

/// Aggregate review block: large average + 5-bar histogram + 3 recent
/// reviews + see-all link. Strict monochrome — no coral on bars.
class ReviewSummaryBlock extends StatelessWidget {
  final double average;
  final int count;

  /// Distribution keyed by star value (1..5) → number of reviews.
  final Map<int, int> breakdown;
  final List<RecentReview> recent;
  final VoidCallback? onSeeAllTap;

  const ReviewSummaryBlock({
    super.key,
    required this.average,
    required this.count,
    required this.breakdown,
    required this.recent,
    this.onSeeAllTap,
  });

  int get _total {
    var sum = 0;
    for (final v in breakdown.values) {
      sum += v;
    }
    return sum == 0 ? count : sum;
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSummaryRow(),
        const SizedBox(height: Spacing.lg),
        _buildHistogram(),
        if (recent.isNotEmpty) ...[
          const SizedBox(height: Spacing.xl),
          ...recent
              .take(3)
              .map((r) => Padding(
                    padding: const EdgeInsets.only(bottom: Spacing.lg),
                    child: _RecentReviewTile(review: r),
                  )),
        ],
        if (onSeeAllTap != null && count > 0)
          _SeeAllButton(label: 'See all $count', onTap: onSeeAllTap!),
      ],
    );
  }

  Widget _buildSummaryRow() {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Text(
          average.toStringAsFixed(1),
          style: GoogleFonts.fraunces(
            fontSize: 32,
            fontWeight: FontWeight.w600,
            height: 1.1,
            color: AppColors.ink,
          ),
        ),
        const SizedBox(width: Spacing.md),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            RatingStars(rating: average, size: 18),
            const SizedBox(height: 2),
            Text(
              '($count ${count == 1 ? 'review' : 'reviews'})',
              style: AppTypography.bodySmall.copyWith(
                color: AppColors.inkSoft,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildHistogram() {
    final total = _total;
    return Column(
      children: List.generate(5, (i) {
        final star = 5 - i;
        final value = breakdown[star] ?? 0;
        final ratio = total == 0 ? 0.0 : value / total;
        return Padding(
          padding: EdgeInsets.only(bottom: i == 4 ? 0 : Spacing.xs),
          child: _HistogramRow(star: star, ratio: ratio, count: value),
        );
      }),
    );
  }
}

class _HistogramRow extends StatelessWidget {
  final int star;
  final double ratio;
  final int count;

  const _HistogramRow({
    required this.star,
    required this.ratio,
    required this.count,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        SizedBox(
          width: 16,
          child: Text(
            '$star',
            style: AppTypography.caption.copyWith(color: AppColors.inkSoft),
          ),
        ),
        const SizedBox(width: Spacing.sm),
        Expanded(
          child: ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: Stack(
              children: [
                Container(height: 8, color: AppColors.hairline),
                FractionallySizedBox(
                  widthFactor: ratio.clamp(0.0, 1.0),
                  child: Container(
                    height: 8,
                    color: AppColors.inkSoft,
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(width: Spacing.sm),
        SizedBox(
          width: 32,
          child: Text(
            '$count',
            textAlign: TextAlign.right,
            style: AppTypography.caption.copyWith(color: AppColors.inkSoft),
          ),
        ),
      ],
    );
  }
}

class _RecentReviewTile extends StatelessWidget {
  final RecentReview review;
  const _RecentReviewTile({required this.review});

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        InitialAvatar(
          name: review.reviewerName,
          avatarUrl: review.reviewerAvatarUrl,
          size: 36,
        ),
        const SizedBox(width: Spacing.md),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Flexible(
                    child: Text(
                      review.reviewerName,
                      style: AppTypography.bodySmall.copyWith(
                        fontWeight: FontWeight.w600,
                        color: AppColors.ink,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(width: Spacing.sm),
                  RatingStars(rating: review.rating, size: 12),
                ],
              ),
              const SizedBox(height: 2),
              Text(
                review.body,
                style: AppTypography.bodySmall,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 2),
              Text(
                formatTimeAgo(review.createdAt),
                style: AppTypography.caption,
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _SeeAllButton extends StatelessWidget {
  final String label;
  final VoidCallback onTap;

  const _SeeAllButton({required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: () {
        HapticFeedback.lightImpact();
        onTap();
      },
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: Spacing.xs),
        child: Text(
          '$label →',
          style: AppTypography.body.copyWith(
            fontWeight: FontWeight.w600,
            color: AppColors.ink,
          ),
        ),
      ),
    );
  }
}
