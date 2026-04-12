import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../shared/theme/colors.dart';
import '../../../shared/theme/typography.dart' as typ;
import '../../../shared/theme/spacing.dart';
import '../../../shared/theme/layout.dart';
import '../../../shared/theme/animations.dart';

/// Reusable card for the content type picker grid.
///
/// Displays an icon, title, subtitle, and an optional badge.
/// Disabled cards show reduced opacity and ignore taps.
class ContentTypeCard extends StatefulWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final String? badgeText;
  final Color? badgeColor;
  final bool enabled;
  final VoidCallback? onTap;

  const ContentTypeCard({
    super.key,
    required this.icon,
    required this.title,
    required this.subtitle,
    this.badgeText,
    this.badgeColor,
    this.enabled = true,
    this.onTap,
  });

  @override
  State<ContentTypeCard> createState() => _ContentTypeCardState();
}

class _ContentTypeCardState extends State<ContentTypeCard>
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
    if (widget.enabled) _pressController.forward();
  }

  void _onTapUp(TapUpDetails _) {
    _pressController.reverse();
  }

  void _onTapCancel() {
    _pressController.reverse();
  }

  void _onTap() {
    if (!widget.enabled) return;
    HapticFeedback.lightImpact();
    widget.onTap?.call();
  }

  @override
  Widget build(BuildContext context) {
    final Widget card = AnimatedBuilder(
      animation: _scaleAnimation,
      builder: (context, child) => Transform.scale(
        scale: _scaleAnimation.value,
        child: child,
      ),
      child: Opacity(
        opacity: widget.enabled ? 1.0 : 0.4,
        child: Container(
          constraints: const BoxConstraints(
            minHeight: Layout.minTapTarget,
          ),
          decoration: BoxDecoration(
            color: AppColors.white,
            borderRadius: BorderRadius.circular(Layout.cardRadius),
            border: Border.all(color: AppColors.border),
            boxShadow: widget.enabled
                ? const [
                    BoxShadow(
                      color: Color(0x0A2C2823),
                      blurRadius: 8,
                      offset: Offset(0, 2),
                    ),
                  ]
                : null,
          ),
          padding: const EdgeInsets.all(Layout.cardPadding),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Icon
              Icon(
                widget.icon,
                size: 64,
                color: widget.enabled ? AppColors.coral : AppColors.softInk,
              ),
              const SizedBox(height: Spacing.md),

              // Title
              Text(
                widget.title,
                style: typ.AppTypography.h4,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: Spacing.xs),

              // Subtitle
              Text(
                widget.subtitle,
                style: typ.AppTypography.caption,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),

              // Badge
              if (widget.badgeText != null) ...[
                const SizedBox(height: Spacing.sm),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 3,
                  ),
                  decoration: BoxDecoration(
                    color: (widget.badgeColor ?? AppColors.muted)
                        .withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    widget.badgeText!,
                    style: typ.AppTypography.label.copyWith(
                      color: widget.badgeColor ?? AppColors.muted,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );

    return GestureDetector(
      onTapDown: _onTapDown,
      onTapUp: _onTapUp,
      onTapCancel: _onTapCancel,
      onTap: _onTap,
      behavior: HitTestBehavior.opaque,
      child: card,
    );
  }
}
