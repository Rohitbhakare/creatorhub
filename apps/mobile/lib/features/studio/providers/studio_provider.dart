import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/providers/auth_provider.dart';

// ── Models ─────────────────────────────────────────────────────────

class StudioAlert {
  final String id;
  final String alertType; // 'quiet_state' | 'blocker' | 'celebration' | 'activity'
  final String title;
  final String body;
  final String? ctaTarget;

  const StudioAlert({
    required this.id,
    required this.alertType,
    required this.title,
    required this.body,
    this.ctaTarget,
  });

  bool get isQuietState => alertType == 'quiet_state';
  bool get isBlocker => alertType == 'blocker';

  factory StudioAlert.fromJson(Map<String, dynamic> json) => StudioAlert(
        id: json['id'] as String,
        alertType: json['alert_type'] as String,
        title: json['title'] as String,
        body: json['body'] as String,
        ctaTarget: json['cta_target'] as String?,
      );
}

class StudioStats {
  final int followers;
  final int views;
  final int saves;
  final int bookings;
  final int contentCount;

  const StudioStats({
    required this.followers,
    required this.views,
    required this.saves,
    required this.bookings,
    required this.contentCount,
  });

  factory StudioStats.fromJson(Map<String, dynamic> json) => StudioStats(
        followers: (json['followers'] as num?)?.toInt() ?? 0,
        views: (json['views'] as num?)?.toInt() ?? 0,
        saves: (json['saves'] as num?)?.toInt() ?? 0,
        bookings: (json['bookings'] as num?)?.toInt() ?? 0,
        contentCount: (json['content_count'] as num?)?.toInt() ?? 0,
      );
}

class StudioContentItem {
  final String id;
  final String title;
  final String contentType; // 'post' | 'itinerary' | 'event'
  final String status; // 'draft' | 'published' | 'archived'
  final String? coverUrl;
  final int pricePaisa;
  final int likeCount;
  final int commentCount;
  final DateTime updatedAt;

  const StudioContentItem({
    required this.id,
    required this.title,
    required this.contentType,
    required this.status,
    this.coverUrl,
    required this.pricePaisa,
    required this.likeCount,
    required this.commentCount,
    required this.updatedAt,
  });

  bool get isFree => pricePaisa == 0;

  factory StudioContentItem.fromJson(Map<String, dynamic> json) =>
      StudioContentItem(
        id: json['id'] as String,
        title: json['title'] as String? ?? '',
        contentType: json['content_type'] as String? ?? 'post',
        status: json['status'] as String? ?? 'draft',
        coverUrl: json['cover_url'] as String?,
        pricePaisa: (json['price_paisa'] as num?)?.toInt() ?? 0,
        likeCount: (json['like_count'] as num?)?.toInt() ?? 0,
        commentCount: (json['comment_count'] as num?)?.toInt() ?? 0,
        updatedAt: DateTime.tryParse(json['updated_at'] as String? ?? '') ??
            DateTime.now(),
      );
}

// ── Alert Provider ─────────────────────────────────────────────────

/// Nullable — null means no alert to show (new creator quiet state is
/// handled by the UI when this is null, or the API may return quiet_state).
final studioAlertProvider =
    FutureProvider.autoDispose<StudioAlert?>((ref) async {
  final dio = ref.read(authServiceProvider).dio;
  try {
    final res = await dio.get('/api/v1/studio/alerts');
    final data =
        (res.data as Map<String, dynamic>)['data'] as Map<String, dynamic>?;
    if (data == null) return null;
    return StudioAlert.fromJson(data);
  } on DioException catch (e) {
    // 404 = no alert — treat as quiet state
    if (e.response?.statusCode == 404) return null;
    rethrow;
  }
});

// ── Stats Provider ─────────────────────────────────────────────────

final studioStatsProvider =
    FutureProvider.autoDispose<StudioStats>((ref) async {
  final dio = ref.read(authServiceProvider).dio;
  final res = await dio.get('/api/v1/studio/stats');
  final data =
      (res.data as Map<String, dynamic>)['data'] as Map<String, dynamic>;
  return StudioStats.fromJson(data);
});

// ── Content List Provider ──────────────────────────────────────────

class StudioContentState {
  final List<StudioContentItem> items;
  final bool isLoading;
  final bool isLoadingMore;
  final bool hasMore;
  final String? nextCursor;
  final String statusFilter; // 'all' | 'published' | 'draft' | 'archived'
  final String? error;

  const StudioContentState({
    this.items = const [],
    this.isLoading = true,
    this.isLoadingMore = false,
    this.hasMore = false,
    this.nextCursor,
    this.statusFilter = 'all',
    this.error,
  });

  StudioContentState copyWith({
    List<StudioContentItem>? items,
    bool? isLoading,
    bool? isLoadingMore,
    bool? hasMore,
    String? nextCursor,
    String? statusFilter,
    Object? error = _sentinel,
  }) =>
      StudioContentState(
        items: items ?? this.items,
        isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        hasMore: hasMore ?? this.hasMore,
        nextCursor: nextCursor ?? this.nextCursor,
        statusFilter: statusFilter ?? this.statusFilter,
        error: error == _sentinel ? this.error : error as String?,
      );
}

const _sentinel = Object();

class StudioContentNotifier extends Notifier<StudioContentState> {
  static const int _pageSize = 20;

  @override
  StudioContentState build() {
    // Defer the initial fetch to a microtask so that build() returns first
    // and Riverpod sets the initial state before _fetch() reads state.statusFilter.
    // Calling _fetch() synchronously in build() causes "uninitialized provider"
    // because state is not accessible until after build() completes.
    Future.microtask(_fetch);
    return const StudioContentState();
  }

  Future<void> _fetch() async {
    final currentFilter = state.statusFilter;
    state = state.copyWith(
      isLoading: true,
      items: const [],
      hasMore: false,
      nextCursor: null,
      error: null,
    );
    try {
      final dio = ref.read(authServiceProvider).dio;
      final queryParams = <String, dynamic>{
        'limit': _pageSize,
        if (currentFilter != 'all') 'status': currentFilter,
      };
      final res = await dio.get(
        '/api/v1/studio/content',
        queryParameters: queryParams,
      );
      final data =
          (res.data as Map<String, dynamic>)['data'] as Map<String, dynamic>;
      final rawItems = data['items'] as List<dynamic>? ?? [];
      final items = rawItems
          .map((e) =>
              StudioContentItem.fromJson(e as Map<String, dynamic>))
          .toList();
      state = StudioContentState(
        items: items,
        isLoading: false,
        hasMore: data['next_cursor'] != null,
        nextCursor: data['next_cursor'] as String?,
        statusFilter: currentFilter,
      );
    } on DioException catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.response?.statusMessage ?? 'Failed to load content',
      );
    }
  }

  void setStatusFilter(String status) {
    if (state.statusFilter == status) return;
    state = state.copyWith(statusFilter: status);
    _fetch();
  }

  Future<void> loadMore() async {
    if (state.isLoadingMore || !state.hasMore || state.nextCursor == null) {
      return;
    }
    state = state.copyWith(isLoadingMore: true);
    try {
      final dio = ref.read(authServiceProvider).dio;
      final queryParams = <String, dynamic>{
        'limit': _pageSize,
        'cursor': state.nextCursor,
        if (state.statusFilter != 'all') 'status': state.statusFilter,
      };
      final res = await dio.get(
        '/api/v1/studio/content',
        queryParameters: queryParams,
      );
      final data =
          (res.data as Map<String, dynamic>)['data'] as Map<String, dynamic>;
      final rawItems = data['items'] as List<dynamic>? ?? [];
      final more = rawItems
          .map((e) =>
              StudioContentItem.fromJson(e as Map<String, dynamic>))
          .toList();
      state = state.copyWith(
        items: [...state.items, ...more],
        isLoadingMore: false,
        hasMore: data['next_cursor'] != null,
        nextCursor: data['next_cursor'] as String?,
      );
    } on DioException {
      state = state.copyWith(isLoadingMore: false);
    }
  }

  void retry() => _fetch();
}

final studioContentProvider =
    NotifierProvider<StudioContentNotifier, StudioContentState>(
  StudioContentNotifier.new,
);
