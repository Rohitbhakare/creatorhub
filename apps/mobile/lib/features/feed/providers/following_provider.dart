import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/providers/auth_provider.dart';
import '../models/feed_models.dart';

/// "Following" feed — strictly content from creators the user follows.
/// Returns empty when the user follows nobody (renders empty-state UI).
final followingProvider =
    FutureProvider.autoDispose<List<FeedContentItem>>((ref) async {
  final authState = ref.watch(authProvider);
  if (authState.isLoading || !authState.isAuthenticated) return const [];

  final dio = ref.read(authServiceProvider).dio;
  final response = await dio.get('/api/v1/feed/following');
  final items = (response.data as Map<String, dynamic>)['data'] as List<dynamic>;
  return items
      .map((i) => FeedContentItem.fromJson(i as Map<String, dynamic>))
      .toList();
});
