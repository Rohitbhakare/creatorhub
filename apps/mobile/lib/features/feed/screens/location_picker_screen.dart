import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import 'package:geolocator/geolocator.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart' show PhosphorIconsFill;
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/typography.dart';
import '../../../shared/components/skeleton.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/user_city_provider.dart';
import '../providers/near_you_provider.dart';
import '../providers/vertical_section_provider.dart';

// ── City search provider ─────────────────────────────────────

final _citySearchResultsProvider = FutureProvider.autoDispose
    .family<List<_CityResult>, String>((ref, query) async {
  final dio = ref.read(authServiceProvider).dio;
  final res = await dio.get('/api/v1/cities', queryParameters: {
    if (query.trim().isNotEmpty) 'q': query,
    'limit': '12',
  });
  final items = (res.data as Map<String, dynamic>)['data'] as List<dynamic>;
  return items.map(_CityResult.fromJson).toList();
});

class _CityResult {
  final String id;
  final String name;
  final String state;

  const _CityResult({required this.id, required this.name, required this.state});

  factory _CityResult.fromJson(dynamic json) {
    final m = json as Map<String, dynamic>;
    return _CityResult(
      id: m['id'] as String,
      name: m['name'] as String,
      state: m['state'] as String,
    );
  }
}

// ── Screen ────────────────────────────────────────────────────

/// Location picker bottom sheet (DISC-FR-026).
/// "Use current location" + search + popular cities.
class LocationPickerScreen extends ConsumerStatefulWidget {
  const LocationPickerScreen({super.key});

  @override
  ConsumerState<LocationPickerScreen> createState() => _LocationPickerScreenState();
}

class _LocationPickerScreenState extends ConsumerState<LocationPickerScreen> {
  final _controller = TextEditingController();
  String _query = '';
  bool _isSaving = false;
  bool _isLocating = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _useCurrentLocation() async {
    setState(() => _isLocating = true);

    try {
      // Check / request permission
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Location permission denied. Please enable it in Settings.')),
          );
        }
        return;
      }

      // Get position
      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.low,
          timeLimit: Duration(seconds: 10),
        ),
      );

      if (!mounted) return;

      // Resolve to nearest city via API
      final dio = ref.read(authServiceProvider).dio;
      final res = await dio.get('/api/v1/cities/nearby', queryParameters: {
        'lat': position.latitude.toString(),
        'lng': position.longitude.toString(),
      });
      final cityData = (res.data as Map<String, dynamic>)['data'] as Map<String, dynamic>;
      final city = _CityResult.fromJson(cityData);

      await _selectCity(city);
    } on DioException catch (e) {
      if (mounted) {
        final msg = e.response?.statusCode == 404
            ? 'No city found near your location.'
            : 'Could not detect location. Try searching instead.';
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not detect location. Try searching instead.')),
        );
      }
    } finally {
      if (mounted) setState(() => _isLocating = false);
    }
  }

  Future<void> _selectCity(_CityResult city) async {
    await HapticFeedback.selectionClick();
    setState(() => _isSaving = true);
    try {
      await ref.read(userCityProvider.notifier).updateCity(city.id, city.name);
      ref.invalidate(nearYouProvider);
      ref.invalidate(verticalSectionProvider('travel'));
      ref.invalidate(verticalSectionProvider('stories'));
      if (mounted) Navigator.of(context).pop();
    } on DioException {
      setState(() => _isSaving = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to update city. Try again.')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final resultsAsync = ref.watch(_citySearchResultsProvider(_query));
    final bottomInset = MediaQuery.viewInsetsOf(context).bottom;

    return Container(
      decoration: const BoxDecoration(
        color: AppColors.bg,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      padding: EdgeInsets.only(bottom: bottomInset),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Drag handle
          const SizedBox(height: 12),
          Container(
            width: 36,
            height: 4,
            decoration: BoxDecoration(
              color: AppColors.hairlineStrong,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 16),
          // Title
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Text(
              'Where are you?',
              style: AppTypography.h3.copyWith(color: AppColors.ink),
            ),
          ),
          const SizedBox(height: 4),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Text(
              'We use your location to show trips near you.',
              style: AppTypography.bodySmall.copyWith(color: AppColors.inkSoft),
            ),
          ),
          const SizedBox(height: 16),

          // Use current location button
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: GestureDetector(
              onTap: _isLocating ? null : _useCurrentLocation,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                decoration: BoxDecoration(
                  color: AppColors.coralSurface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.coral.withValues(alpha: 0.2)),
                ),
                child: Row(
                  children: [
                    Icon(
                      PhosphorIconsFill.navigationArrow,
                      size: 18,
                      color: _isLocating ? AppColors.inkMuted : AppColors.coral,
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        _isLocating ? 'Detecting location...' : 'Use current location',
                        style: AppTypography.body.copyWith(
                          color: _isLocating ? AppColors.inkMuted : AppColors.coral,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    if (_isLocating)
                      const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: AppColors.coral,
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: 14),

          // Search input
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Container(
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.hairline),
              ),
              child: Row(
                children: [
                  const Padding(
                    padding: EdgeInsets.only(left: 12),
                    child: Icon(Icons.search, size: 18, color: AppColors.inkMuted),
                  ),
                  Expanded(
                    child: TextField(
                      controller: _controller,
                      style: AppTypography.body.copyWith(color: AppColors.ink),
                      decoration: InputDecoration(
                        hintText: 'Search for your city',
                        hintStyle: AppTypography.body.copyWith(color: AppColors.inkMuted),
                        border: InputBorder.none,
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 13,
                        ),
                      ),
                      onChanged: (v) => setState(() => _query = v),
                    ),
                  ),
                  if (_query.isNotEmpty)
                    GestureDetector(
                      onTap: () {
                        _controller.clear();
                        setState(() => _query = '');
                      },
                      child: const Padding(
                        padding: EdgeInsets.only(right: 12),
                        child: Icon(Icons.close, size: 18, color: AppColors.inkMuted),
                      ),
                    ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          // Section label
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 8),
            child: Align(
              alignment: Alignment.centerLeft,
              child: Text(
                _query.isEmpty ? 'POPULAR IN INDIA' : 'RESULTS',
                style: AppTypography.label.copyWith(
                  color: AppColors.inkMuted,
                  letterSpacing: 0.5,
                ),
              ),
            ),
          ),
          // Results list
          ConstrainedBox(
            constraints: const BoxConstraints(maxHeight: 260),
            child: resultsAsync.when(
              loading: () => const _CityListSkeleton(),
              error: (_, _) => Padding(
                padding: const EdgeInsets.all(20),
                child: Text(
                  'Failed to load cities.',
                  style: AppTypography.body.copyWith(color: AppColors.inkSoft),
                ),
              ),
              data: (cities) {
                if (cities.isEmpty) {
                  return Padding(
                    padding: const EdgeInsets.all(20),
                    child: Text(
                      'No cities found for "$_query".',
                      style: AppTypography.body.copyWith(color: AppColors.inkSoft),
                    ),
                  );
                }
                return ListView.separated(
                  shrinkWrap: true,
                  itemCount: cities.length,
                  separatorBuilder: (_, _) => const Divider(
                    height: 0.5,
                    thickness: 0.5,
                    color: AppColors.hairline,
                    indent: 56,
                  ),
                  itemBuilder: (context, i) {
                    final city = cities[i];
                    return _CityTile(
                      city: city,
                      isSaving: _isSaving,
                      onTap: () => _selectCity(city),
                    );
                  },
                );
              },
            ),
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }
}

class _CityTile extends StatelessWidget {
  final _CityResult city;
  final bool isSaving;
  final VoidCallback onTap;

  const _CityTile({
    required this.city,
    required this.isSaving,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: isSaving ? null : onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
        child: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: AppColors.surfaceAlt,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.location_on_outlined, size: 18, color: AppColors.inkSoft),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    city.name,
                    style: AppTypography.body.copyWith(
                      color: AppColors.ink,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  Text(
                    city.state,
                    style: AppTypography.caption.copyWith(color: AppColors.inkSoft),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CityListSkeleton extends StatelessWidget {
  const _CityListSkeleton();

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      shrinkWrap: true,
      itemCount: 5,
      separatorBuilder: (_, _) =>
          const Divider(height: 0.5, thickness: 0.5, color: AppColors.hairline, indent: 56),
      itemBuilder: (_, _) => const Padding(
        padding: EdgeInsets.symmetric(horizontal: 16, vertical: 13),
        child: Row(
          children: [
            SkeletonRect(width: 36, height: 36, borderRadius: 8),
            SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SkeletonLine(width: 120, height: 14),
                SizedBox(height: 4),
                SkeletonLine(width: 80, height: 11),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
