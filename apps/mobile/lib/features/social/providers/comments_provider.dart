import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/providers/auth_provider.dart';

// ── Data Models ───────────────────────────────────────────────────

class CommentAuthor {
  final String id;
  final String displayName;
  final String? username;
  final String? avatarUrl;

  const CommentAuthor({
    required this.id,
    required this.displayName,
    this.username,
    this.avatarUrl,
  });

  factory CommentAuthor.fromJson(Map<String, dynamic> json) => CommentAuthor(
        id: json['id'] as String? ?? '',
        displayName: json['display_name'] as String? ?? 'User',
        username: json['username'] as String?,
        avatarUrl: json['avatar_url'] as String?,
      );
}

class Comment {
  final String id;
  final String? body;
  final bool isEdited;
  final bool isDeleted;
  final DateTime createdAt;
  final CommentAuthor? author;
  final String? parentId;
  final List<Comment> replies;

  const Comment({
    required this.id,
    this.body,
    required this.isEdited,
    required this.isDeleted,
    required this.createdAt,
    this.author,
    this.parentId,
    this.replies = const [],
  });

  Comment copyWith({
    String? body,
    bool? isEdited,
    bool? isDeleted,
    List<Comment>? replies,
  }) =>
      Comment(
        id: id,
        body: body ?? this.body,
        isEdited: isEdited ?? this.isEdited,
        isDeleted: isDeleted ?? this.isDeleted,
        createdAt: createdAt,
        author: author,
        parentId: parentId,
        replies: replies ?? this.replies,
      );

  factory Comment.fromJson(Map<String, dynamic> json) {
    final usersJson = json['users'] as Map<String, dynamic>?;
    final repliesJson = json['replies'] as List<dynamic>? ?? [];

    return Comment(
      id: json['id'] as String,
      body: json['body'] as String?,
      isEdited: json['is_edited'] as bool? ?? false,
      isDeleted: json['is_deleted'] as bool? ?? false,
      createdAt: DateTime.tryParse(json['created_at'] as String? ?? '') ?? DateTime.now(),
      author: usersJson != null ? CommentAuthor.fromJson(usersJson) : null,
      parentId: json['parent_id'] as String?,
      replies: repliesJson
          .map((r) => Comment.fromJson(r as Map<String, dynamic>))
          .toList(),
    );
  }
}

// ── Comments State ─────────────────────────────────────────────────

class CommentsState {
  final List<Comment> items;
  final bool isLoading;
  final bool isLoadingMore;
  final bool hasMore;
  final String? nextCursor;
  final String? error;
  final String? replyToId;
  final String? replyToName;

  const CommentsState({
    this.items = const [],
    this.isLoading = true,
    this.isLoadingMore = false,
    this.hasMore = false,
    this.nextCursor,
    this.error,
    this.replyToId,
    this.replyToName,
  });

  CommentsState copyWith({
    List<Comment>? items,
    bool? isLoading,
    bool? isLoadingMore,
    bool? hasMore,
    String? nextCursor,
    String? error,
    Object? replyToId = _sentinel,
    Object? replyToName = _sentinel,
  }) =>
      CommentsState(
        items: items ?? this.items,
        isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        hasMore: hasMore ?? this.hasMore,
        nextCursor: nextCursor ?? this.nextCursor,
        error: error,
        replyToId: replyToId == _sentinel ? this.replyToId : replyToId as String?,
        replyToName: replyToName == _sentinel ? this.replyToName : replyToName as String?,
      );
}

const _sentinel = Object();

// ── Provider ──────────────────────────────────────────────────────

/// Family provider keyed by contentId.
final commentsProvider =
    NotifierProvider.family<CommentsNotifier, CommentsState, String>(
  CommentsNotifier.new,
);

// ── Notifier ──────────────────────────────────────────────────────

class CommentsNotifier extends Notifier<CommentsState> {
  static const int _pageSize = 20;

  final String _contentId;

  CommentsNotifier(this._contentId);

  @override
  CommentsState build() {
    _fetch();
    return const CommentsState();
  }

  Future<void> _fetch() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final dio = ref.read(authServiceProvider).dio;
      final res = await dio.get(
        '/api/v1/content/$_contentId/comments',
        queryParameters: {'limit': _pageSize},
      );
      final data = (res.data as Map<String, dynamic>)['data'] as Map<String, dynamic>;
      final rawItems = data['items'] as List<dynamic>? ?? [];
      state = CommentsState(
        items: rawItems.map((c) => Comment.fromJson(c as Map<String, dynamic>)).toList(),
        isLoading: false,
        hasMore: data['next_cursor'] != null,
        nextCursor: data['next_cursor'] as String?,
      );
    } on DioException catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.response?.statusMessage ?? 'Failed to load comments',
      );
    }
  }

  Future<void> loadMore() async {
    if (state.isLoadingMore || !state.hasMore) return;
    state = state.copyWith(isLoadingMore: true);
    try {
      final dio = ref.read(authServiceProvider).dio;
      final res = await dio.get(
        '/api/v1/content/$_contentId/comments',
        queryParameters: {'limit': _pageSize, 'cursor': state.nextCursor},
      );
      final data = (res.data as Map<String, dynamic>)['data'] as Map<String, dynamic>;
      final rawItems = data['items'] as List<dynamic>? ?? [];
      final more = rawItems.map((c) => Comment.fromJson(c as Map<String, dynamic>)).toList();
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

  Future<bool> addComment(String body) async {
    try {
      final dio = ref.read(authServiceProvider).dio;
      final payload = <String, dynamic>{'body': body};
      if (state.replyToId != null) payload['parent_id'] = state.replyToId;

      final res = await dio.post('/api/v1/content/$_contentId/comments', data: payload);
      final commentData = (res.data as Map<String, dynamic>)['data'] as Map<String, dynamic>;
      final newComment = Comment.fromJson(commentData);

      if (state.replyToId != null) {
        final updated = state.items.map((c) {
          if (c.id == state.replyToId) {
            return c.copyWith(replies: [...c.replies, newComment]);
          }
          return c;
        }).toList();
        state = state.copyWith(items: updated, replyToId: null, replyToName: null);
      } else {
        state = state.copyWith(items: [newComment, ...state.items]);
      }
      return true;
    } on DioException {
      return false;
    }
  }

  Future<bool> editComment(String commentId, String body) async {
    try {
      final dio = ref.read(authServiceProvider).dio;
      await dio.put('/api/v1/comments/$commentId', data: {'body': body});

      final updated = _updateCommentInList(state.items, commentId, (c) => c.copyWith(body: body, isEdited: true));
      state = state.copyWith(items: updated);
      return true;
    } on DioException {
      return false;
    }
  }

  Future<bool> deleteComment(String commentId) async {
    try {
      final dio = ref.read(authServiceProvider).dio;
      await dio.delete('/api/v1/comments/$commentId');

      final updated = _updateCommentInList(
        state.items,
        commentId,
        (c) => c.copyWith(body: null, isDeleted: true),
      );
      state = state.copyWith(items: updated);
      return true;
    } on DioException {
      return false;
    }
  }

  void setReplyTo(String? commentId, String? username) {
    state = state.copyWith(replyToId: commentId, replyToName: username);
  }

  void clearReplyTo() {
    state = state.copyWith(replyToId: null, replyToName: null);
  }

  void retry() => _fetch();

  List<Comment> _updateCommentInList(
    List<Comment> items,
    String commentId,
    Comment Function(Comment) updater,
  ) {
    return items.map((c) {
      if (c.id == commentId) return updater(c);
      if (c.replies.isNotEmpty) {
        return c.copyWith(replies: _updateCommentInList(c.replies, commentId, updater));
      }
      return c;
    }).toList();
  }
}
