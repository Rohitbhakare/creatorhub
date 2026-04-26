import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../../../shared/theme/colors.dart';
import '../../../shared/theme/typography.dart';
import '../../feed/widgets/section_header.dart';

class _CatTile {
  final String label;
  final IconData icon;
  final String? routeSlug; // null => not yet active
  final int? approxCount;

  const _CatTile({
    required this.label,
    required this.icon,
    this.routeSlug,
    this.approxCount,
  });

  bool get active => routeSlug != null;
}

// Phosphor icon picks per DD-013 monochrome rule. Counts are placeholders
// until the per-sub-cat live count endpoint lands; founder OK'd showing
// rough numbers for the four active sub-cats.
final List<_CatTile> _kTiles = [
  _CatTile(
    label: 'Road Trips',
    icon: PhosphorIcons.car(PhosphorIconsStyle.regular),
    routeSlug: 'travel.road_trips',
    approxCount: 247,
  ),
  _CatTile(
    label: 'Biking',
    icon: PhosphorIcons.motorcycle(PhosphorIconsStyle.regular),
    routeSlug: 'travel.biking',
    approxCount: 89,
  ),
  _CatTile(
    label: 'Trekking',
    icon: PhosphorIcons.mountains(PhosphorIconsStyle.regular),
    routeSlug: 'travel.trekking',
    approxCount: 156,
  ),
  _CatTile(
    label: 'Food Trails',
    icon: PhosphorIcons.forkKnife(PhosphorIconsStyle.regular),
    routeSlug: 'travel.food_trails',
    approxCount: 78,
  ),
  _CatTile(
    label: 'Adventure',
    icon: PhosphorIcons.compass(PhosphorIconsStyle.regular),
  ),
  _CatTile(
    label: 'Heritage',
    icon: PhosphorIcons.bank(PhosphorIconsStyle.regular),
  ),
  _CatTile(
    label: 'Wildlife',
    icon: PhosphorIcons.bird(PhosphorIconsStyle.regular),
  ),
  _CatTile(
    label: 'Photo Walks',
    icon: PhosphorIcons.camera(PhosphorIconsStyle.regular),
  ),
  _CatTile(
    label: 'Wellness',
    icon: PhosphorIcons.leaf(PhosphorIconsStyle.regular),
  ),
  _CatTile(
    label: 'Family',
    icon: PhosphorIcons.users(PhosphorIconsStyle.regular),
  ),
  _CatTile(
    label: 'Luxury',
    icon: PhosphorIcons.sparkle(PhosphorIconsStyle.regular),
  ),
  _CatTile(
    label: 'Offbeat',
    icon: PhosphorIcons.mapPin(PhosphorIconsStyle.regular),
  ),
];

/// 2-column grid of all 12 travel sub-categories. Active sub-cats route
/// to the existing locked-filter section screen; inactive sub-cats render
/// dimmed with a SOON pill so the roadmap is visible without faking data.
class BrowseByCategoryGrid extends StatelessWidget {
  const BrowseByCategoryGrid({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SectionHeader(
          eyebrow: 'BROWSE',
          title: 'Browse by category',
          subtitle: '12 ways to wander',
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 10,
            crossAxisSpacing: 10,
            childAspectRatio: 1.55,
            children: [
              for (final tile in _kTiles)
                _CategoryTile(
                  tile: tile,
                  onTap: tile.active
                      ? () {
                          HapticFeedback.selectionClick();
                          context.push('/feed/section/sub-cat/${tile.routeSlug}');
                        }
                      : null,
                ),
            ],
          ),
        ),
        const SizedBox(height: 28),
      ],
    );
  }
}

class _CategoryTile extends StatelessWidget {
  final _CatTile tile;
  final VoidCallback? onTap;

  const _CategoryTile({required this.tile, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final dimmed = tile.routeSlug == null;
    final body = Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.hairline, width: 0.5),
      ),
      padding: const EdgeInsets.all(14),
      child: Stack(
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Icon(tile.icon, size: 24, color: AppColors.ink),
              const SizedBox(height: 10),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    tile.label,
                    style: AppTypography.body.copyWith(
                      color: AppColors.ink,
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                    ),
                  ),
                  if (tile.approxCount != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      '${tile.approxCount} trips',
                      style: AppTypography.caption.copyWith(
                        color: AppColors.inkMuted,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ],
              ),
            ],
          ),
          if (dimmed)
            Positioned(
              top: 0,
              right: 0,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(4),
                  border: Border.all(color: AppColors.hairline, width: 0.5),
                ),
                child: Text(
                  'SOON',
                  style: AppTypography.label.copyWith(
                    color: AppColors.inkSoft,
                    fontSize: 9,
                    letterSpacing: 0.8,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ),
        ],
      ),
    );

    final wrapped = dimmed ? Opacity(opacity: 0.55, child: body) : body;

    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: onTap,
      child: wrapped,
    );
  }
}
