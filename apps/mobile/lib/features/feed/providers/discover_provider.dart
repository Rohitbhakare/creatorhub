import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/providers/auth_provider.dart';
import '../models/feed_models.dart';

/// Creators from verticals outside the user's picks.
/// Hidden when empty (DISC-FR-025).
final discoverProvider =
    FutureProvider.autoDispose<List<DiscoverCreator>>((ref) async {
  final dio = ref.read(authServiceProvider).dio;
  final response = await dio.get('/api/v1/feed/discover');
  final items = (response.data as Map<String, dynamic>)['data'] as List<dynamic>;
  return items
      .map((i) => DiscoverCreator.fromJson(i as Map<String, dynamic>))
      .toList();
});
