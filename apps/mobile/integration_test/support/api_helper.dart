import 'dart:io';

/// Staging API client used by [afterScenario] to tear down
/// transient test data created during a scenario.
///
/// Uses the Supabase service-role key (from env) so it bypasses RLS
/// and can delete any row regardless of ownership.
///
/// NEVER import this file from production app code.
abstract final class ApiHelper {
  static final _client = HttpClient();
  static const _serviceKey = String.fromEnvironment(
    'SUPABASE_SERVICE_ROLE_KEY',
    defaultValue: '',
  );

  /// Delete all content rows tagged with [testRunId] in their metadata.
  /// Called in [afterScenario] to keep the staging DB clean.
  static Future<void> cleanupScenario(String? testRunId) async {
    if (testRunId == null || _serviceKey.isEmpty) return;
    // TODO(T4): implement DELETE /api/v1/test/cleanup?run_id={testRunId}
    // with Authorization: Bearer {_serviceKey}
  }

  /// Cancel a booking by ID. Used to clean up booking scenarios.
  static Future<void> cancelBooking(String bookingId) async {
    // TODO(T4): implement
  }

  static void dispose() => _client.close();
}
