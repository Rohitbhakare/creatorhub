import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:patrol/patrol.dart';

import '../support/api_helper.dart';

/// Clear all persisted auth tokens before a scenario runs.
///
/// Call this at the start of every [patrolTest] that needs a clean auth state.
/// Scenarios that share a background "Given the app is launched" implicitly
/// call this via [bootstrapApp] which will land on the welcome/auth screen.
Future<void> beforeScenario(PatrolIntegrationTester $) async {
  const storage = FlutterSecureStorage();
  await storage.deleteAll();
  await $.tester.pumpAndSettle();
}

/// Delete content and bookings created during a scenario.
///
/// Pass the scenario's unique [runId] (set via dart-define in CI) so the
/// staging DB cleanup endpoint knows which rows to delete.
/// Safe to call with a null [runId] — it becomes a no-op.
Future<void> afterScenario({String? runId}) async {
  await ApiHelper.cleanupScenario(runId);
}
