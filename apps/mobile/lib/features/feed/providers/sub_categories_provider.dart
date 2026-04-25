import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/providers/auth_provider.dart';

/// Sub-category data for a single vertical.
class SubCategory {
  final String id;
  final String slug;
  final String name;
  final List<String> leafTypes;
  final int displayOrder;

  const SubCategory({
    required this.id,
    required this.slug,
    required this.name,
    required this.leafTypes,
    required this.displayOrder,
  });

  factory SubCategory.fromJson(Map<String, dynamic> json) => SubCategory(
        id: json['id'] as String,
        slug: json['slug'] as String,
        name: json['name'] as String,
        leafTypes: (json['leaf_types'] as List<dynamic>?)
                ?.map((e) => e as String)
                .toList() ??
            [],
        displayOrder: (json['display_order'] as num?)?.toInt() ?? 0,
      );
}

/// Fetches sub-categories for a given vertical from
/// GET /api/v1/discover/sub-categories?vertical={vertical}.
///
/// Falls back to an empty list on error — the chip rail is simply hidden.
final subCategoriesProvider =
    FutureProvider.family.autoDispose<List<SubCategory>, String>(
  (ref, vertical) async {
    final dio = ref.read(authServiceProvider).dio;
    try {
      final response = await dio
          .get('/api/v1/discover/sub-categories', queryParameters: {'vertical': vertical});
      final data = (response.data as Map<String, dynamic>)['data'] as List<dynamic>;
      final cats = data
          .map((e) => SubCategory.fromJson(e as Map<String, dynamic>))
          .toList();
      cats.sort((a, b) => a.displayOrder.compareTo(b.displayOrder));
      return cats;
    } catch (_) {
      return const [];
    }
  },
);
