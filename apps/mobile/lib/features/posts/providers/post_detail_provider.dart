import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/providers/auth_provider.dart';

// ── Post Detail State ──────────────────────────────────────────

/// Data class for a fully-loaded post detail.
/// Error and loading states are handled by the [AsyncValue] wrapper from
/// [postDetailProvider] — no separate status enum is needed.
class PostDetailState {
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
  final int creatorFollowerCount;
  final int creatorPostCount;
  final DateTime? creatorJoinedAt;

  // Engagement
  final int likeCount;
  final int commentCount;
  final int shareCount;
  final int saveCount;
  final bool isLiked;
  final bool isSaved;

  const PostDetailState({
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
    this.creatorFollowerCount = 0,
    this.creatorPostCount = 0,
    this.creatorJoinedAt,
    this.likeCount = 0,
    this.commentCount = 0,
    this.shareCount = 0,
    this.saveCount = 0,
    this.isLiked = false,
    this.isSaved = false,
  });
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
///
/// Uses [FutureProvider.family] so that [AsyncValue] handles loading/error
/// states automatically. This avoids the Riverpod 3.x issue where reading
/// `state` synchronously inside a `Notifier.build()` async call throws
/// [StateError] before the initial state is committed.
final postDetailProvider =
    FutureProvider.family<PostDetailState, String>((ref, id) async {
  final dio = ref.read(authServiceProvider).dio;

  try {
    final response = await dio.get('/api/v1/posts/$id');
    final responseData = response.data as Map<String, dynamic>;
    final data = responseData['data'] as Map<String, dynamic>;

    final mediaList = (data['media'] as List<dynamic>?)
            ?.map((m) => PostMediaItem.fromJson(m as Map<String, dynamic>))
            .toList() ??
        [];

    final creator = data['creator'] as Map<String, dynamic>?;
    final engagement = data['engagement'] as Map<String, dynamic>?;

    return PostDetailState(
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
      creatorFollowerCount: (creator?['follower_count'] ?? 0) as int,
      creatorPostCount: (creator?['post_count'] ?? 0) as int,
      creatorJoinedAt: creator?['joined_at'] != null
          ? DateTime.tryParse(creator!['joined_at'] as String)
          : null,
      likeCount: (engagement?['like_count'] ?? 0) as int,
      commentCount: (engagement?['comment_count'] ?? 0) as int,
      shareCount: (engagement?['share_count'] ?? 0) as int,
      saveCount: (engagement?['save_count'] ?? 0) as int,
      isLiked: (engagement?['is_liked'] ?? false) as bool,
      isSaved: (engagement?['is_saved'] ?? false) as bool,
    );
  } on DioException catch (e) {
    throw Exception(e.response?.statusMessage ?? 'Failed to load post');
  }
});
