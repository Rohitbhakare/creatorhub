import 'package:flutter/material.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/typography.dart';
import '../../../shared/utils/format.dart';

/// Reusable stats row: followers / following / posts.
/// Used in both You Tab and Profile View.
class ProfileStatsRow extends StatelessWidget {
  final int followerCount;
  final int followingCount;
  final int contentCount;
  final bool showContent;

  const ProfileStatsRow({
    super.key,
    required this.followerCount,
    required this.followingCount,
    required this.contentCount,
    this.showContent = false,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        _StatItem(count: followerCount, label: 'Followers'),
        const _StatDivider(),
        _StatItem(count: followingCount, label: 'Following'),
        if (showContent) ...[
          const _StatDivider(),
          _StatItem(count: contentCount, label: 'Posts'),
        ],
      ],
    );
  }
}

class _StatItem extends StatelessWidget {
  final int count;
  final String label;
  const _StatItem({required this.count, required this.label});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        children: [
          Text(
            formatCount(count),
            style: AppTypography.h4.copyWith(fontSize: 18),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: AppTypography.caption.copyWith(color: AppColors.inkSoft),
          ),
        ],
      ),
    );
  }
}

class _StatDivider extends StatelessWidget {
  const _StatDivider();

  @override
  Widget build(BuildContext context) {
    return Container(width: 1, height: 24, color: AppColors.hairlineStrong);
  }
}
