import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/providers/auth_provider.dart';
import '../../itineraries/providers/itinerary_wizard_provider.dart'
    show SpotState, StopType;

// ── Models ────────────────────────────────────────────────────────

class MeetingPointInfo {
  final String publicAreaName;
  final double? lat;
  final double? lng;
  final String? privateExactName;
  final double? privateLat;
  final double? privateLng;
  final bool isRevealed;
  final int revealHoursBefore;

  const MeetingPointInfo({
    required this.publicAreaName,
    this.lat,
    this.lng,
    this.privateExactName,
    this.privateLat,
    this.privateLng,
    this.isRevealed = false,
    this.revealHoursBefore = 24,
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
      revealHoursBefore: (json['reveal_hours_before'] as num?)?.toInt() ?? 24,
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

/// Mutable day draft used by the Day Plan wizard step.
///
/// Mirrors the itinerary `DayState` structure so the shared spot picker /
/// editor sheets can write into it directly via [SpotState].
class ExperienceDayDraft {
  final String? id;
  final int dayNumber;
  final String? title;
  final List<SpotState> spots;

  const ExperienceDayDraft({
    this.id,
    required this.dayNumber,
    this.title,
    this.spots = const [],
  });

  ExperienceDayDraft copyWith({
    String? id,
    int? dayNumber,
    String? title,
    List<SpotState>? spots,
  }) {
    return ExperienceDayDraft(
      id: id ?? this.id,
      dayNumber: dayNumber ?? this.dayNumber,
      title: title ?? this.title,
      spots: spots ?? this.spots,
    );
  }

  int get totalDurationMinutes {
    int total = 0;
    for (final spot in spots) {
      total += spot.durationMinutes ?? 0;
    }
    return total;
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
  final List<ExperienceDayDraft> days;
  final int selectedDayIndex;
  final bool tncAccepted;
  final bool isSaving;
  final String? saveError;

  // Discoverability facets (PR 2) — sent inside `facets` on
  // PUT /api/v1/experiences/:id. All nullable.
  final String? season;
  final String? tripStyle;
  final String? audience;

  // Cancellation policy: 'flexible' | 'moderate' | 'strict'
  final String cancellationPolicy;

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
    this.days = const [],
    this.selectedDayIndex = 0,
    this.tncAccepted = false,
    this.isSaving = false,
    this.saveError,
    this.season,
    this.tripStyle,
    this.audience,
    this.cancellationPolicy = 'flexible',
  });

  int get dayCount => days.length;

  int get totalSpots {
    int total = 0;
    for (final d in days) {
      total += d.spots.length;
    }
    return total;
  }

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
    List<ExperienceDayDraft>? days,
    int? selectedDayIndex,
    bool? tncAccepted,
    bool? isSaving,
    String? saveError,
    String? cancellationPolicy,
    // Explicit "set this field" flags so callers can clear a facet back to
    // null without the usual `x ?? this.x` rollback.
    bool setSeason = false,
    String? season,
    bool setTripStyle = false,
    String? tripStyle,
    bool setAudience = false,
    String? audience,
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
      days: days ?? this.days,
      selectedDayIndex: selectedDayIndex ?? this.selectedDayIndex,
      tncAccepted: tncAccepted ?? this.tncAccepted,
      isSaving: isSaving ?? this.isSaving,
      saveError: saveError,
      cancellationPolicy: cancellationPolicy ?? this.cancellationPolicy,
      season: setSeason ? season : this.season,
      tripStyle: setTripStyle ? tripStyle : this.tripStyle,
      audience: setAudience ? audience : this.audience,
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

  void setCancellationPolicy(String policy) =>
      state = state.copyWith(cancellationPolicy: policy, saveError: null);

  void setContentId(String id) =>
      state = state.copyWith(contentId: id, saveError: null);

  // ── Discoverability facets (PR 2) ────────────────────────────
  void setSeason(String? value) => state =
      state.copyWith(setSeason: true, season: value, saveError: null);
  void setTripStyle(String? value) => state =
      state.copyWith(setTripStyle: true, tripStyle: value, saveError: null);
  void setAudience(String? value) => state =
      state.copyWith(setAudience: true, audience: value, saveError: null);

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
      await dio.put('/api/v1/experiences/$id', data: buildUpdatePayload());
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

  /// Build the PATCH payload sent to `PUT /api/v1/experiences/:id`.
  /// Exposed on the notifier so tests can assert on the serialized body
  /// without hitting the network.
  Map<String, dynamic> buildUpdatePayload() {
    return <String, dynamic>{
      if (state.title.isNotEmpty) 'title': state.title,
      if (state.description.isNotEmpty) 'description': state.description,
      'price_paisa': state.pricePaisa,
      if (state.coverImageUrl != null) 'cover_image_url': state.coverImageUrl,
      if (state.locationName != null) 'location_name': state.locationName,
      if (state.tags.isNotEmpty) 'tags': state.tags,
      'cancellation_policy': state.cancellationPolicy,
      'facets': <String, dynamic>{
        if (state.season != null) 'season': state.season,
        if (state.tripStyle != null) 'trip_style': state.tripStyle,
        if (state.audience != null) 'audience': state.audience,
      },
    };
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

  // ── Day plan: local selectors ────────────────────────────────

  void selectDay(int index) {
    if (index < 0 || index >= state.days.length) return;
    state = state.copyWith(selectedDayIndex: index);
  }

  // ── Day plan: API-backed CRUD ────────────────────────────────

  /// Sets the total day count. Adds empty days or trims from the end
  /// (server cascades spot deletions). Requires [contentId] to be set.
  Future<bool> setDayCount(int newCount) async {
    final id = state.contentId;
    if (id == null || newCount < 1 || newCount > 30) return false;

    final dio = ref.read(authServiceProvider).dio;
    state = state.copyWith(isSaving: true, saveError: null);

    try {
      await dio.put('/api/v1/experiences/$id/day-count',
          data: {'day_count': newCount});

      // Re-fetch full day/spot tree from GET /experiences/:id
      await _reloadDays(id);
      state = state.copyWith(isSaving: false);
      return true;
    } on DioException catch (e) {
      state = state.copyWith(
        isSaving: false,
        saveError: e.response?.statusMessage ?? 'Failed to update day count',
      );
      return false;
    }
  }

  /// Refreshes `state.days` from the experience detail endpoint.
  Future<void> _reloadDays(String id) async {
    final dio = ref.read(authServiceProvider).dio;
    final response = await dio.get('/api/v1/experiences/$id');
    final data =
        (response.data as Map<String, dynamic>)['data'] as Map<String, dynamic>;
    final daysJson = data['days'] as List<dynamic>? ?? [];

    final drafts = daysJson.map((d) {
      final json = d as Map<String, dynamic>;
      final spotsJson = json['spots'] as List<dynamic>? ?? [];
      final spots = spotsJson.map((s) {
        final sj = s as Map<String, dynamic>;
        return SpotState(
          id: sj['id'] as String?,
          name: sj['name'] as String? ?? '',
          googlePlaceId: sj['google_place_id'] as String?,
          lat: (sj['lat'] as num?)?.toDouble() ?? 0.0,
          lng: (sj['lng'] as num?)?.toDouble() ?? 0.0,
          thumbnailUrl: sj['thumbnail_url'] as String?,
          creatorNote: sj['creator_note'] as String?,
          durationMinutes: sj['duration_minutes'] as int?,
          stopType: StopType.fromString(sj['stop_type'] as String? ?? 'regular'),
          isFreePreview: sj['is_free_preview'] as bool? ?? false,
        );
      }).toList();

      return ExperienceDayDraft(
        id: json['id'] as String?,
        dayNumber: json['day_number'] as int? ?? 1,
        title: json['title'] as String?,
        spots: spots,
      );
    }).toList();

    final newSelectedIndex = drafts.isEmpty
        ? 0
        : state.selectedDayIndex.clamp(0, drafts.length - 1);
    state = state.copyWith(days: drafts, selectedDayIndex: newSelectedIndex);
  }

  /// Adds a spot to the given day. Optimistic: inserts locally first, then
  /// calls the API and reconciles id on success; reverts on failure.
  Future<bool> addSpotApi(int dayIndex, SpotState spot) async {
    if (dayIndex < 0 || dayIndex >= state.days.length) return false;
    final day = state.days[dayIndex];
    final dayId = day.id;
    final contentId = state.contentId;
    if (dayId == null || contentId == null) return false;

    // Optimistic insert (no id yet — will be filled from server)
    final beforeDays = state.days;
    final optimisticDay = day.copyWith(spots: [...day.spots, spot]);
    final newDays = [...state.days]..[dayIndex] = optimisticDay;
    state = state.copyWith(days: newDays, saveError: null);

    final dio = ref.read(authServiceProvider).dio;
    try {
      final response = await dio.post(
        '/api/v1/experiences/$contentId/days/$dayId/spots',
        data: {
          'name': spot.name,
          if (spot.googlePlaceId != null) 'google_place_id': spot.googlePlaceId,
          'lat': spot.lat,
          'lng': spot.lng,
          if (spot.thumbnailUrl != null) 'thumbnail_url': spot.thumbnailUrl,
          if (spot.creatorNote != null) 'creator_note': spot.creatorNote,
          if (spot.durationMinutes != null)
            'duration_minutes': spot.durationMinutes,
          'stop_type': spot.stopType.value,
        },
      );
      final data = (response.data as Map<String, dynamic>)['data']
          as Map<String, dynamic>;
      final serverSpot = spot.copyWith(id: data['id'] as String?);

      // Replace the optimistic tail spot with the server-backed one
      final updatedDay = state.days[dayIndex];
      final updatedSpots = [...updatedDay.spots];
      updatedSpots[updatedSpots.length - 1] = serverSpot;
      final reconciledDays = [...state.days]
        ..[dayIndex] = updatedDay.copyWith(spots: updatedSpots);
      state = state.copyWith(days: reconciledDays);
      return true;
    } on DioException catch (e) {
      // Revert optimistic insert
      state = state.copyWith(
        days: beforeDays,
        saveError: e.response?.statusMessage ?? 'Failed to add spot',
      );
      return false;
    }
  }

  /// Removes a spot from the given day. Optimistic with revert on failure.
  Future<bool> removeSpotApi(int dayIndex, int spotIndex) async {
    if (dayIndex < 0 || dayIndex >= state.days.length) return false;
    final day = state.days[dayIndex];
    if (spotIndex < 0 || spotIndex >= day.spots.length) return false;
    final spot = day.spots[spotIndex];
    final spotId = spot.id;
    final dayId = day.id;
    final contentId = state.contentId;
    if (spotId == null || dayId == null || contentId == null) return false;

    final beforeDays = state.days;
    final spots = [...day.spots]..removeAt(spotIndex);
    final newDays = [...state.days]..[dayIndex] = day.copyWith(spots: spots);
    state = state.copyWith(days: newDays, saveError: null);

    final dio = ref.read(authServiceProvider).dio;
    try {
      await dio.delete(
        '/api/v1/experiences/$contentId/days/$dayId/spots/$spotId',
      );
      return true;
    } on DioException catch (e) {
      state = state.copyWith(
        days: beforeDays,
        saveError: e.response?.statusMessage ?? 'Failed to remove spot',
      );
      return false;
    }
  }

  /// Reorders spots within a day. Optimistic with revert on failure.
  Future<bool> reorderSpotsApi(
    int dayIndex,
    int oldIndex,
    int newIndex,
  ) async {
    if (dayIndex < 0 || dayIndex >= state.days.length) return false;
    final day = state.days[dayIndex];
    if (oldIndex < 0 || oldIndex >= day.spots.length) return false;
    final contentId = state.contentId;
    final dayId = day.id;
    if (contentId == null || dayId == null) return false;

    final beforeDays = state.days;
    final spots = [...day.spots];
    final item = spots.removeAt(oldIndex);
    final adjusted = newIndex > oldIndex ? newIndex - 1 : newIndex;
    spots.insert(adjusted, item);
    final newDays = [...state.days]..[dayIndex] = day.copyWith(spots: spots);
    state = state.copyWith(days: newDays, saveError: null);

    // Only send if all spots have server-side ids
    final spotIds = <String>[];
    for (final s in spots) {
      if (s.id == null) return true; // skip API (not yet persisted)
      spotIds.add(s.id!);
    }

    final dio = ref.read(authServiceProvider).dio;
    try {
      await dio.put(
        '/api/v1/experiences/$contentId/days/$dayId/spots/reorder',
        data: {'spot_ids': spotIds},
      );
      return true;
    } on DioException catch (e) {
      state = state.copyWith(
        days: beforeDays,
        saveError: e.response?.statusMessage ?? 'Failed to reorder spots',
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
        'reveal_hours_before': mp.revealHoursBefore,
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
