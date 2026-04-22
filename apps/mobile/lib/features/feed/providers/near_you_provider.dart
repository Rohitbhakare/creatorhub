import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/providers/auth_provider.dart';
import '../models/feed_models.dart';
import 'user_city_provider.dart';

// ── Near You Section ─────────────────────────────────────────

/// Fetches the near-you section using the nearest-neighbor waterfall.
/// Authed users: server reads stored `current_city_id`.
/// Guests: we pass `?city_id=` from the local guest city (set via LocationPicker).
/// Either side falls back to popular-across-India when no city is available.
final nearYouProvider =
    FutureProvider.autoDispose<NearYouResult>((ref) async {
  final authState = ref.watch(authProvider);
  if (authState.isLoading) {
    return const NearYouResult(
      items: [],
      fallbackLevel: 0,
      label: 'Near you',
      fallbackCities: [],
    );
  }

  final dio = ref.read(authServiceProvider).dio;
  final query = <String, dynamic>{};
  if (authState.isGuest) {
    final guestCityId = ref.watch(userCityProvider).cityId;
    if (guestCityId != null) query['city_id'] = guestCityId;
  }
  final response = await dio.get(
    '/api/v1/feed/near-you',
    queryParameters: query.isEmpty ? null : query,
  );
  final data = (response.data as Map<String, dynamic>)['data'] as Map<String, dynamic>;
  return NearYouResult.fromJson(data);
});
