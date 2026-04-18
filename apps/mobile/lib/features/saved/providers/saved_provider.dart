import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/providers/auth_provider.dart';

// ── Data Models ───────────────────────────────────────────────────

class SavedList {
  final String id;
  final String name;
  final int itemCount;
  final String? coverUrl;
  final DateTime updatedAt;

  const SavedList({
    required this.id,
    required this.name,
    required this.itemCount,
    this.coverUrl,
    required this.updatedAt,
  });

  factory SavedList.fromJson(Map<String, dynamic> json) => SavedList(
        id: json['id'] as String,
        name: json['name'] as String,
        itemCount: json['item_count'] as int? ?? 0,
        coverUrl: json['cover_url'] as String?,
        updatedAt: DateTime.tryParse(json['updated_at'] as String? ?? '') ?? DateTime.now(),
      );
}

class SavedListItem {
  final String contentId;
  final String addedAt;
  final String? title;
  final String? contentType;
  final String? coverImageUrl;
  final int pricePaisa;
  final String? creatorName;
  final String? creatorAvatarUrl;

  const SavedListItem({
    required this.contentId,
    required this.addedAt,
    this.title,
    this.contentType,
    this.coverImageUrl,
    this.pricePaisa = 0,
    this.creatorName,
    this.creatorAvatarUrl,
  });

  bool get isFree => pricePaisa == 0;

  factory SavedListItem.fromJson(Map<String, dynamic> json) {
    final content = json['content'] as Map<String, dynamic>? ?? {};
    final usersData = content['users'];
    final creator = usersData is Map<String, dynamic>
        ? usersData
        : (usersData is List && (usersData).isNotEmpty)
            ? usersData.first as Map<String, dynamic>
            : null;

    return SavedListItem(
      contentId: json['content_id'] as String? ?? '',
      addedAt: json['added_at'] as String? ?? '',
      title: content['title'] as String?,
      contentType: content['content_type'] as String?,
      coverImageUrl: content['cover_image_url'] as String?,
      pricePaisa: content['price_paisa'] as int? ?? 0,
      creatorName: creator?['display_name'] as String?,
      creatorAvatarUrl: creator?['avatar_url'] as String?,
    );
  }
}

// ── Saved Lists State ─────────────────────────────────────────────

class SavedListsState {
  final List<SavedList> lists;
  final bool isLoading;
  final String? error;

  const SavedListsState({
    this.lists = const [],
    this.isLoading = true,
    this.error,
  });

  SavedListsState copyWith({List<SavedList>? lists, bool? isLoading, String? error}) =>
      SavedListsState(
        lists: lists ?? this.lists,
        isLoading: isLoading ?? this.isLoading,
        error: error,
      );
}

// ── Saved Lists Provider ──────────────────────────────────────────

final savedListsProvider =
    NotifierProvider<SavedListsNotifier, SavedListsState>(SavedListsNotifier.new);

class SavedListsNotifier extends Notifier<SavedListsState> {
  @override
  SavedListsState build() {
    // Defer _fetch via microtask so Riverpod initializes state before _fetch
    // reads it. Calling _fetch() inline would read state.copyWith() before
    // build() returns — same pattern as BUG-E2E-006 (StudioContentNotifier).
    Future.microtask(_fetch);
    return const SavedListsState();
  }

  Future<void> _fetch() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final dio = ref.read(authServiceProvider).dio;
      final res = await dio.get('/api/v1/saved-lists');
      final rawData = (res.data as Map<String, dynamic>)['data'] as List<dynamic>;
      state = SavedListsState(
        lists: rawData.map((l) => SavedList.fromJson(l as Map<String, dynamic>)).toList(),
        isLoading: false,
      );
    } on DioException catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.response?.statusMessage ?? 'Failed to load saved lists',
      );
    }
  }

  void retry() => _fetch();

  Future<SavedList?> createList(String name) async {
    // Optimistic: add list immediately so the UI updates without waiting for the API.
    final tempId = '_temp_${DateTime.now().millisecondsSinceEpoch}';
    final tempList = SavedList(
      id: tempId,
      name: name,
      itemCount: 0,
      updatedAt: DateTime.now(),
    );
    state = state.copyWith(lists: [tempList, ...state.lists]);

    try {
      final dio = ref.read(authServiceProvider).dio;
      final res = await dio.post('/api/v1/saved-lists', data: {'name': name});
      final data = (res.data as Map<String, dynamic>)['data'] as Map<String, dynamic>;
      final newList = SavedList(
        id: data['id'] as String,
        name: data['name'] as String,
        itemCount: 0,
        updatedAt: DateTime.tryParse(data['created_at'] as String? ?? '') ?? DateTime.now(),
      );
      // Replace temp entry with the real one from the server.
      state = state.copyWith(
        lists: state.lists.map((l) => l.id == tempId ? newList : l).toList(),
      );
      return newList;
    } catch (e) {
      // Keep the optimistic entry on failure — better UX than silently removing it.
      // Catches both DioException (network/API errors) and CastError/TypeError
      // (unexpected API response shape). The entry won't persist across restarts
      // since the provider re-fetches from server on next init.
      debugPrint('[savedListsProvider] createList error: $e');
      return null;
    }
  }

  Future<bool> deleteList(String listId) async {
    try {
      final dio = ref.read(authServiceProvider).dio;
      await dio.delete('/api/v1/saved-lists/$listId');
      state = state.copyWith(lists: state.lists.where((l) => l.id != listId).toList());
      return true;
    } on DioException {
      return false;
    }
  }

  Future<bool> renameList(String listId, String name) async {
    try {
      final dio = ref.read(authServiceProvider).dio;
      await dio.put('/api/v1/saved-lists/$listId', data: {'name': name});
      state = state.copyWith(
        lists: state.lists.map((l) => l.id == listId
            ? SavedList(id: l.id, name: name, itemCount: l.itemCount, coverUrl: l.coverUrl, updatedAt: DateTime.now())
            : l).toList(),
      );
      return true;
    } on DioException {
      return false;
    }
  }
}

// ── Save Status Provider ──────────────────────────────────────────

/// Tracks which lists a given contentId is saved to.
/// Family keyed by contentId.
final saveStatusProvider =
    NotifierProvider.family<SaveStatusNotifier, Set<String>, String>(
  SaveStatusNotifier.new,
);

class SaveStatusNotifier extends Notifier<Set<String>> {
  final String _contentId;

  SaveStatusNotifier(this._contentId);

  @override
  Set<String> build() {
    // Only fetch when authenticated — avoids spurious network calls in guest mode and tests
    final isAuth = ref.watch(authProvider.select((s) => s.isAuthenticated));
    if (isAuth) _fetch();
    return const {};
  }

  Future<void> _fetch() async {
    try {
      final dio = ref.read(authServiceProvider).dio;
      final res = await dio.get('/api/v1/content/$_contentId/save-status');
      final data = (res.data as Map<String, dynamic>)['data'] as Map<String, dynamic>;
      final rawIds = data['list_ids'] as List<dynamic>? ?? [];
      state = rawIds.map((id) => id as String).toSet();
    } on DioException {
      // Leave as empty — not critical
    }
  }

  bool get isSaved => state.isNotEmpty;

  /// Save/remove content from the selected list IDs.
  /// [selectedListIds] = new desired state (what the user checked in the sheet).
  Future<void> applySelection(List<String> selectedListIds) async {
    final prevState = state;
    // Optimistic
    state = selectedListIds.toSet();

    try {
      final dio = ref.read(authServiceProvider).dio;
      final toAdd = selectedListIds.where((id) => !prevState.contains(id)).toList();
      final toRemove = prevState.where((id) => !selectedListIds.contains(id)).toList();

      if (toAdd.isNotEmpty) {
        await dio.post('/api/v1/content/$_contentId/save', data: {'list_ids': toAdd});
      }
      if (toRemove.isNotEmpty) {
        await dio.delete('/api/v1/content/$_contentId/save', data: {'list_ids': toRemove});
      }

      // Refresh lists to get updated item counts + covers
      ref.invalidate(savedListsProvider);
    } on DioException {
      state = prevState; // revert
    }
  }

  /// Quick save to default list (first-tap bookmark on feed cards).
  Future<void> quickSave() async {
    if (isSaved) {
      // Remove from all lists
      await applySelection([]);
    } else {
      // Save to empty list_ids — API auto-creates default list
      final prevState = state;
      state = {'__optimistic__'};
      try {
        final dio = ref.read(authServiceProvider).dio;
        final res = await dio.post('/api/v1/content/$_contentId/save', data: {'list_ids': <String>[]});
        final data = (res.data as Map<String, dynamic>)['data'] as Map<String, dynamic>;
        final rawIds = data['list_ids'] as List<dynamic>? ?? [];
        state = rawIds.map((id) => id as String).toSet();
        ref.invalidate(savedListsProvider);
      } on DioException {
        state = prevState;
      }
    }
  }
}

// ── List Items Provider ───────────────────────────────────────────

class ListItemsState {
  final List<SavedListItem> items;
  final bool isLoading;
  final bool isLoadingMore;
  final bool hasMore;
  final String? nextCursor;
  final String listName;
  final String sort;
  final String? typeFilter;
  final String? error;

  const ListItemsState({
    this.items = const [],
    this.isLoading = true,
    this.isLoadingMore = false,
    this.hasMore = false,
    this.nextCursor,
    this.listName = '',
    this.sort = 'recently_added',
    this.typeFilter,
    this.error,
  });

  ListItemsState copyWith({
    List<SavedListItem>? items,
    bool? isLoading,
    bool? isLoadingMore,
    bool? hasMore,
    String? nextCursor,
    String? listName,
    String? sort,
    Object? typeFilter = _sentinel2,
    String? error,
  }) =>
      ListItemsState(
        items: items ?? this.items,
        isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        hasMore: hasMore ?? this.hasMore,
        nextCursor: nextCursor ?? this.nextCursor,
        listName: listName ?? this.listName,
        sort: sort ?? this.sort,
        typeFilter: typeFilter == _sentinel2 ? this.typeFilter : typeFilter as String?,
        error: error,
      );
}

const _sentinel2 = Object();

final listItemsProvider =
    NotifierProvider.family<ListItemsNotifier, ListItemsState, String>(
  ListItemsNotifier.new,
);

class ListItemsNotifier extends Notifier<ListItemsState> {
  static const int _pageSize = 20;

  final String _listId;

  ListItemsNotifier(this._listId);

  @override
  ListItemsState build() {
    Future.microtask(_fetch);
    return const ListItemsState();
  }

  Future<void> _fetch() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final dio = ref.read(authServiceProvider).dio;
      final res = await dio.get(
        '/api/v1/saved-lists/$_listId/items',
        queryParameters: {
          'sort': state.sort,
          'limit': _pageSize,
          if (state.typeFilter != null) 'type': state.typeFilter,
        },
      );
      final data = (res.data as Map<String, dynamic>)['data'] as Map<String, dynamic>;
      final rawItems = data['items'] as List<dynamic>? ?? [];
      state = state.copyWith(
        items: rawItems.map((i) => SavedListItem.fromJson(i as Map<String, dynamic>)).toList(),
        isLoading: false,
        hasMore: data['next_cursor'] != null,
        nextCursor: data['next_cursor'] as String?,
        listName: data['list_name'] as String? ?? '',
      );
    } on DioException catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.response?.statusMessage ?? 'Failed to load items',
      );
    }
  }

  Future<void> loadMore() async {
    if (state.isLoadingMore || !state.hasMore) return;
    state = state.copyWith(isLoadingMore: true);
    try {
      final dio = ref.read(authServiceProvider).dio;
      final res = await dio.get(
        '/api/v1/saved-lists/$_listId/items',
        queryParameters: {
          'sort': state.sort,
          'limit': _pageSize,
          'cursor': state.nextCursor,
          if (state.typeFilter != null) 'type': state.typeFilter,
        },
      );
      final data = (res.data as Map<String, dynamic>)['data'] as Map<String, dynamic>;
      final rawItems = data['items'] as List<dynamic>? ?? [];
      final more = rawItems.map((i) => SavedListItem.fromJson(i as Map<String, dynamic>)).toList();
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

  void setSort(String sort) {
    state = state.copyWith(sort: sort);
    _fetch();
  }

  void setTypeFilter(String? type) {
    state = state.copyWith(typeFilter: type);
    _fetch();
  }

  void retry() => _fetch();

  /// Remove item from this list.
  Future<void> removeItem(String contentId) async {
    final prev = state.items;
    state = state.copyWith(items: state.items.where((i) => i.contentId != contentId).toList());
    try {
      final dio = ref.read(authServiceProvider).dio;
      await dio.delete('/api/v1/content/$contentId/save', data: {'list_ids': [_listId]});
      ref.invalidate(saveStatusProvider(contentId));
    } on DioException {
      state = state.copyWith(items: prev);
    }
  }
}
