import 'dart:convert';
import 'dart:io';

/// Helper for Firebase Auth Emulator in integration tests.
///
/// The Auth Emulator generates random OTP codes — NOT '123456'.
/// This helper fetches the actual generated code from the emulator's
/// admin API so tests can enter the correct OTP without hardcoding it.
///
/// NEVER import this in production app code.
abstract final class EmulatorHelper {
  static const _emulatorHost = 'localhost';
  static const _emulatorPort = 9099;
  static const _projectId = 'guideguide-b0a19';

  static final _client = HttpClient();

  /// Return the most recent OTP code generated for [phone].
  ///
  /// [phone] must be in E.164 format, e.g. '+919090909090'.
  ///
  /// Returns null if the emulator is unreachable or no code exists for
  /// the given phone number.
  static Future<String?> getLastOtpForPhone(String phone) async {
    try {
      final uri = Uri.http(
        '$_emulatorHost:$_emulatorPort',
        '/emulator/v1/projects/$_projectId/verificationCodes',
      );

      final request = await _client.getUrl(uri);
      final response = await request.close();

      if (response.statusCode != 200) return null;

      final body = await response.transform(utf8.decoder).join();
      final json = jsonDecode(body) as Map<String, dynamic>;
      final codes = json['verificationCodes'] as List<dynamic>?;

      if (codes == null || codes.isEmpty) return null;

      // The list is chronological — iterate in reverse to get the latest
      // code for this phone number.
      for (final entry in codes.reversed) {
        final map = entry as Map<String, dynamic>;
        if (map['phoneNumber'] == phone) {
          return map['code'] as String?;
        }
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  /// Return the most recent OTP code regardless of phone number.
  ///
  /// Useful when the phone number isn't available at call site.
  /// Falls back to null if the emulator is unreachable.
  static Future<String?> getLatestOtp() async {
    try {
      final uri = Uri.http(
        '$_emulatorHost:$_emulatorPort',
        '/emulator/v1/projects/$_projectId/verificationCodes',
      );

      final request = await _client.getUrl(uri);
      final response = await request.close();

      if (response.statusCode != 200) return null;

      final body = await response.transform(utf8.decoder).join();
      final json = jsonDecode(body) as Map<String, dynamic>;
      final codes = json['verificationCodes'] as List<dynamic>?;

      if (codes == null || codes.isEmpty) return null;

      // Last entry is the most recently generated code.
      final last = codes.last as Map<String, dynamic>;
      return last['code'] as String?;
    } catch (_) {
      return null;
    }
  }

  /// Clear all verification codes from the emulator.
  ///
  /// The Firebase Auth Emulator does not support DELETE on the
  /// verificationCodes endpoint. This method is a no-op but kept for
  /// API compatibility. Stale codes are harmless because the helpers use
  /// phone-specific lookups (getLastOtpForPhone) and phone trackers in
  /// auth_steps (_lastEnteredPhone) to always return the correct code.
  static Future<void> clearVerificationCodes() async {
    // No-op: emulator REST API does not support clearing verification codes.
  }

  static void dispose() => _client.close();
}
