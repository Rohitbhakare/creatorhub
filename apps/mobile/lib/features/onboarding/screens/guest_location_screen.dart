import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../../../shared/theme/colors.dart';
import '../../../shared/theme/layout.dart';
import '../../../shared/components/button.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/guest_prefs_provider.dart';

/// Guest setup step 1 of 2 — location (entirely optional).
/// Simplified chip-only picker; no API auth required.
class GuestLocationScreen extends ConsumerStatefulWidget {
  const GuestLocationScreen({super.key});

  @override
  ConsumerState<GuestLocationScreen> createState() =>
      _GuestLocationScreenState();
}

class _GuestLocationScreenState extends ConsumerState<GuestLocationScreen> {
  static const _popular = [
    _City('Mumbai', 'MH'),
    _City('Delhi', 'DL'),
    _City('Bengaluru', 'KA'),
    _City('Hyderabad', 'TS'),
    _City('Chennai', 'TN'),
    _City('Pune', 'MH'),
    _City('Kolkata', 'WB'),
    _City('Goa', 'GA'),
    _City('Jaipur', 'RJ'),
    _City('Ahmedabad', 'GJ'),
  ];

  final _searchCtrl = TextEditingController();
  List<Map<String, dynamic>> _searchResults = [];
  bool _isSearching = false;
  Timer? _debounce;

  String? _selectedCityId;
  String? _selectedCityName;

  @override
  void dispose() {
    _searchCtrl.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  void _advance() {
    if (_selectedCityId != null) {
      ref.read(guestPrefsProvider.notifier).setCity(
            _selectedCityId!,
            _selectedCityName!,
          );
    }
    context.go('/guest-setup/categories');
  }

  void _onSearchChanged(String q) {
    _debounce?.cancel();
    if (q.trim().isEmpty) {
      setState(() {
        _searchResults = [];
        _isSearching = false;
      });
      return;
    }
    setState(() => _isSearching = true);
    _debounce = Timer(const Duration(milliseconds: 320), () => _search(q));
  }

  Future<void> _search(String q) async {
    try {
      // Use a guest-compatible dio — no token needed for city search
      final dio = ref.read(authServiceProvider).dio;
      final res = await dio.get(
        '/api/v1/cities',
        queryParameters: {'q': q.trim(), 'limit': 8},
      );
      final cities =
          ((res.data as Map<String, dynamic>)['data'] as List<dynamic>)
              .cast<Map<String, dynamic>>();
      if (!mounted) return;
      setState(() {
        _searchResults = cities;
        _isSearching = false;
      });
    } on DioException {
      if (mounted) setState(() => _isSearching = false);
    }
  }

  void _selectSearchResult(Map<String, dynamic> city) {
    HapticFeedback.selectionClick();
    setState(() {
      _selectedCityId = city['id'] as String;
      _selectedCityName = city['name'] as String;
      _searchCtrl.text = _selectedCityName!;
      _searchResults = [];
    });
  }

  Future<void> _selectChip(_City c) async {
    HapticFeedback.selectionClick();
    // If already selected, deselect
    if (_selectedCityName?.toLowerCase() == c.name.toLowerCase()) {
      setState(() {
        _selectedCityId = null;
        _selectedCityName = null;
        _searchCtrl.clear();
      });
      return;
    }
    // Resolve chip name to an id via search
    try {
      final dio = ref.read(authServiceProvider).dio;
      final res = await dio.get(
        '/api/v1/cities',
        queryParameters: {'q': c.name, 'limit': 5},
      );
      final cities =
          ((res.data as Map<String, dynamic>)['data'] as List<dynamic>)
              .cast<Map<String, dynamic>>();
      final match = cities.firstWhere(
        (r) => (r['name'] as String?)?.toLowerCase() == c.name.toLowerCase(),
        orElse: () => cities.isNotEmpty ? cities.first : {},
      );
      final id = match['id'] as String?;
      if (id == null || !mounted) return;
      setState(() {
        _selectedCityId = id;
        _selectedCityName = (match['name'] as String?) ?? c.name;
        _searchCtrl.text = _selectedCityName!;
        _searchResults = [];
      });
    } on DioException {
      // Non-fatal — guest can still skip
    }
  }

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.dark,
      child: Scaffold(
        backgroundColor: AppColors.bg,
        body: SafeArea(
          child: Column(
            children: [
              _TopBar(onSkip: _advance),
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.fromLTRB(24, 12, 24, 32),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Step pill
                      _StepPill(label: 'Step 1 of 2'),
                      const SizedBox(height: 14),
                      Text(
                        'Where are you\nexploring from?',
                        style: GoogleFonts.fraunces(
                          fontSize: 30,
                          fontWeight: FontWeight.w600,
                          height: 1.05,
                          letterSpacing: -0.5,
                          color: AppColors.ink,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'We\'ll show creators and stories closer to you first.',
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          color: AppColors.inkSoft,
                          height: 1.5,
                        ),
                      ),
                      const SizedBox(height: 22),

                      // Search field
                      _SearchField(
                        controller: _searchCtrl,
                        isSearching: _isSearching,
                        onChanged: _onSearchChanged,
                      ),

                      if (_searchResults.isNotEmpty) ...[
                        const SizedBox(height: 8),
                        _SearchResults(
                          results: _searchResults,
                          onSelect: _selectSearchResult,
                        ),
                      ],

                      const SizedBox(height: 20),

                      // City chips
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: _popular.map((c) {
                          final selected = _selectedCityName?.toLowerCase() ==
                              c.name.toLowerCase();
                          return _CityChip(
                            city: c,
                            selected: selected,
                            onTap: () => _selectChip(c),
                          );
                        }).toList(),
                      ),

                      const SizedBox(height: 32),

                      // Selected badge
                      if (_selectedCityName != null)
                        _SelectedBadge(cityName: _selectedCityName!),
                    ],
                  ),
                ),
              ),

              // Footer
              _Footer(
                hasSelection: _selectedCityId != null,
                onContinue: _advance,
                onSkip: _advance,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Widgets ───────────────────────────────────────────────────────

class _TopBar extends StatelessWidget {
  final VoidCallback onSkip;
  const _TopBar({required this.onSkip});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(8, 8, 16, 0),
      child: Row(
        children: [
          IconButton(
            icon: Icon(
              PhosphorIcons.x(PhosphorIconsStyle.regular),
              size: 22,
              color: AppColors.ink,
            ),
            onPressed: () {
              HapticFeedback.lightImpact();
              context.go('/welcome');
            },
          ),
          const Spacer(),
          TextButton(
            onPressed: () {
              HapticFeedback.selectionClick();
              onSkip();
            },
            style: TextButton.styleFrom(
              foregroundColor: AppColors.inkSoft,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            ),
            child: Text(
              'Skip',
              style: GoogleFonts.inter(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: AppColors.inkSoft,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _StepPill extends StatelessWidget {
  final String label;
  const _StepPill({required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.surfaceAlt,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: GoogleFonts.inter(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: AppColors.inkMuted,
          letterSpacing: 0.3,
        ),
      ),
    );
  }
}

class _SearchField extends StatelessWidget {
  final TextEditingController controller;
  final bool isSearching;
  final ValueChanged<String> onChanged;

  const _SearchField({
    required this.controller,
    required this.isSearching,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 48,
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border.all(color: AppColors.hairlineStrong),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          const SizedBox(width: 14),
          Icon(
            PhosphorIcons.magnifyingGlass(),
            size: 18,
            color: AppColors.inkMuted,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: TextField(
              controller: controller,
              onChanged: onChanged,
              style: GoogleFonts.inter(
                fontSize: 14,
                color: AppColors.ink,
                fontWeight: FontWeight.w500,
              ),
              decoration: InputDecoration(
                hintText: 'Search city…',
                hintStyle: GoogleFonts.inter(
                  fontSize: 14,
                  color: AppColors.inkMuted,
                ),
                border: InputBorder.none,
                enabledBorder: InputBorder.none,
                focusedBorder: InputBorder.none,
                isDense: true,
                contentPadding: EdgeInsets.zero,
              ),
            ),
          ),
          if (isSearching) ...[
            const SizedBox(
              width: 16,
              height: 16,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: AppColors.inkMuted,
              ),
            ),
            const SizedBox(width: 14),
          ],
        ],
      ),
    );
  }
}

class _SearchResults extends StatelessWidget {
  final List<Map<String, dynamic>> results;
  final ValueChanged<Map<String, dynamic>> onSelect;

  const _SearchResults({required this.results, required this.onSelect});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.hairline),
        boxShadow: AppColors.cardRaisedShadow,
      ),
      child: Column(
        children: results.map((c) {
          return InkWell(
            onTap: () => onSelect(c),
            borderRadius: BorderRadius.circular(12),
            child: Padding(
              padding:
                  const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
              child: Row(
                children: [
                  Icon(
                    PhosphorIcons.mapPin(PhosphorIconsStyle.fill),
                    size: 15,
                    color: AppColors.coral,
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      '${c['name']}${c['state'] != null ? ', ${c['state']}' : ''}',
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        color: AppColors.ink,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}

class _CityChip extends StatelessWidget {
  final _City city;
  final bool selected;
  final VoidCallback onTap;

  const _CityChip({
    required this.city,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 120),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 9),
        decoration: BoxDecoration(
          color: selected ? AppColors.ink : AppColors.surface,
          border: Border.all(
            color: selected ? AppColors.ink : AppColors.hairlineStrong,
            width: 1.5,
          ),
          borderRadius: BorderRadius.circular(999),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (selected) ...[
              Icon(
                PhosphorIcons.checkCircle(PhosphorIconsStyle.fill),
                size: 13,
                color: AppColors.surface,
              ),
              const SizedBox(width: 5),
            ],
            Text(
              city.name,
              style: GoogleFonts.inter(
                fontSize: 13,
                fontWeight: FontWeight.w500,
                color: selected ? AppColors.surface : AppColors.ink,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SelectedBadge extends StatelessWidget {
  final String cityName;
  const _SelectedBadge({required this.cityName});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: const Color(0xFFECFDF5),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            PhosphorIcons.mapPin(PhosphorIconsStyle.fill),
            size: 14,
            color: const Color(0xFF10B981),
          ),
          const SizedBox(width: 7),
          Text(
            'Showing creators near $cityName',
            style: GoogleFonts.inter(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: const Color(0xFF065F46),
            ),
          ),
        ],
      ),
    );
  }
}

class _Footer extends StatelessWidget {
  final bool hasSelection;
  final VoidCallback onContinue;
  final VoidCallback onSkip;

  const _Footer({
    required this.hasSelection,
    required this.onContinue,
    required this.onSkip,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.fromLTRB(
        Layout.screenPaddingH,
        12,
        Layout.screenPaddingH,
        MediaQuery.of(context).padding.bottom + 16,
      ),
      decoration: const BoxDecoration(
        color: AppColors.bg,
        border: Border(top: BorderSide(color: AppColors.hairline)),
      ),
      child: hasSelection
          ? AppButton(
              label: 'Continue',
              variant: AppButtonVariant.primary,
              size: AppButtonSize.large,
              fullWidth: true,
              trailingIcon: PhosphorIconsFill.arrowRight,
              onPressed: onContinue,
            )
          : Row(
              children: [
                Expanded(
                  child: AppButton(
                    label: 'Skip for now',
                    variant: AppButtonVariant.ghost,
                    size: AppButtonSize.large,
                    fullWidth: true,
                    onPressed: onSkip,
                  ),
                ),
              ],
            ),
    );
  }
}

class _City {
  final String name;
  final String state;
  const _City(this.name, this.state);
}
