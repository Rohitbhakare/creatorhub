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
import '../../../shared/utils/format.dart';

/// Feed card for itineraries in the home feed or search results.
///
/// Shows cover image (16:9), ITINERARY badge, day count, title,
/// creator, stats, and price.
class ItineraryFeedCard extends StatefulWidget {
  final String id;
  final String title;
  final String? coverImageUrl;
  final int dayCount;
  final int totalSpots;
  final double? totalDistanceKm;
  final String pricingModel;
  final int pricePaisa;
  final String creatorName;
  final String? creatorAvatarUrl;

  const ItineraryFeedCard({
    super.key,
    required this.id,
    required this.title,
    this.coverImageUrl,
    required this.dayCount,
    required this.totalSpots,
    this.totalDistanceKm,
    required this.pricingModel,
    required this.pricePaisa,
    required this.creatorName,
    this.creatorAvatarUrl,
  });

  @override
  State<ItineraryFeedCard> createState() => _ItineraryFeedCardState();
}

class _ItineraryFeedCardState extends State<ItineraryFeedCard>
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

  void _onTap() {
    HapticFeedback.lightImpact();
    context.push('/itineraries/${widget.id}');
  }

  @override
  Widget build(BuildContext context) {
    final isFree = widget.pricingModel == 'free';
    final reduceMotion = Anim.shouldReduceMotion(context);

    Widget card = Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(Layout.cardRadius),
        border: Border.all(color: AppColors.hairline),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Cover image (16:9)
          AspectRatio(
            aspectRatio: 16 / 9,
            child: Stack(
              fit: StackFit.expand,
              children: [
                // Image
                widget.coverImageUrl != null
                    ? CachedNetworkImage(
                        imageUrl: widget.coverImageUrl!,
                        fit: BoxFit.cover,
                        placeholder: (_, _) => Container(
                          color: AppColors.shimmerBase,
                        ),
                        errorWidget: (_, _, _) =>
                            _CoverPlaceholder(),
                      )
                    : _CoverPlaceholder(),

                // ITINERARY badge (top-left)
                Positioned(
                  top: Spacing.sm,
                  left: Spacing.sm,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: Spacing.sm,
                      vertical: Spacing.xs,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.ink.withValues(alpha: 0.7),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      'ITINERARY',
                      style: typ.AppTypography.label.copyWith(
                        color: AppColors.surface,
                        fontSize: 10,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ),
                ),

                // Day count badge (top-right)
                Positioned(
                  top: Spacing.sm,
                  right: Spacing.sm,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: Spacing.sm,
                      vertical: Spacing.xs,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.surface.withValues(alpha: 0.9),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          PhosphorIconsFill.calendarDots,
                          size: 12,
                          color: AppColors.ink,
                        ),
                        const SizedBox(width: Spacing.xs),
                        Text(
                          '${widget.dayCount} ${widget.dayCount == 1 ? 'day' : 'days'}',
                          style: typ.AppTypography.label.copyWith(
                            color: AppColors.ink,
                            fontSize: 10,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Content
          Padding(
            padding: const EdgeInsets.all(Layout.cardPaddingCompact),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Title (2 lines max)
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
                    ClipOval(
                      child: SizedBox(
                        width: 20,
                        height: 20,
                        child: widget.creatorAvatarUrl != null
                            ? CachedNetworkImage(
                                imageUrl: widget.creatorAvatarUrl!,
                                fit: BoxFit.cover,
                                placeholder: (_, _) => Container(
                                  color: AppColors.shimmerBase,
                                ),
                                errorWidget: (_, _, _) => Container(
                                  color: AppColors.surfaceAlt,
                                  child: const Icon(
                                    PhosphorIconsFill.user,
                                    size: 12,
                                    color: AppColors.inkMuted,
                                  ),
                                ),
                              )
                            : Container(
                                color: AppColors.surfaceAlt,
                                child: const Icon(
                                  PhosphorIconsFill.user,
                                  size: 12,
                                  color: AppColors.inkMuted,
                                ),
                              ),
                      ),
                    ),
                    const SizedBox(width: Spacing.sm),
                    Expanded(
                      child: Text(
                        widget.creatorName,
                        style: typ.AppTypography.caption
                            .copyWith(color: AppColors.inkSoft),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: Spacing.sm),

                // Stats row + price
                Row(
                  children: [
                    // Stats
                    Expanded(
                      child: Text(
                        _buildStatsText(),
                        style: typ.AppTypography.caption
                            .copyWith(color: AppColors.inkMuted),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: Spacing.sm),

                    // Price badge
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: Spacing.sm,
                        vertical: Spacing.xs,
                      ),
                      decoration: BoxDecoration(
                        color: isFree
                            ? AppColors.successSurface
                            : AppColors.coralSurface,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        formatPrice(widget.pricePaisa),
                        style: typ.AppTypography.label.copyWith(
                          color: isFree ? AppColors.success : AppColors.coral,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );

    // Press animation
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
      onTap: _onTap,
      child: card,
    );
  }

  String _buildStatsText() {
    final parts = <String>[];
    parts.add(
        '${widget.totalSpots} ${widget.totalSpots == 1 ? 'spot' : 'spots'}');
    if (widget.totalDistanceKm != null && widget.totalDistanceKm! > 0) {
      parts.add('${widget.totalDistanceKm!.toStringAsFixed(0)} km');
    }
    return parts.join(' \u00B7 ');
  }
}

/// Placeholder for missing cover image.
class _CoverPlaceholder extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.surfaceAlt,
      child: Center(
        child: Icon(
          PhosphorIconsFill.mapTrifold,
          size: 40,
          color: AppColors.inkMuted.withValues(alpha: 0.5),
        ),
      ),
    );
  }
}
