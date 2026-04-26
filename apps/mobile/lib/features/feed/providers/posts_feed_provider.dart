import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/providers/auth_provider.dart';
import '../models/feed_models.dart';
import 'user_city_provider.dart';

class PostsFeedParams {
  /// 'near' | 'following'
  final String scope;
  final String? cityId;
  final String? subCategoryId;

  const PostsFeedParams({
    required this.scope,
    this.cityId,
    this.subCategoryId,
  });

  @override
  bool operator ==(Object other) =>
      other is PostsFeedParams &&
      other.scope == scope &&
      other.cityId == cityId &&
      other.subCategoryId == subCategoryId;

  @override
  int get hashCode => Object.hash(scope, cityId, subCategoryId);
}

@immutable
class PostsFeedState {
  final List<FeedContentItem> items;
  final String? nextCursor;
  final bool isLoadingMore;
  final bool hasReachedEnd;
  final Object? error;

  const PostsFeedState({
    required this.items,
    required this.nextCursor,
    required this.isLoadingMore,
    required this.hasReachedEnd,
    this.error,
  });

  const PostsFeedState.empty()
      : items = const [],
        nextCursor = null,
        isLoadingMore = false,
        hasReachedEnd = false,
        error = null;

  PostsFeedState copyWith({
    List<FeedContentItem>? items,
    String? nextCursor,
    bool? isLoadingMore,
    bool? hasReachedEnd,
    Object? error,
    bool clearError = false,
    bool clearCursor = false,
  }) =>
      PostsFeedState(
        items: items ?? this.items,
        nextCursor: clearCursor ? null : (nextCursor ?? this.nextCursor),
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        hasReachedEnd: hasReachedEnd ?? this.hasReachedEnd,
        error: clearError ? null : (error ?? this.error),
      );
}

class PostsFeedNotifier extends AsyncNotifier<PostsFeedState> {
  PostsFeedNotifier(this.params);
  final PostsFeedParams params;

  static const _pageSize = 10;

  @override
  Future<PostsFeedState> build() async {
    return _loadPage(cursor: null);
  }

  Future<PostsFeedState> _loadPage({String? cursor}) async {
    final dio = ref.read(authServiceProvider).dio;
    final p = params;
    final cityId = p.cityId ?? ref.read(userCityProvider).cityId;
    final query = <String, dynamic>{
      'scope': p.scope,
      'limit': _pageSize,
    };
    if (cityId != null) query['city_id'] = cityId;
    if (p.subCategoryId != null) query['sub_category_id'] = p.subCategoryId;
    if (cursor != null) query['cursor'] = cursor;

    final response = await dio.get('/api/v1/feed/posts', queryParameters: query);
    final data = (response.data as Map<String, dynamic>)['data'] as Map<String, dynamic>;
    final items = (data['items'] as List<dynamic>)
        .map((i) => FeedContentItem.fromJson(i as Map<String, dynamic>))
        .toList();
    final nextCursor = data['next_cursor'] as String?;
    final hasReached = nextCursor == null;
    return PostsFeedState(
      items: items,
      nextCursor: nextCursor,
      isLoadingMore: false,
      hasReachedEnd: hasReached,
    );
  }

  Future<void> loadMore() async {
    final current = state.value;
    if (current == null) return;
    if (current.isLoadingMore || current.hasReachedEnd || current.nextCursor == null) {
      return;
    }
    state = AsyncData(current.copyWith(isLoadingMore: true, clearError: true));
    try {
      final page = await _loadPage(cursor: current.nextCursor);
      state = AsyncData(
        current.copyWith(
          items: [...current.items, ...page.items],
          nextCursor: page.nextCursor,
          hasReachedEnd: page.hasReachedEnd,
          isLoadingMore: false,
          clearCursor: page.nextCursor == null,
        ),
      );
    } catch (e) {
      state = AsyncData(current.copyWith(isLoadingMore: false, error: e));
    }
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    try {
      final fresh = await _loadPage(cursor: null);
      state = AsyncData(fresh);
    } catch (e, st) {
      state = AsyncError(e, st);
    }
  }
}

final postsFeedProvider = AsyncNotifierProvider.autoDispose
    .family<PostsFeedNotifier, PostsFeedState, PostsFeedParams>(
  PostsFeedNotifier.new,
);

/// Lightweight first-page-only wrapper used by the home "Stories from {city}" rail.
final storiesRailProvider = FutureProvider.autoDispose
    .family<List<FeedContentItem>, String?>((ref, cityId) async {
  final dio = ref.read(authServiceProvider).dio;
  final resolvedCity = cityId ?? ref.watch(userCityProvider).cityId;
  final query = <String, dynamic>{'scope': 'near', 'limit': 8};
  if (resolvedCity != null) query['city_id'] = resolvedCity;
  final response = await dio.get('/api/v1/feed/posts', queryParameters: query);
  final data = (response.data as Map<String, dynamic>)['data'] as Map<String, dynamic>;
  final items = (data['items'] as List<dynamic>)
      .map((i) => FeedContentItem.fromJson(i as Map<String, dynamic>))
      .toList();
  return items;
});
