import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/providers/auth_provider.dart';

// ── Data Models ───────────────────────────────────────────────────

class EventCreator {
  final String id;
  final String displayName;
  final String? username;
  final String? avatarUrl;

  const EventCreator({
    required this.id,
    required this.displayName,
    this.username,
    this.avatarUrl,
  });

  factory EventCreator.fromJson(Map<String, dynamic> json) {
    return EventCreator(
      id: json['id'] as String? ?? '',
      displayName: json['display_name'] as String? ?? 'Creator',
      username: json['username'] as String?,
      avatarUrl: json['avatar_url'] as String?,
    );
  }
}

class EventAttendee {
  final String id;
  final String? displayName;
  final String? avatarUrl;

  const EventAttendee({
    required this.id,
    this.displayName,
    this.avatarUrl,
  });

  factory EventAttendee.fromJson(Map<String, dynamic> json) {
    return EventAttendee(
      id: json['id'] as String? ?? '',
      displayName: json['display_name'] as String?,
      avatarUrl: json['avatar_url'] as String?,
    );
  }
}

class EventDetail {
  final String id;
  final String title;
  final String description;
  final String vertical;
  final String status;

  // Occurrence fields
  final DateTime? startAt;
  final DateTime? endAt;
  final String timezone;
  final String? venueName;
  final String? venueAddress;
  final double? venueLat;
  final double? venueLng;
  final String? cityId;
  final int? capacity;
  final int spotsBooked;
  final bool isFree;
  final List<String> whatToBring;

  // RSVP state
  final bool hasRsvpd;

  // Media
  final List<String> mediaUrls;

  // Creator & attendees
  final EventCreator creator;
  final List<EventAttendee> attendees;
  final int attendeeCount;

  // Social
  final int likeCount;
  final int commentCount;
  final bool isLiked;
  final bool isSaved;

  const EventDetail({
    required this.id,
    required this.title,
    required this.description,
    required this.vertical,
    required this.status,
    this.startAt,
    this.endAt,
    this.timezone = 'Asia/Kolkata',
    this.venueName,
    this.venueAddress,
    this.venueLat,
    this.venueLng,
    this.cityId,
    this.capacity,
    this.spotsBooked = 0,
    this.isFree = true,
    this.whatToBring = const [],
    this.hasRsvpd = false,
    this.mediaUrls = const [],
    required this.creator,
    this.attendees = const [],
    this.attendeeCount = 0,
    this.likeCount = 0,
    this.commentCount = 0,
    this.isLiked = false,
    this.isSaved = false,
  });

  /// Whether this event still has open spots.
  bool get hasSpots =>
      capacity == null || spotsBooked < capacity!;

  /// Whether this event is in the future.
  bool get isFuture =>
      startAt != null && startAt!.isAfter(DateTime.now());

  /// Formatted "X going / Y max" string.
  String get capacityLabel {
    if (capacity == null) return '$spotsBooked going';
    return '$spotsBooked going / $capacity max';
  }

  factory EventDetail.fromJson(Map<String, dynamic> json) {
    final creatorJson = json['creator'] as Map<String, dynamic>? ?? {};
    final attendeesJson = json['attendees'] as List<dynamic>? ?? [];
    final mediaJson = json['media'] as List<dynamic>? ?? [];

    return EventDetail(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? '',
      description: json['description'] as String? ?? '',
      vertical: json['vertical'] as String? ?? '',
      status: json['status'] as String? ?? '',
      startAt: json['start_at'] != null
          ? DateTime.tryParse(json['start_at'] as String)
          : null,
      endAt: json['end_at'] != null
          ? DateTime.tryParse(json['end_at'] as String)
          : null,
      timezone: json['timezone'] as String? ?? 'Asia/Kolkata',
      venueName: json['venue_name'] as String?,
      venueAddress: json['venue_address'] as String?,
      venueLat: (json['venue_lat'] as num?)?.toDouble(),
      venueLng: (json['venue_lng'] as num?)?.toDouble(),
      cityId: json['city_id'] as String?,
      capacity: json['capacity'] as int?,
      spotsBooked: json['spots_booked'] as int? ?? 0,
      isFree: json['is_free'] as bool? ?? true,
      whatToBring: (json['what_to_bring'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          const [],
      hasRsvpd: json['has_rsvpd'] as bool? ?? false,
      mediaUrls: mediaJson
          .map((m) => (m as Map<String, dynamic>)['url'] as String? ?? '')
          .where((url) => url.isNotEmpty)
          .toList(),
      creator: EventCreator.fromJson(creatorJson),
      attendees: attendeesJson
          .map((a) => EventAttendee.fromJson(a as Map<String, dynamic>))
          .toList(),
      attendeeCount: json['attendee_count'] as int? ?? 0,
      likeCount: json['like_count'] as int? ?? 0,
      commentCount: json['comment_count'] as int? ?? 0,
      isLiked: json['is_liked'] as bool? ?? false,
      isSaved: json['is_saved'] as bool? ?? false,
    );
  }
}

// ── Provider ──────────────────────────────────────────────────────

/// Family provider keyed by event ID.
final eventDetailProvider =
    FutureProvider.family.autoDispose<EventDetail, String>((ref, id) async {
  final dio = ref.read(authServiceProvider).dio;

  try {
    final response = await dio.get('/api/v1/events/$id');
    final data =
        (response.data as Map<String, dynamic>)['data'] as Map<String, dynamic>;
    return EventDetail.fromJson(data);
  } on DioException catch (e) {
    throw Exception(e.response?.statusMessage ?? 'Failed to load event');
  }
});
