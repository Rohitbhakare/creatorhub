import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Lightweight in-session preferences for guest users.
/// Collected during the guest setup flow (location → categories → feed).
/// Read by feed providers to pass personalisation query params.
class GuestPrefs {
  final String? cityId;
  final String? cityName;
  final List<String> categories;

  const GuestPrefs({
    this.cityId,
    this.cityName,
    this.categories = const [],
  });

  bool get hasLocation => cityId != null && cityId!.isNotEmpty;
  bool get hasEnoughCategories => categories.length >= 3;
  bool get isConfigured => hasEnoughCategories;

  GuestPrefs copyWith({
    Object? cityId = _sentinel,
    Object? cityName = _sentinel,
    List<String>? categories,
  }) =>
      GuestPrefs(
        cityId: cityId == _sentinel ? this.cityId : cityId as String?,
        cityName: cityName == _sentinel ? this.cityName : cityName as String?,
        categories: categories ?? this.categories,
      );
}

const _sentinel = Object();

final guestPrefsProvider =
    NotifierProvider<GuestPrefsNotifier, GuestPrefs>(GuestPrefsNotifier.new);

class GuestPrefsNotifier extends Notifier<GuestPrefs> {
  @override
  GuestPrefs build() => const GuestPrefs();

  void setCity(String id, String name) {
    state = state.copyWith(cityId: id, cityName: name);
  }

  void clearCity() {
    state = state.copyWith(cityId: null, cityName: null);
  }

  void setCategories(List<String> cats) {
    state = state.copyWith(categories: List.unmodifiable(cats));
  }
}
