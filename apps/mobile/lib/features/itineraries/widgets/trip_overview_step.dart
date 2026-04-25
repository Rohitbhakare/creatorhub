import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart' show PhosphorIconsFill;

import '../../../shared/theme/colors.dart';
import '../../../shared/theme/typography.dart' as typ;
import '../../../shared/theme/spacing.dart';
import '../../../shared/theme/layout.dart';
import '../../../shared/components/input.dart';
import '../../../shared/components/skeleton.dart';
import '../../auth/providers/auth_provider.dart';
import '../../content/providers/wizard_provider.dart';
import '../../content/widgets/discoverability_block.dart';
import '../providers/itinerary_wizard_provider.dart';

/// Trip Overview step (step 2 of 6 for itinerary wizard).
///
/// Collects day count, starting city, and destination cities.
class TripOverviewStep extends ConsumerStatefulWidget {
  const TripOverviewStep({super.key});

  @override
  ConsumerState<TripOverviewStep> createState() => _TripOverviewStepState();
}

class _TripOverviewStepState extends ConsumerState<TripOverviewStep> {
  final _startingCityController = TextEditingController();
  final _destinationController = TextEditingController();
  final _startingCityFocusNode = FocusNode();
  final _destinationFocusNode = FocusNode();

  List<Map<String, dynamic>> _startingCityResults = [];
  List<Map<String, dynamic>> _destinationResults = [];
  bool _isSearchingStarting = false;
  bool _isSearchingDestination = false;
  Timer? _startingDebounce;
  Timer? _destinationDebounce;

  @override
  void dispose() {
    _startingCityController.dispose();
    _destinationController.dispose();
    _startingCityFocusNode.dispose();
    _destinationFocusNode.dispose();
    _startingDebounce?.cancel();
    _destinationDebounce?.cancel();
    super.dispose();
  }

  Future<List<Map<String, dynamic>>> _searchCities(String query) async {
    if (query.trim().length < 2) return [];

    try {
      final dio = ref.read(authServiceProvider).dio;
      final response = await dio.get(
        '/api/v1/cities',
        queryParameters: {'q': query.trim(), 'limit': 10},
      );

      final responseData = response.data as Map<String, dynamic>;
      return (responseData['data'] as List<dynamic>)
          .cast<Map<String, dynamic>>();
    } on DioException {
      return [];
    } catch (_) {
      return [];
    }
  }

  void _onStartingCitySearch(String value) {
    _startingDebounce?.cancel();
    if (value.trim().length < 2) {
      setState(() {
        _startingCityResults = [];
        _isSearchingStarting = false;
      });
      return;
    }
    setState(() => _isSearchingStarting = true);
    _startingDebounce = Timer(const Duration(milliseconds: 300), () async {
      final results = await _searchCities(value);
      if (mounted) {
        setState(() {
          _startingCityResults = results;
          _isSearchingStarting = false;
        });
      }
    });
  }

  void _onDestinationSearch(String value) {
    _destinationDebounce?.cancel();
    if (value.trim().length < 2) {
      setState(() {
        _destinationResults = [];
        _isSearchingDestination = false;
      });
      return;
    }
    setState(() => _isSearchingDestination = true);
    _destinationDebounce = Timer(const Duration(milliseconds: 300), () async {
      final results = await _searchCities(value);
      if (mounted) {
        setState(() {
          _destinationResults = results;
          _isSearchingDestination = false;
        });
      }
    });
  }

  void _selectStartingCity(Map<String, dynamic> city) {
    HapticFeedback.selectionClick();
    final id = city['id'] as String;
    final name = city['name'] as String;
    ref.read(itineraryWizardProvider.notifier).setStartingCity(id, name);
    _startingCityController.clear();
    _startingCityFocusNode.unfocus();
    setState(() {
      _startingCityResults = [];
    });
  }

  void _selectDestinationCity(Map<String, dynamic> city) {
    HapticFeedback.selectionClick();
    final id = city['id'] as String;
    final name = city['name'] as String;
    ref.read(itineraryWizardProvider.notifier).addDestinationCity(id, name);
    _destinationController.clear();
    _destinationFocusNode.unfocus();
    setState(() {
      _destinationResults = [];
    });
  }

  void _incrementDayCount() {
    HapticFeedback.lightImpact();
    final wizard = ref.read(wizardProvider);
    final newCount = (wizard.dayCount + 1).clamp(1, 30);
    ref.read(wizardProvider.notifier).setDayCount(newCount);
    ref.read(itineraryWizardProvider.notifier).syncDays(newCount);
  }

  void _decrementDayCount() {
    HapticFeedback.lightImpact();
    final wizard = ref.read(wizardProvider);
    final newCount = (wizard.dayCount - 1).clamp(1, 30);
    ref.read(wizardProvider.notifier).setDayCount(newCount);
    ref.read(itineraryWizardProvider.notifier).syncDays(newCount);
  }

  @override
  Widget build(BuildContext context) {
    final wizard = ref.watch(wizardProvider);
    final itinWizard = ref.watch(itineraryWizardProvider);
    final hasStartingCity =
        wizard.startingCityId != null && wizard.startingCityId!.isNotEmpty;

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(
        horizontal: Layout.screenPaddingH,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: Spacing.xl),

          // Section title
          Text('Trip Overview', style: typ.AppTypography.h3),
          const SizedBox(height: Spacing.sm),
          Text(
            'Set up the basics of your itinerary',
            style: typ.AppTypography.body.copyWith(color: AppColors.inkSoft),
          ),
          const SizedBox(height: Spacing.xl),

          // ── Difficulty ─────────────────────────────────────
          Text(
            'Difficulty level',
            style: typ.AppTypography.bodySmall.copyWith(
              fontWeight: FontWeight.w600,
              color: AppColors.inkSoft,
            ),
          ),
          const SizedBox(height: Spacing.sm),
          _DifficultyPicker(
            selected: wizard.difficulty,
            onSelect: (val) {
              HapticFeedback.selectionClick();
              ref.read(wizardProvider.notifier).setDifficulty(
                    wizard.difficulty == val ? null : val,
                  );
            },
          ),
          const SizedBox(height: Spacing.xl),

          // Day count stepper
          Text(
            'Number of days',
            style: typ.AppTypography.bodySmall.copyWith(
              fontWeight: FontWeight.w600,
              color: AppColors.inkSoft,
            ),
          ),
          const SizedBox(height: Spacing.sm),
          _DayCountStepper(
            count: wizard.dayCount,
            onIncrement: _incrementDayCount,
            onDecrement: _decrementDayCount,
          ),
          const SizedBox(height: Spacing.xl),

          // Starting city
          Text(
            'Starting city',
            style: typ.AppTypography.bodySmall.copyWith(
              fontWeight: FontWeight.w600,
              color: AppColors.inkSoft,
            ),
          ),
          const SizedBox(height: Spacing.sm),

          if (hasStartingCity) ...[
            _CityChip(
              name: itinWizard.startingCityName ?? '',
              onRemove: () {
                HapticFeedback.selectionClick();
                ref
                    .read(itineraryWizardProvider.notifier)
                    .clearStartingCity();
              },
            ),
          ] else ...[
            AppSearchInput(
              controller: _startingCityController,
              hint: 'Search for starting city...',
              onSearch: _onStartingCitySearch,
            ),
            if (_isSearchingStarting)
              const Padding(
                padding: EdgeInsets.only(top: Spacing.sm),
                child: SkeletonLoader(
                  child: Column(
                    children: [
                      _SkeletonCityRow(),
                      SizedBox(height: Spacing.sm),
                      _SkeletonCityRow(),
                      SizedBox(height: Spacing.sm),
                      _SkeletonCityRow(),
                    ],
                  ),
                ),
              ),
            if (!_isSearchingStarting && _startingCityResults.isNotEmpty)
              _CityResultsList(
                results: _startingCityResults,
                onSelect: _selectStartingCity,
              ),
          ],
          const SizedBox(height: Spacing.xl),

          // Destination cities
          Text(
            'Destinations',
            style: typ.AppTypography.bodySmall.copyWith(
              fontWeight: FontWeight.w600,
              color: AppColors.inkSoft,
            ),
          ),
          const SizedBox(height: Spacing.sm),

          // Selected destination chips
          if (itinWizard.destinationCityNames.isNotEmpty)
            Wrap(
              spacing: Spacing.sm,
              runSpacing: Spacing.sm,
              children: [
                for (int i = 0;
                    i < itinWizard.destinationCityNames.length;
                    i++)
                  _CityChip(
                    name: itinWizard.destinationCityNames[i],
                    onRemove: () {
                      HapticFeedback.selectionClick();
                      ref
                          .read(itineraryWizardProvider.notifier)
                          .removeDestinationCity(i);
                    },
                  ),
              ],
            ),
          if (itinWizard.destinationCityNames.isNotEmpty)
            const SizedBox(height: Spacing.md),

          AppSearchInput(
            controller: _destinationController,
            hint: 'Add a destination...',
            onSearch: _onDestinationSearch,
          ),
          if (_isSearchingDestination)
            const Padding(
              padding: EdgeInsets.only(top: Spacing.sm),
              child: SkeletonLoader(
                child: Column(
                  children: [
                    _SkeletonCityRow(),
                    SizedBox(height: Spacing.sm),
                    _SkeletonCityRow(),
                    SizedBox(height: Spacing.sm),
                    _SkeletonCityRow(),
                  ],
                ),
              ),
            ),
          if (!_isSearchingDestination && _destinationResults.isNotEmpty)
            _CityResultsList(
              results: _destinationResults,
              onSelect: _selectDestinationCity,
            ),

          // Summary
          const SizedBox(height: Spacing.xxl),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(Layout.cardPadding),
            decoration: BoxDecoration(
              color: AppColors.surfaceAlt,
              borderRadius: BorderRadius.circular(Layout.cardRadius),
            ),
            child: Row(
              children: [
                const Icon(
                  PhosphorIconsFill.mapTrifold,
                  size: 20,
                  color: AppColors.inkSoft,
                ),
                const SizedBox(width: Spacing.md),
                Text(
                  '${wizard.dayCount} ${wizard.dayCount == 1 ? 'day' : 'days'}',
                  style: typ.AppTypography.h4,
                ),
                if (itinWizard.destinationCityNames.isNotEmpty) ...[
                  const SizedBox(width: Spacing.sm),
                  Text(
                    '\u00B7',
                    style:
                        typ.AppTypography.body.copyWith(color: AppColors.inkSoft),
                  ),
                  const SizedBox(width: Spacing.sm),
                  Expanded(
                    child: Text(
                      itinWizard.destinationCityNames.join(', '),
                      style: typ.AppTypography.bodySmall
                          .copyWith(color: AppColors.inkSoft),
                      overflow: TextOverflow.ellipsis,
                      maxLines: 1,
                    ),
                  ),
                ],
              ],
            ),
          ),

          // ── Budget range ────────────────────────────────────
          const SizedBox(height: Spacing.xxl),
          Text(
            'Budget range',
            style: typ.AppTypography.bodySmall.copyWith(
              fontWeight: FontWeight.w600,
              color: AppColors.inkSoft,
            ),
          ),
          const SizedBox(height: Spacing.sm),
          Row(
            children: [
              for (final option in _budgetOptions) ...[
                Expanded(
                  child: _BudgetChip(
                    label: option.$1,
                    emoji: option.$2,
                    isSelected: wizard.budgetRange == option.$3,
                    onTap: () {
                      HapticFeedback.selectionClick();
                      ref.read(wizardProvider.notifier).setBudgetRange(
                            wizard.budgetRange == option.$3 ? null : option.$3,
                          );
                    },
                  ),
                ),
                if (option != _budgetOptions.last) const SizedBox(width: Spacing.sm),
              ],
            ],
          ),

          // ── Discoverability (PR 2 — facets) ────────────────
          const SizedBox(height: Spacing.xxl),
          DiscoverabilityBlock(
            season: wizard.season,
            tripStyle: wizard.tripStyle,
            audience: wizard.audience,
            contentLabel: 'itinerary',
            onSeasonChanged: ref.read(wizardProvider.notifier).setSeason,
            onTripStyleChanged:
                ref.read(wizardProvider.notifier).setTripStyle,
            onAudienceChanged: ref.read(wizardProvider.notifier).setAudience,
          ),
          const SizedBox(height: Spacing.xxxl),
        ],
      ),
    );
  }
}

// ── Budget options (label, emoji, API value) ──────────────────

const _budgetOptions = [
  ('Budget', '🎒', 'budget'),
  ('Mid-range', '🏨', 'mid_range'),
  ('Luxury', '✨', 'luxury'),
];

class _BudgetChip extends StatelessWidget {
  final String label;
  final String emoji;
  final bool isSelected;
  final VoidCallback onTap;

  const _BudgetChip({
    required this.label,
    required this.emoji,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(vertical: Spacing.sm),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primaryTint : AppColors.surfaceAlt,
          borderRadius: BorderRadius.circular(Layout.cardRadius),
          border: Border.all(
            color: isSelected ? AppColors.coral : AppColors.hairline,
            width: isSelected ? 1.5 : 1,
          ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(emoji, style: const TextStyle(fontSize: 20)),
            const SizedBox(height: 4),
            Text(
              label,
              style: typ.AppTypography.caption.copyWith(
                color: isSelected ? AppColors.ink : AppColors.inkSoft,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

// ── Day Count Stepper ─────────────────────────────────────────

class _DayCountStepper extends StatelessWidget {
  final int count;
  final VoidCallback onIncrement;
  final VoidCallback onDecrement;

  const _DayCountStepper({
    required this.count,
    required this.onIncrement,
    required this.onDecrement,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: Spacing.lg,
        vertical: Spacing.md,
      ),
      decoration: BoxDecoration(
        color: AppColors.surfaceAlt,
        borderRadius: BorderRadius.circular(Layout.inputRadius),
        border: Border.all(color: AppColors.hairline),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          // Decrement button
          GestureDetector(
            onTap: count > 1 ? onDecrement : null,
            behavior: HitTestBehavior.opaque,
            child: Container(
              width: Layout.minTapTarget,
              height: Layout.minTapTarget,
              decoration: BoxDecoration(
                color: count > 1 ? AppColors.surface : AppColors.surfaceAlt,
                shape: BoxShape.circle,
                border: Border.all(
                  color: count > 1 ? AppColors.hairline : AppColors.hairline,
                ),
              ),
              child: Icon(
                PhosphorIconsFill.minus,
                size: 18,
                color: count > 1 ? AppColors.ink : AppColors.inkMuted,
              ),
            ),
          ),

          // Count display
          Column(
            children: [
              Text(
                '$count',
                style: typ.AppTypography.h2,
              ),
              Text(
                count == 1 ? 'day' : 'days',
                style: typ.AppTypography.caption,
              ),
            ],
          ),

          // Increment button
          GestureDetector(
            onTap: count < 30 ? onIncrement : null,
            behavior: HitTestBehavior.opaque,
            child: Container(
              width: Layout.minTapTarget,
              height: Layout.minTapTarget,
              decoration: BoxDecoration(
                color: count < 30 ? AppColors.surface : AppColors.surfaceAlt,
                shape: BoxShape.circle,
                border: Border.all(
                  color: count < 30 ? AppColors.hairline : AppColors.hairline,
                ),
              ),
              child: Icon(
                PhosphorIconsFill.plus,
                size: 18,
                color: count < 30 ? AppColors.ink : AppColors.inkMuted,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── City Chip ─────────────────────────────────────────────────

class _CityChip extends StatelessWidget {
  final String name;
  final VoidCallback onRemove;

  const _CityChip({
    required this.name,
    required this.onRemove,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: Spacing.md,
        vertical: Spacing.sm,
      ),
      decoration: BoxDecoration(
        color: AppColors.coralSurface,
        borderRadius: BorderRadius.circular(Layout.chipRadius),
        border: Border.all(color: AppColors.coral),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(
            PhosphorIconsFill.mapPin,
            size: 16,
            color: AppColors.coral,
          ),
          const SizedBox(width: Spacing.sm),
          Flexible(
            child: Text(
              name,
              style: typ.AppTypography.body.copyWith(
                fontWeight: FontWeight.w600,
                color: AppColors.ink,
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
          const SizedBox(width: Spacing.sm),
          GestureDetector(
            onTap: onRemove,
            behavior: HitTestBehavior.opaque,
            child: const Padding(
              padding: EdgeInsets.all(Spacing.xs),
              child: Icon(
                PhosphorIconsFill.xCircle,
                size: 18,
                color: AppColors.inkSoft,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── City Results List ─────────────────────────────────────────

class _CityResultsList extends StatelessWidget {
  final List<Map<String, dynamic>> results;
  final ValueChanged<Map<String, dynamic>> onSelect;

  const _CityResultsList({
    required this.results,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(top: Spacing.xs),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(Layout.cardRadius),
        border: Border.all(color: AppColors.hairline),
      ),
      constraints: const BoxConstraints(maxHeight: 200),
      child: ListView.separated(
        shrinkWrap: true,
        padding: EdgeInsets.zero,
        itemCount: results.length,
        separatorBuilder: (_, _) =>
            const Divider(color: AppColors.hairline, height: 1),
        itemBuilder: (context, index) {
          final city = results[index];
          final name = city['name'] as String? ?? '';
          final stateName = city['state'] as String? ?? '';

          return GestureDetector(
            onTap: () => onSelect(city),
            behavior: HitTestBehavior.opaque,
            child: Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: Spacing.lg,
                vertical: Spacing.md,
              ),
              child: Row(
                children: [
                  const Icon(
                    PhosphorIconsFill.mapPin,
                    size: 18,
                    color: AppColors.coral,
                  ),
                  const SizedBox(width: Spacing.md),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(name, style: typ.AppTypography.body),
                        if (stateName.isNotEmpty)
                          Text(stateName, style: typ.AppTypography.caption),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

// ── Difficulty Picker ─────────────────────────────────────────

const _difficultyOptions = [
  ('easy', '🥾', 'Easy', 'Flat paths, anyone'),
  ('moderate', '🏃', 'Moderate', 'Some climbs & effort'),
  ('tough', '🧗', 'Tough', 'Challenging terrain'),
];

class _DifficultyPicker extends StatelessWidget {
  final String? selected;
  final ValueChanged<String> onSelect;

  const _DifficultyPicker({
    required this.selected,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        for (int i = 0; i < _difficultyOptions.length; i++) ...[
          Expanded(
            child: _DifficultyCard(
              emoji: _difficultyOptions[i].$2,
              label: _difficultyOptions[i].$3,
              sublabel: _difficultyOptions[i].$4,
              isSelected: selected == _difficultyOptions[i].$1,
              onTap: () => onSelect(_difficultyOptions[i].$1),
            ),
          ),
          if (i < _difficultyOptions.length - 1)
            const SizedBox(width: Spacing.sm),
        ],
      ],
    );
  }
}

class _DifficultyCard extends StatelessWidget {
  final String emoji;
  final String label;
  final String sublabel;
  final bool isSelected;
  final VoidCallback onTap;

  const _DifficultyCard({
    required this.emoji,
    required this.label,
    required this.sublabel,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(
          vertical: Spacing.md,
          horizontal: Spacing.sm,
        ),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primaryTint : AppColors.surfaceAlt,
          borderRadius: BorderRadius.circular(Layout.cardRadius),
          border: Border.all(
            color: isSelected ? AppColors.coral : AppColors.hairline,
            width: isSelected ? 1.5 : 1.0,
          ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(emoji, style: const TextStyle(fontSize: 22)),
            const SizedBox(height: Spacing.xs),
            Text(
              label,
              style: typ.AppTypography.caption.copyWith(
                fontWeight: FontWeight.w700,
                color: isSelected ? AppColors.coral : AppColors.ink,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 2),
            Text(
              sublabel,
              style: typ.AppTypography.caption.copyWith(
                fontSize: 10,
                color: AppColors.inkMuted,
              ),
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}

// ── Skeleton Row ──────────────────────────────────────────────

class _SkeletonCityRow extends StatelessWidget {
  const _SkeletonCityRow();

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.symmetric(vertical: Spacing.xs),
      child: Row(
        children: [
          SkeletonRect(width: 18, height: 18, borderRadius: 4),
          SizedBox(width: Spacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SkeletonLine(width: 120, height: 14),
                SizedBox(height: Spacing.xs),
                SkeletonLine(width: 80, height: 12),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
