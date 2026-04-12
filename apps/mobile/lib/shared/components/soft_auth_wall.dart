import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../features/auth/providers/auth_provider.dart';

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
      borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
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
    final theme = Theme.of(context);

    // Sanitize action description — strip any markup
    final sanitized = actionDescription.replaceAll(RegExp(r'[<>&]'), '');

    return SafeArea(
      child: AnimatedPadding(
        duration: const Duration(milliseconds: 240),
        curve: Curves.easeOut,
        padding: EdgeInsets.only(
          left: 24,
          right: 24,
          top: 16,
          bottom: MediaQuery.of(context).viewInsets.bottom + 24,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Drag handle
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: theme.colorScheme.outline.withValues(alpha: 0.3),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 24),

            // Icon
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                color: theme.colorScheme.primary.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.lock_outline_rounded,
                size: 32,
                color: theme.colorScheme.primary,
              ),
            ),
            const SizedBox(height: 20),

            // Title
            Text(
              'Sign in to continue',
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),

            // Context-aware subtitle
            Text(
              'Create a free account to $sanitized and unlock the full experience.',
              textAlign: TextAlign.center,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurface.withValues(alpha: 0.6),
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
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: const Text('Sign up — it\'s free'),
              ),
            ),
            const SizedBox(height: 12),

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
                    borderRadius: BorderRadius.circular(12),
                  ),
                  side: BorderSide(
                    color: theme.colorScheme.outline.withValues(alpha: 0.3),
                  ),
                ),
                child: const Text('I already have an account'),
              ),
            ),
            const SizedBox(height: 8),

            // Not now
            TextButton(
              onPressed: () {
                HapticFeedback.lightImpact();
                Navigator.of(context).pop(false);
              },
              child: Text(
                'Not now',
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: theme.colorScheme.onSurface.withValues(alpha: 0.5),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
