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

/// 4-col flex grid of compact tiles. Adding more tiles auto-wraps to next row.
/// Tap applies a sub-cat chip filter on the home feed.
class BrowseByInterestGrid extends StatelessWidget {
  final ValueChanged<String> onSelectSubCat;

  const BrowseByInterestGrid({super.key, required this.onSelectSubCat});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 8),
      child: GridView.count(
        crossAxisCount: 4,
        mainAxisSpacing: 10,
        crossAxisSpacing: 10,
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        childAspectRatio: 0.78,
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
    final base = tile.tint;
    final highlight = Color.alphaBlend(Colors.white.withValues(alpha: 0.55), base);
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          gradient: RadialGradient(
            center: const Alignment(-0.4, -0.6),
            radius: 1.2,
            colors: [highlight, base],
          ),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.hairline, width: 0.5),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 8),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(tile.emoji, style: const TextStyle(fontSize: 24, height: 1.0)),
            const SizedBox(height: 6),
            Text(
              tile.label,
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AppTypography.caption.copyWith(
                color: AppColors.ink,
                fontWeight: FontWeight.w600,
                fontSize: 11,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
