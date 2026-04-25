import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../../../shared/theme/colors.dart';
import '../../../shared/theme/layout.dart';
import '../providers/guest_prefs_provider.dart';

/// Guest setup step 2 of 2 — travel category picker.
/// Matches the wireframe "What gets you packing?" design:
/// coloured cards, count badges, min-3 requirement, animated counter pill.
class GuestCategoryScreen extends ConsumerStatefulWidget {
  const GuestCategoryScreen({super.key});

  @override
  ConsumerState<GuestCategoryScreen> createState() =>
      _GuestCategoryScreenState();
}

class _GuestCategoryScreenState extends ConsumerState<GuestCategoryScreen> {
  static const _kMin = 3;

  final _selected = <String>{};

  void _toggle(String id) {
    HapticFeedback.selectionClick();
    setState(() {
      if (_selected.contains(id)) {
        _selected.remove(id);
      } else {
        _selected.add(id);
      }
    });
  }

  void _onContinue() {
    if (_selected.length < _kMin) return;
    ref.read(guestPrefsProvider.notifier).setCategories(_selected.toList());
    context.go('/guest-setup/done');
  }

  @override
  Widget build(BuildContext context) {
    final ready = _selected.length >= _kMin;

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.dark,
      child: Scaffold(
        backgroundColor: AppColors.bg,
        body: SafeArea(
          child: Column(
            children: [
              _TopBar(),
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Step pill
                      _StepPill(label: 'Step 2 of 2'),
                      const SizedBox(height: 14),

                      // Headline
                      Text(
                        'What gets you\npacking?',
                        style: GoogleFonts.fraunces(
                          fontSize: 32,
                          fontWeight: FontWeight.w600,
                          height: 1.04,
                          letterSpacing: -0.5,
                          color: AppColors.ink,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Pick at least $_kMin. Tap a card to add it.',
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          color: AppColors.inkSoft,
                          height: 1.5,
                        ),
                      ),
                      const SizedBox(height: 20),

                      // Category grid
                      GridView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        gridDelegate:
                            const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          crossAxisSpacing: 10,
                          mainAxisSpacing: 10,
                          childAspectRatio: 1.65,
                        ),
                        itemCount: _kCategories.length,
                        itemBuilder: (_, i) {
                          final cat = _kCategories[i];
                          return _CategoryCard(
                            cat: cat,
                            selected: _selected.contains(cat.id),
                            onTap: () => _toggle(cat.id),
                          );
                        },
                      ),

                      const SizedBox(height: 16),

                      // Counter pill — animated in once ≥3 selected
                      AnimatedSwitcher(
                        duration: const Duration(milliseconds: 250),
                        transitionBuilder: (child, anim) =>
                            FadeTransition(opacity: anim, child: child),
                        child: ready
                            ? _ReadyBanner(count: _selected.length)
                                .animate()
                                .slideY(
                                  begin: 0.3,
                                  end: 0,
                                  duration: 250.ms,
                                  curve: Curves.easeOut,
                                )
                                .fadeIn(duration: 200.ms)
                            : _CounterHint(
                                count: _selected.length, min: _kMin),
                      ),
                    ],
                  ),
                ),
              ),

              // Bottom CTA
              _Footer(ready: ready, onContinue: _onContinue),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Category data ─────────────────────────────────────────────────

class _Cat {
  final String id;
  final String name;
  final String emoji;
  final int tripCount;
  final Color bgColor;
  final Color accentColor;

  const _Cat({
    required this.id,
    required this.name,
    required this.emoji,
    required this.tripCount,
    required this.bgColor,
    required this.accentColor,
  });
}

const _kCategories = [
  _Cat(
    id: 'road_trips',
    name: 'Road Trips',
    emoji: '🚗',
    tripCount: 142,
    bgColor: Color(0xFFFFF0EC),
    accentColor: Color(0xFFE15A41),
  ),
  _Cat(
    id: 'street_food',
    name: 'Street Food',
    emoji: '🍜',
    tripCount: 87,
    bgColor: Color(0xFFFFF8EC),
    accentColor: Color(0xFFF59E0B),
  ),
  _Cat(
    id: 'adventure',
    name: 'Adventure &\nTrekking',
    emoji: '🧗',
    tripCount: 204,
    bgColor: Color(0xFFECFDF5),
    accentColor: Color(0xFF10B981),
  ),
  _Cat(
    id: 'cultural',
    name: 'Cultural &\nFestival',
    emoji: '🎨',
    tripCount: 63,
    bgColor: Color(0xFFF5F3FF),
    accentColor: Color(0xFF7C5CFC),
  ),
  _Cat(
    id: 'wildlife',
    name: 'Wildlife &\nNature',
    emoji: '🦁',
    tripCount: 98,
    bgColor: Color(0xFFFFF7ED),
    accentColor: Color(0xFFF97316),
  ),
  _Cat(
    id: 'offbeat',
    name: 'Offbeat &\nHidden',
    emoji: '🌍',
    tripCount: 71,
    bgColor: Color(0xFFEEF2FF),
    accentColor: Color(0xFF6366F1),
  ),
  _Cat(
    id: 'solo_budget',
    name: 'Solo & Budget',
    emoji: '🎒',
    tripCount: 156,
    bgColor: Color(0xFFEFF6FF),
    accentColor: Color(0xFF0EA5E9),
  ),
  _Cat(
    id: 'luxury',
    name: 'Luxury\nEscapes',
    emoji: '✨',
    tripCount: 44,
    bgColor: Color(0xFFFDF4FF),
    accentColor: Color(0xFFD946EF),
  ),
];

// ── Category card ─────────────────────────────────────────────────

class _CategoryCard extends StatelessWidget {
  final _Cat cat;
  final bool selected;
  final VoidCallback onTap;

  const _CategoryCard({
    required this.cat,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 140),
        curve: Curves.easeOut,
        decoration: BoxDecoration(
          color: selected ? cat.bgColor : AppColors.surface,
          border: Border.all(
            color: selected ? cat.accentColor : AppColors.hairline,
            width: selected ? 2 : 1,
          ),
          borderRadius: BorderRadius.circular(14),
          boxShadow: selected ? AppColors.cardRaisedShadow : [],
        ),
        padding: const EdgeInsets.fromLTRB(14, 12, 12, 12),
        child: Stack(
          children: [
            // Name + count (left)
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  cat.name,
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: AppColors.ink,
                    height: 1.25,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${cat.tripCount} trips',
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    color: AppColors.inkMuted,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),

            // Emoji (bottom-right)
            Positioned(
              right: 0,
              bottom: 0,
              child: Text(
                cat.emoji,
                style: const TextStyle(fontSize: 26),
              ),
            ),

            // Check badge (top-right) — slides in on selection
            if (selected)
              Positioned(
                top: 0,
                right: 0,
                child: Container(
                  width: 20,
                  height: 20,
                  decoration: BoxDecoration(
                    color: cat.accentColor,
                    shape: BoxShape.circle,
                  ),
                  alignment: Alignment.center,
                  child: Icon(
                    PhosphorIcons.check(PhosphorIconsStyle.bold),
                    size: 11,
                    color: Colors.white,
                  ),
                )
                    .animate()
                    .scale(
                      begin: const Offset(0, 0),
                      end: const Offset(1, 1),
                      duration: 160.ms,
                      curve: Curves.elasticOut,
                    )
                    .fadeIn(duration: 80.ms),
              ),
          ],
        ),
      ),
    );
  }
}

// ── Counter / ready banner ────────────────────────────────────────

class _ReadyBanner extends StatelessWidget {
  final int count;
  const _ReadyBanner({required this.count});

  @override
  Widget build(BuildContext context) {
    return Container(
      key: const ValueKey('ready'),
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: const Color(0xFFECFDF5),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF6EE7B7)),
      ),
      child: Row(
        children: [
          Icon(
            PhosphorIcons.checkCircle(PhosphorIconsStyle.fill),
            size: 18,
            color: const Color(0xFF10B981),
          ),
          const SizedBox(width: 8),
          Text(
            '$count picked · ready when you are',
            style: GoogleFonts.inter(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: const Color(0xFF065F46),
            ),
          ),
        ],
      ),
    );
  }
}

class _CounterHint extends StatelessWidget {
  final int count;
  final int min;
  const _CounterHint({required this.count, required this.min});

  @override
  Widget build(BuildContext context) {
    final remaining = min - count;
    return Padding(
      key: const ValueKey('hint'),
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Text(
        count == 0
            ? 'Pick at least $min to continue'
            : 'Pick $remaining more to continue',
        style: GoogleFonts.inter(
          fontSize: 12,
          color: AppColors.inkMuted,
        ),
      ),
    );
  }
}

// ── Top bar ───────────────────────────────────────────────────────

class _TopBar extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(8, 8, 16, 0),
      child: Row(
        children: [
          IconButton(
            icon: Icon(
              PhosphorIcons.arrowLeft(PhosphorIconsStyle.regular),
              size: 22,
              color: AppColors.ink,
            ),
            onPressed: () {
              HapticFeedback.lightImpact();
              context.go('/guest-setup/location');
            },
          ),
          const Spacer(),
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

// ── Footer ────────────────────────────────────────────────────────

class _Footer extends StatelessWidget {
  final bool ready;
  final VoidCallback onContinue;

  const _Footer({required this.ready, required this.onContinue});

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
      child: AnimatedOpacity(
        opacity: ready ? 1.0 : 0.45,
        duration: const Duration(milliseconds: 200),
        child: SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: ready ? onContinue : null,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.coral,
              disabledBackgroundColor: AppColors.coral,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(Layout.cardRadius),
              ),
              elevation: 0,
            ),
            child: Text(
              'Continue',
              style: GoogleFonts.inter(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: Colors.white,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
