import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/providers/auth_provider.dart';
import '../models/feed_models.dart';
import 'user_city_provider.dart';

/// Shared params for the simple home rails. cityId is read from
/// [userCityProvider] when null. lat/lng currently unused server-side
/// (server reads stored coords for authed users).
class SectionRailParams {
  final String? cityId;
  final double? lat;
  final double? lng;

  const SectionRailParams({this.cityId, this.lat, this.lng});

  @override
  bool operator ==(Object other) =>
      other is SectionRailParams &&
      other.cityId == cityId &&
      other.lat == lat &&
      other.lng == lng;

  @override
  int get hashCode => Object.hash(cityId, lat, lng);
}

Future<List<FeedContentItem>> _fetchRail(
  Ref ref,
  String path,
  SectionRailParams params,
) async {
  final dio = ref.read(authServiceProvider).dio;
  final cityId = params.cityId ?? ref.watch(userCityProvider).cityId;
  final query = <String, dynamic>{};
  if (cityId != null) query['city_id'] = cityId;
  if (params.lat != null) query['lat'] = params.lat;
  if (params.lng != null) query['lng'] = params.lng;
  final response = await dio.get(
    path,
    queryParameters: query.isEmpty ? null : query,
  );
  final items = (response.data as Map<String, dynamic>)['data'] as List<dynamic>;
  return items
      .map((i) => FeedContentItem.fromJson(i as Map<String, dynamic>))
      .toList();
}

/// 7-day trending content within ~100km, mixed types.
final hotNearYouProvider = FutureProvider.autoDispose
    .family<List<FeedContentItem>, SectionRailParams>(
  (ref, params) => _fetchRail(ref, '/api/v1/feed/hot-near-you', params),
);

/// Itineraries + experiences with starting_city_id == user's city.
final tripsFromCityProvider = FutureProvider.autoDispose
    .family<List<FeedContentItem>, SectionRailParams>(
  (ref, params) => _fetchRail(ref, '/api/v1/feed/trips-from-city', params),
);

/// Events / experiences with start_at within next Sat–Sun, ≤90km.
final thisWeekendProvider = FutureProvider.autoDispose
    .family<List<FeedContentItem>, SectionRailParams>(
  (ref, params) => _fetchRail(ref, '/api/v1/feed/this-weekend', params),
);

/// Events + scheduled experiences this weekend — same window as
/// [thisWeekendProvider] but narrowed to time-bound types only. Feeds the
/// date-block EventCard rail.
final happeningThisWeekendProvider = FutureProvider.autoDispose
    .family<List<FeedContentItem>, SectionRailParams>(
  (ref, params) => _fetchRail(ref, '/api/v1/feed/happening-this-weekend', params),
);

/// Events in next 30 days, ordered by start_at.
final upcomingEventsProvider = FutureProvider.autoDispose
    .family<List<FeedContentItem>, SectionRailParams>(
  (ref, params) => _fetchRail(ref, '/api/v1/feed/upcoming-events', params),
);

/// Itineraries with duration_minutes ≤ 480.
final dayTripsProvider = FutureProvider.autoDispose
    .family<List<FeedContentItem>, SectionRailParams>(
  (ref, params) => _fetchRail(ref, '/api/v1/feed/day-trips', params),
);

/// 2-day itineraries.
final weekendGetawaysProvider = FutureProvider.autoDispose
    .family<List<FeedContentItem>, SectionRailParams>(
  (ref, params) => _fetchRail(ref, '/api/v1/feed/weekend-getaways', params),
);
