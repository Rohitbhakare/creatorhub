import 'dart:async';
import 'package:dio/dio.dart';
import 'package:firebase_auth/firebase_auth.dart' as fb;
import 'package:google_sign_in/google_sign_in.dart';
import 'dart:io' show Platform;
import 'secure_storage.dart';

/// API client for authentication endpoints.
/// Handles Firebase auth, API registration, and token management.
class AuthService {
  final Dio _dio;
  final SecureStorage _storage;
  final fb.FirebaseAuth? _firebaseAuth;

  // Mutex for token refresh to prevent concurrent refresh calls
  Completer<void>? _refreshLock;

  /// Safely get FirebaseAuth.instance — returns null if Firebase isn't initialized.
  static fb.FirebaseAuth? _safeFirebaseInstance() {
    try {
      return fb.FirebaseAuth.instance;
    } catch (_) {
      return null;
    }
  }

  /// Throws a clear error when Firebase isn't initialized.
  fb.FirebaseAuth get _auth {
    if (_firebaseAuth == null) {
      throw Exception(
        'Firebase is not initialized. Add GoogleService-Info.plist (iOS) '
        'or google-services.json (Android) to enable authentication.',
      );
    }
    return _firebaseAuth;
  }

  AuthService({
    required String baseUrl,
    SecureStorage? storage,
    fb.FirebaseAuth? firebaseAuth,
  })  : _storage = storage ?? SecureStorage(),
        _firebaseAuth = firebaseAuth ?? _safeFirebaseInstance(),
        _dio = Dio(BaseOptions(
          baseUrl: baseUrl,
          connectTimeout: const Duration(seconds: 10),
          receiveTimeout: const Duration(seconds: 10),
          headers: {'Content-Type': 'application/json'},
        )) {
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        // Attach Bearer token to all API requests (except auth endpoints)
        if (!options.path.contains('/auth/')) {
          final token = await _storage.getAccessToken();
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
        }
        handler.next(options);
      },
      onError: (error, handler) async {
        // Auto-refresh on 401
        if (error.response?.statusCode == 401 &&
            !error.requestOptions.path.contains('/auth/')) {
          try {
            await refreshTokens();
            // Retry the original request
            final token = await _storage.getAccessToken();
            error.requestOptions.headers['Authorization'] = 'Bearer $token';
            final response = await _dio.fetch(error.requestOptions);
            handler.resolve(response);
            return;
          } catch (_) {
            // Refresh failed — propagate the original error
          }
        }
        handler.next(error);
      },
    ));
  }

  // ── Phone OTP ─────────────────────────────────────────────────

  /// Send OTP to phone number via Firebase.
  /// Returns verificationId for OTP verification.
  Future<String> sendOtp(String phoneNumber) async {
    final completer = Completer<String>();

    await _auth.verifyPhoneNumber(
      phoneNumber: '+91$phoneNumber',
      timeout: const Duration(seconds: 60),
      verificationCompleted: (fb.PhoneAuthCredential credential) async {
        // Auto-verification (Android only)
        await _auth.signInWithCredential(credential);
        if (!completer.isCompleted) {
          completer.complete('auto');
        }
      },
      verificationFailed: (fb.FirebaseAuthException e) {
        if (!completer.isCompleted) {
          completer.completeError(e.message ?? 'OTP verification failed');
        }
      },
      codeSent: (String verificationId, int? resendToken) {
        if (!completer.isCompleted) {
          completer.complete(verificationId);
        }
      },
      codeAutoRetrievalTimeout: (String verificationId) {
        // Timeout is not an error — user can still enter OTP manually
      },
    );

    return completer.future;
  }

  /// Verify OTP and sign in with Firebase, then register with our API.
  Future<Map<String, dynamic>> verifyOtp(
    String verificationId,
    String otp,
  ) async {
    final credential = fb.PhoneAuthProvider.credential(
      verificationId: verificationId,
      smsCode: otp,
    );

    final userCredential =
        await _auth.signInWithCredential(credential);
    return _registerWithApi(userCredential);
  }

  // ── Social Login ──────────────────────────────────────────────

  /// Sign in with Google.
  Future<Map<String, dynamic>> signInWithGoogle() async {
    final googleSignIn = GoogleSignIn.instance;

    // Use the full interactive authenticate flow
    final GoogleSignInAccount googleUser;
    try {
      googleUser = await googleSignIn.authenticate();
    } on GoogleSignInException catch (e) {
      if (e.code == GoogleSignInExceptionCode.canceled) {
        throw Exception('Google sign-in cancelled');
      }
      rethrow;
    }

    final idToken = googleUser.authentication.idToken;
    if (idToken == null) {
      throw Exception('Failed to get Google ID token');
    }

    final credential = fb.GoogleAuthProvider.credential(idToken: idToken);

    final userCredential =
        await _auth.signInWithCredential(credential);
    return _registerWithApi(userCredential);
  }

  /// Sign in with Apple (iOS only).
  Future<Map<String, dynamic>> signInWithApple() async {
    final appleProvider = fb.AppleAuthProvider()
      ..addScope('email')
      ..addScope('name');

    final userCredential =
        await _auth.signInWithProvider(appleProvider);
    return _registerWithApi(userCredential);
  }

  // ── API Registration ──────────────────────────────────────────

  Future<Map<String, dynamic>> _registerWithApi(
    fb.UserCredential userCredential,
  ) async {
    final idToken = await userCredential.user?.getIdToken();
    if (idToken == null) throw Exception('Failed to get Firebase ID token');

    final platform = Platform.isIOS ? 'ios' : 'android';

    final response = await _dio.post('/api/v1/auth/register', data: {
      'firebase_token': idToken,
      'device_info': {
        'platform': platform,
      },
    });

    final responseData = response.data as Map<String, dynamic>;
    final data = responseData['data'] as Map<String, dynamic>;
    final tokens = data['tokens'] as Map<String, dynamic>;
    final user = data['user'] as Map<String, dynamic>;

    // Store tokens securely
    await _storage.saveTokens(
      accessToken: tokens['access_token'] as String,
      refreshToken: tokens['refresh_token'] as String,
      userId: user['id'] as String,
    );

    return data;
  }

  // ── Token Management ──────────────────────────────────────────

  /// Refresh access + refresh tokens.
  /// Uses a mutex to prevent concurrent refresh calls.
  Future<void> refreshTokens() async {
    // If a refresh is already in progress, wait for it
    if (_refreshLock != null) {
      await _refreshLock!.future;
      return;
    }

    _refreshLock = Completer<void>();

    try {
      final refreshToken = await _storage.getRefreshToken();
      if (refreshToken == null) throw Exception('No refresh token');

      final response = await _dio.post('/api/v1/auth/refresh', data: {
        'refresh_token': refreshToken,
      });

      final responseData = response.data as Map<String, dynamic>;
      final tokens = responseData['data'] as Map<String, dynamic>;
      final userId = await _storage.getUserId();

      await _storage.saveTokens(
        accessToken: tokens['access_token'] as String,
        refreshToken: tokens['refresh_token'] as String,
        userId: userId ?? '',
      );

      _refreshLock!.complete();
    } catch (e) {
      _refreshLock!.completeError(e);
      // Clear tokens on refresh failure — force re-login
      await _storage.clearAll();
      rethrow;
    } finally {
      _refreshLock = null;
    }
  }

  // ── Sign Out ──────────────────────────────────────────────────

  Future<void> signOut() async {
    try {
      final accessToken = await _storage.getAccessToken();
      final refreshToken = await _storage.getRefreshToken();

      if (accessToken != null) {
        await _dio.post(
          '/api/v1/auth/sign-out',
          data:
              refreshToken != null ? {'refresh_token': refreshToken} : null,
          options: Options(
            headers: {'Authorization': 'Bearer $accessToken'},
          ),
        );
      }
    } catch (_) {
      // Sign out is best-effort — always clear local state
    }

    await _auth.signOut();
    await _storage.clearAll();
  }

  // ── Getters ───────────────────────────────────────────────────

  Dio get dio => _dio;
  SecureStorage get storage => _storage;
}
