import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/typography.dart';

// Nav chip ids
const kFeedNavForYou = 'for_you';
const kFeedNavFollowing = 'following';
const kFeedNavNearYou = 'near_you';

// Category chip ids
const kFeedCatTravel = 'travel';
const kFeedCatStories = 'stories';

/// Horizontally scrollable chip rail combining navigation + category filters.
///
/// Nav chips (For you / Following / Near you) switch the feed view.
/// Category chips (Travel / Stories) trigger a scroll-jump to the relevant
/// section — only functional when [selectedNavId] == [kFeedNavForYou].
class FeedChipRail extends StatelessWidget {
  final String selectedNavId;
  final void Function(String navId) onNavSelect;
  final void Function(String vertical) onCategoryJump;

  const FeedChipRail({
    super.key,
    required this.selectedNavId,
    required this.onNavSelect,
    required this.onCategoryJump,
  });

  bool get _categoryActive => selectedNavId == kFeedNavForYou;

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
            label: 'For you',
            id: kFeedNavForYou,
            selected: selectedNavId == kFeedNavForYou,
            onTap: () {
              HapticFeedback.selectionClick();
              onNavSelect(kFeedNavForYou);
            },
          ),
          const SizedBox(width: 8),
          _NavChip(
            label: 'Following',
            id: kFeedNavFollowing,
            selected: selectedNavId == kFeedNavFollowing,
            onTap: () {
              HapticFeedback.selectionClick();
              onNavSelect(kFeedNavFollowing);
            },
          ),
          const SizedBox(width: 8),
          _NavChip(
            label: 'Near you',
            id: kFeedNavNearYou,
            selected: selectedNavId == kFeedNavNearYou,
            onTap: () {
              HapticFeedback.selectionClick();
              onNavSelect(kFeedNavNearYou);
            },
          ),
          const SizedBox(width: 12),
          // Thin vertical separator
          Center(
            child: Container(
              width: 1,
              height: 18,
              color: AppColors.hairlineStrong,
            ),
          ),
          const SizedBox(width: 12),
          // Category chips — dimmed when not in For-you tab
          Opacity(
            opacity: _categoryActive ? 1.0 : 0.4,
            child: _CategoryChip(
              label: 'Travel',
              icon: PhosphorIcons.mountains(PhosphorIconsStyle.regular),
              onTap: () {
                HapticFeedback.selectionClick();
                onCategoryJump(kFeedCatTravel);
              },
            ),
          ),
          const SizedBox(width: 8),
          Opacity(
            opacity: _categoryActive ? 1.0 : 0.4,
            child: _CategoryChip(
              label: 'Stories',
              icon: PhosphorIcons.bookOpen(PhosphorIconsStyle.regular),
              onTap: () {
                HapticFeedback.selectionClick();
                onCategoryJump(kFeedCatStories);
              },
            ),
          ),
          const SizedBox(width: 16),
        ],
      ),
    );
  }
}

class _NavChip extends StatefulWidget {
  final String label;
  final String id;
  final bool selected;
  final VoidCallback onTap;

  const _NavChip({
    required this.label,
    required this.id,
    required this.selected,
    required this.onTap,
  });

  @override
  State<_NavChip> createState() => _NavChipState();
}

class _NavChipState extends State<_NavChip> with SingleTickerProviderStateMixin {
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

class _CategoryChip extends StatefulWidget {
  final String label;
  final IconData icon;
  final VoidCallback onTap;

  const _CategoryChip({
    required this.label,
    required this.icon,
    required this.onTap,
  });

  @override
  State<_CategoryChip> createState() => _CategoryChipState();
}

class _CategoryChipState extends State<_CategoryChip>
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
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
          decoration: BoxDecoration(
            color: AppColors.surfaceAlt,
            borderRadius: BorderRadius.circular(999),
            border: Border.all(color: AppColors.hairline, width: 0.5),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(widget.icon, size: 12, color: AppColors.inkSoft),
              const SizedBox(width: 5),
              Text(
                widget.label,
                style: AppTypography.label.copyWith(
                  color: AppColors.inkSoft,
                  fontWeight: FontWeight.w500,
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
