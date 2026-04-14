import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
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
  if (query.trim().isEmpty) {
    // Popular cities
    final dio = ref.read(authServiceProvider).dio;
    final res = await dio.get('/api/v1/cities', queryParameters: {'limit': '10'});
    final items = (res.data as Map<String, dynamic>)['data'] as List<dynamic>;
    return items.map(_CityResult.fromJson).toList();
  }
  final dio = ref.read(authServiceProvider).dio;
  final res = await dio.get('/api/v1/cities', queryParameters: {'q': query, 'limit': '15'});
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
/// Search or pick from popular cities; updates user's current city.
class LocationPickerScreen extends ConsumerStatefulWidget {
  const LocationPickerScreen({super.key});

  @override
  ConsumerState<LocationPickerScreen> createState() => _LocationPickerScreenState();
}

class _LocationPickerScreenState extends ConsumerState<LocationPickerScreen> {
  final _controller = TextEditingController();
  String _query = '';
  bool _isSaving = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _selectCity(_CityResult city) async {
    setState(() => _isSaving = true);
    try {
      await ref.read(userCityProvider.notifier).updateCity(city.id, city.name);
      // Invalidate feed sections so they reload with the new city
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
        color: AppColors.surface,
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
              color: AppColors.line,
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
              style: AppTypography.bodySmall.copyWith(color: AppColors.muted),
            ),
          ),
          const SizedBox(height: 16),
          // Search input
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Container(
              decoration: BoxDecoration(
                color: AppColors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.border),
              ),
              child: Row(
                children: [
                  const Padding(
                    padding: EdgeInsets.only(left: 12),
                    child: Icon(Icons.search, size: 18, color: AppColors.softInk),
                  ),
                  Expanded(
                    child: TextField(
                      controller: _controller,
                      autofocus: true,
                      style: AppTypography.body.copyWith(color: AppColors.ink),
                      decoration: InputDecoration(
                        hintText: 'Search for your city',
                        hintStyle: AppTypography.body.copyWith(color: AppColors.softInk),
                        border: InputBorder.none,
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 13,
                        ),
                      ),
                      onChanged: (v) => setState(() => _query = v),
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
                  color: AppColors.softInk,
                  letterSpacing: 0.5,
                ),
              ),
            ),
          ),
          // Results list — constrained height
          ConstrainedBox(
            constraints: const BoxConstraints(maxHeight: 320),
            child: resultsAsync.when(
              loading: () => const _CityListSkeleton(),
              error: (_, _) => Padding(
                padding: const EdgeInsets.all(20),
                child: Text(
                  'Failed to load cities.',
                  style: AppTypography.body.copyWith(color: AppColors.muted),
                ),
              ),
              data: (cities) {
                if (cities.isEmpty) {
                  return Padding(
                    padding: const EdgeInsets.all(20),
                    child: Text(
                      'No cities found for "$_query".',
                      style: AppTypography.body.copyWith(color: AppColors.muted),
                    ),
                  );
                }
                return ListView.separated(
                  shrinkWrap: true,
                  itemCount: cities.length,
                  separatorBuilder: (_, _) => const Divider(
                    height: 0.5,
                    thickness: 0.5,
                    color: AppColors.border,
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
                color: AppColors.sunken,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.location_on_outlined, size: 18, color: AppColors.muted),
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
                    style: AppTypography.caption.copyWith(color: AppColors.muted),
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
          const Divider(height: 0.5, thickness: 0.5, color: AppColors.border, indent: 56),
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
