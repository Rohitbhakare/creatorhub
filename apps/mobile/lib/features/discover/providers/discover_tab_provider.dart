import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/providers/auth_provider.dart';
import '../../feed/providers/user_city_provider.dart';
import '../models/discover_models.dart';

export '../models/discover_models.dart';

// ── Themes ────────────────────────────────────────────────────────────────────

final discoverThemesProvider = FutureProvider.autoDispose<List<EditorialTheme>>((ref) async {
  final dio = ref.read(authServiceProvider).dio;
  final response = await dio.get('/api/v1/discover/themes');
  final data = (response.data as Map<String, dynamic>)['data'] as Map<String, dynamic>;
  final list = data['themes'] as List<dynamic>;
  return list.map((e) => EditorialTheme.fromJson(e as Map<String, dynamic>)).toList();
});

// ── Creators near city ────────────────────────────────────────────────────────

final discoverCreatorsProvider =
    FutureProvider.autoDispose<DiscoverCreatorsResult>((ref) async {
  final dio = ref.read(authServiceProvider).dio;
  final cityId = ref.watch(userCityProvider).cityId;

  final query = <String, dynamic>{'limit': 8};
  if (cityId != null) query['city_id'] = cityId;

  final response = await dio.get('/api/v1/discover/creators', queryParameters: query);
  final data = (response.data as Map<String, dynamic>)['data'] as Map<String, dynamic>;
  return DiscoverCreatorsResult.fromJson(data);
});

// ── Upcoming experiences ──────────────────────────────────────────────────────

final discoverExperiencesProvider =
    FutureProvider.autoDispose<List<DiscoverExperience>>((ref) async {
  final dio = ref.read(authServiceProvider).dio;
  final cityId = ref.watch(userCityProvider).cityId;

  final query = <String, dynamic>{'limit': 5};
  if (cityId != null) query['city_id'] = cityId;

  final response = await dio.get('/api/v1/discover/experiences', queryParameters: query);
  final data = (response.data as Map<String, dynamic>)['data'] as Map<String, dynamic>;
  final list = data['experiences'] as List<dynamic>;
  return list.map((e) => DiscoverExperience.fromJson(e as Map<String, dynamic>)).toList();
});
