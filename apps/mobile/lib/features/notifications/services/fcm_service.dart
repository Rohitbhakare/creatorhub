import 'dart:io';

import 'package:dio/dio.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';

/// Firebase Cloud Messaging service.
///
/// Call [FcmService.initialize] once after the user is authenticated.
/// Handles permission request, token registration, token refresh,
/// and foreground message logging (M1 — no local notification display yet).
class FcmService {
  FcmService._();

  static bool _initialized = false;

  /// Initialize FCM — safe to call multiple times (idempotent).
  static Future<void> initialize(Dio dio) async {
    if (_initialized) return;

    try {
      // 1. Request permission
      final settings = await FirebaseMessaging.instance.requestPermission(
        alert: true,
        badge: true,
        sound: true,
      );

      if (settings.authorizationStatus == AuthorizationStatus.denied) {
        debugPrint('[FCM] Permission denied — skipping token registration');
        return;
      }

      // iOS Simulator never receives an APNS token (Apple platform limitation).
      // Skip FCM token fetch silently instead of letting it throw inside
      // getToken() and produce a noisy error log on every cold start.
      if (Platform.isIOS) {
        final apnsToken = await FirebaseMessaging.instance.getAPNSToken();
        if (apnsToken == null) {
          debugPrint('[FCM] APNS token unavailable (simulator) — skipping');
          return;
        }
      }

      // 2. Get token
      final token = await FirebaseMessaging.instance.getToken();
      if (token == null) {
        debugPrint('[FCM] Token is null — cannot register device');
        return;
      }

      // 3. Register with API
      await _registerToken(dio, token);

      // 4. Listen for token refresh
      FirebaseMessaging.instance.onTokenRefresh.listen((newToken) async {
        debugPrint('[FCM] Token refreshed — re-registering device');
        await _registerToken(dio, newToken);
      });

      // 5. Handle foreground messages (log only in M1)
      FirebaseMessaging.onMessage.listen((message) {
        debugPrint(
          '[FCM] Foreground message: ${message.notification?.title} — ${message.notification?.body}',
        );
      });

      _initialized = true;
      debugPrint('[FCM] Initialized successfully');
    } catch (e) {
      debugPrint('[FCM] Initialization error: $e');
    }
  }

  static Future<void> _registerToken(Dio dio, String token) async {
    try {
      await dio.post('/api/v1/devices', data: {
        'fcm_token': token,
        'platform': Platform.isIOS ? 'ios' : 'android',
      });
      debugPrint('[FCM] Device registered');
    } on DioException catch (e) {
      debugPrint('[FCM] Device registration failed: ${e.message}');
    }
  }

  /// Reset initialization flag (for testing / sign-out).
  static void reset() => _initialized = false;
}
