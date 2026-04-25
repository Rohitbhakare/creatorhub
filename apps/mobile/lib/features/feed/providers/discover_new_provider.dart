import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/providers/auth_provider.dart';
import '../models/feed_models.dart';

/// Fetches creators from outside the user's active verticals for the
/// "Discover something new" section at the bottom of the home feed.
///
/// Calls GET /api/v1/discover/creators?exclude_verticals=travel,stories&limit=6.
/// Falls back to /api/v1/discover/creators?limit=6 if the exclude param is
/// not supported yet.
/// Returns empty list on error — the section is hidden when empty.
final discoverNewProvider =
    FutureProvider.autoDispose<List<DiscoverCreator>>((ref) async {
  final dio = ref.read(authServiceProvider).dio;
  try {
    final response = await dio.get(
      '/api/v1/discover/creators',
      queryParameters: {
        'exclude_verticals': 'travel,stories',
        'limit': 6,
      },
    );
    final data = (response.data as Map<String, dynamic>)['data'] as List<dynamic>;
    return data
        .map((e) => DiscoverCreator.fromJson(e as Map<String, dynamic>))
        .toList();
  } catch (_) {
    // Fallback: try without exclude_verticals param
    try {
      final response = await dio.get(
        '/api/v1/discover/creators',
        queryParameters: {'limit': 6},
      );
      final data =
          (response.data as Map<String, dynamic>)['data'] as List<dynamic>;
      return data
          .map((e) => DiscoverCreator.fromJson(e as Map<String, dynamic>))
          .toList();
    } catch (_) {
      return const [];
    }
  }
});
