import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Secure token storage using platform keychain/keystore.
/// Tokens are encrypted at rest by the OS.
class SecureStorage {
  static const _accessTokenKey = 'access_token';
  static const _refreshTokenKey = 'refresh_token';
  static const _userIdKey = 'user_id';

  final FlutterSecureStorage _storage;

  SecureStorage()
      : _storage = const FlutterSecureStorage(
          iOptions: IOSOptions(
            accessibility: KeychainAccessibility.first_unlock_this_device,
          ),
        );

  // ── Access Token ────────────────────────────────────────────
  Future<String?> getAccessToken() => _storage.read(key: _accessTokenKey);

  Future<void> setAccessToken(String token) =>
      _storage.write(key: _accessTokenKey, value: token);

  // ── Refresh Token ───────────────────────────────────────────
  Future<String?> getRefreshToken() => _storage.read(key: _refreshTokenKey);

  Future<void> setRefreshToken(String token) =>
      _storage.write(key: _refreshTokenKey, value: token);

  // ── User ID ─────────────────────────────────────────────────
  Future<String?> getUserId() => _storage.read(key: _userIdKey);

  Future<void> setUserId(String userId) =>
      _storage.write(key: _userIdKey, value: userId);

  // ── Token Pair ──────────────────────────────────────────────
  Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
    required String userId,
  }) async {
    await Future.wait([
      setAccessToken(accessToken),
      setRefreshToken(refreshToken),
      setUserId(userId),
    ]);
  }

  // ── Clear All ───────────────────────────────────────────────
  Future<void> clearAll() => _storage.deleteAll();

  /// Check if tokens exist (for initial auth state check)
  Future<bool> hasTokens() async {
    final token = await getAccessToken();
    return token != null && token.isNotEmpty;
  }
}
