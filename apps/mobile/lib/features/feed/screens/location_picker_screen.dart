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

// ── Popular cities (hardcoded) ────────────────────────────────

class _PopularCity {
  final String name;
  final String emoji;
  const _PopularCity(this.name, this.emoji);
}

const _popularCities = [
  _PopularCity('Pune', '🏯'),
  _PopularCity('Mumbai', '🌊'),
  _PopularCity('Bangalore', '🌳'),
  _PopularCity('Delhi', '🏛️'),
  _PopularCity('Hyderabad', '💎'),
  _PopularCity('Chennai', '🌴'),
  _PopularCity('Kolkata', '🎭'),
  _PopularCity('Ahmedabad', '🎨'),
];

// ── City search provider ─────────────────────────────────────

final _citySearchResultsProvider = FutureProvider.autoDispose
    .family<List<_CityResult>, String>((ref, query) async {
  final dio = ref.read(authServiceProvider).dio;
  final res = await dio.get('/api/v1/cities', queryParameters: {
    if (query.trim().isNotEmpty) 'q': query,
    'limit': '20',
  });
  final items = (res.data as Map<String, dynamic>)['data'] as List<dynamic>;
  return items.map(_CityResult.fromJson).toList();
});

class _CityResult {
  final String id;
  final String name;
  final String state;
  final int? tripCount;

  const _CityResult({
    required this.id,
    required this.name,
    required this.state,
    this.tripCount,
  });

  factory _CityResult.fromJson(dynamic json) {
    final m = json as Map<String, dynamic>;
    return _CityResult(
      id: m['id'] as String,
      name: m['name'] as String,
      state: m['state'] as String,
      tripCount: m['trip_count'] as int?,
    );
  }
}

// ── Screen ────────────────────────────────────────────────────

/// Location picker bottom sheet (DISC-FR-026).
/// "Use current location" + search + popular cities grid + other cities list.
/// When [showSkip] is true, renders a "Skip for now" button that dismisses
/// the sheet without picking a city — used for the guest first-visit prompt.
class LocationPickerScreen extends ConsumerStatefulWidget {
  final bool showSkip;
  const LocationPickerScreen({super.key, this.showSkip = false});

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

      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.low,
          timeLimit: Duration(seconds: 10),
        ),
      );

      if (!mounted) return;

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
    final currentCityName = ref.watch(userCityProvider).cityName;
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

          // Header row: title + X button
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              children: [
                Text(
                  'Change city',
                  style: AppTypography.h3.copyWith(color: AppColors.ink),
                ),
                const Spacer(),
                GestureDetector(
                  onTap: () {
                    HapticFeedback.selectionClick();
                    Navigator.of(context).pop();
                  },
                  child: Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      color: AppColors.surfaceAlt,
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: const Icon(Icons.close, size: 16, color: AppColors.inkSoft),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Use current location card
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: GestureDetector(
              onTap: _isLocating ? null : _useCurrentLocation,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                decoration: BoxDecoration(
                  color: AppColors.coralSurface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.coral.withValues(alpha: 0.4)),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: AppColors.coral,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Icon(
                        PhosphorIconsFill.navigationArrow,
                        size: 18,
                        color: _isLocating ? AppColors.surface.withValues(alpha: 0.6) : AppColors.surface,
                      ),
                    ),
                    const SizedBox(width: 12),
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
                      )
                    else
                      const Icon(Icons.chevron_right, size: 20, color: AppColors.coral),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: 12),

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
          const SizedBox(height: 16),

          // Cities section
          Flexible(
            child: _query.isEmpty
                ? _buildPopularAndOther(resultsAsync, currentCityName)
                : _buildSearchResults(resultsAsync),
          ),

          if (widget.showSkip) ...[
            const SizedBox(height: 4),
            Center(
              child: TextButton(
                onPressed: () {
                  HapticFeedback.selectionClick();
                  Navigator.of(context).pop();
                },
                style: TextButton.styleFrom(
                  foregroundColor: AppColors.inkMuted,
                  minimumSize: const Size(0, 44),
                ),
                child: Text(
                  'Skip for now',
                  style: AppTypography.bodySmall.copyWith(
                    color: AppColors.inkMuted,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ),
          ],
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  Widget _buildPopularAndOther(
    AsyncValue<List<_CityResult>> resultsAsync,
    String? currentCityName,
  ) {
    return resultsAsync.when(
      loading: () => const _PopularCitySkeleton(),
      error: (_, _) => Padding(
        padding: const EdgeInsets.all(20),
        child: Text(
          'Failed to load cities.',
          style: AppTypography.body.copyWith(color: AppColors.inkSoft),
        ),
      ),
      data: (cities) {
        final popularNames =
            _popularCities.map((c) => c.name.toLowerCase()).toSet();
        final otherCities = cities
            .where((c) => !popularNames.contains(c.name.toLowerCase()))
            .toList();

        return SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // POPULAR CITIES label
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
                child: Text(
                  'POPULAR CITIES',
                  style: AppTypography.label.copyWith(
                    color: AppColors.inkMuted,
                    letterSpacing: 0.6,
                  ),
                ),
              ),

              // 4-column grid of popular cities
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 4,
                    mainAxisSpacing: 10,
                    crossAxisSpacing: 10,
                    childAspectRatio: 0.82,
                  ),
                  itemCount: _popularCities.length,
                  itemBuilder: (context, i) {
                    final pop = _popularCities[i];
                    final match = cities
                        .where((c) =>
                            c.name.toLowerCase() == pop.name.toLowerCase())
                        .firstOrNull;
                    final isSelected = currentCityName?.toLowerCase() ==
                        pop.name.toLowerCase();
                    return _PopularCityTile(
                      city: pop,
                      isSelected: isSelected,
                      isSaving: _isSaving,
                      onTap: match != null ? () => _selectCity(match) : null,
                    );
                  },
                ),
              ),

              if (otherCities.isNotEmpty) ...[
                const SizedBox(height: 20),

                // OTHER CITIES label
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 0, 20, 4),
                  child: Text(
                    'OTHER CITIES',
                    style: AppTypography.label.copyWith(
                      color: AppColors.inkMuted,
                      letterSpacing: 0.6,
                    ),
                  ),
                ),

                // Other cities list
                ...otherCities.map((city) => _OtherCityTile(
                      city: city,
                      isSaving: _isSaving,
                      onTap: () => _selectCity(city),
                    )),
              ],

              const SizedBox(height: 8),
            ],
          ),
        );
      },
    );
  }

  Widget _buildSearchResults(AsyncValue<List<_CityResult>> resultsAsync) {
    return resultsAsync.when(
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
    );
  }
}

// ── Popular city grid tile ────────────────────────────────────

class _PopularCityTile extends StatelessWidget {
  final _PopularCity city;
  final bool isSelected;
  final bool isSaving;
  final VoidCallback? onTap;

  const _PopularCityTile({
    required this.city,
    required this.isSelected,
    required this.isSaving,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: (onTap == null || isSaving) ? null : () {
        HapticFeedback.selectionClick();
        onTap!();
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.ink : AppColors.surfaceAlt,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              city.emoji,
              style: const TextStyle(fontSize: 26),
            ),
            const SizedBox(height: 6),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4),
              child: Text(
                city.name,
                style: AppTypography.caption.copyWith(
                  color: isSelected ? Colors.white : AppColors.ink,
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                ),
                textAlign: TextAlign.center,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Other city list tile ───────────────────────────────────────

class _OtherCityTile extends StatelessWidget {
  final _CityResult city;
  final bool isSaving;
  final VoidCallback onTap;

  const _OtherCityTile({
    required this.city,
    required this.isSaving,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: isSaving ? null : () {
        HapticFeedback.selectionClick();
        onTap();
      },
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 13),
        child: Row(
          children: [
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
            if (city.tripCount != null)
              Text(
                '${city.tripCount} trips',
                style: AppTypography.caption.copyWith(color: AppColors.inkMuted),
              ),
          ],
        ),
      ),
    );
  }
}

// ── Search result tile (used when querying) ───────────────────

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

// ── Skeletons ─────────────────────────────────────────────────

class _PopularCitySkeleton extends StatelessWidget {
  const _PopularCitySkeleton();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 4,
          mainAxisSpacing: 10,
          crossAxisSpacing: 10,
          childAspectRatio: 0.82,
        ),
        itemCount: 8,
        itemBuilder: (_, _) => const SkeletonRect(
          width: double.infinity,
          height: double.infinity,
          borderRadius: 12,
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
