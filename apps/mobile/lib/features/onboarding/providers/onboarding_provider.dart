import 'package:flutter_riverpod/flutter_riverpod.dart';

// ── Onboarding State ───────────────────────────────────────────

/// Tracks progress through the onboarding flow:
/// profile=1 → location=2 → verticals=3 → creators=4 → celebration=5.
/// Profile step (E0.4c T3a) adds username/firstName/email capture after
/// phone signup. OAuth signups may pre-fill firstName and email.
class OnboardingState {
  final int currentStep;

  // Profile bootstrap (A2c)
  final String? username;
  final bool usernameAvailable;
  final String? firstName;
  final String? email;
  final bool emailVerified;

  // Location (A3)
  final String? selectedCityId;
  final String? selectedCityName;

  // Verticals (A4)
  final List<String> selectedVerticals;

  // Creators (A5)
  final Set<String> followedCreatorIds;

  final bool isCompleted;

  const OnboardingState({
    this.currentStep = 1,
    this.username,
    this.usernameAvailable = false,
    this.firstName,
    this.email,
    this.emailVerified = false,
    this.selectedCityId,
    this.selectedCityName,
    this.selectedVerticals = const [],
    this.followedCreatorIds = const {},
    this.isCompleted = false,
  });

  OnboardingState copyWith({
    int? currentStep,
    String? username,
    bool? usernameAvailable,
    String? firstName,
    String? email,
    bool? emailVerified,
    String? selectedCityId,
    String? selectedCityName,
    List<String>? selectedVerticals,
    Set<String>? followedCreatorIds,
    bool? isCompleted,
  }) {
    return OnboardingState(
      currentStep: currentStep ?? this.currentStep,
      username: username ?? this.username,
      usernameAvailable: usernameAvailable ?? this.usernameAvailable,
      firstName: firstName ?? this.firstName,
      email: email ?? this.email,
      emailVerified: emailVerified ?? this.emailVerified,
      selectedCityId: selectedCityId ?? this.selectedCityId,
      selectedCityName: selectedCityName ?? this.selectedCityName,
      selectedVerticals: selectedVerticals ?? this.selectedVerticals,
      followedCreatorIds: followedCreatorIds ?? this.followedCreatorIds,
      isCompleted: isCompleted ?? this.isCompleted,
    );
  }

  /// Whether the current step's requirements are met for advancing.
  /// Step 1: profile needs unique username + firstName (email optional).
  /// Step 2: location needs a city.
  /// Step 3: verticals needs min 3.
  /// Step 4: creators — always optional.
  bool get canAdvance {
    return switch (currentStep) {
      1 =>
        (username?.isNotEmpty ?? false) &&
            usernameAvailable &&
            (firstName?.trim().isNotEmpty ?? false),
      2 => selectedCityId != null && selectedCityName != null,
      3 => selectedVerticals.length >= 3,
      4 => true,
      5 => true,
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
  OnboardingState build() => const OnboardingState();

  /// Prefill from OAuth identity (Google/Apple) on first signup.
  void prefillFromOAuth({String? firstName, String? email}) {
    state = state.copyWith(
      firstName: firstName ?? state.firstName,
      email: email ?? state.email,
      // OAuth emails are considered verified (provider-asserted).
      emailVerified: email != null ? true : state.emailVerified,
    );
  }

  void setUsername(String value, {bool? available}) {
    state = state.copyWith(
      username: value,
      usernameAvailable: available ?? false,
    );
  }

  void setFirstName(String value) {
    state = state.copyWith(firstName: value);
  }

  void setEmail(String? value) {
    state = state.copyWith(
      email: value,
      emailVerified: false, // re-verify on change
    );
  }

  void markEmailVerified() {
    state = state.copyWith(emailVerified: true);
  }

  /// Set the user's city (A3).
  void setCity(String id, String name) {
    state = state.copyWith(selectedCityId: id, selectedCityName: name);
  }

  /// Set selected verticals. Validates that at least 3 are chosen.
  void setVerticals(List<String> verticals) {
    if (verticals.length < 3) return;
    state = state.copyWith(selectedVerticals: verticals);
  }

  /// Toggle a creator follow.
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
