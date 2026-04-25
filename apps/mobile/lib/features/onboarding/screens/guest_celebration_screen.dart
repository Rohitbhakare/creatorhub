import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../../../shared/theme/colors.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/guest_prefs_provider.dart';

/// Guest setup — milestone screen (C in wireframe).
/// Auto-dismisses to home after 2.5 s; "Take me there" for manual control.
/// Calls enterGuestMode() here so the app treats this user as a guest session.
class GuestCelebrationScreen extends ConsumerStatefulWidget {
  const GuestCelebrationScreen({super.key});

  @override
  ConsumerState<GuestCelebrationScreen> createState() =>
      _GuestCelebrationScreenState();
}

class _GuestCelebrationScreenState
    extends ConsumerState<GuestCelebrationScreen> {
  Timer? _autoTimer;

  @override
  void initState() {
    super.initState();
    // Activate guest session now that setup is complete
    ref.read(authProvider.notifier).enterGuestMode();
    // Auto-advance after 2.5 s
    _autoTimer = Timer(const Duration(milliseconds: 2500), _goHome);
  }

  @override
  void dispose() {
    _autoTimer?.cancel();
    super.dispose();
  }

  void _goHome() {
    _autoTimer?.cancel();
    if (!mounted) return;
    HapticFeedback.lightImpact();
    context.go('/home');
  }

  @override
  Widget build(BuildContext context) {
    final prefs = ref.watch(guestPrefsProvider);
    final cats = prefs.categories;
    final cityLabel = prefs.cityName;

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.dark,
      child: Scaffold(
        backgroundColor: AppColors.bg,
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(28, 0, 28, 32),
            child: Column(
              children: [
                const Spacer(),

                // ── Big check circle ───────────────────────────────
                _CheckCircle()
                    .animate()
                    .scale(
                      begin: const Offset(0.4, 0.4),
                      end: const Offset(1, 1),
                      duration: 500.ms,
                      curve: Curves.elasticOut,
                    )
                    .fadeIn(duration: 300.ms),

                const SizedBox(height: 36),

                // ── Heading ────────────────────────────────────────
                Text(
                  'You\'re all set!',
                  style: GoogleFonts.fraunces(
                    fontSize: 36,
                    fontWeight: FontWeight.w600,
                    height: 1.05,
                    letterSpacing: -0.5,
                    color: AppColors.ink,
                  ),
                  textAlign: TextAlign.center,
                )
                    .animate(delay: 200.ms)
                    .fadeIn(duration: 400.ms)
                    .slideY(begin: 0.2, end: 0, duration: 350.ms),

                const SizedBox(height: 12),

                // ── Subhead ────────────────────────────────────────
                Text(
                  _buildSubhead(cats, cityLabel),
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    color: AppColors.inkSoft,
                    height: 1.6,
                  ),
                  textAlign: TextAlign.center,
                )
                    .animate(delay: 350.ms)
                    .fadeIn(duration: 400.ms)
                    .slideY(begin: 0.2, end: 0, duration: 350.ms),

                const SizedBox(height: 28),

                // ── Category chips preview ─────────────────────────
                if (cats.isNotEmpty)
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    alignment: WrapAlignment.center,
                    children: cats.take(5).map((c) => _CatChip(slug: c)).toList(),
                  )
                      .animate(delay: 450.ms)
                      .fadeIn(duration: 350.ms),

                const Spacer(),

                // ── CTA ────────────────────────────────────────────
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _goHome,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.coral,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                      elevation: 0,
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          'Take me there',
                          style: GoogleFonts.inter(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(width: 8),
                        const Icon(Icons.arrow_forward_rounded,
                            size: 18, color: Colors.white),
                      ],
                    ),
                  ),
                )
                    .animate(delay: 550.ms)
                    .fadeIn(duration: 400.ms)
                    .slideY(begin: 0.3, end: 0, duration: 350.ms),

                const SizedBox(height: 16),
                _AutoDismissHint()
                    .animate(delay: 600.ms)
                    .fadeIn(duration: 400.ms),
              ],
            ),
          ),
        ),
      ),
    );
  }

  String _buildSubhead(List<String> cats, String? city) {
    final catsLabel = cats.isEmpty
        ? 'travel'
        : cats.take(3).map(_pretty).join(', ');
    if (city != null) {
      return 'Your feed is curated for $catsLabel stories near $city.';
    }
    return 'Your feed is curated around $catsLabel — stories handpicked for you.';
  }

  String _pretty(String slug) {
    return slug
        .replaceAll('_', ' ')
        .split(' ')
        .map((w) => w.isEmpty ? '' : '${w[0].toUpperCase()}${w.substring(1)}')
        .join(' ');
  }
}

// ── Widgets ───────────────────────────────────────────────────────

class _CheckCircle extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Stack(
      alignment: Alignment.center,
      children: [
        // Outer glow ring
        Container(
          width: 120,
          height: 120,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: AppColors.primaryTint,
          ),
        ),
        // Inner white circle
        Container(
          width: 88,
          height: 88,
          decoration: const BoxDecoration(
            shape: BoxShape.circle,
            color: AppColors.coral,
          ),
          alignment: Alignment.center,
          child: Icon(
            PhosphorIcons.check(PhosphorIconsStyle.bold),
            size: 42,
            color: Colors.white,
          ),
        ),
        // Sparkle top-right
        const Positioned(
          top: 6,
          right: 10,
          child: _Sparkle(size: 10),
        ),
        // Sparkle bottom-left
        const Positioned(
          bottom: 10,
          left: 8,
          child: _Sparkle(size: 7),
        ),
      ],
    );
  }
}

class _Sparkle extends StatelessWidget {
  final double size;
  const _Sparkle({required this.size});

  @override
  Widget build(BuildContext context) {
    return Text(
      '✦',
      style: TextStyle(
        fontSize: size,
        color: AppColors.coral.withValues(alpha: 0.7),
      ),
    );
  }
}

class _CatChip extends StatelessWidget {
  final String slug;
  const _CatChip({required this.slug});

  String _label(String s) => s
      .replaceAll('_', ' ')
      .split(' ')
      .map((w) => w.isEmpty ? '' : '${w[0].toUpperCase()}${w.substring(1)}')
      .join(' ');

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: AppColors.primaryTint,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        _label(slug),
        style: GoogleFonts.inter(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: AppColors.coralDeep,
        ),
      ),
    );
  }
}

class _AutoDismissHint extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Text(
      'Taking you there automatically…',
      style: GoogleFonts.inter(
        fontSize: 12,
        color: AppColors.inkFaint,
      ),
      textAlign: TextAlign.center,
    );
  }
}
