import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart' show PhosphorIconsFill;

import '../../../shared/components/soft_auth_wall.dart' show showSoftAuthWall;
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/layout.dart';
import '../../../shared/theme/spacing.dart';
import '../../../shared/theme/typography.dart' as typ;
import '../../../shared/utils/format.dart';
import '../../auth/providers/auth_provider.dart';
import '../../saved/providers/saved_provider.dart';
import '../../saved/widgets/save_to_list_sheet.dart';
import '../providers/like_provider.dart';
import '../utils/share_utils.dart';
import 'comments_sheet.dart';

/// Shared bottom engagement bar used in post, itinerary, and event detail screens.
///
/// Layout: [❤ count]  [💬 count]  [WhatsApp]  [↗ Share]    [🔖]
///
/// Like and save are optimistic. Guest users see soft auth wall on like/save.
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

    // Save state — family provider keyed by contentId
    final saveStatus = ref.watch(saveStatusProvider(contentId));
    final isSaved = saveStatus.isNotEmpty;

    final isAuth = ref.watch(authProvider.select((s) => s.isAuthenticated));

    return Container(
      padding: EdgeInsets.only(
        left: Layout.screenPaddingH,
        right: Layout.screenPaddingH,
        top: Spacing.md,
        bottom: Spacing.md + MediaQuery.of(context).padding.bottom,
      ),
      decoration: const BoxDecoration(
        color: AppColors.surface,
        border: Border(top: BorderSide(color: AppColors.border, width: 1)),
      ),
      child: Row(
        children: [
          // ── Like ────────────────────────────────────────────
          _EngagementAction(
            icon: likeState.isLiked ? PhosphorIconsFill.heart : PhosphorIconsFill.heart,
            label: likeState.likeCount > 0 ? formatCount(likeState.likeCount) : '',
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
            icon: PhosphorIconsFill.chatCircle,
            label: commentCount > 0 ? formatCount(commentCount) : '',
            isActive: false,
            onTap: () {
              HapticFeedback.lightImpact();
              showCommentsSheet(context, contentId, commentCount);
            },
          ),
          const SizedBox(width: Spacing.xl),

          // ── WhatsApp share ───────────────────────────────────
          _EngagementAction(
            icon: PhosphorIconsFill.shareNetwork,
            label: '',
            isActive: false,
            activeColor: const Color(0xFF25D366),
            onTap: () {
              HapticFeedback.lightImpact();
              shareWhatsApp(
                title: contentTitle,
                contentId: contentId,
                contentType: contentType,
                ref: ref,
              );
            },
          ),

          // ── Native share ─────────────────────────────────────
          _EngagementAction(
            icon: PhosphorIconsFill.shareFat,
            label: '',
            isActive: false,
            onTap: () {
              HapticFeedback.lightImpact();
              shareNative(
                title: contentTitle,
                contentId: contentId,
                contentType: contentType,
                ref: ref,
              );
            },
          ),

          const Spacer(),

          // ── Save/Bookmark ────────────────────────────────────
          _EngagementAction(
            icon: PhosphorIconsFill.bookmarkSimple,
            label: '',
            isActive: isSaved,
            activeColor: AppColors.coral,
            onTap: () {
              HapticFeedback.lightImpact();
              if (!isAuth) {
                showSoftAuthWall(context, ref, 'save this');
                return;
              }
              showSaveToListSheet(context, ref, contentId);
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

  const _EngagementAction({
    required this.icon,
    required this.label,
    required this.isActive,
    this.activeColor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final color = isActive ? (activeColor ?? AppColors.coral) : AppColors.muted;

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
                style: typ.AppTypography.bodySmall.copyWith(color: color),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

