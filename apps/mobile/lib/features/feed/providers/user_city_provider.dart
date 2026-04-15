import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../auth/providers/auth_provider.dart';

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
    // Seed from auth user data — API returns current_city as nested object
    final user = ref.watch(authProvider).user;
    final currentCity = user?['current_city'] as Map<String, dynamic>?;
    final cityName = currentCity?['name'] as String?;
    final cityId = currentCity?['id'] as String?;
    return UserCityState(cityId: cityId, cityName: cityName);
  }

  Future<void> updateCity(String cityId, String cityName) async {
    state = state.copyWith(isUpdating: true);
    try {
      final dio = ref.read(authServiceProvider).dio;
      await dio.put('/api/v1/users/me/city', data: {'city_id': cityId});
      state = UserCityState(cityId: cityId, cityName: cityName);
    } on DioException {
      state = state.copyWith(isUpdating: false);
      rethrow;
    }
  }
}
