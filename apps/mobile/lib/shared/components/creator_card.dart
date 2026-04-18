import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../theme/colors.dart';
import '../theme/layout.dart';
import '../theme/spacing.dart';
import '../theme/typography.dart' as typ;
import '../theme/animations.dart';
import 'avatar.dart';
import 'button.dart';

/// Creator card: avatar, name, verticals, follower count, follow button.
class CreatorCard extends StatefulWidget {
  final String name;
  final String? avatarUrl;
  final List<String> verticals;
  final int followerCount;
  final bool isFollowing;
  final bool isVerified;
  final VoidCallback? onTap;
  final VoidCallback? onFollow;

  const CreatorCard({
    super.key,
    required this.name,
    this.avatarUrl,
    this.verticals = const [],
    this.followerCount = 0,
    this.isFollowing = false,
    this.isVerified = false,
    this.onTap,
    this.onFollow,
  });

  @override
  State<CreatorCard> createState() => _CreatorCardState();
}

class _CreatorCardState extends State<CreatorCard>
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

  @override
  Widget build(BuildContext context) {
    final reduceMotion = Anim.shouldReduceMotion(context);

    Widget card = Container(
      padding: const EdgeInsets.all(Layout.cardPadding),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(Layout.cardRadius),
        border: Border.all(color: AppColors.hairline, width: 0.5),
      ),
      child: Row(
        children: [
          // Avatar
          AppAvatar(
            imageUrl: widget.avatarUrl,
            name: widget.name,
            size: 56,
            showVerified: widget.isVerified,
          ),
          const SizedBox(width: Spacing.md),

          // Info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  widget.name,
                  style: typ.AppTypography.h4,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                if (widget.verticals.isNotEmpty) ...[
                  const SizedBox(height: 2),
                  Text(
                    widget.verticals.join(' · '),
                    style: typ.AppTypography.caption.copyWith(
                      color: AppColors.inkSoft,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
                const SizedBox(height: 2),
                Text(
                  _formatFollowers(widget.followerCount),
                  style: typ.AppTypography.caption,
                ),
              ],
            ),
          ),

          const SizedBox(width: Spacing.sm),

          // Follow button
          AppButton(
            label: widget.isFollowing ? 'Following' : 'Follow',
            variant: widget.isFollowing
                ? AppButtonVariant.secondary
                : AppButtonVariant.primary,
            size: AppButtonSize.small,
            onPressed: () {
              HapticFeedback.lightImpact();
              widget.onFollow?.call();
            },
          ),
        ],
      ),
    );

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
      onTapDown: (_) => _pressController.forward(),
      onTapUp: (_) => _pressController.reverse(),
      onTapCancel: () => _pressController.reverse(),
      onTap: () {
        HapticFeedback.lightImpact();
        widget.onTap?.call();
      },
      child: card,
    );
  }

  String _formatFollowers(int count) {
    if (count >= 1000000) return '${(count / 1000000).toStringAsFixed(1)}M followers';
    if (count >= 1000) return '${(count / 1000).toStringAsFixed(1)}K followers';
    return '$count ${count == 1 ? 'follower' : 'followers'}';
  }
}
