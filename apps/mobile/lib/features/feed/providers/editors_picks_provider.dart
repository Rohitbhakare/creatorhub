import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/providers/auth_provider.dart';
import '../models/feed_models.dart';

/// DISC-FR-039: Featured content — ops-curated via admin/Retool.
/// Section self-hides on mobile when list is empty.
final editorPicksProvider =
    FutureProvider.autoDispose<List<FeedContentItem>>((ref) async {
  final authState = ref.watch(authProvider);
  if (authState.isLoading) return const [];

  final dio = ref.read(authServiceProvider).dio;
  final response = await dio.get('/api/v1/feed/editors-picks');
  final items =
      (response.data as Map<String, dynamic>)['data'] as List<dynamic>;
  return items
      .map((i) => FeedContentItem.fromJson(i as Map<String, dynamic>))
      .toList();
});
