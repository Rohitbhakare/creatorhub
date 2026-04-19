import 'dart:async' show unawaited;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../../../shared/components/button.dart';
import '../../../shared/theme/colors.dart';
import '../providers/auth_provider.dart';

/// A7 Soft auth sheet (IAM-FR-011).
/// Triggered when a guest attempts one of 5 gated actions:
/// save, follow, book, comment, like.
///
/// Returns `true` if the user signed in (caller should retry the action)
/// or `false` if they dismissed / kept browsing as guest.
enum SoftAuthTrigger { save, follow, book, comment, like }

/// Optional descriptive payload rendered in the sheet's item card
/// (e.g. postcard title + creator + thumbnail).
class SoftAuthItem {
  final String title;
  final String? subtitle;
  final IconData? icon;

  const SoftAuthItem({
    required this.title,
    this.subtitle,
    this.icon,
  });
}

Future<bool> showSoftAuthSheet(
  BuildContext context,
  WidgetRef ref, {
  required SoftAuthTrigger trigger,
  SoftAuthItem? item,
}) async {
  // Guard: never show for authenticated users.
  final authState = ref.read(authProvider);
  if (authState.isAuthenticated) return true;

  final result = await showModalBottomSheet<bool>(
    context: context,
    isScrollControlled: true,
    backgroundColor: AppColors.surface,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
    ),
    builder: (_) => _SoftAuthSheet(trigger: trigger, item: item),
  );
  return result ?? false;
}

class _SoftAuthSheet extends ConsumerStatefulWidget {
  final SoftAuthTrigger trigger;
  final SoftAuthItem? item;

  const _SoftAuthSheet({required this.trigger, this.item});

  @override
  ConsumerState<_SoftAuthSheet> createState() => _SoftAuthSheetState();
}

class _SoftAuthSheetState extends ConsumerState<_SoftAuthSheet> {
  bool _oauthBusy = false;

  String get _title {
    switch (widget.trigger) {
      case SoftAuthTrigger.save:
        return 'Save this postcard?';
      case SoftAuthTrigger.follow:
        return 'Follow this creator?';
      case SoftAuthTrigger.book:
        return 'Book this experience?';
      case SoftAuthTrigger.comment:
        return 'Join the conversation?';
      case SoftAuthTrigger.like:
        return 'Like this postcard?';
    }
  }

  IconData get _defaultIcon {
    switch (widget.trigger) {
      case SoftAuthTrigger.save:
        return PhosphorIcons.bookmarkSimple(PhosphorIconsStyle.fill);
      case SoftAuthTrigger.follow:
        return PhosphorIcons.userPlus(PhosphorIconsStyle.fill);
      case SoftAuthTrigger.book:
        return PhosphorIcons.ticket(PhosphorIconsStyle.fill);
      case SoftAuthTrigger.comment:
        return PhosphorIcons.chatCircle(PhosphorIconsStyle.fill);
      case SoftAuthTrigger.like:
        return PhosphorIcons.heart(PhosphorIconsStyle.fill);
    }
  }

  void _dismiss(bool signedIn) {
    if (!mounted) return;
    Navigator.of(context).pop(signedIn);
  }

  void _continueWithPhone() {
    unawaited(HapticFeedback.selectionClick());
    _dismiss(false);
    if (!mounted) return;
    unawaited(context.push('/auth'));
  }

  Future<void> _continueWithGoogle() async {
    if (_oauthBusy) return;
    unawaited(HapticFeedback.selectionClick());
    setState(() => _oauthBusy = true);
    try {
      await ref.read(authProvider.notifier).signInWithGoogle();
      if (!mounted) return;
      _dismiss(ref.read(authProvider).isAuthenticated);
    } catch (_) {
      if (!mounted) return;
      setState(() => _oauthBusy = false);
    }
  }

  Future<void> _continueWithApple() async {
    if (_oauthBusy) return;
    unawaited(HapticFeedback.selectionClick());
    setState(() => _oauthBusy = true);
    try {
      await ref.read(authProvider.notifier).signInWithApple();
      if (!mounted) return;
      _dismiss(ref.read(authProvider).isAuthenticated);
    } catch (_) {
      if (!mounted) return;
      setState(() => _oauthBusy = false);
    }
  }

  void _keepBrowsing() {
    unawaited(HapticFeedback.selectionClick());
    _dismiss(false);
  }

  @override
  Widget build(BuildContext context) {
    final item = widget.item;

    return SafeArea(
      child: Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 12),
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.hairlineStrong,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 18, 20, 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    _title,
                    style: GoogleFonts.fraunces(
                      fontSize: 22,
                      fontWeight: FontWeight.w500,
                      color: AppColors.ink,
                      letterSpacing: -0.018 * 22,
                    ),
                  ),
                  if (item != null) ...[
                    const SizedBox(height: 12),
                    _ItemCard(item: item, fallbackIcon: _defaultIcon),
                  ] else
                    const SizedBox(height: 12),
                  const SizedBox(height: 16),
                  _DescriptionText(),
                  const SizedBox(height: 16),
                  AppButton(
                    label: 'Continue with phone',
                    variant: AppButtonVariant.primary,
                    size: AppButtonSize.large,
                    fullWidth: true,
                    onPressed: _oauthBusy ? null : _continueWithPhone,
                  ),
                  const SizedBox(height: 8),
                  _OAuthButton(
                    label: 'Continue with Google',
                    iconAsset: _GoogleG(),
                    isLoading: _oauthBusy,
                    onPressed: _continueWithGoogle,
                  ),
                  const SizedBox(height: 8),
                  _OAuthButton(
                    label: 'Continue with Apple',
                    iconAsset: const Icon(Icons.apple,
                        size: 20, color: AppColors.ink),
                    isLoading: _oauthBusy,
                    onPressed: _continueWithApple,
                  ),
                  const SizedBox(height: 4),
                  Center(
                    child: TextButton(
                      onPressed: _oauthBusy ? null : _keepBrowsing,
                      style: TextButton.styleFrom(
                        foregroundColor: AppColors.inkMuted,
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 10),
                      ),
                      child: Text(
                        'Keep browsing as guest',
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                          color: AppColors.inkMuted,
                        ),
                      ),
                    ),
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

class _DescriptionText extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return RichText(
      text: TextSpan(
        style: GoogleFonts.inter(
          fontSize: 13,
          color: AppColors.inkSoft,
          height: 1.55,
        ),
        children: [
          const TextSpan(
            text:
                'You need an account to save postcards, follow creators, and book experiences. ',
          ),
          TextSpan(
            text: '30 seconds.',
            style: GoogleFonts.inter(
              fontSize: 13,
              height: 1.55,
              color: AppColors.ink,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

class _ItemCard extends StatelessWidget {
  final SoftAuthItem item;
  final IconData fallbackIcon;

  const _ItemCard({required this.item, required this.fallbackIcon});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        children: [
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              color: AppColors.primaryTint,
              borderRadius: BorderRadius.circular(10),
            ),
            alignment: Alignment.center,
            child: Icon(
              item.icon ?? fallbackIcon,
              size: 22,
              color: AppColors.coral,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: AppColors.ink,
                  ),
                ),
                if (item.subtitle != null && item.subtitle!.isNotEmpty) ...[
                  const SizedBox(height: 2),
                  Text(
                    item.subtitle!,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      color: AppColors.inkMuted,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _OAuthButton extends StatelessWidget {
  final String label;
  final Widget iconAsset;
  final bool isLoading;
  final VoidCallback onPressed;

  const _OAuthButton({
    required this.label,
    required this.iconAsset,
    required this.isLoading,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 48,
      child: OutlinedButton(
        onPressed: isLoading ? null : onPressed,
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.ink,
          backgroundColor: AppColors.surface,
          side: const BorderSide(color: AppColors.hairlineStrong),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(width: 20, height: 20, child: iconAsset),
            const SizedBox(width: 10),
            Flexible(
              child: Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: GoogleFonts.inter(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: AppColors.ink,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Simple "G" glyph fallback — keeps the sheet asset-free (matches the
/// treatment on A2 phone-sign-in which also uses a glyph placeholder).
class _GoogleG extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Text(
        'G',
        style: GoogleFonts.inter(
          fontSize: 16,
          fontWeight: FontWeight.w700,
          color: AppColors.ink,
        ),
      ),
    );
  }
}
