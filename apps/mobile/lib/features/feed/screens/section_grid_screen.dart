import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/typography.dart';
import '../../../shared/components/skeleton.dart';
import '../../auth/providers/auth_provider.dart';
import '../../discover/models/discover_filters.dart';
import '../../discover/providers/discover_results_provider.dart';
import '../../discover/screens/filter_sheet.dart';
import '../models/feed_models.dart';
import '../providers/section_rails_provider.dart';
import '../providers/user_city_provider.dart';
import '../utils/feed_navigation.dart';
import '../widgets/content_card.dart';

/// Single reusable full-screen for all home "See all" navigations.
/// Each [SectionKind] picks a different provider and pre-locked filter set.
enum SectionKind {
  hotNearYou,
  tripsFromCity,
  thisWeekend,
  upcomingEvents,
  dayTrips,
  weekendGetaways,
  subCat,
}

class SectionGridScreen extends ConsumerStatefulWidget {
  final SectionKind kind;

  /// For [SectionKind.subCat]: 'travel.road_trips', 'travel.biking', etc.
  final String? subCategorySlug;

  const SectionGridScreen({
    super.key,
    required this.kind,
    this.subCategorySlug,
  });

  @override
  ConsumerState<SectionGridScreen> createState() => _SectionGridScreenState();
}

class _SectionGridScreenState extends ConsumerState<SectionGridScreen> {
  /// User-applied filters from the bottom sheet. When null, the screen uses
  /// the section's default rail provider. When non-null, it switches to
  /// discoverResultsProvider with locked + extra filters merged.
  DiscoverFilters? _extraFilters;

  String _title(String? cityName) {
    final city = cityName ?? 'you';
    switch (widget.kind) {
      case SectionKind.hotNearYou:
        return "What's hot near $city";
      case SectionKind.tripsFromCity:
        return 'Trips from $city';
      case SectionKind.thisWeekend:
        return 'This weekend in $city';
      case SectionKind.upcomingEvents:
        return 'Upcoming events';
      case SectionKind.dayTrips:
        return 'Day trips from $city';
      case SectionKind.weekendGetaways:
        return 'Weekend getaways';
      case SectionKind.subCat:
        final label = _subCatLabel(widget.subCategorySlug);
        return '$label near $city';
    }
  }

  String _subCatLabel(String? slug) {
    switch (slug) {
      case 'travel.road_trips':
        return 'Road Trips';
      case 'travel.biking':
        return 'Biking';
      case 'travel.trekking':
        return 'Trekking';
      case 'travel.food_trails':
        return 'Food Trails';
      default:
        return 'Travel';
    }
  }

  /// Filters that the section locks in by default — these compose with
  /// whatever the user picks in the filter sheet.
  DiscoverFilters _lockedFilters(String? cityId) {
    switch (widget.kind) {
      case SectionKind.hotNearYou:
        return const DiscoverFilters(sort: 'trending', distanceKm: 100);
      case SectionKind.tripsFromCity:
        return DiscoverFilters(startingCityId: cityId, distanceKm: 100);
      case SectionKind.thisWeekend:
        return const DiscoverFilters(timeWindow: 'this_weekend', distanceKm: 100);
      case SectionKind.upcomingEvents:
        return const DiscoverFilters(contentType: 'event', timeWindow: 'this_month');
      case SectionKind.dayTrips:
        return const DiscoverFilters(
          durationBuckets: {'day_trip'},
          distanceKm: 100,
        );
      case SectionKind.weekendGetaways:
        return const DiscoverFilters(durationBuckets: {'weekend'}, distanceKm: 250);
      case SectionKind.subCat:
        return DiscoverFilters(
          subCategoryId: widget.subCategorySlug,
          distanceKm: 100,
        );
    }
  }

  /// Merges locked filters with user picks. User picks override locked
  /// values for the same field.
  DiscoverFilters _mergedFilters(String? cityId) {
    final locked = _lockedFilters(cityId);
    final extras = _extraFilters;
    if (extras == null) return locked;
    return DiscoverFilters(
      subCategoryId: extras.subCategoryId ?? locked.subCategoryId,
      leafType: extras.leafType ?? locked.leafType,
      contentType: extras.contentType ?? locked.contentType,
      timeWindow: extras.timeWindow ?? locked.timeWindow,
      dateFrom: extras.dateFrom ?? locked.dateFrom,
      dateTo: extras.dateTo ?? locked.dateTo,
      durationBuckets:
          extras.durationBuckets.isNotEmpty ? extras.durationBuckets : locked.durationBuckets,
      seasons: extras.seasons.isNotEmpty ? extras.seasons : locked.seasons,
      months: extras.months.isNotEmpty ? extras.months : locked.months,
      budgetBuckets:
          extras.budgetBuckets.isNotEmpty ? extras.budgetBuckets : locked.budgetBuckets,
      difficulties: extras.difficulties.isNotEmpty ? extras.difficulties : locked.difficulties,
      groupSizes: extras.groupSizes.isNotEmpty ? extras.groupSizes : locked.groupSizes,
      destinationCityId: extras.destinationCityId ?? locked.destinationCityId,
      destinationLat: extras.destinationLat ?? locked.destinationLat,
      destinationLng: extras.destinationLng ?? locked.destinationLng,
      destinationLabel: extras.destinationLabel ?? locked.destinationLabel,
      startingCityId: extras.startingCityId ?? locked.startingCityId,
      distanceKm: extras.distanceKm ?? locked.distanceKm,
      userLat: extras.userLat ?? locked.userLat,
      userLng: extras.userLng ?? locked.userLng,
      sort: extras.sort ?? locked.sort,
      query: extras.query ?? locked.query,
    );
  }

  AsyncValue<List<FeedContentItem>> _watchDefault(SectionRailParams params) {
    switch (widget.kind) {
      case SectionKind.hotNearYou:
        return ref.watch(hotNearYouProvider(params));
      case SectionKind.tripsFromCity:
        return ref.watch(tripsFromCityProvider(params));
      case SectionKind.thisWeekend:
        return ref.watch(thisWeekendProvider(params));
      case SectionKind.upcomingEvents:
        return ref.watch(upcomingEventsProvider(params));
      case SectionKind.dayTrips:
        return ref.watch(dayTripsProvider(params));
      case SectionKind.weekendGetaways:
        return ref.watch(weekendGetawaysProvider(params));
      case SectionKind.subCat:
        return ref.watch(_subCatVerticalProvider(widget.subCategorySlug ?? ''));
    }
  }

  void _invalidateDefault(SectionRailParams params) {
    switch (widget.kind) {
      case SectionKind.hotNearYou:
        ref.invalidate(hotNearYouProvider(params));
      case SectionKind.tripsFromCity:
        ref.invalidate(tripsFromCityProvider(params));
      case SectionKind.thisWeekend:
        ref.invalidate(thisWeekendProvider(params));
      case SectionKind.upcomingEvents:
        ref.invalidate(upcomingEventsProvider(params));
      case SectionKind.dayTrips:
        ref.invalidate(dayTripsProvider(params));
      case SectionKind.weekendGetaways:
        ref.invalidate(weekendGetawaysProvider(params));
      case SectionKind.subCat:
        ref.invalidate(_subCatVerticalProvider(widget.subCategorySlug ?? ''));
    }
  }

  Future<void> _openFilters(String? cityId) async {
    final hydrated = _extraFilters ?? _lockedFilters(cityId);
    final result = await DiscoverFilterSheet.show(context, hydrated);
    if (result == null) return;
    setState(() => _extraFilters = result);
  }

  void _clearFilters() {
    setState(() => _extraFilters = null);
  }

  @override
  Widget build(BuildContext context) {
    final cityState = ref.watch(userCityProvider);
    final params = SectionRailParams(cityId: cityState.cityId);
    final hasExtras = _extraFilters != null && !_extraFilters!.isEmpty;

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0,
        scrolledUnderElevation: 0,
        title: Text(
          _title(cityState.cityName),
          style: AppTypography.h4,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        leading: IconButton(
          icon: Icon(PhosphorIcons.arrowLeft(PhosphorIconsStyle.regular)),
          color: AppColors.ink,
          onPressed: () => context.pop(),
        ),
        actions: [
          Stack(
            clipBehavior: Clip.none,
            children: [
              IconButton(
                icon: Icon(PhosphorIcons.slidersHorizontal(PhosphorIconsStyle.regular)),
                color: AppColors.ink,
                tooltip: 'Filters',
                onPressed: () => _openFilters(cityState.cityId),
              ),
              if (hasExtras)
                Positioned(
                  right: 8,
                  top: 8,
                  child: Container(
                    width: 8,
                    height: 8,
                    decoration: const BoxDecoration(
                      color: AppColors.coral,
                      shape: BoxShape.circle,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            if (hasExtras) _ActiveFilterBar(
              count: _extraFilters!.activeCount,
              onClear: _clearFilters,
            ),
            Expanded(
              child: hasExtras
                  ? _FilteredBody(
                      filters: _mergedFilters(cityState.cityId),
                      cityName: cityState.cityName,
                    )
                  : _DefaultBody(
                      async: _watchDefault(params),
                      cityName: cityState.cityName,
                      onRefresh: () async => _invalidateDefault(params),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Subcat sections fetch from /feed/vertical/travel with sub_category_id filter.
final _subCatVerticalProvider = FutureProvider.autoDispose
    .family<List<FeedContentItem>, String>((ref, subCatId) async {
  final dio = ref.read(authServiceProvider).dio;
  final response = await dio.get(
    '/api/v1/feed/vertical/travel',
    queryParameters: {'sub_category_id': subCatId},
  );
  final items = (response.data as Map<String, dynamic>)['data'] as List<dynamic>;
  return items
      .map((i) => FeedContentItem.fromJson(i as Map<String, dynamic>))
      .toList();
});

class _ActiveFilterBar extends StatelessWidget {
  final int count;
  final VoidCallback onClear;
  const _ActiveFilterBar({required this.count, required this.onClear});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
      color: AppColors.surface,
      child: Row(
        children: [
          Icon(
            PhosphorIcons.funnelSimple(PhosphorIconsStyle.fill),
            size: 14,
            color: AppColors.coral,
          ),
          const SizedBox(width: 6),
          Text(
            '$count filter${count == 1 ? '' : 's'} applied',
            style: AppTypography.caption.copyWith(
              color: AppColors.ink,
              fontWeight: FontWeight.w600,
            ),
          ),
          const Spacer(),
          TextButton(
            onPressed: onClear,
            style: TextButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              minimumSize: Size.zero,
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              foregroundColor: AppColors.coral,
            ),
            child: Text(
              'Clear',
              style: AppTypography.caption.copyWith(fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }
}

class _DefaultBody extends StatelessWidget {
  final AsyncValue<List<FeedContentItem>> async;
  final String? cityName;
  final Future<void> Function() onRefresh;

  const _DefaultBody({
    required this.async,
    required this.cityName,
    required this.onRefresh,
  });

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      color: AppColors.coral,
      onRefresh: onRefresh,
      child: async.when(
        loading: () => const _Skeleton(),
        error: (_, _) => const _ErrorState(),
        data: (items) {
          if (items.isEmpty) return _Empty(cityName: cityName);
          return _Grid(items: items);
        },
      ),
    );
  }
}

class _FilteredBody extends ConsumerWidget {
  final DiscoverFilters filters;
  final String? cityName;

  const _FilteredBody({required this.filters, required this.cityName});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(discoverResultsProvider(filters));
    return RefreshIndicator(
      color: AppColors.coral,
      onRefresh: () =>
          ref.read(discoverResultsProvider(filters).notifier).refresh(),
      child: async.when(
        loading: () => const _Skeleton(),
        error: (_, _) => const _ErrorState(),
        data: (state) {
          if (state.items.isEmpty) return _Empty(cityName: cityName);
          return _Grid(items: state.items);
        },
      ),
    );
  }
}

class _Grid extends StatelessWidget {
  final List<FeedContentItem> items;
  const _Grid({required this.items});

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 18,
        crossAxisSpacing: 12,
        childAspectRatio: 0.65,
      ),
      itemCount: items.length,
      itemBuilder: (context, i) => ContentCard(
        item: items[i],
        variant: ContentCardVariant.grid,
        onTap: () => openFeedItem(context, items[i]),
      ),
    );
  }
}

class _Skeleton extends StatelessWidget {
  const _Skeleton();

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
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
          "Couldn't load this section",
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

class _Empty extends StatelessWidget {
  final String? cityName;
  const _Empty({this.cityName});

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
          'No matches in ${cityName ?? 'your area'} yet',
          textAlign: TextAlign.center,
          style: AppTypography.h4.copyWith(color: AppColors.ink),
        ),
        const SizedBox(height: 4),
        Text(
          'Try widening your filters or check back later.',
          textAlign: TextAlign.center,
          style: AppTypography.body.copyWith(color: AppColors.inkMuted),
        ),
      ],
    );
  }
}
