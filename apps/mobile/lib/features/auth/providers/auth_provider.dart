import 'dart:async' show unawaited;

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/auth_service.dart';
import '../services/secure_storage.dart';
import '../../saved/services/local_save_store.dart';

// ── Auth State ──────────────────────────────────────────────────

enum AuthStatus { loading, authenticated, unauthenticated, guest }

class AuthState {
  final AuthStatus status;
  final Map<String, dynamic>? user;
  final String? error;

  const AuthState({
    this.status = AuthStatus.loading,
    this.user,
    this.error,
  });

  AuthState copyWith({
    AuthStatus? status,
    Map<String, dynamic>? user,
    String? error,
  }) {
    return AuthState(
      status: status ?? this.status,
      user: user ?? this.user,
      error: error,
    );
  }

  bool get isAuthenticated => status == AuthStatus.authenticated;
  bool get isGuest => status == AuthStatus.guest;
  bool get isLoading => status == AuthStatus.loading;
}

// ── Providers ───────────────────────────────────────────────────

final authServiceProvider = Provider<AuthService>((ref) {
  const baseUrl = 'http://192.168.1.3:3001';
  return AuthService(baseUrl: baseUrl);
});

final secureStorageProvider = Provider<SecureStorage>((ref) {
  return SecureStorage();
});

final authProvider =
    NotifierProvider<AuthNotifier, AuthState>(AuthNotifier.new);

// ── Auth Notifier ───────────────────────────────────────────────

class AuthNotifier extends Notifier<AuthState> {
  late final AuthService _authService;

  @override
  AuthState build() {
    _authService = ref.read(authServiceProvider);
    _checkAuthState();
    return const AuthState();
  }

  /// Check stored tokens on app launch.
  Future<void> _checkAuthState() async {
    try {
      final hasTokens = await _authService.storage.hasTokens();
      if (!hasTokens) {
        state = state.copyWith(status: AuthStatus.unauthenticated);
        return;
      }

      // Try to refresh tokens silently
      await _authService.refreshTokens();

      // Fetch user profile
      final response = await _authService.dio.get('/api/v1/users/me');
      final responseData = response.data as Map<String, dynamic>;

      state = AuthState(
        status: AuthStatus.authenticated,
        user: responseData['data'] as Map<String, dynamic>,
      );
    } catch (_) {
      // Token refresh failed — user must re-authenticate
      await _authService.storage.clearAll();
      state = state.copyWith(status: AuthStatus.unauthenticated);
    }
  }

  /// Send OTP to phone number.
  /// Does NOT change auth status — user is still unauthenticated until OTP is verified.
  Future<String> sendOtp(String phoneNumber) async {
    try {
      return await _authService.sendOtp(phoneNumber);
    } catch (e) {
      state = state.copyWith(
        status: AuthStatus.unauthenticated,
        error: e.toString(),
      );
      rethrow;
    }
  }

  /// Verify OTP and complete registration.
  Future<void> verifyOtp(String verificationId, String otp) async {
    state = state.copyWith(status: AuthStatus.loading, error: null);
    try {
      final data = await _authService.verifyOtp(verificationId, otp);
      state = AuthState(
        status: AuthStatus.authenticated,
        user: data['user'] as Map<String, dynamic>,
      );
      unawaited(_transferGuestSaves());
    } catch (e) {
      state = state.copyWith(
        status: AuthStatus.unauthenticated,
        error: _formatAuthError(e),
      );
      rethrow;
    }
  }

  /// Sign in with Google.
  Future<void> signInWithGoogle() async {
    state = state.copyWith(status: AuthStatus.loading, error: null);
    try {
      final data = await _authService.signInWithGoogle();
      state = AuthState(
        status: AuthStatus.authenticated,
        user: data['user'] as Map<String, dynamic>,
      );
      unawaited(_transferGuestSaves());
    } catch (e) {
      state = state.copyWith(
        status: AuthStatus.unauthenticated,
        error: _formatAuthError(e),
      );
      rethrow;
    }
  }

  /// Sign in with Apple.
  Future<void> signInWithApple() async {
    state = state.copyWith(status: AuthStatus.loading, error: null);
    try {
      final data = await _authService.signInWithApple();
      state = AuthState(
        status: AuthStatus.authenticated,
        user: data['user'] as Map<String, dynamic>,
      );
      unawaited(_transferGuestSaves());
    } catch (e) {
      state = state.copyWith(
        status: AuthStatus.unauthenticated,
        error: _formatAuthError(e),
      );
      rethrow;
    }
  }

  /// Move any device-local guest saves (SOC-FR-004) to the server's default
  /// list, then clear local storage. Best-effort — individual failures are
  /// swallowed so a partial network issue can't block the auth flow.
  Future<void> _transferGuestSaves() async {
    final store = LocalSaveStore();
    final entries = await store.drain();
    if (entries.isEmpty) return;

    for (final entry in entries) {
      try {
        await _authService.dio.post(
          '/api/v1/content/${entry.id}/save',
          data: {'list_ids': <String>[]},
        );
      } catch (e) {
        if (kDebugMode) debugPrint('[auth] guest save transfer failed for ${entry.id}: $e');
      }
    }
    await store.clear();
  }

  /// Enter guest mode.
  void enterGuestMode() {
    state = const AuthState(status: AuthStatus.guest);
  }

  /// Sign out.
  Future<void> signOut() async {
    await _authService.signOut();
    state = const AuthState(status: AuthStatus.unauthenticated);
  }

  /// Update user data after profile changes.
  void updateUser(Map<String, dynamic> user) {
    state = state.copyWith(user: user);
  }

  String _formatAuthError(dynamic error) {
    final msg = error.toString();
    if (msg.contains('invalid-verification-code')) return 'Invalid OTP code';
    if (msg.contains('too-many-requests')) {
      return 'Too many attempts. Try again later.';
    }
    if (msg.contains('network')) return 'Network error. Check your connection.';
    if (msg.contains('cancelled')) return '';
    return 'Something went wrong. Please try again.';
  }
}
