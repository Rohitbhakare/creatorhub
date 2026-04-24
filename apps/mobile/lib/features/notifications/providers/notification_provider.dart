import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/providers/auth_provider.dart';

// ── Models ────────────────────────────────────────────────────────

class NotificationPreference {
  final String category;
  final String channel;
  final bool enabled;

  const NotificationPreference({
    required this.category,
    required this.channel,
    required this.enabled,
  });

  factory NotificationPreference.fromJson(Map<String, dynamic> json) =>
      NotificationPreference(
        category: json['category'] as String,
        channel: json['channel'] as String,
        enabled: json['enabled'] as bool? ?? true,
      );

  NotificationPreference copyWith({bool? enabled}) => NotificationPreference(
        category: category,
        channel: channel,
        enabled: enabled ?? this.enabled,
      );
}

class NotificationPreferencesState {
  final List<NotificationPreference> preferences;
  final bool isLoading;
  final bool dndEnabled;
  final String? error;

  const NotificationPreferencesState({
    this.preferences = const [],
    this.isLoading = true,
    this.dndEnabled = false,
    this.error,
  });

  NotificationPreferencesState copyWith({
    List<NotificationPreference>? preferences,
    bool? isLoading,
    bool? dndEnabled,
    Object? error = _sentinel,
  }) =>
      NotificationPreferencesState(
        preferences: preferences ?? this.preferences,
        isLoading: isLoading ?? this.isLoading,
        dndEnabled: dndEnabled ?? this.dndEnabled,
        error: error == _sentinel ? this.error : error as String?,
      );

  /// Get enabled state for a specific category + channel pair.
  bool isEnabled(String category, String channel) {
    final pref = preferences.where(
      (p) => p.category == category && p.channel == channel,
    );
    if (pref.isEmpty) return true; // default on
    return pref.first.enabled;
  }
}

const _sentinel = Object();

// ── Notifier ──────────────────────────────────────────────────────

class NotificationPreferencesNotifier
    extends Notifier<NotificationPreferencesState> {
  @override
  NotificationPreferencesState build() {
    Future.microtask(() => _load());
    return const NotificationPreferencesState();
  }

  Dio get _dio => ref.read(authServiceProvider).dio;

  Future<void> _load() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final res = await _dio.get('/api/v1/notifications/preferences');
      final data = (res.data as Map<String, dynamic>)['data'] as Map<String, dynamic>;

      final rawPrefs = data['preferences'] as List<dynamic>? ?? [];
      final prefs = rawPrefs
          .map((p) => NotificationPreference.fromJson(p as Map<String, dynamic>))
          .toList();

      state = NotificationPreferencesState(
        preferences: prefs,
        isLoading: false,
        dndEnabled: data['dnd_enabled'] as bool? ?? false,
      );
    } on DioException catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.response?.statusMessage ?? 'Failed to load preferences',
      );
    }
  }

  /// Toggle a single preference cell — optimistic update + revert on failure.
  Future<void> togglePreference(
    String category,
    String channel,
    bool enabled,
  ) async {
    // Optimistic update
    final previous = state.preferences;
    final updated = _applyToggle(previous, category, channel, enabled);
    state = state.copyWith(preferences: updated);

    try {
      await _dio.patch('/api/v1/notifications/preferences', data: {
        'category': category,
        'channel': channel,
        'enabled': enabled,
      });
    } on DioException {
      // Revert on failure
      state = state.copyWith(preferences: previous);
      rethrow;
    }
  }

  /// Enable / disable Do-Not-Disturb — optimistic + revert on failure.
  Future<void> setDnd(bool enabled) async {
    final previous = state.dndEnabled;
    state = state.copyWith(dndEnabled: enabled);

    try {
      await _dio.patch('/api/v1/notifications/preferences/dnd', data: {
        'enabled': enabled,
      });
    } on DioException {
      state = state.copyWith(dndEnabled: previous);
      rethrow;
    }
  }

  /// Retry after an error.
  void retry() => _load();

  List<NotificationPreference> _applyToggle(
    List<NotificationPreference> prefs,
    String category,
    String channel,
    bool enabled,
  ) {
    final exists = prefs.any((p) => p.category == category && p.channel == channel);
    if (exists) {
      return prefs.map((p) {
        if (p.category == category && p.channel == channel) {
          return p.copyWith(enabled: enabled);
        }
        return p;
      }).toList();
    }
    // If not yet in list, add it
    return [
      ...prefs,
      NotificationPreference(category: category, channel: channel, enabled: enabled),
    ];
  }
}

// ── Provider ──────────────────────────────────────────────────────

final notificationPrefsProvider = NotifierProvider<
    NotificationPreferencesNotifier, NotificationPreferencesState>(
  NotificationPreferencesNotifier.new,
);
