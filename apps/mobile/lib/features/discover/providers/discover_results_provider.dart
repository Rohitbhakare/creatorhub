import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/providers/auth_provider.dart';
import '../../feed/models/feed_models.dart';
import '../models/discover_filters.dart';

@immutable
class DiscoverResultsState {
  final List<FeedContentItem> items;
  final String? nextCursor;
  final int? totalCount;
  final bool isLoadingMore;
  final bool hasReachedEnd;
  final Object? error;

  const DiscoverResultsState({
    required this.items,
    required this.nextCursor,
    required this.totalCount,
    required this.isLoadingMore,
    required this.hasReachedEnd,
    this.error,
  });

  const DiscoverResultsState.empty()
      : items = const [],
        nextCursor = null,
        totalCount = null,
        isLoadingMore = false,
        hasReachedEnd = false,
        error = null;

  DiscoverResultsState copyWith({
    List<FeedContentItem>? items,
    String? nextCursor,
    int? totalCount,
    bool? isLoadingMore,
    bool? hasReachedEnd,
    Object? error,
    bool clearError = false,
    bool clearCursor = false,
  }) =>
      DiscoverResultsState(
        items: items ?? this.items,
        nextCursor: clearCursor ? null : (nextCursor ?? this.nextCursor),
        totalCount: totalCount ?? this.totalCount,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        hasReachedEnd: hasReachedEnd ?? this.hasReachedEnd,
        error: clearError ? null : (error ?? this.error),
      );
}

class DiscoverResultsNotifier extends AsyncNotifier<DiscoverResultsState> {
  DiscoverResultsNotifier(this.filters);
  final DiscoverFilters filters;

  static const _pageSize = 20;

  @override
  Future<DiscoverResultsState> build() async {
    return _fetchPage(cursor: null);
  }

  Future<DiscoverResultsState> _fetchPage({String? cursor}) async {
    final dio = ref.read(authServiceProvider).dio;
    final query = filters.toQueryParams();
    query['limit'] = _pageSize;
    if (cursor != null) query['cursor'] = cursor;

    final response = await dio.get(
      '/api/v1/discover/results',
      queryParameters: query,
    );
    final data =
        (response.data as Map<String, dynamic>)['data'] as Map<String, dynamic>;
    final items = (data['items'] as List<dynamic>)
        .map((i) => FeedContentItem.fromJson(i as Map<String, dynamic>))
        .toList();
    final nextCursor = data['next_cursor'] as String?;
    return DiscoverResultsState(
      items: items,
      nextCursor: nextCursor,
      totalCount: (data['total_count'] as num?)?.toInt(),
      isLoadingMore: false,
      hasReachedEnd: nextCursor == null,
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
      final page = await _fetchPage(cursor: current.nextCursor);
      state = AsyncData(
        current.copyWith(
          items: [...current.items, ...page.items],
          nextCursor: page.nextCursor,
          totalCount: page.totalCount ?? current.totalCount,
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
      state = AsyncData(await _fetchPage(cursor: null));
    } catch (e, st) {
      state = AsyncError(e, st);
    }
  }
}

final discoverResultsProvider = AsyncNotifierProvider.autoDispose
    .family<DiscoverResultsNotifier, DiscoverResultsState, DiscoverFilters>(
  DiscoverResultsNotifier.new,
);
