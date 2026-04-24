import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../shared/constants/discoverability.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/layout.dart';
import '../../../shared/theme/spacing.dart';
import '../../../shared/theme/typography.dart' as typ;

/// Converts a wire-format facet value (e.g. `year_round`, `nightlife`,
/// `trip_style` values) into a user-facing title-cased label.
///
/// Public so wizard steps / feed chips can render the same strings without
/// duplicating the casing rules.
String labelForFacet(String value) {
  // Explicit overrides for values whose default title-case doesn't read well.
  const overrides = <String, String>{
    'year_round': 'Year-round',
  };
  final override = overrides[value];
  if (override != null) return override;

  return value
      .split('_')
      .map((w) => w.isEmpty ? w : '${w[0].toUpperCase()}${w.substring(1)}')
      .join(' ');
}

/// A "Discoverability" section used inside the 3 publish wizards
/// (Itinerary, Event, Scheduled Experience).
///
/// Exposes three pill-picker rows — season, trip style, audience — that
/// map 1:1 to the `facets` JSONB bag on the content table. Tapping a
/// selected pill clears it (`null` emitted through the callback).
///
/// Kept stateless — the wizard provider owns the selection state.
class DiscoverabilityBlock extends StatelessWidget {
  /// Currently selected season (wire-format enum value, nullable).
  final String? season;

  /// Currently selected trip style (wire-format enum value, nullable).
  final String? tripStyle;

  /// Currently selected audience (wire-format enum value, nullable).
  final String? audience;

  /// Whether to render the trip-style row. Kept so individual wizards
  /// (e.g. Event) can opt out if the dimension doesn't make sense for
  /// that content type. Defaults to `true`.
  final bool includeTripStyle;

  /// Human-readable content type used in the subtitle, e.g. "itinerary",
  /// "event", "experience". Falls back to "trip" if not provided.
  final String contentLabel;

  final void Function(String?) onSeasonChanged;
  final void Function(String?) onTripStyleChanged;
  final void Function(String?) onAudienceChanged;

  const DiscoverabilityBlock({
    super.key,
    required this.season,
    required this.tripStyle,
    required this.audience,
    required this.onSeasonChanged,
    required this.onTripStyleChanged,
    required this.onAudienceChanged,
    this.includeTripStyle = true,
    this.contentLabel = 'trip',
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Section title — matches the Inter 16/600 (bodyLarge+) cadence used
        // for subsection headers in the other wizard steps.
        Text('Discoverability', style: typ.AppTypography.h3),
        const SizedBox(height: Spacing.xs),
        Text(
          'Help travelers find your $contentLabel',
          style: typ.AppTypography.bodySmall.copyWith(
            color: AppColors.inkMuted,
          ),
        ),
        const SizedBox(height: Spacing.lg),

        _PillRow(
          label: 'Season',
          values: kSeasons,
          selected: season,
          onChanged: onSeasonChanged,
        ),
        const SizedBox(height: Spacing.lg),

        if (includeTripStyle) ...[
          _PillRow(
            label: 'Style',
            values: kTripStyles,
            selected: tripStyle,
            onChanged: onTripStyleChanged,
          ),
          const SizedBox(height: Spacing.lg),
        ],

        _PillRow(
          label: 'Audience',
          values: kAudiences,
          selected: audience,
          onChanged: onAudienceChanged,
        ),
      ],
    );
  }
}

// ── Pill Row ───────────────────────────────────────────────────────

class _PillRow extends StatelessWidget {
  final String label;
  final List<String> values;
  final String? selected;
  final void Function(String?) onChanged;

  const _PillRow({
    required this.label,
    required this.values,
    required this.selected,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: typ.AppTypography.caption.copyWith(
            fontSize: 12,
            fontWeight: FontWeight.w500,
            color: AppColors.inkMuted,
          ),
        ),
        const SizedBox(height: Spacing.sm),
        SizedBox(
          height: Layout.minTapTarget,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: EdgeInsets.zero,
            itemCount: values.length,
            separatorBuilder: (_, _) => const SizedBox(width: Spacing.sm),
            itemBuilder: (context, index) {
              final value = values[index];
              final isSelected = value == selected;
              return _FacetPill(
                label: labelForFacet(value),
                isSelected: isSelected,
                onTap: () {
                  HapticFeedback.selectionClick();
                  // Tap-to-clear: if already selected, emit null.
                  onChanged(isSelected ? null : value);
                },
              );
            },
          ),
        ),
      ],
    );
  }
}

// ── Pill ───────────────────────────────────────────────────────────

class _FacetPill extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _FacetPill({
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 120),
        curve: Curves.easeInOut,
        constraints: const BoxConstraints(
          minHeight: Layout.minTapTarget,
          minWidth: Layout.minTapTarget,
        ),
        padding: const EdgeInsets.symmetric(
          horizontal: Spacing.lg,
          vertical: Spacing.sm,
        ),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.ink : AppColors.surfaceAlt,
          borderRadius: BorderRadius.circular(Layout.chipRadius),
          border: Border.all(
            color: isSelected ? AppColors.ink : AppColors.hairline,
          ),
        ),
        alignment: Alignment.center,
        child: Text(
          label,
          style: typ.AppTypography.bodySmall.copyWith(
            fontWeight: FontWeight.w600,
            color: isSelected ? AppColors.surface : AppColors.ink,
          ),
        ),
      ),
    );
  }
}
