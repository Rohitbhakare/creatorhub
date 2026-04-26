import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/typography.dart';
import '../models/discover_filters.dart';

const _kSubCatOptions = <_Option>[
  _Option('Road Trips', 'travel.road_trips'),
  _Option('Biking', 'travel.biking'),
  _Option('Trekking', 'travel.trekking'),
  _Option('Food Trails', 'travel.food_trails'),
  _Option('Adventure', 'travel.adventure'),
  _Option('Heritage', 'travel.heritage'),
  _Option('Wildlife', 'travel.wildlife'),
  _Option('Photo Walks', 'travel.photo_walks'),
  _Option('Wellness', 'travel.wellness'),
  _Option('Family', 'travel.family'),
  _Option('Luxury', 'travel.luxury'),
  _Option('Offbeat', 'travel.offbeat'),
];

const _kContentTypes = <_Option>[
  _Option('Posts', 'post'),
  _Option('Itineraries', 'self_paced_itinerary'),
  _Option('Experiences', 'scheduled_experience'),
  _Option('Events', 'event'),
];

const _kTimeWindows = <_Option>[
  _Option('Today', 'today'),
  _Option('This weekend', 'this_weekend'),
  _Option('Next 7 days', 'next_7d'),
  _Option('This month', 'this_month'),
];

const _kDurations = <_Option>[
  _Option('Day trip ≤8h', 'day_trip'),
  _Option('Weekend (2d)', 'weekend'),
  _Option('3–5 days', 'short'),
  _Option('6+ days', 'long'),
];

const _kSeasons = <_Option>[
  _Option('Monsoon', 'monsoon'),
  _Option('Winter', 'winter'),
  _Option('Summer', 'summer'),
  _Option('Spring', 'spring'),
  _Option('Autumn', 'autumn'),
];

const _kBudgets = <_Option>[
  _Option('Free', 'free'),
  _Option('≤ ₹2k', 'lt2k'),
  _Option('₹2–5k', '2to5k'),
  _Option('₹5–15k', '5to15k'),
  _Option('₹15k+', 'gt15k'),
];

const _kDifficulties = <_Option>[
  _Option('Easy', 'easy'),
  _Option('Moderate', 'moderate'),
  _Option('Hard', 'hard'),
  _Option('Expert', 'expert'),
];

const _kGroupSizes = <_Option>[
  _Option('Solo', 'solo'),
  _Option('Pair', 'pair'),
  _Option('Small', 'small'),
  _Option('Large', 'large'),
];

const _kDistanceKm = <_NumOption>[
  _NumOption('25 km', 25),
  _NumOption('50 km', 50),
  _NumOption('100 km', 100),
  _NumOption('250 km', 250),
];

const _kMonthLabels = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

class DiscoverFilterSheet extends StatefulWidget {
  final DiscoverFilters initial;
  final void Function(DiscoverFilters filters) onApply;

  const DiscoverFilterSheet({
    super.key,
    required this.initial,
    required this.onApply,
  });

  static Future<DiscoverFilters?> show(
    BuildContext context,
    DiscoverFilters current,
  ) {
    return showModalBottomSheet<DiscoverFilters>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => DiscoverFilterSheet(
        initial: current,
        onApply: (f) => Navigator.of(context).pop(f),
      ),
    );
  }

  @override
  State<DiscoverFilterSheet> createState() => _DiscoverFilterSheetState();
}

class _DiscoverFilterSheetState extends State<DiscoverFilterSheet> {
  late DiscoverFilters _filters;

  @override
  void initState() {
    super.initState();
    _filters = widget.initial;
  }

  void _set(DiscoverFilters f) {
    HapticFeedback.selectionClick();
    setState(() => _filters = f);
  }

  Set<T> _toggleSet<T>(Set<T> current, T value) {
    final updated = Set<T>.from(current);
    if (updated.contains(value)) {
      updated.remove(value);
    } else {
      updated.add(value);
    }
    return updated;
  }

  @override
  Widget build(BuildContext context) {
    final bottomPad = MediaQuery.paddingOf(context).bottom;

    return DraggableScrollableSheet(
      initialChildSize: 0.85,
      minChildSize: 0.6,
      maxChildSize: 0.95,
      expand: false,
      builder: (context, scrollController) {
        return Container(
          decoration: const BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 36, height: 4,
                margin: const EdgeInsets.only(top: 12),
                decoration: BoxDecoration(
                  color: AppColors.hairlineStrong,
                  borderRadius: BorderRadius.circular(999),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 4),
                child: Row(
                  children: [
                    Text('Refine', style: AppTypography.h3),
                    const Spacer(),
                    if (!_filters.isEmpty)
                      GestureDetector(
                        onTap: () => _set(_filters.cleared()),
                        child: Text(
                          'Clear all',
                          style: AppTypography.bodySmall.copyWith(color: AppColors.coral),
                        ),
                      ),
                  ],
                ),
              ),
              const Divider(height: 20, color: AppColors.hairline),
              Expanded(
                child: ListView(
                  controller: scrollController,
                  padding: const EdgeInsets.fromLTRB(20, 4, 20, 16),
                  children: [
                    _SingleSelectGroup(
                      label: 'Sub-category',
                      options: _kSubCatOptions,
                      selected: _filters.subCategoryId,
                      onSelect: (v) => _set(_filters.copyWith(
                        subCategoryId: v,
                        clearSubCat: v == null,
                      )),
                    ),
                    const SizedBox(height: 20),
                    _SingleSelectGroup(
                      label: 'Content type',
                      options: _kContentTypes,
                      selected: _filters.contentType,
                      onSelect: (v) => _set(_filters.copyWith(
                        contentType: v,
                        clearContentType: v == null,
                      )),
                    ),
                    const SizedBox(height: 20),
                    _SingleSelectGroup(
                      label: 'Time window',
                      options: _kTimeWindows,
                      selected: _filters.timeWindow,
                      onSelect: (v) => _set(_filters.copyWith(
                        timeWindow: v,
                        clearTimeWindow: v == null,
                      )),
                    ),
                    const SizedBox(height: 20),
                    _MultiSelectGroup<String>(
                      label: 'Duration',
                      options: _kDurations,
                      selected: _filters.durationBuckets,
                      onToggle: (v) => _set(_filters.copyWith(
                        durationBuckets: _toggleSet(_filters.durationBuckets, v),
                      )),
                    ),
                    const SizedBox(height: 20),
                    _MultiSelectGroup<String>(
                      label: 'Season',
                      options: _kSeasons,
                      selected: _filters.seasons,
                      onToggle: (v) => _set(_filters.copyWith(
                        seasons: _toggleSet(_filters.seasons, v),
                      )),
                    ),
                    const SizedBox(height: 20),
                    _MonthsGroup(
                      selected: _filters.months,
                      onToggle: (m) => _set(_filters.copyWith(
                        months: _toggleSet(_filters.months, m),
                      )),
                    ),
                    const SizedBox(height: 20),
                    _MultiSelectGroup<String>(
                      label: 'Budget',
                      options: _kBudgets,
                      selected: _filters.budgetBuckets,
                      onToggle: (v) => _set(_filters.copyWith(
                        budgetBuckets: _toggleSet(_filters.budgetBuckets, v),
                      )),
                    ),
                    const SizedBox(height: 20),
                    _MultiSelectGroup<String>(
                      label: 'Difficulty',
                      options: _kDifficulties,
                      selected: _filters.difficulties,
                      onToggle: (v) => _set(_filters.copyWith(
                        difficulties: _toggleSet(_filters.difficulties, v),
                      )),
                    ),
                    const SizedBox(height: 20),
                    _MultiSelectGroup<String>(
                      label: 'Group size',
                      options: _kGroupSizes,
                      selected: _filters.groupSizes,
                      onToggle: (v) => _set(_filters.copyWith(
                        groupSizes: _toggleSet(_filters.groupSizes, v),
                      )),
                    ),
                    const SizedBox(height: 20),
                    _DistanceGroup(
                      selected: _filters.distanceKm,
                      onSelect: (km) => _set(_filters.copyWith(
                        distanceKm: km,
                        clearDistance: km == null,
                      )),
                    ),
                  ],
                ),
              ),
              Padding(
                padding: EdgeInsets.fromLTRB(20, 12, 20, 16 + bottomPad),
                child: Row(
                  children: [
                    if (!_filters.isEmpty) ...[
                      OutlinedButton(
                        onPressed: () => _set(_filters.cleared()),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppColors.ink,
                          side: const BorderSide(color: AppColors.hairlineStrong),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12)),
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                        ),
                        child: const Text('Clear'),
                      ),
                      const SizedBox(width: 12),
                    ],
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () {
                          HapticFeedback.mediumImpact();
                          widget.onApply(_filters);
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.coral,
                          foregroundColor: AppColors.surface,
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12)),
                          padding: const EdgeInsets.symmetric(vertical: 14),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              'Show results',
                              style: AppTypography.body.copyWith(
                                color: AppColors.surface,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            if (_filters.activeCount > 0) ...[
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                decoration: BoxDecoration(
                                  color: AppColors.surface.withValues(alpha: 0.2),
                                  borderRadius: BorderRadius.circular(999),
                                ),
                                child: Text(
                                  '${_filters.activeCount}',
                                  style: AppTypography.label.copyWith(
                                    color: AppColors.surface,
                                    fontSize: 12,
                                  ),
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _Option {
  final String label;
  final String value;
  const _Option(this.label, this.value);
}

class _NumOption {
  final String label;
  final int value;
  const _NumOption(this.label, this.value);
}

class _GroupHeader extends StatelessWidget {
  final String label;
  const _GroupHeader(this.label);

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: 10),
        child: Text(
          label.toUpperCase(),
          style: AppTypography.label.copyWith(
            color: AppColors.inkMuted,
            letterSpacing: 0.6,
            fontSize: 10,
          ),
        ),
      );
}

class _Pill extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _Pill({required this.label, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: selected ? AppColors.ink : AppColors.surfaceAlt,
          borderRadius: BorderRadius.circular(999),
          border: Border.all(
            color: selected ? AppColors.ink : AppColors.hairline,
            width: 1,
          ),
        ),
        child: Text(
          label,
          style: AppTypography.bodySmall.copyWith(
            color: selected ? AppColors.surface : AppColors.inkSoft,
            fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
          ),
        ),
      ),
    );
  }
}

class _SingleSelectGroup extends StatelessWidget {
  final String label;
  final List<_Option> options;
  final String? selected;
  final ValueChanged<String?> onSelect;

  const _SingleSelectGroup({
    required this.label,
    required this.options,
    required this.selected,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _GroupHeader(label),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: options
              .map((o) => _Pill(
                    label: o.label,
                    selected: selected == o.value,
                    onTap: () => onSelect(selected == o.value ? null : o.value),
                  ))
              .toList(),
        ),
      ],
    );
  }
}

class _MultiSelectGroup<T> extends StatelessWidget {
  final String label;
  final List<_Option> options;
  final Set<T> selected;
  final ValueChanged<T> onToggle;

  const _MultiSelectGroup({
    required this.label,
    required this.options,
    required this.selected,
    required this.onToggle,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _GroupHeader(label),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: options
              .map((o) => _Pill(
                    label: o.label,
                    selected: selected.contains(o.value),
                    onTap: () => onToggle(o.value as T),
                  ))
              .toList(),
        ),
      ],
    );
  }
}

class _MonthsGroup extends StatelessWidget {
  final Set<int> selected;
  final ValueChanged<int> onToggle;

  const _MonthsGroup({required this.selected, required this.onToggle});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _GroupHeader('Month'),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: List.generate(
            12,
            (i) => _Pill(
              label: _kMonthLabels[i],
              selected: selected.contains(i + 1),
              onTap: () => onToggle(i + 1),
            ),
          ),
        ),
      ],
    );
  }
}

class _DistanceGroup extends StatelessWidget {
  final int? selected;
  final ValueChanged<int?> onSelect;

  const _DistanceGroup({required this.selected, required this.onSelect});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _GroupHeader('Distance from me'),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            ..._kDistanceKm.map(
              (d) => _Pill(
                label: d.label,
                selected: selected == d.value,
                onTap: () => onSelect(selected == d.value ? null : d.value),
              ),
            ),
            _Pill(
              label: 'Anywhere',
              selected: selected == null,
              onTap: () => onSelect(null),
            ),
          ],
        ),
      ],
    );
  }
}
