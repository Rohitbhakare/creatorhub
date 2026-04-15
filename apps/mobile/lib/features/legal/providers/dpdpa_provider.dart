import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/providers/auth_provider.dart';

// ─── Models ───────────────────────────────────────────────────

class DeletionStatus {
  final String status; // 'none' | 'pending' | 'cancelled' | 'executed'
  final DateTime? scheduledFor;
  final DateTime? requestedAt;

  const DeletionStatus({
    required this.status,
    this.scheduledFor,
    this.requestedAt,
  });

  factory DeletionStatus.fromJson(Map<String, dynamic> json) {
    return DeletionStatus(
      status: json['status'] as String? ?? 'none',
      scheduledFor: json['scheduledFor'] != null
          ? DateTime.tryParse(json['scheduledFor'] as String)
          : null,
      requestedAt: json['requestedAt'] != null
          ? DateTime.tryParse(json['requestedAt'] as String)
          : null,
    );
  }

  bool get isPending => status == 'pending';
  bool get isNone => status == 'none';
}

class ConsentStatus {
  final String? termsOfService;
  final String? privacyPolicy;
  final String? contentTnc;

  const ConsentStatus({
    this.termsOfService,
    this.privacyPolicy,
    this.contentTnc,
  });

  factory ConsentStatus.fromJson(Map<String, dynamic> json) {
    return ConsentStatus(
      termsOfService: json['terms_of_service'] as String?,
      privacyPolicy: json['privacy_policy'] as String?,
      contentTnc: json['content_tnc'] as String?,
    );
  }

  const ConsentStatus.empty()
      : termsOfService = null,
        privacyPolicy = null,
        contentTnc = null;
}

// ─── Providers ────────────────────────────────────────────────

/// Fetches the current deletion status for the authenticated user.
final deletionStatusProvider = FutureProvider.autoDispose<DeletionStatus>((ref) async {
  final dio = ref.read(authServiceProvider).dio;
  final res = await dio.get('/api/v1/dpdpa/deletion/status');
  final data = (res.data as Map<String, dynamic>)['data'] as Map<String, dynamic>;
  return DeletionStatus.fromJson(data);
});

/// Fetches the current consent status for the authenticated user.
final consentStatusProvider = FutureProvider.autoDispose<ConsentStatus>((ref) async {
  final dio = ref.read(authServiceProvider).dio;
  final res = await dio.get('/api/v1/dpdpa/consent');
  final data = (res.data as Map<String, dynamic>)['data'] as Map<String, dynamic>;
  return ConsentStatus.fromJson(data);
});

// ─── Actions Notifier ─────────────────────────────────────────

/// Manages DPDPA actions: request/cancel deletion, export data, record consent.
class DpdpaActionsNotifier extends AsyncNotifier<void> {
  @override
  Future<void> build() async {}

  Dio get _dio => ref.read(authServiceProvider).dio;

  /// Request account deletion — 30-day grace period.
  Future<DateTime> requestDeletion() async {
    state = const AsyncLoading();
    try {
      final res = await _dio.post('/api/v1/dpdpa/deletion/request');
      final data = (res.data as Map<String, dynamic>)['data'] as Map<String, dynamic>;
      state = const AsyncData(null);
      // Invalidate status so UI re-fetches
      ref.invalidate(deletionStatusProvider);
      return DateTime.parse(data['scheduledFor'] as String);
    } on DioException catch (e, st) {
      state = AsyncError(e, st);
      rethrow;
    }
  }

  /// Cancel a pending deletion request.
  Future<void> cancelDeletion() async {
    state = const AsyncLoading();
    try {
      await _dio.post('/api/v1/dpdpa/deletion/cancel');
      state = const AsyncData(null);
      ref.invalidate(deletionStatusProvider);
    } on DioException catch (e, st) {
      state = AsyncError(e, st);
      rethrow;
    }
  }

  /// Export all user data — returns the download URL / JSON payload.
  Future<Map<String, dynamic>> exportData() async {
    state = const AsyncLoading();
    try {
      final res = await _dio.get('/api/v1/dpdpa/export');
      final data = (res.data as Map<String, dynamic>)['data'] as Map<String, dynamic>;
      state = const AsyncData(null);
      return data;
    } on DioException catch (e, st) {
      state = AsyncError(e, st);
      rethrow;
    }
  }

  /// Record user consent to a policy document.
  Future<void> recordConsent({
    required String type, // 'terms_of_service' | 'privacy_policy' | 'content_tnc'
    required String version,
  }) async {
    await _dio.post('/api/v1/dpdpa/consent', data: {'type': type, 'version': version});
    ref.invalidate(consentStatusProvider);
  }
}

final dpdpaActionsProvider = AsyncNotifierProvider<DpdpaActionsNotifier, void>(
  DpdpaActionsNotifier.new,
);
