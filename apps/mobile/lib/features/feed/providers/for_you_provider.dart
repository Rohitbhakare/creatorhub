import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/providers/auth_provider.dart';
import '../models/feed_models.dart';

/// "For you" feed — Option-C weighted merge of follows + user verticals.
/// Guests (IAM-FR-010) get popular-across-India from the server.
final forYouProvider =
    FutureProvider.autoDispose<List<FeedContentItem>>((ref) async {
  final authState = ref.watch(authProvider);
  if (authState.isLoading) return const [];

  final dio = ref.read(authServiceProvider).dio;
  final response = await dio.get('/api/v1/feed/for-you');
  final items = (response.data as Map<String, dynamic>)['data'] as List<dynamic>;
  return items
      .map((i) => FeedContentItem.fromJson(i as Map<String, dynamic>))
      .toList();
});
