import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/typography.dart';
import 'feed_chip_rail.dart';

class BrowseByInterestTile {
  final String emoji;
  final String label;
  final String subCatId;
  final Color tint;

  const BrowseByInterestTile({
    required this.emoji,
    required this.label,
    required this.subCatId,
    required this.tint,
  });
}

const _kBrowseTiles = <BrowseByInterestTile>[
  BrowseByInterestTile(
    emoji: '🚗',
    label: 'Road Trips',
    subCatId: kFeedSubCatRoadTrips,
    tint: Color(0xFFFFF3E0),
  ),
  BrowseByInterestTile(
    emoji: '🏍️',
    label: 'Biking',
    subCatId: kFeedSubCatBiking,
    tint: Color(0xFFFFEBEE),
  ),
  BrowseByInterestTile(
    emoji: '🥾',
    label: 'Trekking',
    subCatId: kFeedSubCatTrekking,
    tint: Color(0xFFE8F5E9),
  ),
  BrowseByInterestTile(
    emoji: '🍜',
    label: 'Food Trails',
    subCatId: kFeedSubCatFoodTrails,
    tint: Color(0xFFFCE4EC),
  ),
];

/// 2-col tile grid that, on tap, applies a sub-cat chip filter on the home feed.
class BrowseByInterestGrid extends StatelessWidget {
  final ValueChanged<String> onSelectSubCat;

  const BrowseByInterestGrid({super.key, required this.onSelectSubCat});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 8),
      child: GridView.count(
        crossAxisCount: 2,
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        childAspectRatio: 1.55,
        children: [
          for (final t in _kBrowseTiles)
            _Tile(
              tile: t,
              onTap: () {
                HapticFeedback.selectionClick();
                onSelectSubCat(t.subCatId);
              },
            ),
        ],
      ),
    );
  }
}

class _Tile extends StatelessWidget {
  final BrowseByInterestTile tile;
  final VoidCallback onTap;

  const _Tile({required this.tile, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.fromLTRB(14, 12, 12, 12),
        decoration: BoxDecoration(
          color: tile.tint,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.hairline, width: 0.5),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(tile.emoji, style: const TextStyle(fontSize: 26)),
            Text(
              tile.label,
              style: AppTypography.h4.copyWith(
                color: AppColors.ink,
                fontSize: 16,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
