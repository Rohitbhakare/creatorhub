import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../content/providers/wizard_provider.dart';

// ── Stop Types ────────────────────────────────────────────────

/// Allowed stop types for itinerary spots.
enum StopType {
  regular('regular', 'Regular'),
  overnight('overnight', 'Overnight'),
  meal('meal', 'Meal'),
  viewpoint('viewpoint', 'Viewpoint'),
  activity('activity', 'Activity');

  final String value;
  final String label;
  const StopType(this.value, this.label);

  static StopType fromString(String v) {
    return StopType.values.firstWhere(
      (e) => e.value == v,
      orElse: () => StopType.regular,
    );
  }
}

// ── Spot State ────────────────────────────────────────────────

class SpotState {
  final String? id;
  final String name;
  final String? googlePlaceId;
  final double lat;
  final double lng;
  final String? thumbnailUrl;
  /// Creator-uploaded cover override (DD-032). When non-null, takes
  /// precedence over [thumbnailUrl] (the Google Places photo) when the
  /// spot is rendered.
  final String? coverUrl;
  final String? creatorNote;
  final int? durationMinutes;
  final StopType stopType;
  final bool isFreePreview;

  const SpotState({
    this.id,
    required this.name,
    this.googlePlaceId,
    required this.lat,
    required this.lng,
    this.thumbnailUrl,
    this.coverUrl,
    this.creatorNote,
    this.durationMinutes,
    this.stopType = StopType.regular,
    this.isFreePreview = false,
  });

  /// Resolved display URL for the spot thumbnail.
  /// Prefers the creator-uploaded [coverUrl] over the Places [thumbnailUrl].
  String? get displayImageUrl => coverUrl ?? thumbnailUrl;

  SpotState copyWith({
    String? id,
    String? name,
    String? googlePlaceId,
    double? lat,
    double? lng,
    String? thumbnailUrl,
    Object? coverUrl = _sentinel,
    String? creatorNote,
    int? durationMinutes,
    StopType? stopType,
    bool? isFreePreview,
  }) {
    return SpotState(
      id: id ?? this.id,
      name: name ?? this.name,
      googlePlaceId: googlePlaceId ?? this.googlePlaceId,
      lat: lat ?? this.lat,
      lng: lng ?? this.lng,
      thumbnailUrl: thumbnailUrl ?? this.thumbnailUrl,
      coverUrl:
          identical(coverUrl, _sentinel) ? this.coverUrl : coverUrl as String?,
      creatorNote: creatorNote ?? this.creatorNote,
      durationMinutes: durationMinutes ?? this.durationMinutes,
      stopType: stopType ?? this.stopType,
      isFreePreview: isFreePreview ?? this.isFreePreview,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (id != null) 'id': id,
      'name': name,
      if (googlePlaceId != null) 'google_place_id': googlePlaceId,
      'lat': lat,
      'lng': lng,
      if (thumbnailUrl != null) 'thumbnail_url': thumbnailUrl,
      // cover_url is sent regardless of null-ness so that resetting an
      // override clears the column on the server (PUT /spots/:spotId).
      'cover_url': coverUrl,
      if (creatorNote != null) 'creator_note': creatorNote,
      if (durationMinutes != null) 'duration_minutes': durationMinutes,
      'stop_type': stopType.value,
      'is_free_preview': isFreePreview,
    };
  }

  factory SpotState.fromJson(Map<String, dynamic> json) {
    return SpotState(
      id: json['id'] as String?,
      name: json['name'] as String,
      googlePlaceId: json['google_place_id'] as String?,
      lat: (json['lat'] as num).toDouble(),
      lng: (json['lng'] as num).toDouble(),
      thumbnailUrl: json['thumbnail_url'] as String?,
      coverUrl: json['cover_url'] as String?,
      creatorNote: json['creator_note'] as String?,
      durationMinutes: json['duration_minutes'] as int?,
      stopType: StopType.fromString(json['stop_type'] as String? ?? 'regular'),
      isFreePreview: json['is_free_preview'] as bool? ?? false,
    );
  }
}

/// Sentinel used by [SpotState.copyWith] to distinguish "field omitted"
/// from "field explicitly set to null" (needed for clearing [coverUrl]).
const Object _sentinel = Object();

// ── Day State ─────────────────────────────────────────────────

class DayState {
  final String? id;
  final int dayNumber;
  final String? title;
  final String? description;
  final List<SpotState> spots;
  final double? totalDistanceKm;
  final double? estimatedHours;

  const DayState({
    this.id,
    required this.dayNumber,
    this.title,
    this.description,
    this.spots = const [],
    this.totalDistanceKm,
    this.estimatedHours,
  });

  DayState copyWith({
    String? id,
    int? dayNumber,
    String? title,
    String? description,
    List<SpotState>? spots,
    double? totalDistanceKm,
    double? estimatedHours,
  }) {
    return DayState(
      id: id ?? this.id,
      dayNumber: dayNumber ?? this.dayNumber,
      title: title ?? this.title,
      description: description ?? this.description,
      spots: spots ?? this.spots,
      totalDistanceKm: totalDistanceKm ?? this.totalDistanceKm,
      estimatedHours: estimatedHours ?? this.estimatedHours,
    );
  }

  /// Total duration of all spots in minutes.
  int get totalDurationMinutes {
    int total = 0;
    for (final spot in spots) {
      total += spot.durationMinutes ?? 0;
    }
    return total;
  }

  Map<String, dynamic> toJson() {
    return {
      if (id != null) 'id': id,
      'day_number': dayNumber,
      if (title != null) 'title': title,
      if (description != null) 'description': description,
      'spots': spots.map((s) => s.toJson()).toList(),
      if (totalDistanceKm != null) 'total_distance_km': totalDistanceKm,
      if (estimatedHours != null) 'estimated_hours': estimatedHours,
    };
  }

  factory DayState.fromJson(Map<String, dynamic> json) {
    return DayState(
      id: json['id'] as String?,
      dayNumber: json['day_number'] as int,
      title: json['title'] as String?,
      description: json['description'] as String?,
      spots: (json['spots'] as List<dynamic>?)
              ?.map((s) => SpotState.fromJson(s as Map<String, dynamic>))
              .toList() ??
          const [],
      totalDistanceKm: (json['total_distance_km'] as num?)?.toDouble(),
      estimatedHours: (json['estimated_hours'] as num?)?.toDouble(),
    );
  }
}

// ── Itinerary Wizard State ────────────────────────────────────

class ItineraryWizardState {
  final String? startingCityName;
  final List<String> destinationCityNames;
  final List<DayState> days;
  final int selectedDayIndex;

  const ItineraryWizardState({
    this.startingCityName,
    this.destinationCityNames = const [],
    this.days = const [],
    this.selectedDayIndex = 0,
  });

  ItineraryWizardState copyWith({
    String? startingCityName,
    List<String>? destinationCityNames,
    List<DayState>? days,
    int? selectedDayIndex,
  }) {
    return ItineraryWizardState(
      startingCityName: startingCityName ?? this.startingCityName,
      destinationCityNames:
          destinationCityNames ?? this.destinationCityNames,
      days: days ?? this.days,
      selectedDayIndex: selectedDayIndex ?? this.selectedDayIndex,
    );
  }

  /// Total number of spots across all days.
  int get totalSpots {
    int total = 0;
    for (final day in days) {
      total += day.spots.length;
    }
    return total;
  }

  /// Total distance across all days in km.
  double get totalDistanceKm {
    double total = 0;
    for (final day in days) {
      total += day.totalDistanceKm ?? 0;
    }
    return total;
  }
}

// ── Provider ──────────────────────────────────────────────────

final itineraryWizardProvider =
    NotifierProvider<ItineraryWizardNotifier, ItineraryWizardState>(
  ItineraryWizardNotifier.new,
);

// ── Itinerary Wizard Notifier ─────────────────────────────────

class ItineraryWizardNotifier extends Notifier<ItineraryWizardState> {
  @override
  ItineraryWizardState build() {
    return const ItineraryWizardState();
  }

  /// Initialize days based on the wizard's dayCount.
  void syncDays(int dayCount) {
    final currentDays = state.days;
    if (currentDays.length == dayCount) return;

    final List<DayState> newDays;
    if (dayCount > currentDays.length) {
      // Add new empty days
      newDays = [
        ...currentDays,
        for (int i = currentDays.length + 1; i <= dayCount; i++)
          DayState(dayNumber: i),
      ];
    } else {
      // Trim extra days
      newDays = currentDays.sublist(0, dayCount);
    }

    state = state.copyWith(
      days: newDays,
      selectedDayIndex: state.selectedDayIndex.clamp(0, dayCount - 1),
    );
  }

  // ── City Management ──────────────────────────────────────────

  void setStartingCity(String cityId, String cityName) {
    ref
        .read(wizardProvider.notifier)
        .setStartingCity(cityId, cityName: cityName);
    state = state.copyWith(startingCityName: cityName);
  }

  void addDestinationCity(String cityId, String cityName) {
    final wizard = ref.read(wizardProvider);
    if (wizard.destinationCityIds.contains(cityId)) return;

    ref.read(wizardProvider.notifier).setDestinationCities(
      [...wizard.destinationCityIds, cityId],
    );
    state = state.copyWith(
      destinationCityNames: [...state.destinationCityNames, cityName],
    );
  }

  void removeDestinationCity(int index) {
    final wizard = ref.read(wizardProvider);
    if (index < 0 || index >= wizard.destinationCityIds.length) return;

    final newIds = [...wizard.destinationCityIds]..removeAt(index);
    final newNames = [...state.destinationCityNames]..removeAt(index);

    ref.read(wizardProvider.notifier).setDestinationCities(newIds);
    state = state.copyWith(destinationCityNames: newNames);
  }

  void clearStartingCity() {
    ref.read(wizardProvider.notifier).clearStartingCity();
    state = state.copyWith(startingCityName: null);
  }

  // ── Day Selection ─────────────────────────────────────────────

  void selectDay(int index) {
    if (index < 0 || index >= state.days.length) return;
    state = state.copyWith(selectedDayIndex: index);
  }

  // ── Day Management ────────────────────────────────────────────

  void updateDay(int dayIndex, {String? title, String? description}) {
    if (dayIndex < 0 || dayIndex >= state.days.length) return;
    final days = [...state.days];
    days[dayIndex] = days[dayIndex].copyWith(
      title: title,
      description: description,
    );
    state = state.copyWith(days: days);
    ref.read(wizardProvider.notifier).setTitle(
      ref.read(wizardProvider).title, // keep dirty flag
    );
  }

  // ── Spot Management ───────────────────────────────────────────

  void addSpot(int dayIndex, SpotState spot) {
    if (dayIndex < 0 || dayIndex >= state.days.length) return;
    final days = [...state.days];
    final currentSpots = [...days[dayIndex].spots, spot];
    days[dayIndex] = days[dayIndex].copyWith(spots: currentSpots);
    state = state.copyWith(days: days);
    _markDirty();
  }

  void removeSpot(int dayIndex, int spotIndex) {
    if (dayIndex < 0 || dayIndex >= state.days.length) return;
    final day = state.days[dayIndex];
    if (spotIndex < 0 || spotIndex >= day.spots.length) return;

    final days = [...state.days];
    final spots = [...day.spots]..removeAt(spotIndex);
    days[dayIndex] = days[dayIndex].copyWith(spots: spots);
    state = state.copyWith(days: days);
    _markDirty();
  }

  void updateSpot(int dayIndex, int spotIndex, SpotState updatedSpot) {
    if (dayIndex < 0 || dayIndex >= state.days.length) return;
    final day = state.days[dayIndex];
    if (spotIndex < 0 || spotIndex >= day.spots.length) return;

    final days = [...state.days];
    final spots = [...day.spots];
    spots[spotIndex] = updatedSpot;
    days[dayIndex] = days[dayIndex].copyWith(spots: spots);
    state = state.copyWith(days: days);
    _markDirty();
  }

  void reorderSpots(int dayIndex, int oldIndex, int newIndex) {
    if (dayIndex < 0 || dayIndex >= state.days.length) return;
    final day = state.days[dayIndex];
    if (oldIndex < 0 || oldIndex >= day.spots.length) return;
    if (newIndex < 0 || newIndex > day.spots.length) return;

    final days = [...state.days];
    final spots = [...day.spots];
    final item = spots.removeAt(oldIndex);
    final adjustedIndex = newIndex > oldIndex ? newIndex - 1 : newIndex;
    spots.insert(adjustedIndex, item);
    days[dayIndex] = days[dayIndex].copyWith(spots: spots);
    state = state.copyWith(days: days);
    _markDirty();
  }

  void _markDirty() {
    // Touch the wizard state to trigger dirty flag
    final wizard = ref.read(wizardProvider);
    ref.read(wizardProvider.notifier).setTitle(wizard.title);
  }

  /// Reset itinerary wizard state.
  void reset() {
    state = const ItineraryWizardState();
  }
}
