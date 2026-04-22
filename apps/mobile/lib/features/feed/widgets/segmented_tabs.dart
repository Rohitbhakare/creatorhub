import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/typography.dart';

class SegmentedTab {
  final String id;
  final String label;
  const SegmentedTab({required this.id, required this.label});
}

/// Full-width 3-up segmented control. Active tab is ink-filled; inactive
/// tabs are transparent text on the surface-alt track.
class SegmentedTabs extends StatelessWidget {
  final List<SegmentedTab> tabs;
  final String selectedId;
  final void Function(String id) onSelect;

  const SegmentedTabs({
    super.key,
    required this.tabs,
    required this.selectedId,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Container(
        height: 40,
        padding: const EdgeInsets.all(4),
        decoration: BoxDecoration(
          color: AppColors.surfaceAlt,
          borderRadius: BorderRadius.circular(22),
        ),
        child: Row(
          children: tabs.map((t) {
            final active = selectedId == t.id;
            return Expanded(
              child: GestureDetector(
                behavior: HitTestBehavior.opaque,
                onTap: () {
                  if (active) return;
                  HapticFeedback.selectionClick();
                  onSelect(t.id);
                },
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 160),
                  curve: Curves.easeOut,
                  decoration: BoxDecoration(
                    color: active ? AppColors.ink : Colors.transparent,
                    borderRadius: BorderRadius.circular(18),
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    t.label,
                    style: AppTypography.bodySmall.copyWith(
                      color: active ? AppColors.surface : AppColors.inkSoft,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ),
    );
  }
}
