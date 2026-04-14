import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/typography.dart';
import '../../../shared/utils/format.dart';
import '../models/feed_models.dart';

/// Horizontal rail card (200px wide, 4:3 aspect).
/// Used in Near You and per-vertical section rails.
class FeedRailCard extends StatelessWidget {
  final FeedContentItem item;
  final VoidCallback? onTap;

  const FeedRailCard({super.key, required this.item, this.onTap});

  String get _typeLabel {
    switch (item.type) {
      case 'post':
        return 'Story';
      case 'itinerary':
        return 'Itinerary';
      case 'event':
        return 'Event';
      default:
        return item.type;
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 200,
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.border, width: 0.5),
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 4:3 cover image
            AspectRatio(
              aspectRatio: 4 / 3,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  Container(color: AppColors.sunken),
                  // Type pill
                  Positioned(
                    top: 8,
                    left: 8,
                    child: _TypePill(label: _typeLabel),
                  ),
                ],
              ),
            ),
            // Card body
            Padding(
              padding: const EdgeInsets.all(10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item.title,
                    style: AppTypography.body.copyWith(
                      color: AppColors.ink,
                      fontWeight: FontWeight.w600,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      if (item.startingCityId != null) ...[
                        const Icon(
                          Icons.location_on,
                          size: 11,
                          color: AppColors.softInk,
                        ),
                        const SizedBox(width: 2),
                        Expanded(
                          child: Text(
                            item.startingCityId!.split('.').last,
                            style: AppTypography.caption
                                .copyWith(color: AppColors.softInk),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ] else
                        const Spacer(),
                      Text(
                        formatPrice(item.pricePaisa),
                        style: AppTypography.caption.copyWith(
                          color: item.pricePaisa == 0
                              ? AppColors.success
                              : AppColors.ink,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TypePill extends StatelessWidget {
  final String label;
  const _TypePill({required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
      decoration: BoxDecoration(
        color: AppColors.ink.withValues(alpha: 0.75),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        label.toUpperCase(),
        style: AppTypography.caption.copyWith(
          color: AppColors.white,
          fontWeight: FontWeight.w600,
          fontSize: 9,
          letterSpacing: 0.5,
        ),
      ),
    );
  }
}

/// Discover creator chip (130px wide, coral-border avatar + follow button).
class DiscoverCreatorCard extends StatelessWidget {
  final String displayName;
  final String? avatarUrl;
  final String vertical;
  final VoidCallback? onFollow;

  const DiscoverCreatorCard({
    super.key,
    required this.displayName,
    this.avatarUrl,
    required this.vertical,
    this.onFollow,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 130,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border, width: 0.5),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Avatar with coral border
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: AppColors.coral, width: 2),
            ),
            child: ClipOval(
              child: avatarUrl != null
                  ? CachedNetworkImage(
                      imageUrl: avatarUrl!,
                      fit: BoxFit.cover,
                      placeholder: (_, _) => Container(color: AppColors.sunken),
                      errorWidget: (_, _, _) => _InitialsAvatar(name: displayName),
                    )
                  : _InitialsAvatar(name: displayName),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            displayName,
            style: AppTypography.bodySmall.copyWith(
              color: AppColors.ink,
              fontWeight: FontWeight.w600,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 2),
          Text(
            vertical.toUpperCase(),
            style: AppTypography.caption.copyWith(
              color: AppColors.softInk,
              fontSize: 9,
              letterSpacing: 0.5,
            ),
          ),
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            height: 30,
            child: OutlinedButton(
              onPressed: onFollow,
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: AppColors.coral),
                foregroundColor: AppColors.coral,
                padding: EdgeInsets.zero,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                textStyle: AppTypography.caption.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
              child: const Text('+ Follow'),
            ),
          ),
        ],
      ),
    );
  }
}

class _InitialsAvatar extends StatelessWidget {
  final String name;
  const _InitialsAvatar({required this.name});

  String get _initials {
    final parts = name.trim().split(' ');
    if (parts.length >= 2) return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    return name.isNotEmpty ? name[0].toUpperCase() : '?';
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.sunken,
      alignment: Alignment.center,
      child: Text(
        _initials,
        style: AppTypography.label.copyWith(
          color: AppColors.muted,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
