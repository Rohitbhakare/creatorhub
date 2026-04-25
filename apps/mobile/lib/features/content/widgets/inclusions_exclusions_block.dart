import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../shared/theme/colors.dart';
import '../../../shared/theme/typography.dart' as typ;
import '../../../shared/theme/spacing.dart';
import '../../../shared/theme/layout.dart';
import '../providers/wizard_provider.dart';

// ── Preset suggestions by vertical ───────────────────────────────

const _kInclusionSuggestions = <String>[
  'Accommodation',
  'Meals',
  'Transport',
  'Guide',
  'Entry fees',
  'Equipment',
  'Insurance',
  'Bottled water',
  'First aid kit',
  'Certificate',
];

const _kExclusionSuggestions = <String>[
  'Flights',
  'Personal expenses',
  'Tips & gratuities',
  'Travel insurance',
  'Visa fees',
  'Laundry',
  'Alcoholic beverages',
  'Any item not listed',
];

// ── Widget ────────────────────────────────────────────────────────

/// Editable inclusion/exclusion checklists (CRT-FR-024).
/// Max 15 items per list, free text up to 80 chars each.
/// Pre-populated with vertical-appropriate suggestions as chips.
class InclusionsExclusionsBlock extends ConsumerStatefulWidget {
  const InclusionsExclusionsBlock({super.key});

  @override
  ConsumerState<InclusionsExclusionsBlock> createState() =>
      _InclusionsExclusionsBlockState();
}

class _InclusionsExclusionsBlockState
    extends ConsumerState<InclusionsExclusionsBlock> {
  final _customInclusionController = TextEditingController();
  final _customExclusionController = TextEditingController();

  @override
  void dispose() {
    _customInclusionController.dispose();
    _customExclusionController.dispose();
    super.dispose();
  }

  void _addInclusion(String item, List<String> current) {
    final trimmed = item.trim();
    if (trimmed.isEmpty || trimmed.length > 80) return;
    if (current.contains(trimmed)) return;
    if (current.length >= 15) return;
    ref.read(wizardProvider.notifier).setInclusions([...current, trimmed]);
    _customInclusionController.clear();
  }

  void _removeInclusion(String item, List<String> current) {
    ref
        .read(wizardProvider.notifier)
        .setInclusions(current.where((i) => i != item).toList());
  }

  void _addExclusion(String item, List<String> current) {
    final trimmed = item.trim();
    if (trimmed.isEmpty || trimmed.length > 80) return;
    if (current.contains(trimmed)) return;
    if (current.length >= 15) return;
    ref.read(wizardProvider.notifier).setExclusions([...current, trimmed]);
    _customExclusionController.clear();
  }

  void _removeExclusion(String item, List<String> current) {
    ref
        .read(wizardProvider.notifier)
        .setExclusions(current.where((i) => i != item).toList());
  }

  @override
  Widget build(BuildContext context) {
    final wizard = ref.watch(wizardProvider);
    final inclusions = wizard.inclusions;
    final exclusions = wizard.exclusions;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // ── Inclusions ───────────────────────────────────────────
        _ListHeader(
          label: "What's included",
          count: inclusions.length,
          maxCount: 15,
        ),
        const SizedBox(height: Spacing.sm),

        // Selected items
        if (inclusions.isNotEmpty) ...[
          Wrap(
            spacing: Spacing.sm,
            runSpacing: Spacing.sm,
            children: inclusions
                .map((item) => _ItemChip(
                      label: item,
                      color: AppColors.success,
                      onRemove: () {
                        HapticFeedback.selectionClick();
                        _removeInclusion(item, inclusions);
                      },
                    ))
                .toList(),
          ),
          const SizedBox(height: Spacing.md),
        ],

        // Suggestions row
        if (inclusions.length < 15)
          _SuggestionRow(
            suggestions: _kInclusionSuggestions
                .where((s) => !inclusions.contains(s))
                .take(6)
                .toList(),
            onSelect: (s) {
              HapticFeedback.selectionClick();
              _addInclusion(s, inclusions);
            },
          ),

        // Custom input
        if (inclusions.length < 15) ...[
          const SizedBox(height: Spacing.sm),
          _CustomItemInput(
            controller: _customInclusionController,
            hint: 'Add custom inclusion...',
            onAdd: (v) => _addInclusion(v, inclusions),
          ),
        ],

        const SizedBox(height: Spacing.xl),

        // ── Exclusions ───────────────────────────────────────────
        _ListHeader(
          label: "What's not included",
          count: exclusions.length,
          maxCount: 15,
        ),
        const SizedBox(height: Spacing.sm),

        if (exclusions.isNotEmpty) ...[
          Wrap(
            spacing: Spacing.sm,
            runSpacing: Spacing.sm,
            children: exclusions
                .map((item) => _ItemChip(
                      label: item,
                      color: AppColors.danger,
                      onRemove: () {
                        HapticFeedback.selectionClick();
                        _removeExclusion(item, exclusions);
                      },
                    ))
                .toList(),
          ),
          const SizedBox(height: Spacing.md),
        ],

        if (exclusions.length < 15)
          _SuggestionRow(
            suggestions: _kExclusionSuggestions
                .where((s) => !exclusions.contains(s))
                .take(6)
                .toList(),
            onSelect: (s) {
              HapticFeedback.selectionClick();
              _addExclusion(s, exclusions);
            },
          ),

        if (exclusions.length < 15) ...[
          const SizedBox(height: Spacing.sm),
          _CustomItemInput(
            controller: _customExclusionController,
            hint: 'Add custom exclusion...',
            onAdd: (v) => _addExclusion(v, exclusions),
          ),
        ],
      ],
    );
  }
}

// ── Sub-widgets ───────────────────────────────────────────────────

class _ListHeader extends StatelessWidget {
  final String label;
  final int count;
  final int maxCount;

  const _ListHeader({
    required this.label,
    required this.count,
    required this.maxCount,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Text(
          label,
          style: typ.AppTypography.bodySmall.copyWith(
            fontWeight: FontWeight.w600,
            color: AppColors.inkSoft,
          ),
        ),
        const Spacer(),
        Text(
          '$count/$maxCount',
          style: typ.AppTypography.caption.copyWith(color: AppColors.inkMuted),
        ),
      ],
    );
  }
}

class _ItemChip extends StatelessWidget {
  final String label;
  final Color color;
  final VoidCallback onRemove;

  const _ItemChip({
    required this.label,
    required this.color,
    required this.onRemove,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: Spacing.md, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(Layout.chipRadius),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            color == AppColors.success
                ? Icons.check_circle_outline_rounded
                : Icons.cancel_outlined,
            size: 14,
            color: color,
          ),
          const SizedBox(width: 6),
          Flexible(
            child: Text(
              label,
              style: typ.AppTypography.caption.copyWith(
                color: AppColors.ink,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          const SizedBox(width: 6),
          GestureDetector(
            onTap: onRemove,
            behavior: HitTestBehavior.opaque,
            child: const Padding(
              padding: EdgeInsets.all(2),
              child: Icon(Icons.close, size: 12, color: AppColors.inkMuted),
            ),
          ),
        ],
      ),
    );
  }
}

class _SuggestionRow extends StatelessWidget {
  final List<String> suggestions;
  final void Function(String) onSelect;

  const _SuggestionRow({
    required this.suggestions,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    if (suggestions.isEmpty) return const SizedBox.shrink();
    return Wrap(
      spacing: Spacing.sm,
      runSpacing: Spacing.sm,
      children: suggestions
          .map((s) => GestureDetector(
                onTap: () => onSelect(s),
                behavior: HitTestBehavior.opaque,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: Spacing.md,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.surfaceAlt,
                    borderRadius: BorderRadius.circular(Layout.chipRadius),
                    border: Border.all(color: AppColors.hairline),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.add, size: 12, color: AppColors.inkSoft),
                      const SizedBox(width: 4),
                      Text(
                        s,
                        style: typ.AppTypography.caption.copyWith(
                          color: AppColors.inkSoft,
                        ),
                      ),
                    ],
                  ),
                ),
              ))
          .toList(),
    );
  }
}

class _CustomItemInput extends StatelessWidget {
  final TextEditingController controller;
  final String hint;
  final void Function(String) onAdd;

  const _CustomItemInput({
    required this.controller,
    required this.hint,
    required this.onAdd,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Container(
            height: 40,
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(Layout.inputRadius),
              border: Border.all(color: AppColors.hairline),
            ),
            child: TextField(
              controller: controller,
              style: typ.AppTypography.bodySmall.copyWith(color: AppColors.ink),
              maxLength: 80,
              decoration: InputDecoration(
                hintText: hint,
                hintStyle: typ.AppTypography.bodySmall
                    .copyWith(color: AppColors.inkMuted),
                border: InputBorder.none,
                counterText: '',
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: Spacing.md,
                  vertical: 10,
                ),
              ),
              textInputAction: TextInputAction.done,
              onSubmitted: onAdd,
            ),
          ),
        ),
        const SizedBox(width: Spacing.sm),
        GestureDetector(
          onTap: () {
            HapticFeedback.selectionClick();
            onAdd(controller.text);
          },
          behavior: HitTestBehavior.opaque,
          child: Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: AppColors.coral,
              borderRadius: BorderRadius.circular(Layout.inputRadius),
            ),
            child: const Icon(Icons.add, size: 20, color: AppColors.surface),
          ),
        ),
      ],
    );
  }
}
