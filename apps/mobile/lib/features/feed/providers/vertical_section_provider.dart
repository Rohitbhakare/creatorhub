import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/providers/auth_provider.dart';
import '../models/feed_models.dart';

/// Content rail for a single vertical (e.g. 'travel', 'stories').
/// Optional auth — works for guests too.
final verticalSectionProvider =
    FutureProvider.family.autoDispose<List<FeedContentItem>, String>((ref, vertical) async {
  final dio = ref.read(authServiceProvider).dio;
  final response = await dio.get('/api/v1/feed/vertical/$vertical');
  final items = (response.data as Map<String, dynamic>)['data'] as List<dynamic>;
  return items
      .map((i) => FeedContentItem.fromJson(i as Map<String, dynamic>))
      .toList();
});
