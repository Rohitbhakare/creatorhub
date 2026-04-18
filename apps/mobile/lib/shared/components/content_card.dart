import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../theme/colors.dart';
import '../theme/layout.dart';
import '../theme/spacing.dart';
import '../theme/typography.dart' as typ;
import '../theme/animations.dart';
import '../utils/format.dart';
import 'avatar.dart';
import 'badge.dart';

/// Polymorphic content card (post, itinerary, experience, event).
/// Image + title + creator row + vertical badge + price/free badge + save button.
class ContentCard extends StatefulWidget {
  final String? imageUrl;
  final String title;
  final String creatorName;
  final String? creatorAvatarUrl;
  final String? verticalSlug;
  final String? verticalLabel;
  final int priceInPaisa;
  final bool isSaved;
  final VoidCallback? onTap;
  final VoidCallback? onSave;
  final VoidCallback? onCreatorTap;

  const ContentCard({
    super.key,
    this.imageUrl,
    required this.title,
    required this.creatorName,
    this.creatorAvatarUrl,
    this.verticalSlug,
    this.verticalLabel,
    this.priceInPaisa = 0,
    this.isSaved = false,
    this.onTap,
    this.onSave,
    this.onCreatorTap,
  });

  @override
  State<ContentCard> createState() => _ContentCardState();
}

class _ContentCardState extends State<ContentCard>
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

    Widget card = _buildCard();

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

  Widget _buildCard() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Image with overlays
        _buildImage(),
        const SizedBox(height: Spacing.sm),

        // Title
        Text(
          widget.title,
          style: typ.AppTypography.h4,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
        ),
        const SizedBox(height: Spacing.xs),

        // Creator row
        _buildCreatorRow(),
      ],
    );
  }

  Widget _buildImage() {
    return ClipRRect(
      borderRadius: BorderRadius.circular(Layout.cardRadius),
      child: AspectRatio(
        aspectRatio: 16 / 10,
        child: Stack(
          fit: StackFit.expand,
          children: [
            // Image
            if (widget.imageUrl != null)
              CachedNetworkImage(
                imageUrl: widget.imageUrl!,
                fit: BoxFit.cover,
                placeholder: (_, _) => Container(
                  color: _verticalColor.withValues(alpha: 0.15),
                ),
                errorWidget: (_, _, _) => Container(
                  color: _verticalColor.withValues(alpha: 0.15),
                  child: Icon(Icons.image, color: _verticalColor, size: 40),
                ),
              )
            else
              Container(
                color: _verticalColor.withValues(alpha: 0.15),
                child: Icon(Icons.image, color: _verticalColor, size: 40),
              ),

            // Save button (top right)
            Positioned(
              top: Spacing.sm,
              right: Spacing.sm,
              child: GestureDetector(
                onTap: () {
                  HapticFeedback.lightImpact();
                  widget.onSave?.call();
                },
                child: Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: AppColors.surface.withValues(alpha: 0.9),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    widget.isSaved
                        ? Icons.bookmark
                        : Icons.bookmark_border,
                    size: 20,
                    color:
                        widget.isSaved ? AppColors.coral : AppColors.ink,
                  ),
                ),
              ),
            ),

            // Price badge (bottom left)
            Positioned(
              bottom: Spacing.sm,
              left: Spacing.sm,
              child: _PriceBadge(priceInPaisa: widget.priceInPaisa),
            ),

            // Vertical badge (bottom right)
            if (widget.verticalLabel != null)
              Positioned(
                bottom: Spacing.sm,
                right: Spacing.sm,
                child: CategoryBadge(
                  label: widget.verticalLabel!,
                  slug: widget.verticalSlug ?? '',
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildCreatorRow() {
    return GestureDetector(
      onTap: widget.onCreatorTap,
      child: Row(
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
              style: typ.AppTypography.bodySmall.copyWith(
                color: AppColors.inkSoft,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }

  Color get _verticalColor {
    if (widget.verticalSlug == null) return AppColors.inkMuted;
    return AppColors.verticalColors[widget.verticalSlug] ??
        AppColors.storyColors[widget.verticalSlug] ??
        AppColors.inkMuted;
  }
}

/// Price badge: "FREE" (green) or "₹X,XXX" (ink).
class _PriceBadge extends StatelessWidget {
  final int priceInPaisa;

  const _PriceBadge({required this.priceInPaisa});

  @override
  Widget build(BuildContext context) {
    final isFree = priceInPaisa <= 0;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.surface.withValues(alpha: 0.92),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        formatPrice(priceInPaisa),
        style: typ.AppTypography.label.copyWith(
          color: isFree ? AppColors.success : AppColors.ink,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}
