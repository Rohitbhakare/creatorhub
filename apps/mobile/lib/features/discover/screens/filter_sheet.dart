import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/typography.dart';

/// Active filter state — immutable, composable.
class DiscoverFilters {
  final Set<String> durations;   // 'day' | 'weekend' | '3_5d' | '6plus'
  final Set<String> budgets;     // 'under_2k' | '2k_5k' | '5k_15k' | '15k_plus'
  final Set<String> groupSizes;  // 'solo' | 'couple' | 'small' | 'group'
  final Set<String> difficulties; // 'easy' | 'moderate' | 'challenging'

  const DiscoverFilters({
    this.durations = const {},
    this.budgets = const {},
    this.groupSizes = const {},
    this.difficulties = const {},
  });

  bool get isEmpty =>
      durations.isEmpty && budgets.isEmpty && groupSizes.isEmpty && difficulties.isEmpty;

  int get activeCount =>
      (durations.isNotEmpty ? 1 : 0) +
      (budgets.isNotEmpty ? 1 : 0) +
      (groupSizes.isNotEmpty ? 1 : 0) +
      (difficulties.isNotEmpty ? 1 : 0);

  DiscoverFilters copyWith({
    Set<String>? durations,
    Set<String>? budgets,
    Set<String>? groupSizes,
    Set<String>? difficulties,
  }) =>
      DiscoverFilters(
        durations: durations ?? this.durations,
        budgets: budgets ?? this.budgets,
        groupSizes: groupSizes ?? this.groupSizes,
        difficulties: difficulties ?? this.difficulties,
      );

  DiscoverFilters clear() => const DiscoverFilters();
}

/// Bottom sheet filter UI (DISC-FR-034).
///
/// Shows facet groups with multi-select pills. Apply CTA shows a coral
/// count chip with the active filter count as user toggles.
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

  void _toggle(String value, Set<String> current, void Function(Set<String>) update) {
    HapticFeedback.selectionClick();
    final updated = Set<String>.from(current);
    if (updated.contains(value)) {
      updated.remove(value);
    } else {
      updated.add(value);
    }
    update(updated);
  }

  @override
  Widget build(BuildContext context) {
    final bottomPad = MediaQuery.paddingOf(context).bottom;

    return Container(
      decoration: const BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Drag handle
          Container(
            width: 36,
            height: 4,
            margin: const EdgeInsets.only(top: 12),
            decoration: BoxDecoration(
              color: AppColors.hairlineStrong,
              borderRadius: BorderRadius.circular(999),
            ),
          ),
          // Header
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 4),
            child: Row(
              children: [
                Text('Refine', style: AppTypography.h3.copyWith(color: AppColors.ink)),
                const Spacer(),
                if (!_filters.isEmpty)
                  GestureDetector(
                    onTap: () {
                      HapticFeedback.selectionClick();
                      setState(() => _filters = _filters.clear());
                    },
                    child: Text(
                      'Clear all',
                      style: AppTypography.bodySmall.copyWith(color: AppColors.coral),
                    ),
                  ),
              ],
            ),
          ),
          const Divider(height: 20, color: AppColors.hairline),
          // Scrollable facets
          Flexible(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 4, 20, 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _FacetGroup(
                    label: 'Duration',
                    options: const [
                      _Option('Day trip', 'day'),
                      _Option('Weekend', 'weekend'),
                      _Option('3–5 days', '3_5d'),
                      _Option('6+ days', '6plus'),
                    ],
                    selected: _filters.durations,
                    onToggle: (v) => _toggle(v, _filters.durations,
                        (s) => setState(() => _filters = _filters.copyWith(durations: s))),
                  ),
                  const SizedBox(height: 20),
                  _FacetGroup(
                    label: 'Budget per person',
                    options: const [
                      _Option('Under ₹2k', 'under_2k'),
                      _Option('₹2k–5k', '2k_5k'),
                      _Option('₹5k–15k', '5k_15k'),
                      _Option('₹15k+', '15k_plus'),
                    ],
                    selected: _filters.budgets,
                    onToggle: (v) => _toggle(v, _filters.budgets,
                        (s) => setState(() => _filters = _filters.copyWith(budgets: s))),
                  ),
                  const SizedBox(height: 20),
                  _FacetGroup(
                    label: 'Group size',
                    options: const [
                      _Option('Solo', 'solo'),
                      _Option('Couple', 'couple'),
                      _Option('Small group', 'small'),
                      _Option('Large group', 'group'),
                    ],
                    selected: _filters.groupSizes,
                    onToggle: (v) => _toggle(v, _filters.groupSizes,
                        (s) => setState(() => _filters = _filters.copyWith(groupSizes: s))),
                  ),
                  const SizedBox(height: 20),
                  _FacetGroup(
                    label: 'Difficulty',
                    options: const [
                      _Option('Easy', 'easy'),
                      _Option('Moderate', 'moderate'),
                      _Option('Challenging', 'challenging'),
                    ],
                    selected: _filters.difficulties,
                    onToggle: (v) => _toggle(v, _filters.difficulties,
                        (s) => setState(() => _filters = _filters.copyWith(difficulties: s))),
                  ),
                ],
              ),
            ),
          ),
          // Apply CTA
          Padding(
            padding: EdgeInsets.fromLTRB(20, 12, 20, 16 + bottomPad),
            child: Row(
              children: [
                if (!_filters.isEmpty) ...[
                  OutlinedButton(
                    onPressed: () {
                      HapticFeedback.selectionClick();
                      setState(() => _filters = _filters.clear());
                    },
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
  }
}

class _Option {
  final String label;
  final String value;
  const _Option(this.label, this.value);
}

class _FacetGroup extends StatelessWidget {
  final String label;
  final List<_Option> options;
  final Set<String> selected;
  final void Function(String value) onToggle;

  const _FacetGroup({
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
        Text(
          label.toUpperCase(),
          style: AppTypography.label.copyWith(
            color: AppColors.inkMuted,
            letterSpacing: 0.6,
            fontSize: 10,
          ),
        ),
        const SizedBox(height: 10),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: options.map((o) {
            final on = selected.contains(o.value);
            return GestureDetector(
              onTap: () => onToggle(o.value),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 150),
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 9),
                decoration: BoxDecoration(
                  color: on ? AppColors.ink : AppColors.surfaceAlt,
                  borderRadius: BorderRadius.circular(999),
                  border: Border.all(
                    color: on ? AppColors.ink : AppColors.hairline,
                    width: 1,
                  ),
                ),
                child: Text(
                  o.label,
                  style: AppTypography.bodySmall.copyWith(
                    color: on ? AppColors.surface : AppColors.inkSoft,
                    fontWeight: on ? FontWeight.w600 : FontWeight.w400,
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }
}
