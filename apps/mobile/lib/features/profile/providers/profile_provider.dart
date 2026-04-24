import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/providers/auth_provider.dart';
import '../../booking/providers/booking_provider.dart';
import '../../saved/providers/saved_provider.dart';

// ─── Profile Completion ────────────────────────────────────────

class ProfileCompletionItem {
  final String key;
  final String label;
  final bool done;
  const ProfileCompletionItem({required this.key, required this.label, required this.done});
}

class ProfileCompletion {
  final int percentage;
  final int completed;
  final int total;
  final List<ProfileCompletionItem> items;
  const ProfileCompletion({
    required this.percentage,
    required this.completed,
    required this.total,
    required this.items,
  });
}

final profileCompletionProvider = FutureProvider.autoDispose<ProfileCompletion>((ref) async {
  final dio = ref.read(authServiceProvider).dio;
  final res = await dio.get('/api/v1/users/me/completion');
  final data = (res.data as Map<String, dynamic>)['data'] as Map<String, dynamic>;

  final rawItems = data['items'] as List<dynamic>;
  final items = rawItems.map((item) {
    final m = item as Map<String, dynamic>;
    return ProfileCompletionItem(
      key: m['key'] as String,
      label: m['label'] as String,
      done: m['done'] as bool,
    );
  }).toList();

  return ProfileCompletion(
    percentage: data['percentage'] as int,
    completed: data['completed'] as int,
    total: data['total'] as int,
    items: items,
  );
});

// ─── Public Profile ────────────────────────────────────────────

class PublicProfile {
  final String id;
  final String? displayName;
  final String? username;
  final String? bio;
  final String? avatarUrl;
  final bool isCreator;
  final int followerCount;
  final int followingCount;
  final int contentCount;
  final bool isFollowing;
  final List<String> activeVerticals;

  const PublicProfile({
    required this.id,
    this.displayName,
    this.username,
    this.bio,
    this.avatarUrl,
    required this.isCreator,
    required this.followerCount,
    required this.followingCount,
    required this.contentCount,
    required this.isFollowing,
    required this.activeVerticals,
  });

  factory PublicProfile.fromJson(Map<String, dynamic> json) {
    return PublicProfile(
      id: json['id'] as String,
      displayName: json['display_name'] as String?,
      username: json['username'] as String?,
      bio: json['bio'] as String?,
      avatarUrl: json['avatar_url'] as String?,
      isCreator: json['is_creator'] as bool? ?? false,
      followerCount: (json['follower_count'] as num?)?.toInt() ?? 0,
      followingCount: (json['following_count'] as num?)?.toInt() ?? 0,
      contentCount: (json['content_count'] as num?)?.toInt() ?? 0,
      isFollowing: json['is_following'] as bool? ?? false,
      activeVerticals: ((json['active_verticals'] as List<dynamic>?) ?? [])
          .map((v) => v.toString())
          .toList(),
    );
  }
}

// ─── You Tab Stats ─────────────────────────────────────────────

class YouStats {
  final int savedItemCount;
  final int upcomingBookingsCount;
  final int completedBookingsCount;

  const YouStats({
    required this.savedItemCount,
    required this.upcomingBookingsCount,
    required this.completedBookingsCount,
  });
}

final youStatsProvider = FutureProvider.autoDispose<YouStats>((ref) async {
  final savedState = ref.watch(savedListsProvider);
  final bookings = await ref.watch(userBookingsProvider.future);

  final savedCount = savedState.lists.fold<int>(0, (sum, l) => sum + l.itemCount);
  final upcoming = bookings
      .where((b) => b.status == 'confirmed' || b.status == 'pending_payment')
      .length;
  final completed = bookings.where((b) => b.status == 'completed').length;

  return YouStats(
    savedItemCount: savedCount,
    upcomingBookingsCount: upcoming,
    completedBookingsCount: completed,
  );
});

// ─── Public Profile ────────────────────────────────────────────

final publicProfileProvider =
    FutureProvider.autoDispose.family<PublicProfile, String>((ref, userId) async {
  final dio = ref.read(authServiceProvider).dio;
  final res = await dio.get('/api/v1/users/$userId');
  final data = (res.data as Map<String, dynamic>)['data'] as Map<String, dynamic>;
  return PublicProfile.fromJson(data);
});
