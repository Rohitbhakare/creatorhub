import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/providers/auth_provider.dart';
import '../models/feed_models.dart';
import 'user_city_provider.dart';

/// Hero item for the active Home tab. Backed by `/api/v1/feed/hero?tab=...`.
/// Null when the tab has no content (hero slot hides entirely).
/// Guests use `?city_id=` for the near_you tab, same as [nearYouProvider].
final heroProvider = FutureProvider.autoDispose
    .family<FeedContentItem?, String>((ref, tab) async {
  final authState = ref.watch(authProvider);
  if (authState.isLoading) return null;

  final dio = ref.read(authServiceProvider).dio;
  final query = <String, dynamic>{'tab': tab};
  if (authState.isGuest && tab == 'near_you') {
    final guestCityId = ref.watch(userCityProvider).cityId;
    if (guestCityId != null) query['city_id'] = guestCityId;
  }
  final response = await dio.get('/api/v1/feed/hero', queryParameters: query);
  final data = (response.data as Map<String, dynamic>)['data'];
  if (data == null) return null;
  return FeedContentItem.fromJson(data as Map<String, dynamic>);
});
