import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/providers/auth_provider.dart';

// ── Models ────────────────────────────────────────────────────────

class MeetingPointInfo {
  final String publicAreaName;
  final double? lat;
  final double? lng;
  final String? privateExactName;
  final double? privateLat;
  final double? privateLng;
  final bool isRevealed;

  const MeetingPointInfo({
    required this.publicAreaName,
    this.lat,
    this.lng,
    this.privateExactName,
    this.privateLat,
    this.privateLng,
    this.isRevealed = false,
  });

  factory MeetingPointInfo.fromJson(Map<String, dynamic> json) {
    return MeetingPointInfo(
      publicAreaName: json['public_area_name'] as String? ?? '',
      lat: (json['lat'] as num?)?.toDouble(),
      lng: (json['lng'] as num?)?.toDouble(),
      privateExactName: json['private_exact_name'] as String?,
      privateLat: (json['private_lat'] as num?)?.toDouble(),
      privateLng: (json['private_lng'] as num?)?.toDouble(),
      isRevealed: json['is_revealed'] as bool? ?? false,
    );
  }
}

class ExperienceCreator {
  final String id;
  final String displayName;
  final String? username;
  final String? avatarUrl;
  final bool isVerified;

  const ExperienceCreator({
    required this.id,
    required this.displayName,
    this.username,
    this.avatarUrl,
    this.isVerified = false,
  });

  factory ExperienceCreator.fromJson(Map<String, dynamic> json) {
    return ExperienceCreator(
      id: json['id'] as String? ?? '',
      displayName: json['display_name'] as String? ?? 'Creator',
      username: json['username'] as String?,
      avatarUrl: json['avatar_url'] as String?,
      isVerified: json['is_verified'] as bool? ?? false,
    );
  }
}

class ExperienceDaySpot {
  final String id;
  final String name;
  final String stopType;
  final int? durationMinutes;
  final String? creatorNote;
  final String? thumbnailUrl;
  final double lat;
  final double lng;

  const ExperienceDaySpot({
    required this.id,
    required this.name,
    required this.stopType,
    this.durationMinutes,
    this.creatorNote,
    this.thumbnailUrl,
    required this.lat,
    required this.lng,
  });

  factory ExperienceDaySpot.fromJson(Map<String, dynamic> json) {
    return ExperienceDaySpot(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      stopType: json['stop_type'] as String? ?? 'regular',
      durationMinutes: json['duration_minutes'] as int?,
      creatorNote: json['creator_note'] as String?,
      thumbnailUrl: json['thumbnail_url'] as String?,
      lat: (json['lat'] as num?)?.toDouble() ?? 0.0,
      lng: (json['lng'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

class ExperienceDay {
  final String id;
  final int dayNumber;
  final String? title;
  final List<ExperienceDaySpot> spots;

  const ExperienceDay({
    required this.id,
    required this.dayNumber,
    this.title,
    required this.spots,
  });

  factory ExperienceDay.fromJson(Map<String, dynamic> json) {
    final spotsJson = json['spots'] as List<dynamic>? ?? [];
    return ExperienceDay(
      id: json['id'] as String? ?? '',
      dayNumber: json['day_number'] as int? ?? 1,
      title: json['title'] as String?,
      spots: spotsJson
          .map((s) => ExperienceDaySpot.fromJson(s as Map<String, dynamic>))
          .toList(),
    );
  }
}

class ExperienceDetail {
  final String id;
  final String title;
  final String description;
  final String status;
  final String contentType;
  final int? pricePaisa;
  final String? coverImageUrl;
  final String? locationName;
  final List<String> tags;
  final MeetingPointInfo? meetingPoint;
  final ExperienceCreator creator;
  final List<ExperienceDay> days;
  final int likeCount;
  final int commentCount;
  final bool isLiked;
  final bool isSaved;

  const ExperienceDetail({
    required this.id,
    required this.title,
    required this.description,
    required this.status,
    required this.contentType,
    this.pricePaisa,
    this.coverImageUrl,
    this.locationName,
    this.tags = const [],
    this.meetingPoint,
    required this.creator,
    this.days = const [],
    this.likeCount = 0,
    this.commentCount = 0,
    this.isLiked = false,
    this.isSaved = false,
  });

  bool get isFree => (pricePaisa ?? 0) <= 0;

  factory ExperienceDetail.fromJson(Map<String, dynamic> json) {
    final creatorJson = json['creator'] as Map<String, dynamic>? ?? {};
    final daysJson = json['days'] as List<dynamic>? ?? [];
    final meetingPointJson = json['meeting_point'] as Map<String, dynamic>?;

    return ExperienceDetail(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? '',
      description: json['description'] as String? ?? '',
      status: json['status'] as String? ?? 'draft',
      contentType: json['content_type'] as String? ?? 'experience',
      pricePaisa: json['price_paisa'] as int?,
      coverImageUrl: json['cover_image_url'] as String?,
      locationName: json['location_name'] as String?,
      tags: (json['tags'] as List<dynamic>?)
              ?.map((t) => t as String)
              .toList() ??
          const [],
      meetingPoint: meetingPointJson != null
          ? MeetingPointInfo.fromJson(meetingPointJson)
          : null,
      creator: ExperienceCreator.fromJson(creatorJson),
      days: daysJson
          .map((d) => ExperienceDay.fromJson(d as Map<String, dynamic>))
          .toList(),
      likeCount: json['like_count'] as int? ?? 0,
      commentCount: json['comment_count'] as int? ?? 0,
      isLiked: json['is_liked'] as bool? ?? false,
      isSaved: json['is_saved'] as bool? ?? false,
    );
  }
}

class ScheduledDate {
  final String id;
  final String startDate;
  final String endDate;
  final int capacity;
  final int spotsBooked;
  final bool isActive;

  const ScheduledDate({
    required this.id,
    required this.startDate,
    required this.endDate,
    required this.capacity,
    required this.spotsBooked,
    required this.isActive,
  });

  int get spotsLeft => (capacity - spotsBooked).clamp(0, capacity);
  bool get isSoldOut => spotsLeft == 0;

  factory ScheduledDate.fromJson(Map<String, dynamic> json) {
    return ScheduledDate(
      id: json['id'] as String? ?? '',
      startDate: json['start_date'] as String? ?? '',
      endDate: json['end_date'] as String? ?? '',
      capacity: json['capacity'] as int? ?? 0,
      spotsBooked: json['spots_booked'] as int? ?? 0,
      isActive: json['is_active'] as bool? ?? true,
    );
  }
}

// ── Providers ─────────────────────────────────────────────────────

/// Family provider for experience detail, keyed by experience ID.
final experienceDetailProvider =
    FutureProvider.family.autoDispose<ExperienceDetail, String>((ref, id) async {
  final dio = ref.read(authServiceProvider).dio;
  try {
    final response = await dio.get('/api/v1/experiences/$id');
    final data =
        (response.data as Map<String, dynamic>)['data'] as Map<String, dynamic>;
    return ExperienceDetail.fromJson(data);
  } on DioException catch (e) {
    throw Exception(
      e.response?.statusMessage ?? 'Failed to load experience',
    );
  }
});

/// Family provider for scheduled dates of an experience, keyed by experience ID.
final experienceDatesProvider =
    FutureProvider.family.autoDispose<List<ScheduledDate>, String>((ref, id) async {
  final dio = ref.read(authServiceProvider).dio;
  try {
    final response = await dio.get('/api/v1/experiences/$id/dates');
    final dataList =
        (response.data as Map<String, dynamic>)['data'] as List<dynamic>? ?? [];
    return dataList
        .map((d) => ScheduledDate.fromJson(d as Map<String, dynamic>))
        .toList();
  } on DioException catch (e) {
    throw Exception(
      e.response?.statusMessage ?? 'Failed to load dates',
    );
  }
});

// ── Create Experience Notifier ─────────────────────────────────────

class CreateExperienceState {
  final String? contentId;
  final String title;
  final String description;
  final String vertical;
  final int pricePaisa;
  final String? coverImageUrl;
  final String? locationName;
  final List<String> tags;
  final List<ScheduledDate> dates;
  final MeetingPointInfo? meetingPoint;
  final bool tncAccepted;
  final bool isSaving;
  final String? saveError;

  const CreateExperienceState({
    this.contentId,
    this.title = '',
    this.description = '',
    this.vertical = 'travel',
    this.pricePaisa = 0,
    this.coverImageUrl,
    this.locationName,
    this.tags = const [],
    this.dates = const [],
    this.meetingPoint,
    this.tncAccepted = false,
    this.isSaving = false,
    this.saveError,
  });

  CreateExperienceState copyWith({
    String? contentId,
    String? title,
    String? description,
    String? vertical,
    int? pricePaisa,
    String? coverImageUrl,
    String? locationName,
    List<String>? tags,
    List<ScheduledDate>? dates,
    MeetingPointInfo? meetingPoint,
    bool? tncAccepted,
    bool? isSaving,
    String? saveError,
  }) {
    return CreateExperienceState(
      contentId: contentId ?? this.contentId,
      title: title ?? this.title,
      description: description ?? this.description,
      vertical: vertical ?? this.vertical,
      pricePaisa: pricePaisa ?? this.pricePaisa,
      coverImageUrl: coverImageUrl ?? this.coverImageUrl,
      locationName: locationName ?? this.locationName,
      tags: tags ?? this.tags,
      dates: dates ?? this.dates,
      meetingPoint: meetingPoint ?? this.meetingPoint,
      tncAccepted: tncAccepted ?? this.tncAccepted,
      isSaving: isSaving ?? this.isSaving,
      saveError: saveError,
    );
  }
}

final createExperienceProvider =
    NotifierProvider<CreateExperienceNotifier, CreateExperienceState>(
  CreateExperienceNotifier.new,
);

class CreateExperienceNotifier extends Notifier<CreateExperienceState> {
  @override
  CreateExperienceState build() => const CreateExperienceState();

  void reset() {
    state = const CreateExperienceState();
  }

  // ── Field setters ────────────────────────────────────────────

  void setTitle(String v) => state = state.copyWith(title: v, saveError: null);
  void setDescription(String v) =>
      state = state.copyWith(description: v, saveError: null);
  void setVertical(String v) =>
      state = state.copyWith(vertical: v, saveError: null);
  void setLocationName(String v) =>
      state = state.copyWith(locationName: v, saveError: null);
  void setTags(List<String> v) =>
      state = state.copyWith(tags: v, saveError: null);
  void setTncAccepted(bool v) =>
      state = state.copyWith(tncAccepted: v, saveError: null);
  void setCoverImageUrl(String? url) =>
      state = state.copyWith(coverImageUrl: url, saveError: null);

  /// Sets price in rupees — converts to paisa internally.
  void setPriceRupees(double rupees) =>
      state = state.copyWith(pricePaisa: (rupees * 100).round(), saveError: null);

  void setMeetingPoint(MeetingPointInfo mp) =>
      state = state.copyWith(meetingPoint: mp, saveError: null);

  void addDate(ScheduledDate date) {
    state = state.copyWith(dates: [...state.dates, date], saveError: null);
  }

  void removeDate(String dateId) {
    state = state.copyWith(
      dates: state.dates.where((d) => d.id != dateId).toList(),
      saveError: null,
    );
  }

  // ── API operations ────────────────────────────────────────────

  /// Creates an experience draft. Returns the new ID.
  Future<String?> createDraft() async {
    final dio = ref.read(authServiceProvider).dio;
    state = state.copyWith(isSaving: true, saveError: null);
    try {
      final response = await dio.post('/api/v1/experiences', data: {
        'vertical': state.vertical.isNotEmpty ? state.vertical : 'travel',
      });
      final data =
          (response.data as Map<String, dynamic>)['data'] as Map<String, dynamic>;
      final id = data['id'] as String;
      state = state.copyWith(contentId: id, isSaving: false);
      return id;
    } on DioException catch (e) {
      state = state.copyWith(
        isSaving: false,
        saveError: e.response?.statusMessage ?? 'Failed to create draft',
      );
      return null;
    }
  }

  /// Updates basic fields (title, description, price, location, tags).
  Future<bool> updateField() async {
    final id = state.contentId;
    if (id == null) return false;
    final dio = ref.read(authServiceProvider).dio;
    state = state.copyWith(isSaving: true, saveError: null);
    try {
      await dio.put('/api/v1/experiences/$id', data: {
        if (state.title.isNotEmpty) 'title': state.title,
        if (state.description.isNotEmpty) 'description': state.description,
        'price_paisa': state.pricePaisa,
        if (state.coverImageUrl != null) 'cover_image_url': state.coverImageUrl,
        if (state.locationName != null) 'location_name': state.locationName,
        if (state.tags.isNotEmpty) 'tags': state.tags,
      });
      state = state.copyWith(isSaving: false);
      return true;
    } on DioException catch (e) {
      state = state.copyWith(
        isSaving: false,
        saveError: e.response?.statusMessage ?? 'Failed to save',
      );
      return false;
    }
  }

  /// Adds a scheduled date to the experience.
  Future<ScheduledDate?> addDateApi({
    required String startDate,
    required String endDate,
    required int capacity,
  }) async {
    final id = state.contentId;
    if (id == null) return null;
    final dio = ref.read(authServiceProvider).dio;
    state = state.copyWith(isSaving: true, saveError: null);
    try {
      final response = await dio.post('/api/v1/experiences/$id/dates', data: {
        'start_date': startDate,
        'end_date': endDate,
        'capacity': capacity,
      });
      final data =
          (response.data as Map<String, dynamic>)['data'] as Map<String, dynamic>;
      final date = ScheduledDate.fromJson(data);
      addDate(date);
      state = state.copyWith(isSaving: false);
      return date;
    } on DioException catch (e) {
      state = state.copyWith(
        isSaving: false,
        saveError: e.response?.statusMessage ?? 'Failed to add date',
      );
      return null;
    }
  }

  /// Publishes the experience draft.
  Future<bool> publishExperience() async {
    final id = state.contentId;
    if (id == null || !state.tncAccepted) return false;
    final dio = ref.read(authServiceProvider).dio;
    state = state.copyWith(isSaving: true, saveError: null);
    try {
      await dio.post(
        '/api/v1/experiences/$id/publish',
        data: {'tnc_accepted': true},
      );
      state = state.copyWith(isSaving: false);
      return true;
    } on DioException catch (e) {
      state = state.copyWith(
        isSaving: false,
        saveError: e.response?.statusMessage ?? 'Failed to publish',
      );
      return false;
    }
  }

  /// Saves the meeting point to the API.
  Future<bool> saveMeetingPoint(MeetingPointInfo mp) async {
    final id = state.contentId;
    if (id == null) return false;
    final dio = ref.read(authServiceProvider).dio;
    state = state.copyWith(isSaving: true, saveError: null);
    try {
      await dio.put('/api/v1/experiences/$id/meeting-point', data: {
        'public_area_name': mp.publicAreaName,
        if (mp.lat != null) 'lat': mp.lat,
        if (mp.lng != null) 'lng': mp.lng,
        if (mp.privateExactName != null) 'private_exact_name': mp.privateExactName,
        if (mp.privateLat != null) 'private_lat': mp.privateLat,
        if (mp.privateLng != null) 'private_lng': mp.privateLng,
      });
      setMeetingPoint(mp);
      state = state.copyWith(isSaving: false);
      return true;
    } on DioException catch (e) {
      state = state.copyWith(
        isSaving: false,
        saveError: e.response?.statusMessage ?? 'Failed to save meeting point',
      );
      return false;
    }
  }
}
