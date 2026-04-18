import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../features/auth/providers/auth_provider.dart';
import '../theme/colors.dart';
import '../theme/typography.dart' as typ;
import '../theme/spacing.dart';
import '../theme/layout.dart';

/// Soft auth wall bottom sheet (IAM-FR-011).
/// Triggered on protected actions for guest users.
/// Shows context-aware message + sign up / sign in buttons.
///
/// Usage:
/// ```dart
/// await showSoftAuthWall(context, ref, 'save this itinerary');
/// ```
Future<bool> showSoftAuthWall(
  BuildContext context,
  WidgetRef ref,
  String actionDescription,
) async {
  // Guard: never show for authenticated users
  final AuthState authState = ref.read(authProvider);
  if (authState.isAuthenticated) return true;

  final result = await showModalBottomSheet<bool>(
    context: context,
    isScrollControlled: true,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(Layout.sheetRadius)),
    ),
    builder: (context) => _SoftAuthWallSheet(
      actionDescription: actionDescription,
    ),
  );

  return result ?? false;
}

class _SoftAuthWallSheet extends StatelessWidget {
  final String actionDescription;

  const _SoftAuthWallSheet({required this.actionDescription});

  @override
  Widget build(BuildContext context) {
    // Sanitize action description — strip any markup
    final sanitized = actionDescription.replaceAll(RegExp(r'[<>&]'), '');

    return SafeArea(
      child: AnimatedPadding(
        duration: const Duration(milliseconds: 240),
        curve: Curves.easeOut,
        padding: EdgeInsets.only(
          left: Spacing.xl,
          right: Spacing.xl,
          top: Spacing.lg,
          bottom: MediaQuery.of(context).viewInsets.bottom + Spacing.xl,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Drag handle
            Container(
              width: Layout.sheetHandleWidth,
              height: Layout.sheetHandleHeight,
              decoration: BoxDecoration(
                color: AppColors.hairlineStrong,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: Spacing.xl),

            // Icon
            Container(
              width: 64,
              height: 64,
              decoration: const BoxDecoration(
                color: AppColors.coralSurface,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.lock_outline_rounded,
                size: 32,
                color: AppColors.coral,
              ),
            ),
            const SizedBox(height: Spacing.mlg),

            // Title
            Text(
              'Sign in to continue',
              style: typ.AppTypography.h3,
            ),
            const SizedBox(height: Spacing.sm),

            // Context-aware subtitle
            Text(
              'Create a free account to $sanitized and unlock the full experience.',
              textAlign: TextAlign.center,
              style: typ.AppTypography.body.copyWith(
                color: AppColors.inkSoft,
              ),
            ),
            const SizedBox(height: 28),

            // Sign up button (primary)
            SizedBox(
              width: double.infinity,
              height: 52,
              child: FilledButton(
                onPressed: () {
                  HapticFeedback.lightImpact();
                  Navigator.of(context).pop(true);
                  // Navigate to auth screen
                  Navigator.of(context).pushNamed('/auth');
                },
                style: FilledButton.styleFrom(
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(Layout.buttonRadius),
                  ),
                ),
                child: const Text('Sign up — it\'s free'),
              ),
            ),
            const SizedBox(height: Spacing.md),

            // Sign in (secondary)
            SizedBox(
              width: double.infinity,
              height: 52,
              child: OutlinedButton(
                onPressed: () {
                  HapticFeedback.lightImpact();
                  Navigator.of(context).pop(true);
                  Navigator.of(context).pushNamed('/auth');
                },
                style: OutlinedButton.styleFrom(
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(Layout.buttonRadius),
                  ),
                  side: const BorderSide(
                    color: AppColors.hairline,
                  ),
                ),
                child: const Text('I already have an account'),
              ),
            ),
            const SizedBox(height: Spacing.sm),

            // Not now
            TextButton(
              onPressed: () {
                HapticFeedback.lightImpact();
                Navigator.of(context).pop(false);
              },
              child: Text(
                'Not now',
                style: typ.AppTypography.body.copyWith(
                  color: AppColors.inkMuted,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
