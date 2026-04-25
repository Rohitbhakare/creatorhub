import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/providers/auth_provider.dart';
import '../models/feed_models.dart';

/// Parameters for [verticalSectionProvider].
class VerticalSectionParams {
  final String vertical;

  /// If non-null, filters by this sub-category ID (e.g. 'travel.trekking').
  final String? subCategoryId;

  const VerticalSectionParams(this.vertical, {this.subCategoryId});

  @override
  bool operator ==(Object other) =>
      other is VerticalSectionParams &&
      other.vertical == vertical &&
      other.subCategoryId == subCategoryId;

  @override
  int get hashCode => Object.hash(vertical, subCategoryId);
}

/// Content rail for a single vertical (e.g. 'travel', 'stories').
/// Accepts an optional sub_category_id query param for filtered views.
/// Optional auth — works for guests too.
final verticalSectionProvider = FutureProvider.family
    .autoDispose<List<FeedContentItem>, VerticalSectionParams>((ref, params) async {
  final dio = ref.read(authServiceProvider).dio;
  final queryParameters = <String, dynamic>{};
  if (params.subCategoryId != null) {
    queryParameters['sub_category_id'] = params.subCategoryId;
  }
  final response = await dio.get(
    '/api/v1/feed/vertical/${params.vertical}',
    queryParameters: queryParameters.isEmpty ? null : queryParameters,
  );
  final items = (response.data as Map<String, dynamic>)['data'] as List<dynamic>;
  return items
      .map((i) => FeedContentItem.fromJson(i as Map<String, dynamic>))
      .toList();
});
