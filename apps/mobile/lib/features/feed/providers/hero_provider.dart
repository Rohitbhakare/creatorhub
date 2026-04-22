import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/providers/auth_provider.dart';
import '../models/feed_models.dart';

/// Hero item for the active Home tab. Backed by `/api/v1/feed/hero?tab=...`.
/// Null when the tab has no content (hero slot hides entirely).
final heroProvider = FutureProvider.autoDispose
    .family<FeedContentItem?, String>((ref, tab) async {
  final authState = ref.watch(authProvider);
  if (authState.isLoading || !authState.isAuthenticated) return null;

  final dio = ref.read(authServiceProvider).dio;
  final response = await dio.get('/api/v1/feed/hero', queryParameters: {'tab': tab});
  final data = (response.data as Map<String, dynamic>)['data'];
  if (data == null) return null;
  return FeedContentItem.fromJson(data as Map<String, dynamic>);
});
