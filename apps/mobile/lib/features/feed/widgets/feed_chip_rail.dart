import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/typography.dart';

// Nav chip ids (audience scope)
const kFeedNavNearYou = 'near_you';
const kFeedNavFollowing = 'following';

// Sub-cat chip ids (filter)
const kFeedSubCatAll = 'all';
const kFeedSubCatPosts = 'posts';
const kFeedSubCatRoadTrips = 'travel.road_trips';
const kFeedSubCatBiking = 'travel.biking';
const kFeedSubCatTrekking = 'travel.trekking';
const kFeedSubCatFoodTrails = 'travel.food_trails';

class FeedChipSelection {
  final String navId;
  final String subCatId;

  const FeedChipSelection({required this.navId, required this.subCatId});

  FeedChipSelection copyWith({String? navId, String? subCatId}) =>
      FeedChipSelection(
        navId: navId ?? this.navId,
        subCatId: subCatId ?? this.subCatId,
      );

  @override
  bool operator ==(Object other) =>
      other is FeedChipSelection &&
      other.navId == navId &&
      other.subCatId == subCatId;

  @override
  int get hashCode => Object.hash(navId, subCatId);
}

/// Horizontal chip rail: 2 nav chips + separator + 6 sub-cat chips.
///
/// Travel-only launch model:
/// - Nav (audience): Near you / Following — single-select, default Near you.
/// - Sub-cat (filter): All / Posts / 4 active sub-cats — single-select, default All.
/// - All + Posts + sub-cat are compounding-aware on the screen side
///   (e.g. Posts + Trekking → trekking-typed posts only).
class FeedChipRail extends StatelessWidget {
  final FeedChipSelection selection;
  final ValueChanged<FeedChipSelection> onSelectionChange;

  const FeedChipRail({
    super.key,
    required this.selection,
    required this.onSelectionChange,
  });

  void _selectNav(String id) {
    if (selection.navId == id) return;
    HapticFeedback.selectionClick();
    onSelectionChange(selection.copyWith(navId: id));
  }

  void _selectSubCat(String id) {
    if (selection.subCatId == id) return;
    HapticFeedback.selectionClick();
    onSelectionChange(selection.copyWith(subCatId: id));
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 52,
      color: AppColors.surface,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        children: [
          _NavChip(
            label: 'Near you',
            selected: selection.navId == kFeedNavNearYou,
            onTap: () => _selectNav(kFeedNavNearYou),
          ),
          const SizedBox(width: 8),
          _NavChip(
            label: 'Following',
            selected: selection.navId == kFeedNavFollowing,
            onTap: () => _selectNav(kFeedNavFollowing),
          ),
          const SizedBox(width: 12),
          Center(
            child: Container(
              width: 1,
              height: 18,
              color: AppColors.hairlineStrong,
            ),
          ),
          const SizedBox(width: 12),
          _SubCatChip(
            label: 'All',
            selected: selection.subCatId == kFeedSubCatAll,
            onTap: () => _selectSubCat(kFeedSubCatAll),
          ),
          const SizedBox(width: 8),
          _SubCatChip(
            label: 'Posts',
            selected: selection.subCatId == kFeedSubCatPosts,
            onTap: () => _selectSubCat(kFeedSubCatPosts),
          ),
          const SizedBox(width: 8),
          _SubCatChip(
            emoji: '🚗',
            label: 'Road Trips',
            selected: selection.subCatId == kFeedSubCatRoadTrips,
            onTap: () => _selectSubCat(kFeedSubCatRoadTrips),
          ),
          const SizedBox(width: 8),
          _SubCatChip(
            emoji: '🏍️',
            label: 'Biking',
            selected: selection.subCatId == kFeedSubCatBiking,
            onTap: () => _selectSubCat(kFeedSubCatBiking),
          ),
          const SizedBox(width: 8),
          _SubCatChip(
            emoji: '🥾',
            label: 'Trekking',
            selected: selection.subCatId == kFeedSubCatTrekking,
            onTap: () => _selectSubCat(kFeedSubCatTrekking),
          ),
          const SizedBox(width: 8),
          _SubCatChip(
            emoji: '🍜',
            label: 'Food Trails',
            selected: selection.subCatId == kFeedSubCatFoodTrails,
            onTap: () => _selectSubCat(kFeedSubCatFoodTrails),
          ),
          const SizedBox(width: 16),
        ],
      ),
    );
  }
}

class _NavChip extends StatefulWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _NavChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  @override
  State<_NavChip> createState() => _NavChipState();
}

class _NavChipState extends State<_NavChip>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 120),
    );
    _scale = TweenSequence([
      TweenSequenceItem(tween: Tween(begin: 1.0, end: 1.04), weight: 50),
      TweenSequenceItem(tween: Tween(begin: 1.04, end: 1.0), weight: 50),
    ]).animate(CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut));
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  void _onTap() {
    _ctrl.forward(from: 0);
    widget.onTap();
  }

  @override
  Widget build(BuildContext context) {
    return ScaleTransition(
      scale: _scale,
      child: GestureDetector(
        onTap: _onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
          decoration: BoxDecoration(
            color: widget.selected ? AppColors.ink : AppColors.surfaceAlt,
            borderRadius: BorderRadius.circular(999),
          ),
          child: Text(
            widget.label,
            style: AppTypography.label.copyWith(
              color: widget.selected ? AppColors.surface : AppColors.inkMuted,
              fontWeight: widget.selected ? FontWeight.w600 : FontWeight.w500,
              fontSize: 13,
            ),
          ),
        ),
      ),
    );
  }
}

class _SubCatChip extends StatefulWidget {
  final String label;
  final String? emoji;
  final bool selected;
  final VoidCallback onTap;

  const _SubCatChip({
    required this.label,
    this.emoji,
    required this.selected,
    required this.onTap,
  });

  @override
  State<_SubCatChip> createState() => _SubCatChipState();
}

class _SubCatChipState extends State<_SubCatChip>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 120),
    );
    _scale = TweenSequence([
      TweenSequenceItem(tween: Tween(begin: 1.0, end: 1.04), weight: 50),
      TweenSequenceItem(tween: Tween(begin: 1.04, end: 1.0), weight: 50),
    ]).animate(CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut));
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  void _onTap() {
    _ctrl.forward(from: 0);
    widget.onTap();
  }

  @override
  Widget build(BuildContext context) {
    final selected = widget.selected;
    return ScaleTransition(
      scale: _scale,
      child: GestureDetector(
        onTap: _onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
          decoration: BoxDecoration(
            color: selected ? AppColors.ink : AppColors.surfaceAlt,
            borderRadius: BorderRadius.circular(999),
            border: selected
                ? null
                : Border.all(color: AppColors.hairline, width: 0.5),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (widget.emoji != null) ...[
                Text(widget.emoji!, style: const TextStyle(fontSize: 13)),
                const SizedBox(width: 5),
              ],
              Text(
                widget.label,
                style: AppTypography.label.copyWith(
                  color: selected ? AppColors.surface : AppColors.inkSoft,
                  fontWeight: selected ? FontWeight.w600 : FontWeight.w500,
                  fontSize: 13,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
