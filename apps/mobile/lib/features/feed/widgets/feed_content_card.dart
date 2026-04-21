import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/typography.dart';
import '../../../shared/utils/format.dart';
import '../models/feed_models.dart';

/// Horizontal rail card (200px wide).
/// Used in Near You and per-vertical section rails.
class FeedRailCard extends StatelessWidget {
  final FeedContentItem item;
  final VoidCallback? onTap;

  const FeedRailCard({super.key, required this.item, this.onTap});

  String get _typeLabel {
    switch (item.type) {
      case 'post':
        return 'Story';
      case 'self_paced_itinerary':
      case 'itinerary':
        return 'Itinerary';
      case 'scheduled_experience':
        return 'Experience';
      case 'event':
        return 'Event';
      default:
        return item.type.replaceAll('_', ' ');
    }
  }

  @override
  Widget build(BuildContext context) {
    final creatorName = item.creator?.displayName;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 200,
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.hairline, width: 0.5),
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Cover image — 16:10 aspect
            AspectRatio(
              aspectRatio: 16 / 10,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  if (item.coverImageUrl != null)
                    CachedNetworkImage(
                      imageUrl: item.coverImageUrl!,
                      fit: BoxFit.cover,
                      placeholder: (_, __) => Container(
                        decoration: const BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                            colors: [AppColors.surfaceAlt, AppColors.hairline],
                          ),
                        ),
                      ),
                      errorWidget: (_, __, ___) => Container(
                        decoration: const BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                            colors: [AppColors.surfaceAlt, AppColors.hairline],
                          ),
                        ),
                      ),
                    )
                  else
                    Container(
                      decoration: const BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [AppColors.surfaceAlt, AppColors.hairline],
                        ),
                      ),
                    ),
                  // Type pill (top-left)
                  Positioned(
                    top: 8,
                    left: 8,
                    child: _TypePill(label: _typeLabel),
                  ),
                ],
              ),
            ),
            // Card body
            Expanded(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(10, 8, 10, 10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Title
                    Text(
                      item.title,
                      style: AppTypography.bodySmall.copyWith(
                        color: AppColors.ink,
                        fontWeight: FontWeight.w600,
                        height: 1.3,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const Spacer(),
                    // Bottom row: creator + price
                    Row(
                      children: [
                        // Creator avatar
                        if (creatorName != null) ...[
                          _CreatorInitial(name: creatorName),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text(
                              creatorName,
                              style: AppTypography.caption.copyWith(
                                color: AppColors.inkMuted,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ] else
                          const Spacer(),
                        const SizedBox(width: 6),
                        // Price tag
                        Text(
                          formatPrice(item.pricePaisa),
                          style: AppTypography.caption.copyWith(
                            color: item.pricePaisa == 0
                                ? AppColors.success
                                : AppColors.ink,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Small colored circle with first initial — for card creator row.
class _CreatorInitial extends StatelessWidget {
  final String name;
  const _CreatorInitial({required this.name});

  // Stable color from name hash
  static const _colors = [
    Color(0xFFB8860B), // amber
    Color(0xFF5A7247), // olive
    Color(0xFF7C5CBF), // violet
    Color(0xFFE15A41), // coral
    Color(0xFF3B7DD8), // blue
    Color(0xFF2D8F6F), // jade
    Color(0xFF8B4F8B), // plum
    Color(0xFF888888), // gray
  ];

  @override
  Widget build(BuildContext context) {
    final color = _colors[name.hashCode.abs() % _colors.length];
    final initial = name.isNotEmpty ? name[0].toUpperCase() : '?';

    return Container(
      width: 18,
      height: 18,
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        shape: BoxShape.circle,
      ),
      alignment: Alignment.center,
      child: Text(
        initial,
        style: TextStyle(
          fontSize: 9,
          fontWeight: FontWeight.w700,
          color: color,
          height: 1,
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
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.ink.withValues(alpha: 0.7),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        label,
        style: AppTypography.caption.copyWith(
          color: AppColors.surface,
          fontWeight: FontWeight.w600,
          fontSize: 10,
          letterSpacing: 0.3,
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
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.hairline, width: 0.5),
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
                      placeholder: (_, _) => Container(color: AppColors.surfaceAlt),
                      errorWidget: (_, _, _) =>
                          _InitialsAvatar(name: displayName),
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
              color: AppColors.inkMuted,
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
      color: AppColors.surfaceAlt,
      alignment: Alignment.center,
      child: Text(
        _initials,
        style: AppTypography.label.copyWith(
          color: AppColors.inkSoft,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
