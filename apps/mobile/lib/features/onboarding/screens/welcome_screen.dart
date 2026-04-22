import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../shared/components/button.dart';
import '../../../shared/theme/colors.dart';
import '../../auth/providers/auth_provider.dart';

/// Welcome screen — Pack A / S_Welcome (SRS IAM-FR-001).
///
/// Visual spec: `docs/01_wireframes/v2/project/pack-a-onboarding.jsx` § S_Welcome.
/// Hero uses a coral gradient placeholder (E0.4c decision Q2); no photo asset.
class WelcomeScreen extends ConsumerWidget {
  const WelcomeScreen({super.key});

  static const double _heroHeight = 420;
  static const double _contentTop = 340;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light,
      child: Scaffold(
        backgroundColor: AppColors.surface,
        body: Stack(
          children: [
            const Positioned(
              top: 0,
              left: 0,
              right: 0,
              height: _heroHeight,
              child: _Hero(),
            ),
            Positioned.fill(
              top: _contentTop,
              child: _ContentPane(
                onGetStarted: () => context.go('/auth'),
                onSignIn: () => context.go('/auth'),
                onBrowseAsGuest: () {
                  ref.read(authProvider.notifier).enterGuestMode();
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Hero extends StatelessWidget {
  const _Hero();

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [AppColors.coral, AppColors.coralDeep],
        ),
      ),
      child: DecoratedBox(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            stops: const [0.4, 1.0],
            colors: [Colors.transparent, Colors.black.withValues(alpha: 0.55)],
          ),
        ),
      ),
    );
  }
}

class _ContentPane extends StatelessWidget {
  final VoidCallback onGetStarted;
  final VoidCallback onSignIn;
  final VoidCallback onBrowseAsGuest;

  const _ContentPane({
    required this.onGetStarted,
    required this.onSignIn,
    required this.onBrowseAsGuest,
  });

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          stops: [0.0, 0.3],
          colors: [Colors.transparent, AppColors.surface],
        ),
      ),
      child: SafeArea(
        top: false,
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(24, 24, 24, 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'CREATORHUB',
                style: GoogleFonts.jetBrainsMono(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 0.18 * 11,
                  color: AppColors.coral,
                ),
              ),
              const SizedBox(height: 8),
              RichText(
                text: TextSpan(
                  style: GoogleFonts.fraunces(
                    fontSize: 40,
                    fontWeight: FontWeight.w500,
                    height: 0.98,
                    letterSpacing: -0.018 * 40,
                    color: AppColors.ink,
                  ),
                  children: [
                    const TextSpan(text: 'Every journey\n'),
                    TextSpan(
                      text: 'is a chapter.',
                      style: GoogleFonts.fraunces(
                        fontSize: 40,
                        fontWeight: FontWeight.w500,
                        fontStyle: FontStyle.italic,
                        height: 0.98,
                        letterSpacing: -0.018 * 40,
                        color: AppColors.coral,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),
              Text(
                'Follow Indian creators on the road, save stories as postcards, '
                'book their experiences.',
                style: GoogleFonts.inter(
                  fontSize: 14,
                  fontWeight: FontWeight.w400,
                  height: 1.55,
                  color: AppColors.inkSoft,
                ),
              ),
              const SizedBox(height: 22),
              AppButton(
                label: 'Get started',
                variant: AppButtonVariant.primary,
                size: AppButtonSize.large,
                fullWidth: true,
                onPressed: onGetStarted,
              ),
              const SizedBox(height: 10),
              AppButton(
                label: 'I already have an account',
                variant: AppButtonVariant.ghost,
                size: AppButtonSize.large,
                fullWidth: true,
                onPressed: onSignIn,
              ),
              const SizedBox(height: 6),
              Center(
                child: TextButton(
                  onPressed: () {
                    HapticFeedback.selectionClick();
                    onBrowseAsGuest();
                  },
                  style: TextButton.styleFrom(
                    foregroundColor: AppColors.inkMuted,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                    minimumSize: const Size(0, 44),
                  ),
                  child: Text(
                    'Browse as guest',
                    style: GoogleFonts.inter(
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                      color: AppColors.inkMuted,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Text(
                'By continuing you agree to Terms & Privacy.\n'
                'हिंदी · मराठी · தமிழ் · বাংলা coming soon',
                textAlign: TextAlign.center,
                style: GoogleFonts.inter(
                  fontSize: 11,
                  fontWeight: FontWeight.w400,
                  height: 1.5,
                  color: AppColors.inkMuted,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
