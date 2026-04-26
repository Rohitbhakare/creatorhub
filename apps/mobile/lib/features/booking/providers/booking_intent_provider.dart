import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/providers/auth_provider.dart';

// ── Models ────────────────────────────────────────────────────────

/// Active booking-intent hold returned by POST /api/v1/booking-intents.
/// The hold expires at [expiresAt] (10 minutes by spec).
class BookingIntent {
  final String intentId;
  final DateTime expiresAt;
  final int basePricePaisa;
  final int travellers;

  const BookingIntent({
    required this.intentId,
    required this.expiresAt,
    required this.basePricePaisa,
    required this.travellers,
  });

  factory BookingIntent.fromJson(Map<String, dynamic> json) {
    return BookingIntent(
      intentId: json['intent_id'] as String? ??
          json['id'] as String? ??
          '',
      expiresAt: DateTime.tryParse(json['expires_at'] as String? ?? '')
              ?.toLocal() ??
          DateTime.now().add(const Duration(minutes: 10)),
      basePricePaisa: json['base_price_paisa'] as int? ?? 0,
      travellers: json['travellers'] as int? ?? 1,
    );
  }
}

// ── State ─────────────────────────────────────────────────────────

class BookingIntentState {
  final BookingIntent? intent;
  final bool isLoading;
  final String? error;
  final String? errorCode;

  const BookingIntentState({
    this.intent,
    this.isLoading = false,
    this.error,
    this.errorCode,
  });

  BookingIntentState copyWith({
    BookingIntent? intent,
    bool? isLoading,
    String? error,
    String? errorCode,
    bool clearIntent = false,
    bool clearError = false,
  }) {
    return BookingIntentState(
      intent: clearIntent ? null : (intent ?? this.intent),
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : (error ?? this.error),
      errorCode: clearError ? null : (errorCode ?? this.errorCode),
    );
  }
}

// ── Provider ──────────────────────────────────────────────────────

final bookingIntentProvider =
    NotifierProvider<BookingIntentNotifier, BookingIntentState>(
  BookingIntentNotifier.new,
);

class BookingIntentNotifier extends Notifier<BookingIntentState> {
  @override
  BookingIntentState build() => const BookingIntentState();

  /// Creates a hold on inventory. Backend returns `{intent_id, expires_at,
  /// base_price_paisa, travellers}`. Returns the intent on success, null
  /// on failure (state.error is populated).
  Future<BookingIntent?> create({
    required String contentId,
    String? scheduledDateId,
    String? eventOccurrenceId,
    int travellers = 1,
  }) async {
    state = state.copyWith(isLoading: true, clearError: true);
    final dio = ref.read(authServiceProvider).dio;
    try {
      final response = await dio.post('/api/v1/booking-intents', data: {
        'content_id': contentId,
        if (scheduledDateId != null) 'scheduled_date_id': scheduledDateId,
        if (eventOccurrenceId != null) 'event_occurrence_id': eventOccurrenceId,
        'travellers': travellers,
      });
      final data = (response.data as Map<String, dynamic>)['data']
          as Map<String, dynamic>;
      final intent = BookingIntent.fromJson(data);
      state = BookingIntentState(intent: intent);
      return intent;
    } on DioException catch (e) {
      final msg = _extractErrorMessage(e) ?? 'Could not reserve spots';
      final code = _extractErrorCode(e);
      state = BookingIntentState(error: msg, errorCode: code);
      return null;
    }
  }

  /// Releases the held intent. Best-effort — failures are swallowed
  /// because the server-side hold will expire on its own.
  Future<void> release() async {
    final intent = state.intent;
    if (intent == null) return;
    state = const BookingIntentState();
    final dio = ref.read(authServiceProvider).dio;
    try {
      await dio.delete('/api/v1/booking-intents/${intent.intentId}');
    } on DioException catch (_) {
      // Swallow — hold expires server-side.
    }
  }

  /// Clears local state without calling the API (e.g. after the hold
  /// has fired its onExpiry callback).
  void clearLocal() {
    state = const BookingIntentState();
  }

  String? _extractErrorMessage(DioException e) {
    try {
      final body = e.response?.data as Map<String, dynamic>?;
      final errorMap = body?['error'] as Map<String, dynamic>?;
      final errors = errorMap?['errors'] as List<dynamic>?;
      if (errors != null && errors.isNotEmpty) {
        final first = errors.first as Map<String, dynamic>;
        return first['message'] as String?;
      }
      return errorMap?['detail'] as String?;
    } catch (_) {
      return null;
    }
  }

  String? _extractErrorCode(DioException e) {
    try {
      final body = e.response?.data as Map<String, dynamic>?;
      final errorMap = body?['error'] as Map<String, dynamic>?;
      // RFC 9457 `type` URI tail or custom `code` field.
      return errorMap?['code'] as String? ??
          errorMap?['type'] as String?;
    } catch (_) {
      return null;
    }
  }
}
