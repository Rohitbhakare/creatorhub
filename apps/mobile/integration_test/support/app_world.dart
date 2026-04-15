/// Per-scenario mutable state bag.
///
/// Passed to step functions that need to share data within one scenario
/// (e.g. recording a like count before an action and asserting the delta after).
/// Create a fresh instance at the start of each [patrolTest] closure.
class ScenarioState {
  /// Which test persona is currently logged in.
  /// Values: 'traveler', 'creator', 'unkyc_creator', 'booker'.
  String? currentPersona;

  /// Captured integer values for before/after delta assertions.
  int? recordedLikeCount;
  int? recordedFollowerCount;
  int? recordedListItemCount;

  /// IDs captured during a scenario.
  String? capturedBookingId;
  String? capturedPostId;

  /// Arbitrary state bag for step functions that need to pass data forward.
  final Map<String, dynamic> bag = {};
}
