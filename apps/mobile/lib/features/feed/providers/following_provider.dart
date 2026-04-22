import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/providers/auth_provider.dart';
import '../models/feed_models.dart';

/// "Following" feed — strictly content from creators the user follows.
/// Guests follow nobody — server returns empty, we render the empty state.
final followingProvider =
    FutureProvider.autoDispose<List<FeedContentItem>>((ref) async {
  final authState = ref.watch(authProvider);
  if (authState.isLoading) return const [];

  final dio = ref.read(authServiceProvider).dio;
  final response = await dio.get('/api/v1/feed/following');
  final items = (response.data as Map<String, dynamic>)['data'] as List<dynamic>;
  return items
      .map((i) => FeedContentItem.fromJson(i as Map<String, dynamic>))
      .toList();
});
