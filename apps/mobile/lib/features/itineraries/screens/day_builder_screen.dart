import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart' show PhosphorIconsFill;

import '../../../shared/theme/colors.dart';
import '../../../shared/theme/typography.dart' as typ;
import '../../../shared/theme/spacing.dart';
import '../../../shared/theme/layout.dart';
import '../../../shared/components/empty_state.dart';
import '../../../shared/utils/format.dart';
import '../../content/providers/wizard_provider.dart';
import '../providers/itinerary_wizard_provider.dart';
import '../widgets/spot_list_tile.dart';
import '../widgets/spot_picker_sheet.dart';
import '../widgets/spot_editor_sheet.dart';

/// Day Builder step (step 3 of 6 for itinerary wizard).
///
/// Shows horizontal day tabs and a vertical list of spots for each day.
/// Uses a FAB to add new spots via the SpotPickerSheet.
class DayBuilderStep extends ConsumerStatefulWidget {
  const DayBuilderStep({super.key});

  @override
  ConsumerState<DayBuilderStep> createState() => _DayBuilderStepState();
}

class _DayBuilderStepState extends ConsumerState<DayBuilderStep> {
  @override
  void initState() {
    super.initState();
    // Sync days on first build
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final dayCount = ref.read(wizardProvider).dayCount;
      ref.read(itineraryWizardProvider.notifier).syncDays(dayCount);
    });
  }

  Future<void> _onAddSpot() async {
    unawaited(HapticFeedback.lightImpact());

    // Step 1: Pick a place
    final placeResult = await showModalBottomSheet<PlaceResult>(
      context: context,
      isScrollControlled: true,
      constraints: BoxConstraints(
        maxHeight:
            MediaQuery.of(context).size.height * Layout.sheetMaxHeightFactor,
      ),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(Layout.sheetRadius),
        ),
      ),
      builder: (context) => const SpotPickerSheet(),
    );

    if (placeResult == null || !mounted) return;

    // Step 2: Configure the spot
    final spotState = await showModalBottomSheet<SpotState>(
      context: context,
      isScrollControlled: true,
      constraints: BoxConstraints(
        maxHeight:
            MediaQuery.of(context).size.height * Layout.sheetMaxHeightFactor,
      ),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(Layout.sheetRadius),
        ),
      ),
      builder: (context) => SpotEditorSheet(place: placeResult),
    );

    if (spotState == null || !mounted) return;

    // Step 3: Add spot to the selected day
    final dayIndex = ref.read(itineraryWizardProvider).selectedDayIndex;
    ref.read(itineraryWizardProvider.notifier).addSpot(dayIndex, spotState);
  }

  @override
  Widget build(BuildContext context) {
    final itinWizard = ref.watch(itineraryWizardProvider);
    final days = itinWizard.days;
    final selectedIndex = itinWizard.selectedDayIndex;

    if (days.isEmpty) {
      return const EmptyState(
        icon: PhosphorIconsFill.mapTrifold,
        title: 'No days set up',
        description: 'Go back to set the number of days first',
      );
    }

    final selectedDay = days[selectedIndex];

    return Stack(
      children: [
        Column(
          children: [
            const SizedBox(height: Spacing.sm),

            // Day tab bar
            SizedBox(
              height: Layout.minTapTarget,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(
                  horizontal: Layout.screenPaddingH,
                ),
                itemCount: days.length,
                separatorBuilder: (_, _) =>
                    const SizedBox(width: Spacing.sm),
                itemBuilder: (context, index) {
                  final isSelected = index == selectedIndex;
                  return _DayTab(
                    label: 'Day ${index + 1}',
                    isSelected: isSelected,
                    spotCount: days[index].spots.length,
                    onTap: () {
                      HapticFeedback.selectionClick();
                      ref
                          .read(itineraryWizardProvider.notifier)
                          .selectDay(index);
                    },
                  );
                },
              ),
            ),
            const SizedBox(height: Spacing.sm),

            // Day summary bar
            if (selectedDay.spots.isNotEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: Layout.screenPaddingH,
                ),
                child: _DaySummaryBar(day: selectedDay),
              ),
            if (selectedDay.spots.isNotEmpty)
              const SizedBox(height: Spacing.sm),

            // Spot list
            Expanded(
              child: selectedDay.spots.isEmpty
                  ? EmptyState(
                      icon: PhosphorIconsFill.mapPinPlus,
                      title: 'Add your first spot',
                      description:
                          'Tap the + button to search for places to visit on Day ${selectedIndex + 1}',
                      ctaLabel: 'Add Spot',
                      onCtaPressed: _onAddSpot,
                    )
                  : ReorderableListView.builder(
                      padding: const EdgeInsets.symmetric(
                        horizontal: Layout.screenPaddingH,
                        vertical: Spacing.sm,
                      ),
                      itemCount: selectedDay.spots.length,
                      onReorder: (oldIndex, newIndex) {
                        HapticFeedback.mediumImpact();
                        ref
                            .read(itineraryWizardProvider.notifier)
                            .reorderSpots(
                              selectedIndex,
                              oldIndex,
                              newIndex,
                            );
                      },
                      proxyDecorator: (child, index, animation) {
                        return AnimatedBuilder(
                          animation: animation,
                          builder: (context, child) {
                            final animValue =
                                Curves.easeInOut.transform(animation.value);
                            final elevation = 1 + 6 * animValue;
                            return Material(
                              elevation: elevation,
                              color: Colors.transparent,
                              borderRadius:
                                  BorderRadius.circular(Layout.cardRadius),
                              child: child,
                            );
                          },
                          child: child,
                        );
                      },
                      itemBuilder: (context, index) {
                        final spot = selectedDay.spots[index];
                        return Padding(
                          key: ValueKey(
                            '${selectedIndex}_${index}_${spot.name}',
                          ),
                          padding:
                              const EdgeInsets.only(bottom: Spacing.sm),
                          child: SpotListTile(
                            spot: spot,
                            index: index,
                            onRemove: () {
                              ref
                                  .read(itineraryWizardProvider.notifier)
                                  .removeSpot(selectedIndex, index);
                            },
                          ),
                        );
                      },
                    ),
            ),
          ],
        ),

        // FAB for adding spots
        if (selectedDay.spots.isNotEmpty)
          Positioned(
            bottom: Spacing.xl,
            right: Layout.screenPaddingH,
            child: GestureDetector(
              onTap: _onAddSpot,
              child: Container(
                width: 56,
                height: 56,
                decoration: const BoxDecoration(
                  color: AppColors.coral,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: Color(0x33000000),
                      blurRadius: 8,
                      offset: Offset(0, 4),
                    ),
                  ],
                ),
                child: const Icon(
                  PhosphorIconsFill.plus,
                  size: 24,
                  color: AppColors.white,
                ),
              ),
            ),
          ),
      ],
    );
  }
}

// ── Day Tab ───────────────────────────────────────────────────

class _DayTab extends StatelessWidget {
  final String label;
  final bool isSelected;
  final int spotCount;
  final VoidCallback onTap;

  const _DayTab({
    required this.label,
    required this.isSelected,
    required this.spotCount,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Container(
        constraints: const BoxConstraints(minWidth: Layout.minTapTarget),
        padding: const EdgeInsets.symmetric(
          horizontal: Spacing.lg,
          vertical: Spacing.sm,
        ),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.ink : AppColors.sunken,
          borderRadius: BorderRadius.circular(Layout.chipRadius),
          border: Border.all(
            color: isSelected ? AppColors.ink : AppColors.border,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              label,
              style: typ.AppTypography.bodySmall.copyWith(
                fontWeight: FontWeight.w600,
                color: isSelected ? AppColors.white : AppColors.ink,
              ),
            ),
            if (spotCount > 0) ...[
              const SizedBox(width: Spacing.xs),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 6,
                  vertical: 2,
                ),
                decoration: BoxDecoration(
                  color: isSelected
                      ? AppColors.white.withValues(alpha: 0.2)
                      : AppColors.border,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  '$spotCount',
                  style: typ.AppTypography.label.copyWith(
                    color: isSelected ? AppColors.white : AppColors.muted,
                    fontSize: 10,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

// ── Day Summary Bar ───────────────────────────────────────────

class _DaySummaryBar extends StatelessWidget {
  final DayState day;

  const _DaySummaryBar({required this.day});

  @override
  Widget build(BuildContext context) {
    final spotCount = day.spots.length;
    final totalMinutes = day.totalDurationMinutes;
    final distanceKm = day.totalDistanceKm;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(
        horizontal: Spacing.lg,
        vertical: Spacing.sm,
      ),
      decoration: BoxDecoration(
        color: AppColors.sunken,
        borderRadius: BorderRadius.circular(Layout.cardRadius),
      ),
      child: Row(
        children: [
          const Icon(
            PhosphorIconsFill.path,
            size: 16,
            color: AppColors.muted,
          ),
          const SizedBox(width: Spacing.sm),
          Text(
            '$spotCount ${spotCount == 1 ? 'spot' : 'spots'}',
            style: typ.AppTypography.bodySmall.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
          if (distanceKm != null && distanceKm > 0) ...[
            const SizedBox(width: Spacing.sm),
            Text('\u00B7',
                style: typ.AppTypography.caption),
            const SizedBox(width: Spacing.sm),
            Text(
              '${distanceKm.toStringAsFixed(1)} km',
              style: typ.AppTypography.bodySmall
                  .copyWith(color: AppColors.muted),
            ),
          ],
          if (totalMinutes > 0) ...[
            const SizedBox(width: Spacing.sm),
            Text('\u00B7',
                style: typ.AppTypography.caption),
            const SizedBox(width: Spacing.sm),
            Text(
              formatDuration(totalMinutes),
              style: typ.AppTypography.bodySmall
                  .copyWith(color: AppColors.muted),
            ),
          ],
        ],
      ),
    );
  }
}
