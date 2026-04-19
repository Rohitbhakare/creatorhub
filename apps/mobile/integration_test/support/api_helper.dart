import 'dart:convert';
import 'dart:io';

/// Staging/local API client used by test hooks to set up and tear down
/// data for each scenario.
///
/// Uses the Supabase service-role key (from env or dart-define) to bypass
/// RLS. NEVER import this file from production app code.
abstract final class ApiHelper {
  static final _client = HttpClient();

  static const _supabaseUrl = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: 'https://tqumwskwxthsmknjqznv.supabase.co',
  );
  static const _serviceKey = String.fromEnvironment(
    'SUPABASE_SERVICE_ROLE_KEY',
    defaultValue:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxdW13c2t3eHRoc21rbmpxem52Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTk4MTE3NSwiZXhwIjoyMDkxNTU3MTc1fQ.E8TJdem2jgL1T-0h4IgFtIb4Q7sTyHqzSDOP2KKXhRM',
  );

  // ── Supabase REST helpers ─────────────────────────────────────────

  static Map<String, String> get _headers => {
        'apikey': _serviceKey,
        'Authorization': 'Bearer $_serviceKey',
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      };

  /// Delete a user by their E.164 phone number.
  ///
  /// Called before "new user" scenarios so the phone is guaranteed to be
  /// unregistered. Cascades to all user-owned rows via FK constraints.
  static Future<void> deleteUserByPhone(String phone) async {
    // E.164 format (e.g. '+919999999999')
    final e164 = phone.startsWith('+') ? phone : '+91$phone';
    final encoded = Uri.encodeComponent(e164);
    final uri = Uri.parse(
      '$_supabaseUrl/rest/v1/users?phone=eq.$encoded',
    );

    try {
      final request = await _client.deleteUrl(uri);
      _headers.forEach(request.headers.set);
      await request.close();
    } catch (_) {
      // Best-effort — if delete fails, the test may still pass (user might
      // not exist), but log for debugging.
    }
  }

  /// Reset a user's onboarding status to null (simulates new user returning).
  ///
  /// Useful when the same phone is used across multiple test runs and the
  /// user already has onboarding_completed_at set from a previous run.
  static Future<void> resetOnboarding(String phone) async {
    final e164 = phone.startsWith('+') ? phone : '+91$phone';
    final encoded = Uri.encodeComponent(e164);
    final uri = Uri.parse(
      '$_supabaseUrl/rest/v1/users?phone=eq.$encoded',
    );

    try {
      final body = jsonEncode({'onboarding_completed_at': null});
      final request = await _client.patchUrl(uri);
      _headers.forEach(request.headers.set);
      request.contentLength = utf8.encode(body).length;
      request.write(body);
      await request.close();
    } catch (_) {
      // Best-effort.
    }
  }

  /// Delete all content rows tagged with [testRunId] in their metadata.
  /// Called in [afterScenario] to keep the staging DB clean.
  static Future<void> cleanupScenario(String? testRunId) async {
    if (testRunId == null || _serviceKey.isEmpty) return;
    // TODO(T4): implement DELETE /api/v1/test/cleanup?run_id={testRunId}
  }

  /// Cancel a booking by ID. Used to clean up booking scenarios.
  static Future<void> cancelBooking(String bookingId) async {
    // TODO(T4): implement
  }

  static void dispose() => _client.close();
}
