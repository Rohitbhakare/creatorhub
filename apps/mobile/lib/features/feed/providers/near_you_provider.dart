import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/providers/auth_provider.dart';
import '../models/feed_models.dart';

// ── Near You Section ─────────────────────────────────────────

/// Fetches the near-you section using the nearest-neighbor waterfall.
/// Requires authentication (user's stored city is used server-side).
final nearYouProvider =
    FutureProvider.autoDispose<NearYouResult>((ref) async {
  final dio = ref.read(authServiceProvider).dio;
  final response = await dio.get('/api/v1/feed/near-you');
  final data = (response.data as Map<String, dynamic>)['data'] as Map<String, dynamic>;
  return NearYouResult.fromJson(data);
});
