import 'package:flutter_riverpod/flutter_riverpod.dart';

// ── Onboarding State ───────────────────────────────────────────

/// Tracks progress through the 5-step onboarding flow:
/// location=1, verticals=2, creators=3, celebration=4, done=5.
class OnboardingState {
  final int currentStep;
  final String? selectedCityId;
  final String? selectedCityName;
  final List<String> selectedVerticals;
  final Set<String> followedCreatorIds;
  final bool isCompleted;

  const OnboardingState({
    this.currentStep = 1,
    this.selectedCityId,
    this.selectedCityName,
    this.selectedVerticals = const [],
    this.followedCreatorIds = const {},
    this.isCompleted = false,
  });

  OnboardingState copyWith({
    int? currentStep,
    String? selectedCityId,
    String? selectedCityName,
    List<String>? selectedVerticals,
    Set<String>? followedCreatorIds,
    bool? isCompleted,
  }) {
    return OnboardingState(
      currentStep: currentStep ?? this.currentStep,
      selectedCityId: selectedCityId ?? this.selectedCityId,
      selectedCityName: selectedCityName ?? this.selectedCityName,
      selectedVerticals: selectedVerticals ?? this.selectedVerticals,
      followedCreatorIds: followedCreatorIds ?? this.followedCreatorIds,
      isCompleted: isCompleted ?? this.isCompleted,
    );
  }

  /// Whether the current step's requirements are met for advancing.
  bool get canAdvance {
    return switch (currentStep) {
      1 => selectedCityId != null && selectedCityName != null,
      2 => selectedVerticals.length >= 3,
      3 => true, // following creators is optional
      4 => true, // celebration step — always can advance
      _ => false,
    };
  }
}

// ── Provider ───────────────────────────────────────────────────

final onboardingProvider =
    NotifierProvider<OnboardingNotifier, OnboardingState>(
  OnboardingNotifier.new,
);

// ── Onboarding Notifier ────────────────────────────────────────

class OnboardingNotifier extends Notifier<OnboardingState> {
  @override
  OnboardingState build() {
    return const OnboardingState();
  }

  /// Set the user's city.
  void setCity(String id, String name) {
    state = state.copyWith(
      selectedCityId: id,
      selectedCityName: name,
    );
  }

  /// Set selected verticals. Validates that at least 3 are chosen.
  void setVerticals(List<String> verticals) {
    if (verticals.length < 3) return;
    state = state.copyWith(selectedVerticals: verticals);
  }

  /// Toggle a creator follow. Adds if not present, removes if present.
  void toggleFollow(String creatorId) {
    final updated = Set<String>.from(state.followedCreatorIds);
    if (updated.contains(creatorId)) {
      updated.remove(creatorId);
    } else {
      updated.add(creatorId);
    }
    state = state.copyWith(followedCreatorIds: updated);
  }

  /// Advance to the next step. Only advances if current step can proceed.
  void advanceStep() {
    if (!state.canAdvance) return;
    if (state.currentStep >= 5) return;
    state = state.copyWith(currentStep: state.currentStep + 1);
  }

  /// Go back to the previous step. Minimum is step 1.
  void goBack() {
    if (state.currentStep <= 1) return;
    state = state.copyWith(currentStep: state.currentStep - 1);
  }

  /// Mark onboarding as completed (step 5).
  void completeOnboarding() {
    state = state.copyWith(currentStep: 5, isCompleted: true);
  }
}
