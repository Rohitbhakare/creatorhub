import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../../../shared/theme/colors.dart';
import '../../../shared/theme/typography.dart';
import '../../feed/providers/user_city_provider.dart';
import '../../feed/screens/location_picker_screen.dart';
import '../models/discover_filters.dart';
import '../providers/discover_home_providers.dart';
import '../widgets/browse_by_category_grid.dart';
import '../widgets/explore_by_city_chips.dart';
import '../widgets/handpicked_collections_rail.dart';
import 'filter_sheet.dart';
import 'search_overlay.dart';

/// Discover tab — search-first editorial home (DD-013/014/015).
///
/// Header: page title + city pin chip + subhead + search pill (rotating
/// placeholder + filter icon). Body slivers: Browse by category grid →
/// Handpicked collections rail → Explore by city chips. Stories rail and
/// experiences list have moved to the Home feed and are no longer
/// duplicated here.
class DiscoverTabScreen extends ConsumerStatefulWidget {
  const DiscoverTabScreen({super.key});

  @override
  ConsumerState<DiscoverTabScreen> createState() => _DiscoverTabScreenState();
}

class _DiscoverTabScreenState extends ConsumerState<DiscoverTabScreen> {
  DiscoverFilters _filters = const DiscoverFilters();

  Future<void> _refresh() async {
    final cityId = ref.read(userCityProvider).cityId;
    ref.invalidate(popularSearchesProvider);
    ref.invalidate(handpickedCollectionsProvider(cityId));
    ref.invalidate(discoverCitiesProvider);
  }

  void _openSearch() {
    HapticFeedback.selectionClick();
    Navigator.of(context).push(
      PageRouteBuilder(
        pageBuilder: (_, _, _) => SearchOverlay(
          onQuerySubmitted: (_) => Navigator.of(context).pop(),
          onContentTap: (id, type) {
            Navigator.of(context).pop();
            _navigateToContent(id, type);
          },
          onCityTap: (_, _) => Navigator.of(context).pop(),
          onCreatorTap: (id) {
            Navigator.of(context).pop();
            context.push('/profile/$id');
          },
        ),
        transitionsBuilder: (_, anim, _, child) =>
            FadeTransition(opacity: anim, child: child),
        transitionDuration: const Duration(milliseconds: 200),
      ),
    );
  }

  void _navigateToContent(String id, String type) {
    switch (type) {
      case 'post':
        context.push('/posts/$id');
      case 'self_paced_itinerary':
        context.push('/itineraries/$id');
      case 'scheduled_experience':
        context.push('/experiences/$id');
      case 'event':
        context.push('/events/$id');
    }
  }

  Future<void> _openFilters() async {
    HapticFeedback.selectionClick();
    final result = await DiscoverFilterSheet.show(context, _filters);
    if (result != null && mounted) {
      setState(() => _filters = result);
    }
  }

  void _openCityPicker() {
    HapticFeedback.selectionClick();
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const LocationPickerScreen(),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: RefreshIndicator(
          color: AppColors.coral,
          onRefresh: _refresh,
          child: CustomScrollView(
            slivers: [
              SliverPersistentHeader(
                pinned: true,
                delegate: _DiscoverHeaderDelegate(
                  filters: _filters,
                  onSearchTap: _openSearch,
                  onFilterTap: _openFilters,
                  onCityTap: _openCityPicker,
                ),
              ),
              const SliverToBoxAdapter(child: SizedBox(height: 8)),
              const SliverToBoxAdapter(child: BrowseByCategoryGrid()),
              const SliverToBoxAdapter(child: ExploreByCityChips()),
              const SliverToBoxAdapter(child: HandpickedCollectionsRail()),
              const SliverToBoxAdapter(child: SizedBox(height: 32)),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Sticky header delegate ────────────────────────────────────────────────────

class _DiscoverHeaderDelegate extends SliverPersistentHeaderDelegate {
  final DiscoverFilters filters;
  final VoidCallback onSearchTap;
  final VoidCallback onFilterTap;
  final VoidCallback onCityTap;

  const _DiscoverHeaderDelegate({
    required this.filters,
    required this.onSearchTap,
    required this.onFilterTap,
    required this.onCityTap,
  });

  static const double _kHeight = 168;

  @override
  double get minExtent => _kHeight;
  @override
  double get maxExtent => _kHeight;

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    return Container(
      color: AppColors.surface,
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Expanded(
                child: Text(
                  'Discover',
                  style: AppTypography.h1.copyWith(fontSize: 26),
                ),
              ),
              _CityPinChip(onTap: onCityTap),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            'Trips, creators, stories, and cities',
            style: AppTypography.body.copyWith(
              color: AppColors.inkSoft,
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 14),
          _SearchPill(
            filters: filters,
            onSearchTap: onSearchTap,
            onFilterTap: onFilterTap,
          ),
        ],
      ),
    );
  }

  @override
  bool shouldRebuild(covariant _DiscoverHeaderDelegate old) =>
      old.filters != filters;
}

class _CityPinChip extends ConsumerWidget {
  final VoidCallback onTap;
  const _CityPinChip({required this.onTap});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final city = ref.watch(userCityProvider).cityName ?? 'Set city';
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.hairline, width: 0.5),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              PhosphorIcons.mapPin(PhosphorIconsStyle.fill),
              size: 14,
              color: AppColors.coral,
            ),
            const SizedBox(width: 4),
            Text(
              city,
              style: AppTypography.body.copyWith(
                color: AppColors.ink,
                fontSize: 13,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(width: 2),
            Icon(
              PhosphorIcons.caretRight(PhosphorIconsStyle.regular),
              size: 12,
              color: AppColors.inkMuted,
            ),
          ],
        ),
      ),
    );
  }
}

class _SearchPill extends StatelessWidget {
  final DiscoverFilters filters;
  final VoidCallback onSearchTap;
  final VoidCallback onFilterTap;

  const _SearchPill({
    required this.filters,
    required this.onSearchTap,
    required this.onFilterTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onSearchTap,
      child: Container(
        height: 50,
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: AppColors.hairline, width: 0.5),
        ),
        child: Row(
          children: [
            const SizedBox(width: 16),
            Icon(
              PhosphorIcons.magnifyingGlass(PhosphorIconsStyle.regular),
              size: 17,
              color: AppColors.inkSoft,
            ),
            const SizedBox(width: 10),
            const Expanded(child: _RotatingPlaceholder()),
            Container(
              width: 1,
              height: 22,
              color: AppColors.hairline,
              margin: const EdgeInsets.symmetric(horizontal: 12),
            ),
            GestureDetector(
              onTap: onFilterTap,
              behavior: HitTestBehavior.opaque,
              child: Padding(
                padding: const EdgeInsets.only(right: 16),
                child: Stack(
                  clipBehavior: Clip.none,
                  children: [
                    Icon(
                      PhosphorIcons.slidersHorizontal(PhosphorIconsStyle.regular),
                      size: 18,
                      color: filters.activeCount > 0
                          ? AppColors.coral
                          : AppColors.inkSoft,
                    ),
                    if (filters.activeCount > 0)
                      Positioned(
                        top: -5,
                        right: -7,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 5,
                            vertical: 1,
                          ),
                          decoration: BoxDecoration(
                            color: AppColors.coral,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          constraints: const BoxConstraints(minWidth: 14),
                          child: Text(
                            '${filters.activeCount}',
                            textAlign: TextAlign.center,
                            style: AppTypography.label.copyWith(
                              color: Colors.white,
                              fontSize: 9,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Rotates through real top searches every ~3.5s with a fade. Falls back
/// to a static placeholder when no candidates have loaded yet (cold start).
class _RotatingPlaceholder extends ConsumerStatefulWidget {
  const _RotatingPlaceholder();

  @override
  ConsumerState<_RotatingPlaceholder> createState() =>
      _RotatingPlaceholderState();
}

class _RotatingPlaceholderState extends ConsumerState<_RotatingPlaceholder> {
  Timer? _timer;
  int _index = 0;

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _ensureTimer(int len) {
    if (_timer != null || len <= 1) return;
    _timer = Timer.periodic(const Duration(milliseconds: 3500), (_) {
      if (!mounted) return;
      setState(() => _index = (_index + 1) % len);
    });
  }

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(popularSearchesProvider);
    final candidates = async.maybeWhen(
      data: (list) => list,
      orElse: () => const <String>[],
    );

    final placeholder = candidates.isEmpty
        ? 'Search trips, creators, cities'
        : 'Try "${candidates[_index % candidates.length]}"';

    if (candidates.isNotEmpty) {
      WidgetsBinding.instance.addPostFrameCallback(
        (_) => _ensureTimer(candidates.length),
      );
    }

    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 220),
      transitionBuilder: (child, anim) =>
          FadeTransition(opacity: anim, child: child),
      child: Text(
        placeholder,
        key: ValueKey(placeholder),
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: AppTypography.body.copyWith(color: AppColors.inkMuted),
      ),
    );
  }
}
