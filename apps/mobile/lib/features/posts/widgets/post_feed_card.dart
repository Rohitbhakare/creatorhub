import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart' show PhosphorIconsFill;

import '../../../shared/theme/colors.dart';
import '../../../shared/theme/typography.dart' as typ;
import '../../../shared/theme/spacing.dart';
import '../../../shared/theme/layout.dart';
import '../../../shared/theme/animations.dart';
import '../../../shared/components/avatar.dart';
import '../../../shared/components/badge.dart';
import '../../../shared/components/skeleton.dart';

/// Post feed card — displays a post summary in feed lists.
///
/// Shows cover image (16:9), "POST" badge, title, creator row,
/// and engagement counts. Taps navigate to post detail.
class PostFeedCard extends StatefulWidget {
  final String postId;
  final String title;
  final String? coverImageUrl;
  final String? coverImageBlurHash;
  final String creatorName;
  final String? creatorAvatarUrl;
  final int likeCount;
  final int commentCount;

  const PostFeedCard({
    super.key,
    required this.postId,
    required this.title,
    this.coverImageUrl,
    this.coverImageBlurHash,
    required this.creatorName,
    this.creatorAvatarUrl,
    this.likeCount = 0,
    this.commentCount = 0,
  });

  @override
  State<PostFeedCard> createState() => _PostFeedCardState();
}

class _PostFeedCardState extends State<PostFeedCard>
    with SingleTickerProviderStateMixin {
  late final AnimationController _pressController;
  late final Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _pressController = AnimationController(
      vsync: this,
      duration: Anim.cardPressDuration,
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: Anim.cardPressScale)
        .animate(CurvedAnimation(
      parent: _pressController,
      curve: Anim.pressCurve,
    ));
  }

  @override
  void dispose() {
    _pressController.dispose();
    super.dispose();
  }

  void _onTapDown(TapDownDetails _) {
    _pressController.forward();
  }

  void _onTapUp(TapUpDetails _) {
    _pressController.reverse();
  }

  void _onTapCancel() {
    _pressController.reverse();
  }

  void _onTap() {
    HapticFeedback.lightImpact();
    context.push('/posts/${widget.postId}');
  }

  @override
  Widget build(BuildContext context) {
    final reduceMotion = Anim.shouldReduceMotion(context);

    Widget card = Container(
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(Layout.cardRadius),
        border: Border.all(color: AppColors.border),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Cover image (16:9)
          _CoverImage(
            imageUrl: widget.coverImageUrl,
            blurHash: widget.coverImageBlurHash,
          ),

          // Content
          Padding(
            padding: const EdgeInsets.all(Layout.cardPaddingCompact),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Title
                Text(
                  widget.title,
                  style: typ.AppTypography.h4,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: Spacing.sm),

                // Creator row
                Row(
                  children: [
                    AppAvatar(
                      imageUrl: widget.creatorAvatarUrl,
                      name: widget.creatorName,
                      size: 24,
                    ),
                    const SizedBox(width: Spacing.sm),
                    Expanded(
                      child: Text(
                        widget.creatorName,
                        style: typ.AppTypography.bodySmall
                            .copyWith(color: AppColors.muted),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: Spacing.sm),

                // Engagement row
                Row(
                  children: [
                    const Icon(
                      PhosphorIconsFill.heart,
                      size: 14,
                      color: AppColors.softInk,
                    ),
                    const SizedBox(width: Spacing.xs),
                    Text(
                      _formatCount(widget.likeCount),
                      style: typ.AppTypography.caption,
                    ),
                    const SizedBox(width: Spacing.lg),
                    const Icon(
                      PhosphorIconsFill.chatCircle,
                      size: 14,
                      color: AppColors.softInk,
                    ),
                    const SizedBox(width: Spacing.xs),
                    Text(
                      _formatCount(widget.commentCount),
                      style: typ.AppTypography.caption,
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );

    // Wrap with press scale animation
    if (!reduceMotion) {
      card = AnimatedBuilder(
        animation: _scaleAnimation,
        builder: (context, child) => Transform.scale(
          scale: _scaleAnimation.value,
          child: child,
        ),
        child: card,
      );
    }

    return GestureDetector(
      onTapDown: _onTapDown,
      onTapUp: _onTapUp,
      onTapCancel: _onTapCancel,
      onTap: _onTap,
      child: card,
    );
  }

  String _formatCount(int count) {
    if (count <= 0) return '0';
    if (count >= 1000) return '${(count / 1000).toStringAsFixed(1)}k';
    return count.toString();
  }
}

/// Cover image with POST badge overlay.
class _CoverImage extends StatelessWidget {
  final String? imageUrl;
  final String? blurHash;

  const _CoverImage({
    this.imageUrl,
    this.blurHash,
  });

  @override
  Widget build(BuildContext context) {
    return AspectRatio(
      aspectRatio: 16 / 9,
      child: Stack(
        fit: StackFit.expand,
        children: [
          // Image or placeholder
          if (imageUrl != null && imageUrl!.isNotEmpty)
            CachedNetworkImage(
              imageUrl: imageUrl!,
              fit: BoxFit.cover,
              placeholder: (_, _) =>
                  const SkeletonRect(height: double.infinity, borderRadius: 0),
              errorWidget: (_, _, _) => _buildPlaceholder(),
            )
          else
            _buildPlaceholder(),

          // POST badge (top-left)
          const Positioned(
            top: Spacing.sm,
            left: Spacing.sm,
            child: CategoryBadge(label: 'POST', slug: 'post'),
          ),
        ],
      ),
    );
  }

  Widget _buildPlaceholder() {
    return Container(
      color: AppColors.sunken,
      child: const Center(
        child: Icon(
          PhosphorIconsFill.article,
          size: 36,
          color: AppColors.softInk,
        ),
      ),
    );
  }
}
