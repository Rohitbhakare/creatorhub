import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/providers/auth_provider.dart';

// ── Follow State ──────────────────────────────────────────────────

class FollowState {
  final bool isFollowing;
  final int followerCount;
  final bool isLoading;

  const FollowState({
    required this.isFollowing,
    required this.followerCount,
    this.isLoading = false,
  });

  FollowState copyWith({bool? isFollowing, int? followerCount, bool? isLoading}) =>
      FollowState(
        isFollowing: isFollowing ?? this.isFollowing,
        followerCount: followerCount ?? this.followerCount,
        isLoading: isLoading ?? this.isLoading,
      );
}

// ── Provider ──────────────────────────────────────────────────────

typedef FollowKey = ({String targetUserId, bool isFollowing, int followerCount});

/// Family provider keyed by targetUserId + seed values.
final followProvider =
    NotifierProvider.family<FollowNotifier, FollowState, FollowKey>(
  FollowNotifier.new,
);

// ── Notifier ──────────────────────────────────────────────────────

class FollowNotifier extends Notifier<FollowState> {
  final FollowKey _key;

  FollowNotifier(this._key);

  @override
  FollowState build() {
    return FollowState(isFollowing: _key.isFollowing, followerCount: _key.followerCount);
  }

  /// Optimistic follow toggle. Reverts on failure.
  Future<void> toggle() async {
    if (state.isLoading) return;

    final wasFollowing = state.isFollowing;
    final prevCount = state.followerCount;

    // Optimistic update
    state = state.copyWith(
      isFollowing: !wasFollowing,
      followerCount: wasFollowing ? prevCount - 1 : prevCount + 1,
      isLoading: true,
    );

    try {
      final dio = ref.read(authServiceProvider).dio;
      if (wasFollowing) {
        await dio.delete('/api/v1/users/${_key.targetUserId}/follow');
      } else {
        await dio.post('/api/v1/users/${_key.targetUserId}/follow');
      }
      state = state.copyWith(isLoading: false);
    } on DioException {
      // Revert silently
      state = FollowState(isFollowing: wasFollowing, followerCount: prevCount);
    }
  }
}
