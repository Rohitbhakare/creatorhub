import 'dart:io';

/// Staging API client used by [GlobalHooks] to set up and tear down
/// transient test data (content created during a scenario).
///
/// Uses the Supabase service-role key (from env) so it bypasses RLS
/// and can delete any row regardless of ownership.
///
/// NEVER import this file from production app code.
abstract final class ApiHelper {
  static final _client = HttpClient();
  static final _baseUrl = const String.fromEnvironment(
    'STAGING_API_URL',
    defaultValue: 'http://localhost:3001',
  );
  static final _serviceKey = const String.fromEnvironment(
    'SUPABASE_SERVICE_ROLE_KEY',
    defaultValue: '',
  );

  /// Delete all content rows tagged with [testRunId] in their metadata.
  /// Called in [GlobalHooks.onAfterScenario] to keep staging clean.
  static Future<void> cleanupScenario(String? testRunId) async {
    if (testRunId == null || _serviceKey.isEmpty) return;
    // TODO(T4): implement DELETE /api/v1/test/cleanup?run_id={testRunId}
    // with Authorization: Bearer {_serviceKey}
  }

  /// Cancel a booking by ID. Used to clean up booking scenarios.
  static Future<void> cancelBooking(String bookingId) async {
    // TODO(T4): implement
  }

  /// Fill a seed experience to capacity by creating N bookings.
  /// Used in "Sold Out" scenario setup.
  static Future<void> fillExperienceCapacity(String experienceId, int slots) async {
    // TODO(T4): implement
  }

  static void dispose() => _client.close();
}
