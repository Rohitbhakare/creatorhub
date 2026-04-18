import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/typography.dart' as typ;
import '../../../shared/theme/spacing.dart';
import '../../../shared/theme/layout.dart';
import '../../../shared/components/button.dart';
import '../../auth/providers/auth_provider.dart';

/// Welcome screen shown on first launch (ONB-FR-001).
///
/// Offers three paths:
/// - "Get Started" / "I already have an account" -> navigate to /auth
/// - "Browse as guest" -> enter guest mode via auth provider
class WelcomeScreen extends ConsumerWidget {
  const WelcomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: Layout.screenPaddingH,
          ),
          child: Column(
            children: [
              const Spacer(flex: 2),

              // ── Branding ─────────────────────────────────────
              const Icon(
                PhosphorIconsFill.compassRose,
                size: 80,
                color: AppColors.coral,
              ),
              const SizedBox(height: Spacing.xl),
              Text(
                'CreatorHub',
                style: typ.AppTypography.display,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: Spacing.sm),
              Text(
                'Discover incredible travel experiences\ncrafted by local creators across India.',
                style: typ.AppTypography.body.copyWith(
                  color: AppColors.inkSoft,
                ),
                textAlign: TextAlign.center,
              ),

              const Spacer(flex: 3),

              // ── CTAs ─────────────────────────────────────────
              AppButton(
                label: 'Get Started',
                variant: AppButtonVariant.primary,
                size: AppButtonSize.large,
                fullWidth: true,
                onPressed: () => context.go('/auth'),
              ),
              const SizedBox(height: Spacing.md),
              AppButton(
                label: 'I already have an account',
                variant: AppButtonVariant.secondary,
                size: AppButtonSize.large,
                fullWidth: true,
                onPressed: () => context.go('/auth'),
              ),
              const SizedBox(height: Spacing.lg),
              TextButton(
                onPressed: () {
                  ref.read(authProvider.notifier).enterGuestMode();
                },
                child: Text(
                  'Browse as guest',
                  style: typ.AppTypography.body.copyWith(
                    color: AppColors.inkMuted,
                  ),
                ),
              ),
              const SizedBox(height: Spacing.xxl),
            ],
          ),
        ),
      ),
    );
  }
}
