import 'package:flutter_riverpod/flutter_riverpod.dart';

// ── What To Bring Presets ────────────────────────────────────────

/// Suggested "what to bring" items keyed by vertical.
/// Shown as checkboxes in the suggestions drawer during event creation.
const Map<String, List<String>> kWhatToBringPresets = {
  'travel': [
    'Water bottle',
    'Sunscreen',
    'Comfortable shoes',
    'Rain jacket',
    'Snacks',
    'Camera',
    'Extra cash',
    'ID proof',
    'Charger & power bank',
    'Insect repellent',
  ],
  'stories': [
    'Notebook & pen',
    'Camera or phone',
    'Voice recorder',
    'Business cards',
  ],
  'food': [
    'Appetite',
    'Cash for street food',
    'Napkins',
    'Allergy information',
  ],
  'fitness': [
    'Sports shoes',
    'Water bottle',
    'Towel',
    'Change of clothes',
    'Yoga mat',
  ],
  'education': [
    'Notebook & pen',
    'Laptop (optional)',
    'Questions prepared',
  ],
  'photography': [
    'Camera',
    'Extra batteries',
    'Memory cards',
    'Tripod (optional)',
    'Lens cleaning kit',
  ],
  'music': [
    'Earplugs',
    'Comfortable shoes',
    'Cash for merchandise',
  ],
  'wellness': [
    'Yoga mat',
    'Comfortable clothing',
    'Water bottle',
    'Towel',
  ],
};

/// Default preset when vertical has no specific suggestions.
const List<String> kDefaultWhatToBringPresets = [
  'Water bottle',
  'Comfortable shoes',
  'Extra cash',
  'ID proof',
  'Charger & power bank',
];

// ── Event Wizard State ────────────────────────────────────────────

class EventWizardState {
  final DateTime? startAt;
  final DateTime? endAt;
  final String timezone;
  final String venueName;
  final String venueAddress;
  final double? venueLat;
  final double? venueLng;
  final String? cityId;
  final String? cityName;
  final int capacity;
  final List<String> whatToBring;
  // Optional fields (CRT-FR-013)
  final String? dressCode;
  final String? ageRestriction; // 'none' | '18+' | '21+'
  /// Cancellation policy used for paid events.
  /// Values: 'flexible' (default) | 'moderate' | 'strict'.
  final String cancellationPolicy;

  const EventWizardState({
    this.startAt,
    this.endAt,
    this.timezone = 'Asia/Kolkata',
    this.venueName = '',
    this.venueAddress = '',
    this.venueLat,
    this.venueLng,
    this.cityId,
    this.cityName,
    this.capacity = 20,
    this.whatToBring = const [],
    this.dressCode,
    this.ageRestriction,
    this.cancellationPolicy = 'flexible',
  });

  EventWizardState copyWith({
    DateTime? startAt,
    DateTime? endAt,
    String? timezone,
    String? venueName,
    String? venueAddress,
    double? venueLat,
    double? venueLng,
    String? cityId,
    String? cityName,
    int? capacity,
    List<String>? whatToBring,
    bool setDressCode = false,
    String? dressCode,
    bool setAgeRestriction = false,
    String? ageRestriction,
    String? cancellationPolicy,
  }) {
    return EventWizardState(
      startAt: startAt ?? this.startAt,
      endAt: endAt ?? this.endAt,
      timezone: timezone ?? this.timezone,
      venueName: venueName ?? this.venueName,
      venueAddress: venueAddress ?? this.venueAddress,
      venueLat: venueLat ?? this.venueLat,
      venueLng: venueLng ?? this.venueLng,
      cityId: cityId ?? this.cityId,
      cityName: cityName ?? this.cityName,
      capacity: capacity ?? this.capacity,
      whatToBring: whatToBring ?? this.whatToBring,
      dressCode: setDressCode ? dressCode : this.dressCode,
      ageRestriction: setAgeRestriction ? ageRestriction : this.ageRestriction,
      cancellationPolicy: cancellationPolicy ?? this.cancellationPolicy,
    );
  }

  /// Build the API payload for PUT /api/v1/events/:id
  Map<String, dynamic> toApiPayload() {
    return {
      if (startAt != null) 'start_at': startAt!.toUtc().toIso8601String(),
      if (endAt != null) 'end_at': endAt!.toUtc().toIso8601String(),
      'timezone': timezone,
      if (venueName.trim().isNotEmpty) 'venue_name': venueName.trim(),
      if (venueAddress.trim().isNotEmpty) 'venue_address': venueAddress.trim(),
      if (venueLat != null) 'venue_lat': venueLat,
      if (venueLng != null) 'venue_lng': venueLng,
      if (cityId != null) 'city_id': cityId,
      'capacity': capacity,
      'what_to_bring': whatToBring,
      if (dressCode != null && dressCode!.trim().isNotEmpty)
        'dress_code': dressCode!.trim(),
      if (ageRestriction != null && ageRestriction != 'none')
        'age_restriction': ageRestriction,
      'cancellation_policy': cancellationPolicy,
    };
  }
}

// ── Provider ─────────────────────────────────────────────────────

final eventWizardProvider =
    NotifierProvider<EventWizardNotifier, EventWizardState>(
  EventWizardNotifier.new,
);

// ── Notifier ─────────────────────────────────────────────────────

class EventWizardNotifier extends Notifier<EventWizardState> {
  @override
  EventWizardState build() => const EventWizardState();

  void setStartAt(DateTime value) =>
      state = state.copyWith(startAt: value);

  void setEndAt(DateTime value) =>
      state = state.copyWith(endAt: value);

  void setTimezone(String value) =>
      state = state.copyWith(timezone: value);

  void setVenueName(String value) =>
      state = state.copyWith(venueName: value);

  void setVenueAddress(String value) =>
      state = state.copyWith(venueAddress: value);

  void setVenueCoords(double lat, double lng) =>
      state = state.copyWith(venueLat: lat, venueLng: lng);

  void setCity(String id, String name) =>
      state = state.copyWith(cityId: id, cityName: name);

  void clearCity() => state = EventWizardState(
        startAt: state.startAt,
        endAt: state.endAt,
        timezone: state.timezone,
        venueName: state.venueName,
        venueAddress: state.venueAddress,
        venueLat: state.venueLat,
        venueLng: state.venueLng,
        cityId: null,
        cityName: null,
        capacity: state.capacity,
        whatToBring: state.whatToBring,
        dressCode: state.dressCode,
        ageRestriction: state.ageRestriction,
      );

  void setDressCode(String? value) =>
      state = state.copyWith(setDressCode: true, dressCode: value);

  void setAgeRestriction(String? value) =>
      state = state.copyWith(setAgeRestriction: true, ageRestriction: value);

  void setCapacity(int value) =>
      state = state.copyWith(capacity: value.clamp(1, 10000));

  void setCancellationPolicy(String policy) =>
      state = state.copyWith(cancellationPolicy: policy);

  void setWhatToBring(List<String> items) =>
      state = state.copyWith(whatToBring: List.unmodifiable(items));

  void toggleWhatToBringItem(String item) {
    final current = [...state.whatToBring];
    if (current.contains(item)) {
      current.remove(item);
    } else {
      current.add(item);
    }
    state = state.copyWith(whatToBring: List.unmodifiable(current));
  }

  void addCustomItem(String item) {
    final trimmed = item.trim();
    if (trimmed.isEmpty || trimmed.length > 200) return;
    if (state.whatToBring.contains(trimmed)) return;
    state = state.copyWith(
      whatToBring: List.unmodifiable([...state.whatToBring, trimmed]),
    );
  }

  void removeItem(String item) {
    state = state.copyWith(
      whatToBring: List.unmodifiable(
        state.whatToBring.where((i) => i != item).toList(),
      ),
    );
  }

  void reset() => state = const EventWizardState();
}
