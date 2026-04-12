import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/providers/auth_provider.dart';

// ── Post Detail State ──────────────────────────────────────────

enum PostDetailStatus { loading, loaded, error }

class PostDetailState {
  final PostDetailStatus status;
  final String? error;

  // Post fields
  final String? id;
  final String title;
  final String description;
  final String body;
  final List<PostMediaItem> media;
  final String? locationName;
  final List<String> tags;
  final DateTime? createdAt;

  // Creator fields
  final String? creatorId;
  final String creatorName;
  final String? creatorUsername;
  final String? creatorAvatarUrl;

  // Engagement
  final int likeCount;
  final int commentCount;
  final int shareCount;
  final int saveCount;
  final bool isLiked;
  final bool isSaved;

  const PostDetailState({
    this.status = PostDetailStatus.loading,
    this.error,
    this.id,
    this.title = '',
    this.description = '',
    this.body = '',
    this.media = const [],
    this.locationName,
    this.tags = const [],
    this.createdAt,
    this.creatorId,
    this.creatorName = '',
    this.creatorUsername,
    this.creatorAvatarUrl,
    this.likeCount = 0,
    this.commentCount = 0,
    this.shareCount = 0,
    this.saveCount = 0,
    this.isLiked = false,
    this.isSaved = false,
  });

  PostDetailState copyWith({
    PostDetailStatus? status,
    String? error,
    String? id,
    String? title,
    String? description,
    String? body,
    List<PostMediaItem>? media,
    String? locationName,
    List<String>? tags,
    DateTime? createdAt,
    String? creatorId,
    String? creatorName,
    String? creatorUsername,
    String? creatorAvatarUrl,
    int? likeCount,
    int? commentCount,
    int? shareCount,
    int? saveCount,
    bool? isLiked,
    bool? isSaved,
  }) {
    return PostDetailState(
      status: status ?? this.status,
      error: error ?? this.error,
      id: id ?? this.id,
      title: title ?? this.title,
      description: description ?? this.description,
      body: body ?? this.body,
      media: media ?? this.media,
      locationName: locationName ?? this.locationName,
      tags: tags ?? this.tags,
      createdAt: createdAt ?? this.createdAt,
      creatorId: creatorId ?? this.creatorId,
      creatorName: creatorName ?? this.creatorName,
      creatorUsername: creatorUsername ?? this.creatorUsername,
      creatorAvatarUrl: creatorAvatarUrl ?? this.creatorAvatarUrl,
      likeCount: likeCount ?? this.likeCount,
      commentCount: commentCount ?? this.commentCount,
      shareCount: shareCount ?? this.shareCount,
      saveCount: saveCount ?? this.saveCount,
      isLiked: isLiked ?? this.isLiked,
      isSaved: isSaved ?? this.isSaved,
    );
  }
}

/// Media item for post detail (from API response).
class PostMediaItem {
  final String id;
  final String url;
  final String mimeType;
  final int? width;
  final int? height;
  final String? blurHash;

  const PostMediaItem({
    required this.id,
    required this.url,
    required this.mimeType,
    this.width,
    this.height,
    this.blurHash,
  });

  factory PostMediaItem.fromJson(Map<String, dynamic> json) {
    return PostMediaItem(
      id: json['id'] as String,
      url: json['url'] as String,
      mimeType: (json['mime_type'] ?? 'image/jpeg') as String,
      width: json['width'] as int?,
      height: json['height'] as int?,
      blurHash: json['blur_hash'] as String?,
    );
  }
}

// ── Provider ───────────────────────────────────────────────────

/// Family provider keyed by post ID.
final postDetailProvider =
    NotifierProvider.family<PostDetailNotifier, PostDetailState, String>(
  PostDetailNotifier.new,
);

// ── Notifier ───────────────────────────────────────────────────

class PostDetailNotifier extends Notifier<PostDetailState> {
  final String _postId;

  PostDetailNotifier(this._postId);

  @override
  PostDetailState build() {
    // Fetch post detail on init
    _fetchPost();
    return const PostDetailState();
  }

  Future<void> _fetchPost() async {
    state = state.copyWith(status: PostDetailStatus.loading);

    try {
      final dio = ref.read(authServiceProvider).dio;
      final response = await dio.get('/api/v1/posts/$_postId');
      final responseData = response.data as Map<String, dynamic>;
      final data = responseData['data'] as Map<String, dynamic>;

      final mediaList = (data['media'] as List<dynamic>?)
              ?.map(
                  (m) => PostMediaItem.fromJson(m as Map<String, dynamic>))
              .toList() ??
          [];

      final creator = data['creator'] as Map<String, dynamic>?;
      final engagement = data['engagement'] as Map<String, dynamic>?;

      state = PostDetailState(
        status: PostDetailStatus.loaded,
        id: data['id'] as String,
        title: (data['title'] ?? '') as String,
        description: (data['description'] ?? '') as String,
        body: (data['body'] ?? '') as String,
        media: mediaList,
        locationName: data['location_name'] as String?,
        tags: (data['tags'] as List<dynamic>?)
                ?.map((t) => t as String)
                .toList() ??
            [],
        createdAt: data['created_at'] != null
            ? DateTime.tryParse(data['created_at'] as String)
            : null,
        creatorId: creator?['id'] as String?,
        creatorName: (creator?['display_name'] ?? '') as String,
        creatorUsername: creator?['username'] as String?,
        creatorAvatarUrl: creator?['avatar_url'] as String?,
        likeCount: (engagement?['like_count'] ?? 0) as int,
        commentCount: (engagement?['comment_count'] ?? 0) as int,
        shareCount: (engagement?['share_count'] ?? 0) as int,
        saveCount: (engagement?['save_count'] ?? 0) as int,
        isLiked: (engagement?['is_liked'] ?? false) as bool,
        isSaved: (engagement?['is_saved'] ?? false) as bool,
      );
    } on DioException catch (e) {
      state = state.copyWith(
        status: PostDetailStatus.error,
        error: e.response?.statusMessage ?? 'Failed to load post',
      );
    } catch (_) {
      state = state.copyWith(
        status: PostDetailStatus.error,
        error: 'Something went wrong',
      );
    }
  }

  /// Retry loading the post.
  Future<void> retry() async {
    await _fetchPost();
  }

  /// Toggle like — optimistic update.
  void toggleLike() {
    // TODO: wire up like/save API in E1.7 Social
    final wasLiked = state.isLiked;
    state = state.copyWith(
      isLiked: !wasLiked,
      likeCount: wasLiked ? state.likeCount - 1 : state.likeCount + 1,
    );
  }

  /// Toggle save/bookmark — optimistic update.
  void toggleSave() {
    // TODO: wire up like/save API in E1.7 Social
    final wasSaved = state.isSaved;
    state = state.copyWith(
      isSaved: !wasSaved,
      saveCount: wasSaved ? state.saveCount - 1 : state.saveCount + 1,
    );
  }
}
