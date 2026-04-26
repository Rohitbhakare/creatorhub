import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';

import '../../../shared/components/category_tile.dart';
import '../../feed/widgets/section_header.dart';

/// One canonical entry per travel sub-category. Same emoji/tint set as
/// onboarding's vertical picker so the two surfaces match. Active sub-cats
/// route to the locked-filter section screen; inactive ones render dimmed
/// with a SOON pill.
class _CatTile {
  final String label;
  final String emoji;
  final Color tint;
  final String? routeSlug;

  const _CatTile({
    required this.label,
    required this.emoji,
    required this.tint,
    this.routeSlug,
  });

  bool get active => routeSlug != null;
}

const List<_CatTile> _kTiles = [
  _CatTile(
    label: 'Road Trips',
    emoji: '🚗',
    tint: Color(0xFFFFF3E0),
    routeSlug: 'travel.road_trips',
  ),
  _CatTile(
    label: 'Biking',
    emoji: '🏍️',
    tint: Color(0xFFFFEBEE),
    routeSlug: 'travel.biking',
  ),
  _CatTile(
    label: 'Trekking',
    emoji: '🥾',
    tint: Color(0xFFE8F5E9),
    routeSlug: 'travel.trekking',
  ),
  _CatTile(
    label: 'Food Trails',
    emoji: '🍜',
    tint: Color(0xFFFCE4EC),
    routeSlug: 'travel.food_trails',
  ),
  _CatTile(label: 'Adventure', emoji: '🏔️', tint: Color(0xFFE3F2FD)),
  _CatTile(label: 'Heritage', emoji: '🏛️', tint: Color(0xFFFFF8E1)),
  _CatTile(label: 'Wildlife', emoji: '🦌', tint: Color(0xFFEFEBE9)),
  _CatTile(label: 'Photo Walks', emoji: '📷', tint: Color(0xFFEDE7F6)),
  _CatTile(label: 'Wellness', emoji: '🧘', tint: Color(0xFFE0F2F1)),
  _CatTile(label: 'Family', emoji: '👨‍👩‍👧', tint: Color(0xFFFFF0F0)),
  _CatTile(label: 'Luxury', emoji: '✨', tint: Color(0xFFF3E5F5)),
  _CatTile(label: 'Offbeat', emoji: '🧭', tint: Color(0xFFE8EAF6)),
];

/// 4-col grid of all 12 travel sub-categories. Card visuals come from the
/// shared `CategoryTile` widget so this matches the onboarding picker.
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
            crossAxisCount: 4,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 10,
            crossAxisSpacing: 10,
            childAspectRatio: 0.92,
            children: [
              for (final tile in _kTiles)
                CategoryTile(
                  emoji: tile.emoji,
                  label: tile.label,
                  tint: tile.tint,
                  soon: !tile.active,
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
        const SizedBox(height: 20),
      ],
    );
  }
}
