import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../auth/providers/auth_provider.dart';

const _kGuestCityIdKey = 'guest.city_id';
const _kGuestCityNameKey = 'guest.city_name';

// ── User City State ────────────────────────────────────────────

class UserCityState {
  final String? cityId;
  final String? cityName;
  final bool isUpdating;

  const UserCityState({
    this.cityId,
    this.cityName,
    this.isUpdating = false,
  });

  UserCityState copyWith({
    String? cityId,
    String? cityName,
    bool? isUpdating,
  }) =>
      UserCityState(
        cityId: cityId ?? this.cityId,
        cityName: cityName ?? this.cityName,
        isUpdating: isUpdating ?? this.isUpdating,
      );
}

final userCityProvider = NotifierProvider<UserCityNotifier, UserCityState>(
  UserCityNotifier.new,
);

class UserCityNotifier extends Notifier<UserCityState> {
  @override
  UserCityState build() {
    final auth = ref.watch(authProvider);
    if (auth.isGuest) {
      // Hydrate from SharedPreferences; returns empty until loaded (one-shot).
      _hydrateGuestCity();
      return const UserCityState();
    }
    final user = auth.user;
    final currentCity = user?['current_city'] as Map<String, dynamic>?;
    final cityName = currentCity?['name'] as String?;
    final cityId = currentCity?['id'] as String?;
    return UserCityState(cityId: cityId, cityName: cityName);
  }

  Future<void> _hydrateGuestCity() async {
    final prefs = await SharedPreferences.getInstance();
    final cityId = prefs.getString(_kGuestCityIdKey);
    final cityName = prefs.getString(_kGuestCityNameKey);
    if (cityId != null && cityName != null) {
      state = UserCityState(cityId: cityId, cityName: cityName);
    }
  }

  /// Update city. For guests, persists to SharedPreferences (no server call).
  /// For authed users, calls PUT /users/me/city.
  Future<void> updateCity(String cityId, String cityName) async {
    final auth = ref.read(authProvider);
    state = state.copyWith(isUpdating: true);
    try {
      if (auth.isGuest) {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(_kGuestCityIdKey, cityId);
        await prefs.setString(_kGuestCityNameKey, cityName);
        state = UserCityState(cityId: cityId, cityName: cityName);
        return;
      }
      final dio = ref.read(authServiceProvider).dio;
      await dio.put('/api/v1/users/me/city', data: {'city_id': cityId});
      state = UserCityState(cityId: cityId, cityName: cityName);
    } on DioException {
      state = state.copyWith(isUpdating: false);
      rethrow;
    }
  }
}
