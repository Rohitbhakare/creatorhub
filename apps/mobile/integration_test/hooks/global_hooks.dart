import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:patrol/patrol.dart';

import '../support/api_helper.dart';
import '../support/emulator_helper.dart';

/// Clear all persisted auth tokens and stale emulator codes before a scenario.
///
/// Clearing emulator codes prevents the wrong code from being returned by
/// EmulatorHelper.getLatestOtp() when multiple scenarios run in sequence.
Future<void> beforeScenario(PatrolIntegrationTester $) async {
  const storage = FlutterSecureStorage();
  await storage.deleteAll();
  await EmulatorHelper.clearVerificationCodes();
  // No pump here — the app hasn't been bootstrapped yet.
  // bootstrapApp() is the first action in each test.
}

/// Delete content and bookings created during a scenario.
///
/// Pass the scenario's unique [runId] (set via dart-define in CI) so the
/// staging DB cleanup endpoint knows which rows to delete.
/// Safe to call with a null [runId] — it becomes a no-op.
Future<void> afterScenario({String? runId}) async {
  await ApiHelper.cleanupScenario(runId);
}
