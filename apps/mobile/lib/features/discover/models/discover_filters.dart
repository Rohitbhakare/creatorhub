import 'package:flutter/foundation.dart';

/// Comprehensive filter model — mirrors the 13-field DiscoverFiltersQuerySchema
/// on the API side. Used by both the filter sheet and the results screen.
@immutable
class DiscoverFilters {
  // Taxonomy
  final String? subCategoryId; // 'travel.trekking'
  final String? leafType; // 'monsoon_trek'
  final String? contentType; // 'post' | 'itinerary' | 'scheduled_experience' | 'event'

  // Time
  /// 'today' | 'this_weekend' | 'next_7d' | 'this_month' | 'custom'
  final String? timeWindow;
  final DateTime? dateFrom;
  final DateTime? dateTo;

  // Facets — multi-select
  final Set<String> durationBuckets; // 'day_trip' | 'weekend' | 'short' | 'long'
  final Set<String> seasons; // 'monsoon'|'winter'|'summer'|'spring'|'autumn'
  final Set<int> months; // 1..12
  final Set<String> budgetBuckets; // 'free' | 'lt2k' | '2to5k' | '5to15k' | 'gt15k'
  final Set<String> difficulties; // 'easy'|'moderate'|'hard'|'expert'
  final Set<String> groupSizes; // 'solo'|'pair'|'small'|'large'

  // Place
  final String? destinationCityId;
  final double? destinationLat;
  final double? destinationLng;
  final String? destinationLabel; // free-text echo for chip display
  final String? startingCityId;
  final int? distanceKm; // 25/50/100/250 — null = anywhere

  // User-loc (passed when distanceKm is set)
  final double? userLat;
  final double? userLng;

  // Sort & free-text
  final String? sort; // 'recent'|'trending'|'price_asc'|'price_desc'
  final String? query;

  const DiscoverFilters({
    this.subCategoryId,
    this.leafType,
    this.contentType,
    this.timeWindow,
    this.dateFrom,
    this.dateTo,
    this.durationBuckets = const {},
    this.seasons = const {},
    this.months = const {},
    this.budgetBuckets = const {},
    this.difficulties = const {},
    this.groupSizes = const {},
    this.destinationCityId,
    this.destinationLat,
    this.destinationLng,
    this.destinationLabel,
    this.startingCityId,
    this.distanceKm,
    this.userLat,
    this.userLng,
    this.sort,
    this.query,
  });

  bool get isEmpty =>
      subCategoryId == null &&
      leafType == null &&
      contentType == null &&
      timeWindow == null &&
      dateFrom == null &&
      dateTo == null &&
      durationBuckets.isEmpty &&
      seasons.isEmpty &&
      months.isEmpty &&
      budgetBuckets.isEmpty &&
      difficulties.isEmpty &&
      groupSizes.isEmpty &&
      destinationCityId == null &&
      destinationLat == null &&
      startingCityId == null &&
      distanceKm == null &&
      (query == null || query!.isEmpty);

  int get activeCount {
    var n = 0;
    if (subCategoryId != null) n++;
    if (leafType != null) n++;
    if (contentType != null) n++;
    if (timeWindow != null) n++;
    if (durationBuckets.isNotEmpty) n++;
    if (seasons.isNotEmpty) n++;
    if (months.isNotEmpty) n++;
    if (budgetBuckets.isNotEmpty) n++;
    if (difficulties.isNotEmpty) n++;
    if (groupSizes.isNotEmpty) n++;
    if (destinationCityId != null || destinationLat != null) n++;
    if (startingCityId != null) n++;
    if (distanceKm != null) n++;
    return n;
  }

  DiscoverFilters copyWith({
    String? subCategoryId,
    String? leafType,
    String? contentType,
    String? timeWindow,
    DateTime? dateFrom,
    DateTime? dateTo,
    Set<String>? durationBuckets,
    Set<String>? seasons,
    Set<int>? months,
    Set<String>? budgetBuckets,
    Set<String>? difficulties,
    Set<String>? groupSizes,
    String? destinationCityId,
    double? destinationLat,
    double? destinationLng,
    String? destinationLabel,
    String? startingCityId,
    int? distanceKm,
    double? userLat,
    double? userLng,
    String? sort,
    String? query,
    bool clearSubCat = false,
    bool clearLeafType = false,
    bool clearContentType = false,
    bool clearTimeWindow = false,
    bool clearDateRange = false,
    bool clearDestination = false,
    bool clearStartingCity = false,
    bool clearDistance = false,
    bool clearQuery = false,
  }) =>
      DiscoverFilters(
        subCategoryId: clearSubCat ? null : (subCategoryId ?? this.subCategoryId),
        leafType: clearLeafType ? null : (leafType ?? this.leafType),
        contentType: clearContentType ? null : (contentType ?? this.contentType),
        timeWindow: clearTimeWindow ? null : (timeWindow ?? this.timeWindow),
        dateFrom: clearDateRange ? null : (dateFrom ?? this.dateFrom),
        dateTo: clearDateRange ? null : (dateTo ?? this.dateTo),
        durationBuckets: durationBuckets ?? this.durationBuckets,
        seasons: seasons ?? this.seasons,
        months: months ?? this.months,
        budgetBuckets: budgetBuckets ?? this.budgetBuckets,
        difficulties: difficulties ?? this.difficulties,
        groupSizes: groupSizes ?? this.groupSizes,
        destinationCityId:
            clearDestination ? null : (destinationCityId ?? this.destinationCityId),
        destinationLat:
            clearDestination ? null : (destinationLat ?? this.destinationLat),
        destinationLng:
            clearDestination ? null : (destinationLng ?? this.destinationLng),
        destinationLabel:
            clearDestination ? null : (destinationLabel ?? this.destinationLabel),
        startingCityId:
            clearStartingCity ? null : (startingCityId ?? this.startingCityId),
        distanceKm: clearDistance ? null : (distanceKm ?? this.distanceKm),
        userLat: userLat ?? this.userLat,
        userLng: userLng ?? this.userLng,
        sort: sort ?? this.sort,
        query: clearQuery ? null : (query ?? this.query),
      );

  DiscoverFilters cleared() => const DiscoverFilters();

  /// Maps to query parameters for the GET /api/v1/discover/results endpoint.
  Map<String, dynamic> toQueryParams() {
    final q = <String, dynamic>{};
    if (subCategoryId != null) q['sub_category_id'] = subCategoryId;
    if (leafType != null) q['leaf_type'] = leafType;
    if (contentType != null) q['content_type'] = contentType;
    if (timeWindow != null) q['time_window'] = timeWindow;
    if (dateFrom != null) q['date_from'] = dateFrom!.toIso8601String();
    if (dateTo != null) q['date_to'] = dateTo!.toIso8601String();
    if (durationBuckets.isNotEmpty) q['duration_buckets'] = durationBuckets.toList();
    if (seasons.isNotEmpty) q['seasons'] = seasons.toList();
    if (months.isNotEmpty) q['months'] = months.toList();
    if (budgetBuckets.isNotEmpty) q['budget_buckets'] = budgetBuckets.toList();
    if (difficulties.isNotEmpty) q['difficulties'] = difficulties.toList();
    if (groupSizes.isNotEmpty) q['group_sizes'] = groupSizes.toList();
    if (destinationCityId != null) q['destination_city_id'] = destinationCityId;
    if (destinationLat != null) q['destination_lat'] = destinationLat;
    if (destinationLng != null) q['destination_lng'] = destinationLng;
    if (startingCityId != null) q['starting_city_id'] = startingCityId;
    if (distanceKm != null) q['distance_km'] = distanceKm;
    if (userLat != null) q['user_lat'] = userLat;
    if (userLng != null) q['user_lng'] = userLng;
    if (sort != null) q['sort'] = sort;
    if (query != null && query!.isNotEmpty) q['q'] = query;
    return q;
  }

  /// Hydrates from a router state's queryParameters map. All values arrive
  /// as strings; lists arrive comma-joined.
  factory DiscoverFilters.fromQuery(Map<String, String> qp) {
    Set<String> splitList(String? v) =>
        (v == null || v.isEmpty) ? const {} : v.split(',').toSet();
    Set<int> splitInts(String? v) => (v == null || v.isEmpty)
        ? const {}
        : v.split(',').map(int.parse).toSet();

    return DiscoverFilters(
      subCategoryId: qp['subCat'] ?? qp['sub_category_id'],
      leafType: qp['leaf'] ?? qp['leaf_type'],
      contentType: qp['type'] ?? qp['content_type'],
      timeWindow: qp['time'] ?? qp['time_window'],
      dateFrom: qp['date_from'] != null ? DateTime.tryParse(qp['date_from']!) : null,
      dateTo: qp['date_to'] != null ? DateTime.tryParse(qp['date_to']!) : null,
      durationBuckets: splitList(qp['duration'] ?? qp['duration_buckets']),
      seasons: splitList(qp['season'] ?? qp['seasons']),
      months: splitInts(qp['month'] ?? qp['months']),
      budgetBuckets: splitList(qp['budget'] ?? qp['budget_buckets']),
      difficulties: splitList(qp['difficulty'] ?? qp['difficulties']),
      groupSizes: splitList(qp['groupSize'] ?? qp['group_sizes']),
      destinationCityId: qp['dest'] ?? qp['destination_city_id'],
      destinationLat: qp['dest_lat'] != null ? double.tryParse(qp['dest_lat']!) : null,
      destinationLng: qp['dest_lng'] != null ? double.tryParse(qp['dest_lng']!) : null,
      destinationLabel: qp['dest_label'],
      startingCityId: qp['from'] ?? qp['starting_city_id'],
      distanceKm: qp['distance'] != null ? int.tryParse(qp['distance']!) : null,
      sort: qp['sort'],
      query: qp['q'],
    );
  }
}
