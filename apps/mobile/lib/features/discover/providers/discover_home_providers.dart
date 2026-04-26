import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/providers/auth_provider.dart';
import '../models/discover_home_models.dart';

export '../models/discover_home_models.dart';

// ── Rotating search placeholder source (DD-015) ─────────────────────

final popularSearchesProvider = FutureProvider.autoDispose<List<String>>((ref) async {
  final dio = ref.read(authServiceProvider).dio;
  try {
    final response = await dio.get(
      '/api/v1/discover/search/popular',
      queryParameters: {'limit': 10},
    );
    final data = (response.data as Map<String, dynamic>)['data'] as Map<String, dynamic>;
    final list = (data['queries'] as List<dynamic>).cast<String>();
    return list;
  } catch (_) {
    return const <String>[];
  }
});

// ── Handpicked collections rail (DD-014) ────────────────────────────

final handpickedCollectionsProvider =
    FutureProvider.autoDispose.family<List<HandpickedCollection>, String?>(
  (ref, cityId) async {
    final dio = ref.read(authServiceProvider).dio;
    final query = <String, dynamic>{'limit': 4};
    if (cityId != null) query['city_id'] = cityId;
    final response = await dio.get('/api/v1/discover/collections', queryParameters: query);
    final data = (response.data as Map<String, dynamic>)['data'] as Map<String, dynamic>;
    final list = data['collections'] as List<dynamic>;
    return list
        .map((e) => HandpickedCollection.fromJson(e as Map<String, dynamic>))
        .toList();
  },
);

// ── Active cities chip rail ─────────────────────────────────────────

final discoverCitiesProvider = FutureProvider.autoDispose<List<DiscoverCity>>((ref) async {
  final dio = ref.read(authServiceProvider).dio;
  final response = await dio.get(
    '/api/v1/discover/cities',
    queryParameters: {'limit': 6},
  );
  final data = (response.data as Map<String, dynamic>)['data'] as Map<String, dynamic>;
  final list = data['cities'] as List<dynamic>;
  return list.map((e) => DiscoverCity.fromJson(e as Map<String, dynamic>)).toList();
});
