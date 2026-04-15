import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/providers/auth_provider.dart';

// ── Like State ────────────────────────────────────────────────────

class LikeState {
  final bool isLiked;
  final int likeCount;

  const LikeState({required this.isLiked, required this.likeCount});

  LikeState copyWith({bool? isLiked, int? likeCount}) => LikeState(
        isLiked: isLiked ?? this.isLiked,
        likeCount: likeCount ?? this.likeCount,
      );
}

// ── Provider ──────────────────────────────────────────────────────

typedef LikeKey = ({String contentId, bool isLiked, int likeCount});

/// Family provider keyed by contentId + seed values.
/// Initialised with seed values from the detail page (avoids a second API call).
final likeProvider =
    NotifierProvider.family<LikeNotifier, LikeState, LikeKey>(
  LikeNotifier.new,
);

// ── Notifier ──────────────────────────────────────────────────────

class LikeNotifier extends Notifier<LikeState> {
  final LikeKey _key;

  LikeNotifier(this._key);

  @override
  LikeState build() {
    return LikeState(isLiked: _key.isLiked, likeCount: _key.likeCount);
  }

  /// Optimistic like toggle. Reverts on API failure.
  Future<void> toggle() async {
    final wasLiked = state.isLiked;
    final prevCount = state.likeCount;

    // Optimistic update
    state = state.copyWith(
      isLiked: !wasLiked,
      likeCount: wasLiked ? prevCount - 1 : prevCount + 1,
    );

    try {
      final dio = ref.read(authServiceProvider).dio;
      if (wasLiked) {
        await dio.delete('/api/v1/content/${_key.contentId}/like');
      } else {
        await dio.post('/api/v1/content/${_key.contentId}/like');
      }
    } on DioException {
      // Revert silently
      state = LikeState(isLiked: wasLiked, likeCount: prevCount);
    }
  }
}
