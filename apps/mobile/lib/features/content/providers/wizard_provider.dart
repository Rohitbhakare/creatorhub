import 'package:flutter_riverpod/flutter_riverpod.dart';

// ── Content Types ──────────────────────────────────────────────

enum ContentType {
  post,
  selfPacedItinerary,
  event,
  scheduledExperience;

  String get label => switch (this) {
        post => 'Post',
        selfPacedItinerary => 'Self-paced Itinerary',
        event => 'Event',
        scheduledExperience => 'Scheduled Experience',
      };

  /// API resource path segment used in endpoint URLs (e.g. `/api/v1/$apiPath/:id/publish`).
  String get apiPath => switch (this) {
        post => 'posts',
        selfPacedItinerary => 'itineraries',
        event => 'events',
        scheduledExperience => 'experiences',
      };

  /// Wire-format `type` value expected by the API (snake_case, matches the
  /// `CONTENT_TYPES` enum in packages/shared). Dart enum `.name` yields
  /// camelCase for multi-word variants, which the API rejects.
  String get apiType => switch (this) {
        post => 'post',
        selfPacedItinerary => 'self_paced_itinerary',
        event => 'event',
        scheduledExperience => 'scheduled_experience',
      };

  int get totalSteps => switch (this) {
        post => 3,
        selfPacedItinerary => 6,
        event => 5,
        scheduledExperience => 5,
      };

  List<String> get stepNames => switch (this) {
        post => ['Basics', 'Media', 'Review'],
        selfPacedItinerary => [
            'Basics',
            'Details',
            'Itinerary',
            'Media',
            'Pricing',
            'Review',
          ],
        event => ['Basics', 'Details', 'Media', 'Pricing', 'Review'],
        scheduledExperience => [
            'Basics',
            'Details',
            'Media',
            'Pricing',
            'Review',
          ],
      };
}

// ── Media Item ─────────────────────────────────────────────────

class MediaItem {
  final String id;
  final String uri;
  final String mimeType;
  final int? width;
  final int? height;

  const MediaItem({
    required this.id,
    required this.uri,
    required this.mimeType,
    this.width,
    this.height,
  });
}

// ── Wizard State ───────────────────────────────────────────────

class WizardState {
  final String? contentId;
  final ContentType contentType;
  final int currentStep;
  final int totalSteps;
  final bool isSaving;
  final bool isDirty;
  final DateTime? lastSavedAt;
  final String? saveError;

  // Content fields
  final String title;
  final String description;
  final String body;
  final String vertical;
  final String? subCategoryId;
  final List<String> tags;
  final String? startingCityId;
  final String? startingCityName;
  final List<String> destinationCityIds;
  final String pricingModel;
  final int pricePaisa;
  final int dayCount;
  final List<MediaItem> media;
  final bool tncAccepted;

  // Discoverability facets (PR 2 — stored on `content.facets` JSONB and
  // sent on `PUT /api/v1/{itineraries,events,content}/:id`). All nullable
  // — the creator may leave them unset.
  final String? season;
  final String? tripStyle;
  final String? audience;

  // Budget range for itineraries (budget | mid_range | luxury)
  final String? budgetRange;

  // Difficulty level for itineraries (easy | moderate | tough)
  final String? difficulty;

  // Inclusions/exclusions (CRT-FR-024) — for experiences and itineraries
  final List<String> inclusions;
  final List<String> exclusions;

  const WizardState({
    this.contentId,
    this.contentType = ContentType.post,
    this.currentStep = 1,
    this.totalSteps = 3,
    this.isSaving = false,
    this.isDirty = false,
    this.lastSavedAt,
    this.saveError,
    this.title = '',
    this.description = '',
    this.body = '',
    this.vertical = '',
    this.subCategoryId,
    this.tags = const [],
    this.startingCityId,
    this.startingCityName,
    this.destinationCityIds = const [],
    this.pricingModel = 'free',
    this.pricePaisa = 0,
    this.dayCount = 1,
    this.media = const [],
    this.tncAccepted = false,
    this.season,
    this.tripStyle,
    this.audience,
    this.budgetRange,
    this.difficulty,
    this.inclusions = const [],
    this.exclusions = const [],
  });

  WizardState copyWith({
    String? contentId,
    ContentType? contentType,
    int? currentStep,
    int? totalSteps,
    bool? isSaving,
    bool? isDirty,
    DateTime? lastSavedAt,
    String? saveError,
    String? title,
    String? description,
    String? body,
    String? vertical,
    bool setSubCategoryId = false,
    String? subCategoryId,
    List<String>? tags,
    bool setStartingCityId = false,
    String? startingCityId,
    bool setStartingCityName = false,
    String? startingCityName,
    List<String>? destinationCityIds,
    String? pricingModel,
    int? pricePaisa,
    int? dayCount,
    List<MediaItem>? media,
    bool? tncAccepted,
    // Facets use an explicit "set this field" flag so we can distinguish
    // "clear to null" from "leave untouched" — the usual `x ?? this.x`
    // dance would collapse those.
    bool setSeason = false,
    String? season,
    bool setTripStyle = false,
    String? tripStyle,
    bool setAudience = false,
    String? audience,
    bool setBudgetRange = false,
    String? budgetRange,
    bool setDifficulty = false,
    String? difficulty,
    List<String>? inclusions,
    List<String>? exclusions,
  }) {
    return WizardState(
      contentId: contentId ?? this.contentId,
      contentType: contentType ?? this.contentType,
      currentStep: currentStep ?? this.currentStep,
      totalSteps: totalSteps ?? this.totalSteps,
      isSaving: isSaving ?? this.isSaving,
      isDirty: isDirty ?? this.isDirty,
      lastSavedAt: lastSavedAt ?? this.lastSavedAt,
      saveError: saveError ?? this.saveError,
      title: title ?? this.title,
      description: description ?? this.description,
      body: body ?? this.body,
      vertical: vertical ?? this.vertical,
      subCategoryId: setSubCategoryId ? subCategoryId : this.subCategoryId,
      tags: tags ?? this.tags,
      startingCityId:
          setStartingCityId ? startingCityId : this.startingCityId,
      startingCityName:
          setStartingCityName ? startingCityName : this.startingCityName,
      destinationCityIds: destinationCityIds ?? this.destinationCityIds,
      pricingModel: pricingModel ?? this.pricingModel,
      pricePaisa: pricePaisa ?? this.pricePaisa,
      dayCount: dayCount ?? this.dayCount,
      media: media ?? this.media,
      tncAccepted: tncAccepted ?? this.tncAccepted,
      season: setSeason ? season : this.season,
      tripStyle: setTripStyle ? tripStyle : this.tripStyle,
      audience: setAudience ? audience : this.audience,
      budgetRange: setBudgetRange ? budgetRange : this.budgetRange,
      difficulty: setDifficulty ? difficulty : this.difficulty,
      inclusions: inclusions ?? this.inclusions,
      exclusions: exclusions ?? this.exclusions,
    );
  }

  /// Whether the current step's requirements are met for advancing.
  bool get canAdvance {
    final errors = validationErrors;
    return errors.isEmpty;
  }

  /// Returns a list of validation error messages for the current step.
  List<String> get validationErrors {
    return switch (contentType) {
      ContentType.post => _postValidationErrors,
      ContentType.selfPacedItinerary => _itineraryValidationErrors,
      ContentType.event => _eventValidationErrors,
      ContentType.scheduledExperience => _experienceValidationErrors,
    };
  }

  List<String> get _postValidationErrors {
    // Step 1 (Basics): title + optional description.
    // Step 2 (Story + Media): body + optional photos + optional location.
    //   Body is required; images/location are optional (text-only posts are
    //   a first-class travel-story format).
    return switch (currentStep) {
      1 => [
          if (title.trim().isEmpty) 'Title is required',
          if (title.trim().length > 100) 'Title must be 100 characters or less',
        ],
      2 => [
          if (body.trim().isEmpty) 'Tell your story before moving on',
        ],
      3 => [
          if (!tncAccepted) 'Accept Terms & Conditions',
        ],
      _ => <String>[],
    };
  }

  List<String> get _itineraryValidationErrors {
    return switch (currentStep) {
      1 => [
          if (subCategoryId == null || subCategoryId!.isEmpty)
            'Select a journey style to continue',
          if (title.trim().length < 5) 'Title must be at least 5 characters',
          if (title.trim().length > 100)
            'Title must be 100 characters or less',
        ],
      2 => <String>[],
      3 => <String>[],
      4 => <String>[],
      5 => <String>[],
      6 => [
          if (!tncAccepted) 'Accept Terms & Conditions',
        ],
      _ => <String>[],
    };
  }

  List<String> get _eventValidationErrors {
    return switch (currentStep) {
      1 => [
          if (title.trim().length < 5) 'Title must be at least 5 characters',
          if (title.trim().length > 100)
            'Title must be 100 characters or less',
        ],
      5 => [
          if (!tncAccepted) 'Accept Terms & Conditions',
        ],
      _ => <String>[],
    };
  }

  List<String> get _experienceValidationErrors {
    return switch (currentStep) {
      1 => [
          if (title.trim().length < 5) 'Title must be at least 5 characters',
          if (title.trim().length > 100)
            'Title must be 100 characters or less',
        ],
      5 => [
          if (!tncAccepted) 'Accept Terms & Conditions',
        ],
      _ => <String>[],
    };
  }

  /// Whether this is the final step.
  bool get isLastStep => currentStep == totalSteps;

  /// Current step name label.
  String get currentStepName {
    final names = contentType.stepNames;
    if (currentStep < 1 || currentStep > names.length) return '';
    return names[currentStep - 1];
  }
}

// ── Provider ───────────────────────────────────────────────────

final wizardProvider =
    NotifierProvider<WizardNotifier, WizardState>(WizardNotifier.new);

// ── Wizard Notifier ────────────────────────────────────────────

class WizardNotifier extends Notifier<WizardState> {
  @override
  WizardState build() {
    return const WizardState();
  }

  /// Initialize the wizard for a given content type and vertical.
  void initWizard(ContentType type, String vertical) {
    state = WizardState(
      contentType: type,
      totalSteps: type.totalSteps,
      vertical: vertical,
      currentStep: 1,
      isDirty: false,
    );
  }

  // ── Field Setters ──────────────────────────────────────────

  void setTitle(String value) {
    state = state.copyWith(title: value, isDirty: true, saveError: null);
  }

  void setDescription(String value) {
    state = state.copyWith(description: value, isDirty: true, saveError: null);
  }

  void setBody(String value) {
    state = state.copyWith(body: value, isDirty: true, saveError: null);
  }

  void setTags(List<String> value) {
    state = state.copyWith(tags: value, isDirty: true, saveError: null);
  }

  void setStartingCity(String? cityId, {String? cityName}) {
    state = state.copyWith(
      setStartingCityId: true,
      startingCityId: cityId,
      setStartingCityName: true,
      startingCityName: cityName,
      isDirty: true,
      saveError: null,
    );
  }

  void clearStartingCity() {
    state = state.copyWith(
      setStartingCityId: true,
      startingCityId: null,
      setStartingCityName: true,
      startingCityName: null,
      isDirty: true,
      saveError: null,
    );
  }

  void setDestinationCities(List<String> cityIds) {
    state = state.copyWith(
      destinationCityIds: cityIds,
      isDirty: true,
      saveError: null,
    );
  }

  void setSubCategory(String? id) {
    state = state.copyWith(
      setSubCategoryId: true,
      subCategoryId: id,
      isDirty: true,
      saveError: null,
    );
  }

  void setDayCount(int days) {
    state = state.copyWith(
      dayCount: days.clamp(1, 30),
      isDirty: true,
      saveError: null,
    );
  }

  void setPricing(String model, int pricePaisa) {
    state = state.copyWith(
      pricingModel: model,
      pricePaisa: model == 'free' ? 0 : pricePaisa,
      isDirty: true,
      saveError: null,
    );
  }

  void setTncAccepted(bool value) {
    state = state.copyWith(tncAccepted: value, isDirty: true, saveError: null);
  }

  // ── Discoverability facets (PR 2) ─────────────────────────

  void setSeason(String? value) {
    state = state.copyWith(
      setSeason: true,
      season: value,
      isDirty: true,
      saveError: null,
    );
  }

  void setTripStyle(String? value) {
    state = state.copyWith(
      setTripStyle: true,
      tripStyle: value,
      isDirty: true,
      saveError: null,
    );
  }

  void setAudience(String? value) {
    state = state.copyWith(
      setAudience: true,
      audience: value,
      isDirty: true,
      saveError: null,
    );
  }

  void setBudgetRange(String? value) {
    state = state.copyWith(
      setBudgetRange: true,
      budgetRange: value,
      isDirty: true,
      saveError: null,
    );
  }

  void setDifficulty(String? value) {
    state = state.copyWith(
      setDifficulty: true,
      difficulty: value,
      isDirty: true,
      saveError: null,
    );
  }

  void setInclusions(List<String> value) {
    state = state.copyWith(
      inclusions: List.unmodifiable(value),
      isDirty: true,
      saveError: null,
    );
  }

  void setExclusions(List<String> value) {
    state = state.copyWith(
      exclusions: List.unmodifiable(value),
      isDirty: true,
      saveError: null,
    );
  }

  // ── Media ──────────────────────────────────────────────────

  void addMedia(MediaItem item) {
    final maxMedia = state.contentType == ContentType.post ? 5 : 10;
    if (state.media.length >= maxMedia) return;
    state = state.copyWith(
      media: [...state.media, item],
      isDirty: true,
      saveError: null,
    );
  }

  void removeMedia(String id) {
    state = state.copyWith(
      media: state.media.where((m) => m.id != id).toList(),
      isDirty: true,
      saveError: null,
    );
  }

  void reorderMedia(List<String> orderedIds) {
    final reordered = <MediaItem>[];
    for (final id in orderedIds) {
      final item = state.media.where((m) => m.id == id).firstOrNull;
      if (item != null) reordered.add(item);
    }
    state = state.copyWith(
      media: reordered,
      isDirty: true,
      saveError: null,
    );
  }

  // ── Navigation ─────────────────────────────────────────────

  /// Advance to the next step if validation passes.
  void nextStep() {
    if (!state.canAdvance) return;
    if (state.currentStep >= state.totalSteps) return;
    state = state.copyWith(currentStep: state.currentStep + 1);
  }

  /// Go back to the previous step.
  void prevStep() {
    if (state.currentStep <= 1) return;
    state = state.copyWith(currentStep: state.currentStep - 1);
  }

  /// Jump to a specific step (1-based).
  void goToStep(int step) {
    if (step < 1 || step > state.totalSteps) return;
    state = state.copyWith(currentStep: step);
  }

  // ── Save Status ────────────────────────────────────────────

  void markSaving() {
    state = state.copyWith(isSaving: true, saveError: null);
  }

  void markSaved() {
    state = state.copyWith(
      isSaving: false,
      isDirty: false,
      lastSavedAt: DateTime.now(),
      saveError: null,
    );
  }

  void markSaveError(String error) {
    state = state.copyWith(isSaving: false, saveError: error);
  }

  void setContentId(String id) {
    state = state.copyWith(contentId: id);
  }
}
