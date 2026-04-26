import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/typography.dart';
import '../../../shared/components/skeleton.dart';
import '../../auth/providers/auth_provider.dart';
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

class SectionGridScreen extends ConsumerWidget {
  final SectionKind kind;

  /// For [SectionKind.subCat]: 'travel.road_trips', 'travel.biking', etc.
  final String? subCategorySlug;

  const SectionGridScreen({
    super.key,
    required this.kind,
    this.subCategorySlug,
  });

  String _title(String? cityName) {
    final city = cityName ?? 'you';
    switch (kind) {
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
        final label = _subCatLabel(subCategorySlug);
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

  AsyncValue<List<FeedContentItem>> _watch(
    WidgetRef ref,
    SectionRailParams params,
  ) {
    switch (kind) {
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
        return ref.watch(hotNearYouProvider(params));
    }
  }

  void _invalidate(WidgetRef ref, SectionRailParams params) {
    switch (kind) {
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
        ref.invalidate(hotNearYouProvider(params));
    }
  }

  void _openFilters(BuildContext context, String? cityId) {
    final params = <String, String>{};
    if (kind == SectionKind.subCat && subCategorySlug != null) {
      params['subCat'] = subCategorySlug!;
    }
    if (kind == SectionKind.thisWeekend) params['time'] = 'this_weekend';
    if (kind == SectionKind.dayTrips) params['duration'] = 'day_trip';
    if (kind == SectionKind.weekendGetaways) params['duration'] = 'weekend';
    if (kind == SectionKind.upcomingEvents) {
      params['type'] = 'event';
      params['time'] = 'this_month';
    }
    if (kind == SectionKind.tripsFromCity && cityId != null) {
      params['from'] = cityId;
    }
    final query = params.entries.map((e) => '${e.key}=${Uri.encodeQueryComponent(e.value)}').join('&');
    context.push('/discover/results${query.isEmpty ? '' : '?$query'}');
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cityState = ref.watch(userCityProvider);
    final params = SectionRailParams(cityId: cityState.cityId);

    final async = kind == SectionKind.subCat && subCategorySlug != null
        ? ref.watch(_subCatVerticalProvider(subCategorySlug!))
        : _watch(ref, params);

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
          IconButton(
            icon: Icon(PhosphorIcons.slidersHorizontal(PhosphorIconsStyle.regular)),
            color: AppColors.ink,
            tooltip: 'Filters',
            onPressed: () => _openFilters(context, cityState.cityId),
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: SafeArea(
        child: RefreshIndicator(
          color: AppColors.coral,
          onRefresh: () async {
            if (kind == SectionKind.subCat && subCategorySlug != null) {
              ref.invalidate(_subCatVerticalProvider(subCategorySlug!));
            } else {
              _invalidate(ref, params);
            }
          },
          child: async.when(
            loading: () => const _Skeleton(),
            error: (_, _) => const _ErrorState(),
            data: (items) {
              if (items.isEmpty) {
                return _Empty(cityName: cityState.cityName);
              }
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
            },
          ),
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
