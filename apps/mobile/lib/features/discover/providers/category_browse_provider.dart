import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/providers/auth_provider.dart';
import '../../feed/models/feed_models.dart';

// ── Models ────────────────────────────────────────────────────────────

class SubCategoryItem {
  final String id;
  final String slug;
  final String name;
  final List<String> leafTypes;
  final int contentCount;

  const SubCategoryItem({
    required this.id,
    required this.slug,
    required this.name,
    required this.leafTypes,
    required this.contentCount,
  });

  factory SubCategoryItem.fromJson(Map<String, dynamic> json) =>
      SubCategoryItem(
        id: json['id'] as String,
        slug: json['slug'] as String,
        name: json['name'] as String,
        leafTypes: (json['leaf_types'] as List<dynamic>?)
                ?.map((e) => e as String)
                .toList() ??
            const [],
        contentCount: (json['content_count'] as num?)?.toInt() ?? 0,
      );
}

class CategoryBrowseState {
  final List<SubCategoryItem> subCategories;
  final List<FeedContentItem> items;
  final bool isLoading;
  final bool isLoadingMore;
  final String? nextCursor;
  final String? error;

  const CategoryBrowseState({
    this.subCategories = const [],
    this.items = const [],
    this.isLoading = true,
    this.isLoadingMore = false,
    this.nextCursor,
    this.error,
  });

  CategoryBrowseState copyWith({
    List<SubCategoryItem>? subCategories,
    List<FeedContentItem>? items,
    bool? isLoading,
    bool? isLoadingMore,
    String? nextCursor,
    Object? error = _sentinel,
  }) =>
      CategoryBrowseState(
        subCategories: subCategories ?? this.subCategories,
        items: items ?? this.items,
        isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        nextCursor: nextCursor,
        error: error == _sentinel ? this.error : error as String?,
      );
}

const _sentinel = Object();

// ── Provider ──────────────────────────────────────────────────────────

class CategoryBrowseParams {
  final String vertical;
  final String? subCategoryId;
  final String? leafType;

  const CategoryBrowseParams({
    required this.vertical,
    this.subCategoryId,
    this.leafType,
  });

  @override
  bool operator ==(Object other) =>
      other is CategoryBrowseParams &&
      other.vertical == vertical &&
      other.subCategoryId == subCategoryId &&
      other.leafType == leafType;

  @override
  int get hashCode => Object.hash(vertical, subCategoryId, leafType);
}

class CategoryBrowseNotifier extends Notifier<CategoryBrowseState> {
  final CategoryBrowseParams params;

  CategoryBrowseNotifier(this.params);

  @override
  CategoryBrowseState build() {
    Future.microtask(() => _fetch());
    return const CategoryBrowseState();
  }

  Future<void> _fetch({String? cursor}) async {
    if (cursor == null) {
      state = state.copyWith(isLoading: true, error: null);
    } else {
      state = state.copyWith(isLoadingMore: true);
    }

    try {
      final dio = ref.read(authServiceProvider).dio;
      final queryParams = <String, dynamic>{
        'vertical': params.vertical,
        if (params.subCategoryId != null) 'sub_category_id': params.subCategoryId,
        if (params.leafType != null) 'leaf_type': params.leafType,
        if (cursor != null) 'cursor': cursor,
      };
      final res =
          await dio.get('/api/v1/discover/category', queryParameters: queryParams);
      final data =
          (res.data as Map<String, dynamic>)['data'] as Map<String, dynamic>;

      final subCats = (data['sub_categories'] as List<dynamic>? ?? [])
          .map((e) => SubCategoryItem.fromJson(e as Map<String, dynamic>))
          .toList();
      final newItems = (data['items'] as List<dynamic>? ?? [])
          .map((e) => FeedContentItem.fromJson(e as Map<String, dynamic>))
          .toList();
      final nextCursor = data['next_cursor'] as String?;

      if (cursor == null) {
        state = CategoryBrowseState(
          subCategories: subCats,
          items: newItems,
          isLoading: false,
          nextCursor: nextCursor,
        );
      } else {
        state = state.copyWith(
          items: [...state.items, ...newItems],
          isLoadingMore: false,
          nextCursor: nextCursor,
        );
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        isLoadingMore: false,
        error: 'Could not load content',
      );
    }
  }

  Future<void> loadMore() async {
    if (state.isLoadingMore || state.nextCursor == null) return;
    await _fetch(cursor: state.nextCursor);
  }

  Future<void> refresh() => _fetch();
}

final categoryBrowseProvider = NotifierProvider.family<CategoryBrowseNotifier,
    CategoryBrowseState, CategoryBrowseParams>(CategoryBrowseNotifier.new);
