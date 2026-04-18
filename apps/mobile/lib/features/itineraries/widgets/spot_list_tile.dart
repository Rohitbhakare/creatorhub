import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart' show PhosphorIconsFill;

import '../../../shared/theme/colors.dart';
import '../../../shared/theme/typography.dart' as typ;
import '../../../shared/theme/spacing.dart';
import '../../../shared/theme/layout.dart';
import '../../../shared/utils/format.dart';
import '../providers/itinerary_wizard_provider.dart';

/// Reusable tile for displaying a spot in a day's spot list.
///
/// Shows thumbnail, name, stop type, duration, creator note,
/// and a drag handle for reordering.
class SpotListTile extends StatelessWidget {
  final SpotState spot;
  final int index;
  final VoidCallback? onTap;
  final VoidCallback? onRemove;
  final bool showDragHandle;

  const SpotListTile({
    super.key,
    required this.spot,
    required this.index,
    this.onTap,
    this.onRemove,
    this.showDragHandle = true,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        if (onTap != null) {
          HapticFeedback.lightImpact();
          onTap!();
        }
      },
      behavior: HitTestBehavior.opaque,
      child: Container(
        padding: const EdgeInsets.symmetric(
          horizontal: Layout.cardPadding,
          vertical: Spacing.md,
        ),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(Layout.cardRadius),
          border: Border.all(color: AppColors.hairline),
        ),
        child: Row(
          children: [
            // Spot number indicator
            Container(
              width: 24,
              height: 24,
              decoration: BoxDecoration(
                color: AppColors.surfaceAlt,
                shape: BoxShape.circle,
                border: Border.all(color: AppColors.hairline),
              ),
              child: Center(
                child: Text(
                  '${index + 1}',
                  style: typ.AppTypography.label.copyWith(
                    color: AppColors.ink,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ),
            const SizedBox(width: Spacing.md),

            // Thumbnail
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: SizedBox(
                width: 48,
                height: 48,
                child: spot.thumbnailUrl != null
                    ? CachedNetworkImage(
                        imageUrl: spot.thumbnailUrl!,
                        fit: BoxFit.cover,
                        placeholder: (_, _) => Container(
                          color: AppColors.shimmerBase,
                        ),
                        errorWidget: (_, _, _) => _SpotPlaceholder(
                          stopType: spot.stopType,
                        ),
                      )
                    : _SpotPlaceholder(stopType: spot.stopType),
              ),
            ),
            const SizedBox(width: Spacing.md),

            // Name, stop type, note
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          spot.name,
                          style: typ.AppTypography.body.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: Spacing.xs),
                  Row(
                    children: [
                      _StopTypeDot(stopType: spot.stopType),
                      const SizedBox(width: Spacing.xs),
                      Text(
                        spot.stopType.label,
                        style: typ.AppTypography.caption.copyWith(
                          color: _stopTypeColor(spot.stopType),
                        ),
                      ),
                      if (spot.durationMinutes != null) ...[
                        const SizedBox(width: Spacing.sm),
                        Text(
                          '\u00B7',
                          style: typ.AppTypography.caption,
                        ),
                        const SizedBox(width: Spacing.sm),
                        Text(
                          formatDuration(spot.durationMinutes!),
                          style: typ.AppTypography.caption,
                        ),
                      ],
                    ],
                  ),
                  if (spot.creatorNote != null &&
                      spot.creatorNote!.isNotEmpty) ...[
                    const SizedBox(height: Spacing.xs),
                    Text(
                      spot.creatorNote!,
                      style: typ.AppTypography.caption
                          .copyWith(color: AppColors.inkSoft),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ],
              ),
            ),

            // Remove + drag handle
            if (onRemove != null)
              GestureDetector(
                onTap: () {
                  HapticFeedback.lightImpact();
                  onRemove!();
                },
                behavior: HitTestBehavior.opaque,
                child: const Padding(
                  padding: EdgeInsets.all(Spacing.xs),
                  child: Icon(
                    PhosphorIconsFill.trash,
                    size: 18,
                    color: AppColors.inkSoft,
                  ),
                ),
              ),
            if (showDragHandle) ...[
              const SizedBox(width: Spacing.xs),
              const Icon(
                PhosphorIconsFill.dotsSixVertical,
                size: 20,
                color: AppColors.hairlineStrong,
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// Colored dot for stop type.
class _StopTypeDot extends StatelessWidget {
  final StopType stopType;

  const _StopTypeDot({required this.stopType});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 8,
      height: 8,
      decoration: BoxDecoration(
        color: _stopTypeColor(stopType),
        shape: BoxShape.circle,
      ),
    );
  }
}

/// Placeholder icon for spot thumbnail.
class _SpotPlaceholder extends StatelessWidget {
  final StopType stopType;

  const _SpotPlaceholder({required this.stopType});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.surfaceAlt,
      child: Center(
        child: Icon(
          _stopTypeIcon(stopType),
          size: 22,
          color: AppColors.inkMuted,
        ),
      ),
    );
  }
}

/// Get the color for a stop type.
Color _stopTypeColor(StopType stopType) {
  return switch (stopType) {
    StopType.regular => AppColors.info,
    StopType.overnight => AppColors.coral,
    StopType.meal => AppColors.warning,
    StopType.viewpoint => AppColors.success,
    StopType.activity => const Color(0xFF7B61FF),
  };
}

/// Get the icon for a stop type.
IconData _stopTypeIcon(StopType stopType) {
  return switch (stopType) {
    StopType.regular => PhosphorIconsFill.mapPin,
    StopType.overnight => PhosphorIconsFill.bed,
    StopType.meal => PhosphorIconsFill.forkKnife,
    StopType.viewpoint => PhosphorIconsFill.binoculars,
    StopType.activity => PhosphorIconsFill.mountains,
  };
}
