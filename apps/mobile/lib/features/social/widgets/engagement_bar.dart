import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../../../shared/components/soft_auth_wall.dart' show showSoftAuthWall;
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/layout.dart';
import '../../../shared/theme/spacing.dart';
import '../../../shared/theme/typography.dart' as typ;
import '../../../shared/utils/format.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/like_provider.dart';
import 'comments_sheet.dart';

/// Shared bottom engagement bar — like count + comment count only.
/// Share and save are handled by the hero image overlay buttons.
class EngagementBar extends ConsumerWidget {
  final String contentId;
  final String contentType; // 'post' | 'itinerary' | 'event'
  final String contentTitle;
  final bool initialIsLiked;
  final int initialLikeCount;
  final int commentCount;
  final bool initialIsSaved;

  const EngagementBar({
    super.key,
    required this.contentId,
    required this.contentType,
    required this.contentTitle,
    required this.initialIsLiked,
    required this.initialLikeCount,
    required this.commentCount,
    required this.initialIsSaved,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Like state — family provider seeded with initial values
    final likeKey = (contentId: contentId, isLiked: initialIsLiked, likeCount: initialLikeCount);
    final likeState = ref.watch(likeProvider(likeKey));

    final isAuth = ref.watch(authProvider.select((s) => s.isAuthenticated));

    return Container(
      key: const Key('engagement_bar'),
      padding: EdgeInsets.only(
        left: Layout.screenPaddingH,
        right: Layout.screenPaddingH,
        top: Spacing.md,
        bottom: Spacing.md + MediaQuery.of(context).padding.bottom,
      ),
      decoration: const BoxDecoration(
        color: AppColors.bg,
        border: Border(top: BorderSide(color: AppColors.hairline, width: 1)),
      ),
      child: Row(
        children: [
          // ── Like ────────────────────────────────────────────
          _EngagementAction(
            key: likeState.isLiked
                ? const Key('btn_like_active')
                : const Key('btn_like'),
            icon: likeState.isLiked
                ? PhosphorIconsFill.heart
                : PhosphorIcons.heart(PhosphorIconsStyle.regular),
            label: likeState.likeCount > 0 ? formatCount(likeState.likeCount) : '',
            labelKey: const Key('like_count'),
            isActive: likeState.isLiked,
            activeColor: AppColors.danger,
            onTap: () {
              HapticFeedback.lightImpact();
              if (!isAuth) {
                showSoftAuthWall(context, ref, 'like this');
                return;
              }
              ref.read(likeProvider(likeKey).notifier).toggle();
            },
          ),
          const SizedBox(width: Spacing.xl),

          // ── Comment ─────────────────────────────────────────
          _EngagementAction(
            icon: PhosphorIcons.chatCircle(PhosphorIconsStyle.regular),
            label: commentCount > 0 ? formatCount(commentCount) : '',
            isActive: false,
            onTap: () {
              HapticFeedback.lightImpact();
              showCommentsSheet(context, contentId, commentCount);
            },
          ),

        ],
      ),
    );
  }
}

// ── Action Button ─────────────────────────────────────────────────

class _EngagementAction extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool isActive;
  final Color? activeColor;
  final VoidCallback onTap;
  final Key? labelKey;

  const _EngagementAction({
    super.key,
    required this.icon,
    required this.label,
    required this.isActive,
    this.activeColor,
    required this.onTap,
    this.labelKey,
  });

  @override
  Widget build(BuildContext context) {
    final color = isActive ? (activeColor ?? AppColors.coral) : AppColors.inkSoft;

    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: SizedBox(
        height: Layout.minTapTarget,
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 22, color: color),
            if (label.isNotEmpty) ...[
              const SizedBox(width: Spacing.xs),
              Text(
                label,
                key: labelKey,
                style: typ.AppTypography.bodySmall.copyWith(color: color),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
