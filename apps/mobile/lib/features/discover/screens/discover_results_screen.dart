import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import '../../../shared/components/skeleton.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/typography.dart';
import '../../feed/utils/feed_navigation.dart';
import '../../feed/widgets/content_card.dart';
import '../models/discover_filters.dart';
import '../providers/discover_results_provider.dart';
import 'filter_sheet.dart';

/// Deep-linkable refined-search destination. Reached from:
///  - Filter icon on a SectionGridScreen → after Apply
///  - Home top-bar search pill submission
///  - Discover tab when an explicit filter set is composed
class DiscoverResultsScreen extends ConsumerStatefulWidget {
  final DiscoverFilters initialFilters;

  const DiscoverResultsScreen({super.key, required this.initialFilters});

  @override
  ConsumerState<DiscoverResultsScreen> createState() =>
      _DiscoverResultsScreenState();
}

class _DiscoverResultsScreenState extends ConsumerState<DiscoverResultsScreen> {
  late DiscoverFilters _filters = widget.initialFilters;
  final _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (!_scrollController.hasClients) return;
    final pos = _scrollController.position;
    if (pos.pixels >= pos.maxScrollExtent - 600) {
      ref.read(discoverResultsProvider(_filters).notifier).loadMore();
    }
  }

  void _setFilters(DiscoverFilters next) {
    if (next == _filters) return;
    setState(() => _filters = next);
  }

  Future<void> _openFilterSheet() async {
    HapticFeedback.selectionClick();
    final result = await DiscoverFilterSheet.show(context, _filters);
    if (result != null && mounted) _setFilters(result);
  }

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(discoverResultsProvider(_filters));

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: Icon(PhosphorIcons.arrowLeft(PhosphorIconsStyle.regular)),
          color: AppColors.ink,
          onPressed: () => context.pop(),
        ),
        title: Text('Results', style: AppTypography.h4),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 8),
            child: Stack(
              clipBehavior: Clip.none,
              children: [
                IconButton(
                  tooltip: 'Filters',
                  icon: Icon(
                    PhosphorIcons.slidersHorizontal(PhosphorIconsStyle.regular),
                    color: AppColors.ink,
                  ),
                  onPressed: _openFilterSheet,
                ),
                if (_filters.activeCount > 0)
                  Positioned(
                    top: 6,
                    right: 6,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 5, vertical: 1),
                      constraints: const BoxConstraints(minWidth: 16),
                      decoration: BoxDecoration(
                        color: AppColors.coral,
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text(
                        '${_filters.activeCount}',
                        textAlign: TextAlign.center,
                        style: AppTypography.label.copyWith(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          height: 1.2,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            _ActiveChipsRow(
              filters: _filters,
              onChange: _setFilters,
            ),
            Expanded(
              child: RefreshIndicator(
                color: AppColors.coral,
                onRefresh: () =>
                    ref.read(discoverResultsProvider(_filters).notifier).refresh(),
                child: async.when(
                  loading: () => const _GridSkeleton(),
                  error: (_, _) => const _ErrorState(),
                  data: (state) {
                    if (state.items.isEmpty) {
                      return _EmptyState(onTune: _openFilterSheet);
                    }
                    final showLoader =
                        !state.hasReachedEnd || state.isLoadingMore;
                    final extra = showLoader ? 1 : 0;
                    return GridView.builder(
                      controller: _scrollController,
                      padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
                      gridDelegate:
                          const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        mainAxisSpacing: 18,
                        crossAxisSpacing: 12,
                        childAspectRatio: 0.65,
                      ),
                      itemCount: state.items.length + extra,
                      itemBuilder: (context, i) {
                        if (i >= state.items.length) {
                          return const Padding(
                            padding: EdgeInsets.symmetric(vertical: 24),
                            child: Center(
                              child: SizedBox(
                                width: 22,
                                height: 22,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: AppColors.coral,
                                ),
                              ),
                            ),
                          );
                        }
                        final item = state.items[i];
                        return ContentCard(
                          item: item,
                          variant: ContentCardVariant.grid,
                          onTap: () => openFeedItem(context, item),
                        );
                      },
                    );
                  },
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Active chips ──────────────────────────────────────────────────────────────

class _ActiveChipsRow extends StatelessWidget {
  final DiscoverFilters filters;
  final ValueChanged<DiscoverFilters> onChange;

  const _ActiveChipsRow({required this.filters, required this.onChange});

  @override
  Widget build(BuildContext context) {
    final chips = _buildChips(context);
    if (chips.isEmpty) return const SizedBox.shrink();
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(16, 10, 16, 10),
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border(
          bottom: BorderSide(color: AppColors.hairline, width: 0.5),
        ),
      ),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: [
            for (var i = 0; i < chips.length; i++) ...[
              if (i > 0) const SizedBox(width: 8),
              chips[i],
            ],
            const SizedBox(width: 8),
            _ClearAllChip(onTap: () => onChange(filters.cleared())),
          ],
        ),
      ),
    );
  }

  List<Widget> _buildChips(BuildContext context) {
    final out = <Widget>[];

    if (filters.subCategoryId != null) {
      out.add(_Chip(
        label: _subCatLabel(filters.subCategoryId!),
        onRemove: () => onChange(filters.copyWith(clearSubCat: true)),
      ));
    }
    if (filters.leafType != null) {
      out.add(_Chip(
        label: filters.leafType!.replaceAll('_', ' '),
        onRemove: () => onChange(filters.copyWith(clearLeafType: true)),
      ));
    }
    if (filters.contentType != null) {
      out.add(_Chip(
        label: _contentTypeLabel(filters.contentType!),
        onRemove: () => onChange(filters.copyWith(clearContentType: true)),
      ));
    }
    if (filters.timeWindow != null) {
      out.add(_Chip(
        label: _timeWindowLabel(filters.timeWindow!),
        onRemove: () => onChange(filters.copyWith(
          clearTimeWindow: true,
          clearDateRange: true,
        )),
      ));
    }
    for (final d in filters.durationBuckets) {
      out.add(_Chip(
        label: _durationLabel(d),
        onRemove: () => onChange(filters.copyWith(
          durationBuckets: filters.durationBuckets.difference({d}),
        )),
      ));
    }
    for (final s in filters.seasons) {
      out.add(_Chip(
        label: _capitalize(s),
        onRemove: () => onChange(filters.copyWith(
          seasons: filters.seasons.difference({s}),
        )),
      ));
    }
    for (final m in filters.months) {
      out.add(_Chip(
        label: _monthLabel(m),
        onRemove: () => onChange(filters.copyWith(
          months: filters.months.difference({m}),
        )),
      ));
    }
    for (final b in filters.budgetBuckets) {
      out.add(_Chip(
        label: _budgetLabel(b),
        onRemove: () => onChange(filters.copyWith(
          budgetBuckets: filters.budgetBuckets.difference({b}),
        )),
      ));
    }
    for (final d in filters.difficulties) {
      out.add(_Chip(
        label: _capitalize(d),
        onRemove: () => onChange(filters.copyWith(
          difficulties: filters.difficulties.difference({d}),
        )),
      ));
    }
    for (final g in filters.groupSizes) {
      out.add(_Chip(
        label: _capitalize(g),
        onRemove: () => onChange(filters.copyWith(
          groupSizes: filters.groupSizes.difference({g}),
        )),
      ));
    }
    if (filters.destinationCityId != null || filters.destinationLat != null) {
      out.add(_Chip(
        label: filters.destinationLabel ??
            filters.destinationCityId ??
            'Destination',
        onRemove: () => onChange(filters.copyWith(clearDestination: true)),
      ));
    }
    if (filters.startingCityId != null) {
      out.add(_Chip(
        label: 'From ${filters.startingCityId}',
        onRemove: () => onChange(filters.copyWith(clearStartingCity: true)),
      ));
    }
    if (filters.distanceKm != null) {
      out.add(_Chip(
        label: '≤ ${filters.distanceKm} km',
        onRemove: () => onChange(filters.copyWith(clearDistance: true)),
      ));
    }
    if (filters.query != null && filters.query!.isNotEmpty) {
      out.add(_Chip(
        label: '"${filters.query}"',
        onRemove: () => onChange(filters.copyWith(clearQuery: true)),
      ));
    }
    return out;
  }

  String _subCatLabel(String id) {
    const names = <String, String>{
      'travel.road_trips': 'Road Trips',
      'travel.biking': 'Biking',
      'travel.trekking': 'Trekking',
      'travel.food_trails': 'Food Trails',
      'travel.adventure': 'Adventure',
      'travel.heritage': 'Heritage',
      'travel.wildlife': 'Wildlife',
      'travel.photo_walks': 'Photo Walks',
      'travel.wellness': 'Wellness',
      'travel.family': 'Family',
      'travel.luxury': 'Luxury',
      'travel.offbeat': 'Offbeat',
    };
    return names[id] ?? id;
  }

  String _contentTypeLabel(String t) {
    switch (t) {
      case 'post':
        return 'Posts';
      case 'self_paced_itinerary':
        return 'Itineraries';
      case 'scheduled_experience':
        return 'Experiences';
      case 'event':
        return 'Events';
      default:
        return t;
    }
  }

  String _timeWindowLabel(String t) {
    switch (t) {
      case 'today':
        return 'Today';
      case 'this_weekend':
        return 'This weekend';
      case 'next_7d':
        return 'Next 7 days';
      case 'this_month':
        return 'This month';
      case 'custom':
        return 'Custom dates';
      default:
        return t;
    }
  }

  String _durationLabel(String d) {
    switch (d) {
      case 'day_trip':
        return 'Day trip';
      case 'weekend':
        return 'Weekend';
      case 'short':
        return '3–5 days';
      case 'long':
        return '6+ days';
      default:
        return d;
    }
  }

  String _budgetLabel(String b) {
    switch (b) {
      case 'free':
        return 'Free';
      case 'lt2k':
        return '≤ ₹2k';
      case '2to5k':
        return '₹2–5k';
      case '5to15k':
        return '₹5–15k';
      case 'gt15k':
        return '₹15k+';
      default:
        return b;
    }
  }

  String _monthLabel(int m) {
    const names = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    return (m >= 1 && m <= 12) ? names[m - 1] : '$m';
  }

  String _capitalize(String s) =>
      s.isEmpty ? s : '${s[0].toUpperCase()}${s.substring(1)}';
}

class _Chip extends StatelessWidget {
  final String label;
  final VoidCallback onRemove;

  const _Chip({required this.label, required this.onRemove});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.primaryTint,
      borderRadius: BorderRadius.circular(999),
      child: InkWell(
        borderRadius: BorderRadius.circular(999),
        onTap: () {
          HapticFeedback.selectionClick();
          onRemove();
        },
        child: Padding(
          padding: const EdgeInsets.fromLTRB(12, 7, 8, 7),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                label,
                style: AppTypography.label.copyWith(
                  color: AppColors.coral,
                  fontWeight: FontWeight.w600,
                  fontSize: 12,
                ),
              ),
              const SizedBox(width: 6),
              Icon(
                PhosphorIcons.x(PhosphorIconsStyle.bold),
                size: 12,
                color: AppColors.coral,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ClearAllChip extends StatelessWidget {
  final VoidCallback onTap;
  const _ClearAllChip({required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        onTap();
      },
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
        child: Text(
          'Clear all',
          style: AppTypography.label.copyWith(
            color: AppColors.inkMuted,
            fontWeight: FontWeight.w600,
            fontSize: 12,
            decoration: TextDecoration.underline,
          ),
        ),
      ),
    );
  }
}

// ── States ────────────────────────────────────────────────────────────────────

class _GridSkeleton extends StatelessWidget {
  const _GridSkeleton();

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 18,
        crossAxisSpacing: 12,
        childAspectRatio: 0.65,
      ),
      itemCount: 6,
      itemBuilder: (_, _) => const Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          AspectRatio(aspectRatio: 1, child: SkeletonRect(borderRadius: 12)),
          SizedBox(height: 8),
          SkeletonLine(height: 13),
          SizedBox(height: 6),
          SkeletonLine(width: 100, height: 11),
        ],
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  const _ErrorState();

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(32),
      children: [
        const SizedBox(height: 80),
        Icon(
          PhosphorIcons.warning(PhosphorIconsStyle.regular),
          size: 32,
          color: AppColors.inkSoft,
        ),
        const SizedBox(height: 12),
        Text(
          "Couldn't load results",
          textAlign: TextAlign.center,
          style: AppTypography.h4.copyWith(color: AppColors.ink),
        ),
        const SizedBox(height: 4),
        Text(
          'Pull down to retry.',
          textAlign: TextAlign.center,
          style: AppTypography.body.copyWith(color: AppColors.inkMuted),
        ),
      ],
    );
  }
}

class _EmptyState extends StatelessWidget {
  final VoidCallback onTune;
  const _EmptyState({required this.onTune});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(32),
      children: [
        const SizedBox(height: 80),
        Icon(
          PhosphorIcons.compass(PhosphorIconsStyle.regular),
          size: 32,
          color: AppColors.inkSoft,
        ),
        const SizedBox(height: 12),
        Text(
          'No matches yet',
          textAlign: TextAlign.center,
          style: AppTypography.h4.copyWith(color: AppColors.ink),
        ),
        const SizedBox(height: 4),
        Text(
          'Try widening your filters or browse the home feed.',
          textAlign: TextAlign.center,
          style: AppTypography.body.copyWith(color: AppColors.inkMuted),
        ),
        const SizedBox(height: 16),
        Center(
          child: OutlinedButton(
            onPressed: onTune,
            style: OutlinedButton.styleFrom(
              foregroundColor: AppColors.coral,
              side: const BorderSide(color: AppColors.coral, width: 1.25),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            child: const Text('Tune filters'),
          ),
        ),
      ],
    );
  }
}
