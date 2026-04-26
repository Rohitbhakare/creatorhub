import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/providers/auth_provider.dart';

// ── Models ────────────────────────────────────────────────────────

class WaitlistEntry {
  final String id;
  final String contentId;
  final String? scheduledDateId;
  final String? eventOccurrenceId;
  final String? contentTitle;
  final DateTime joinedAt;

  const WaitlistEntry({
    required this.id,
    required this.contentId,
    this.scheduledDateId,
    this.eventOccurrenceId,
    this.contentTitle,
    required this.joinedAt,
  });

  factory WaitlistEntry.fromJson(Map<String, dynamic> json) {
    return WaitlistEntry(
      id: json['id'] as String? ?? '',
      contentId: json['content_id'] as String? ?? '',
      scheduledDateId: json['scheduled_date_id'] as String?,
      eventOccurrenceId: json['event_occurrence_id'] as String?,
      contentTitle: json['content_title'] as String?,
      joinedAt: DateTime.tryParse(json['joined_at'] as String? ?? '')
              ?.toLocal() ??
          DateTime.now(),
    );
  }
}

// ── Read Provider ─────────────────────────────────────────────────

/// Lists waitlist entries for the current user.
final myWaitlistProvider =
    FutureProvider.autoDispose<List<WaitlistEntry>>((ref) async {
  final dio = ref.read(authServiceProvider).dio;
  try {
    final response = await dio.get('/api/v1/me/waitlist');
    final list =
        (response.data as Map<String, dynamic>)['data'] as List<dynamic>? ?? [];
    return list
        .map((e) => WaitlistEntry.fromJson(e as Map<String, dynamic>))
        .toList();
  } on DioException catch (e) {
    throw Exception(e.response?.statusMessage ?? 'Failed to load waitlist');
  }
});

// ── Mutation Notifier ─────────────────────────────────────────────

class WaitlistActionState {
  final bool isLoading;
  final String? error;

  const WaitlistActionState({this.isLoading = false, this.error});
}

final waitlistActionProvider =
    NotifierProvider<WaitlistActionNotifier, WaitlistActionState>(
  WaitlistActionNotifier.new,
);

class WaitlistActionNotifier extends Notifier<WaitlistActionState> {
  @override
  WaitlistActionState build() => const WaitlistActionState();

  /// POST /api/v1/waitlist — joins the waitlist for a sold-out
  /// scheduled date or event occurrence. Returns true on success.
  Future<bool> joinWaitlist({
    required String contentId,
    String? scheduledDateId,
    String? eventOccurrenceId,
  }) async {
    state = const WaitlistActionState(isLoading: true);
    final dio = ref.read(authServiceProvider).dio;
    try {
      await dio.post('/api/v1/waitlist', data: {
        'content_id': contentId,
        if (scheduledDateId != null) 'scheduled_date_id': scheduledDateId,
        if (eventOccurrenceId != null)
          'event_occurrence_id': eventOccurrenceId,
      });
      ref.invalidate(myWaitlistProvider);
      state = const WaitlistActionState();
      return true;
    } on DioException catch (e) {
      final msg = _extractMessage(e) ?? 'Failed to join waitlist';
      state = WaitlistActionState(error: msg);
      return false;
    }
  }

  /// DELETE /api/v1/waitlist/:id — leaves the waitlist.
  Future<bool> leaveWaitlist(String entryId) async {
    state = const WaitlistActionState(isLoading: true);
    final dio = ref.read(authServiceProvider).dio;
    try {
      await dio.delete('/api/v1/waitlist/$entryId');
      ref.invalidate(myWaitlistProvider);
      state = const WaitlistActionState();
      return true;
    } on DioException catch (e) {
      final msg = _extractMessage(e) ?? 'Failed to leave waitlist';
      state = WaitlistActionState(error: msg);
      return false;
    }
  }

  String? _extractMessage(DioException e) {
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
}
