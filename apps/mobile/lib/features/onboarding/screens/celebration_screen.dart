import 'dart:async' show unawaited;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart' show PhosphorIconsFill;
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/typography.dart' as typ;
import '../../../shared/theme/spacing.dart';
import '../../../shared/theme/animations.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/onboarding_provider.dart';

/// Celebration screen (ONB-FR-005).
/// Full-screen success state after completing onboarding.
/// Auto-navigates to home after 2.5 seconds.
class CelebrationScreen extends ConsumerStatefulWidget {
  const CelebrationScreen({super.key});

  @override
  ConsumerState<CelebrationScreen> createState() => _CelebrationScreenState();
}

class _CelebrationScreenState extends ConsumerState<CelebrationScreen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _scaleController;
  late final Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();

    // Scale-in animation for the icon
    _scaleController = AnimationController(
      vsync: this,
      duration: Anim.heartBounceDuration,
    );
    _scaleAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _scaleController,
        curve: Anim.defaultCurve,
      ),
    );

    _completeOnboarding();
  }

  Future<void> _completeOnboarding() async {
    // Start the icon animation
    unawaited(_scaleController.forward());

    // Complete onboarding via API
    try {
      final authService = ref.read(authServiceProvider);
      await authService.dio.post('/api/v1/onboarding/complete');
      ref.read(onboardingProvider.notifier).completeOnboarding();

      // Refresh user profile so router sees onboarding_completed_at
      final profileRes = await authService.dio.get('/api/v1/users/me');
      final profileData = profileRes.data as Map<String, dynamic>;
      ref
          .read(authProvider.notifier)
          .updateUser(profileData['data'] as Map<String, dynamic>);
    } catch (_) {
      // Graceful failure — still navigate to home
    }

    // Auto-navigate to home after 2.5 seconds
    await Future<void>.delayed(const Duration(milliseconds: 2500));
    if (mounted) {
      context.go('/');
    }
  }

  @override
  void dispose() {
    _scaleController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final reduceMotion = Anim.shouldReduceMotion(context);

    return Scaffold(
      backgroundColor: AppColors.surface,
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: Spacing.xxl),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Animated icon
                if (reduceMotion)
                  const Icon(
                    PhosphorIconsFill.confetti,
                    size: 80,
                    color: AppColors.coral,
                  )
                else
                  ScaleTransition(
                    scale: _scaleAnimation,
                    child: const Icon(
                      PhosphorIconsFill.confetti,
                      size: 80,
                      color: AppColors.coral,
                    ),
                  ),

                const SizedBox(height: Spacing.xl),

                // Title
                Text(
                  "You're all set!",
                  style: typ.AppTypography.h1,
                  textAlign: TextAlign.center,
                ),

                const SizedBox(height: Spacing.md),

                // Subtitle
                Text(
                  "Let's explore what India has to offer",
                  style: typ.AppTypography.bodyLarge.copyWith(
                    color: AppColors.muted,
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
