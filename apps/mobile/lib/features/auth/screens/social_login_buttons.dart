import 'dart:io' show Platform;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/auth_provider.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/typography.dart' as typ;
import '../../../shared/theme/spacing.dart';
import '../../../shared/theme/layout.dart';

/// Social login buttons: Google (both platforms) + Apple (iOS only).
/// Shows OAuth permissions transparency card before each redirect.
class SocialLoginButtons extends ConsumerStatefulWidget {
  const SocialLoginButtons({super.key});

  @override
  ConsumerState<SocialLoginButtons> createState() =>
      _SocialLoginButtonsState();
}

class _SocialLoginButtonsState extends ConsumerState<SocialLoginButtons> {
  bool _isLoading = false;
  String? _loadingProvider;

  Future<void> _showOAuthCard({
    required String provider,
    required String providerName,
    required List<String> permissions,
    required Future<void> Function() onContinue,
  }) async {
    final confirmed = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(Layout.sheetRadius)),
      ),
      builder: (context) => _OAuthPermissionsCard(
        providerName: providerName,
        permissions: permissions,
      ),
    );

    if (confirmed == true && mounted) {
      setState(() {
        _isLoading = true;
        _loadingProvider = provider;
      });

      try {
        await onContinue();
      } catch (e) {
        if (mounted) {
          final msg = e.toString();
          // Don't show error for user cancellation
          if (!msg.contains('cancelled') && !msg.contains('canceled')) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: const Text('Sign-in failed. Please try again.'),
                action: SnackBarAction(
                  label: 'Retry',
                  onPressed: () =>
                      _showOAuthCard(
                        provider: provider,
                        providerName: providerName,
                        permissions: permissions,
                        onContinue: onContinue,
                      ),
                ),
              ),
            );
          }
        }
      } finally {
        if (mounted) {
          setState(() {
            _isLoading = false;
            _loadingProvider = null;
          });
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Divider
        Row(
          children: [
            const Expanded(
              child: Divider(
                color: AppColors.border,
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: Spacing.lg),
              child: Text(
                'or continue with',
                style: typ.AppTypography.bodySmall.copyWith(
                  color: AppColors.softInk,
                ),
              ),
            ),
            const Expanded(
              child: Divider(
                color: AppColors.border,
              ),
            ),
          ],
        ),
        const SizedBox(height: Spacing.mlg),

        // Google
        _SocialButton(
          onTap: () {
            HapticFeedback.lightImpact();
            _showOAuthCard(
              provider: 'google',
              providerName: 'Google',
              permissions: [
                'Your name and profile picture',
                'Your email address',
              ],
              onContinue: () {
                final notifier = ref.read(authProvider.notifier);
                return notifier.signInWithGoogle();
              },
            );
          },
          icon: Icons.g_mobiledata_rounded,
          label: 'Continue with Google',
          isLoading: _isLoading && _loadingProvider == 'google',
          disabled: _isLoading,
        ),

        // Apple (iOS only)
        if (Platform.isIOS) ...[
          const SizedBox(height: 12),
          _SocialButton(
            onTap: () {
              HapticFeedback.lightImpact();
              _showOAuthCard(
                provider: 'apple',
                providerName: 'Apple',
                permissions: [
                  'Your name (first sign-in only)',
                  'Your email address (may be hidden)',
                ],
                onContinue: () {
                  final notifier = ref.read(authProvider.notifier);
                  return notifier.signInWithApple();
                },
              );
            },
            icon: Icons.apple,
            label: 'Continue with Apple',
            isLoading: _isLoading && _loadingProvider == 'apple',
            disabled: _isLoading,
          ),
        ],
      ],
    );
  }
}

// ── Social Button ───────────────────────────────────────────────

class _SocialButton extends StatelessWidget {
  final VoidCallback onTap;
  final IconData icon;
  final String label;
  final bool isLoading;
  final bool disabled;

  const _SocialButton({
    required this.onTap,
    required this.icon,
    required this.label,
    this.isLoading = false,
    this.disabled = false,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 52,
      child: OutlinedButton.icon(
        onPressed: disabled ? null : onTap,
        style: OutlinedButton.styleFrom(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(Layout.buttonRadius),
          ),
          side: const BorderSide(
            color: AppColors.border,
          ),
        ),
        icon: isLoading
            ? const SizedBox(
                height: 18,
                width: 18,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: AppColors.ink,
                ),
              )
            : Icon(icon, size: Spacing.xl),
        label: Text(label),
      ),
    );
  }
}

// ── OAuth Permissions Card (IAM-FR-012) ─────────────────────────

class _OAuthPermissionsCard extends StatelessWidget {
  final String providerName;
  final List<String> permissions;

  const _OAuthPermissionsCard({
    required this.providerName,
    required this.permissions,
  });

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(Spacing.xl, Spacing.lg, Spacing.xl, Spacing.xl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Drag handle
            Center(
              child: Container(
                width: Layout.sheetHandleWidth,
                height: Layout.sheetHandleHeight,
                decoration: BoxDecoration(
                  color: AppColors.line,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: Spacing.mlg),

            Text(
              'Sign in with $providerName',
              style: typ.AppTypography.h3,
            ),
            const SizedBox(height: Spacing.sm),

            Text(
              'CreatorHub will receive:',
              style: typ.AppTypography.body.copyWith(
                color: AppColors.muted,
              ),
            ),
            const SizedBox(height: Spacing.md),

            // Permissions list
            ...permissions.map(
              (p) => Padding(
                padding: const EdgeInsets.symmetric(vertical: Spacing.xs),
                child: Row(
                  children: [
                    const Icon(
                      Icons.check_circle_outline,
                      size: 20,
                      color: AppColors.coral,
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(p, style: typ.AppTypography.body),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: Spacing.xl),

            // Continue button
            SizedBox(
              width: double.infinity,
              height: 52,
              child: FilledButton(
                onPressed: () {
                  HapticFeedback.lightImpact();
                  Navigator.of(context).pop(true);
                },
                style: FilledButton.styleFrom(
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(Layout.buttonRadius),
                  ),
                ),
                child: Text('Continue with $providerName'),
              ),
            ),
            const SizedBox(height: Spacing.sm),

            // Cancel
            Center(
              child: TextButton(
                onPressed: () => Navigator.of(context).pop(false),
                child: const Text('Not now'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
