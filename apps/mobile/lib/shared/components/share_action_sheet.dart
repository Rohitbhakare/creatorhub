import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../../features/social/utils/share_utils.dart';
import '../theme/colors.dart';
import '../theme/layout.dart';
import '../theme/spacing.dart';
import '../theme/typography.dart';

/// Open the canonical share action sheet for any content item.
///
/// Wraps `share_utils.dart` calls. The sheet shows three rows: WhatsApp,
/// Copy link, More… (native share). Each tap also fires `recordShare()`.
///
/// Caller must provide a [WidgetRef] because the underlying utils read
/// the auth-aware Dio instance from Riverpod for analytics.
Future<void> showShareActionSheet({
  required BuildContext context,
  required WidgetRef ref,
  required String contentId,
  required String contentType,
  required String contentTitle,
  required String shareUrl,
}) async {
  unawaited(HapticFeedback.lightImpact());
  await showModalBottomSheet<void>(
    context: context,
    backgroundColor: AppColors.surface,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(
        top: Radius.circular(Layout.sheetRadius),
      ),
    ),
    builder: (sheetContext) => _ShareSheet(
      ref: ref,
      contentId: contentId,
      contentType: contentType,
      contentTitle: contentTitle,
      shareUrl: shareUrl,
    ),
  );
}

class _ShareSheet extends StatelessWidget {
  final WidgetRef ref;
  final String contentId;
  final String contentType;
  final String contentTitle;
  final String shareUrl;

  const _ShareSheet({
    required this.ref,
    required this.contentId,
    required this.contentType,
    required this.contentTitle,
    required this.shareUrl,
  });

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Drag handle
          Padding(
            padding: const EdgeInsets.only(top: Spacing.md),
            child: Container(
              width: Layout.sheetHandleWidth,
              height: Layout.sheetHandleHeight,
              decoration: BoxDecoration(
                color: AppColors.hairlineStrong.withValues(alpha: 0.3),
                borderRadius:
                    BorderRadius.circular(Layout.sheetHandleHeight / 2),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(
              Spacing.xl,
              Spacing.lg,
              Spacing.xl,
              Spacing.sm,
            ),
            child: Row(
              children: [
                Text('Share', style: AppTypography.h4),
              ],
            ),
          ),
          _ShareRow(
            icon: PhosphorIcons.whatsappLogo(),
            label: 'WhatsApp',
            onTap: () async {
              Navigator.of(context).pop();
              await shareWhatsApp(
                title: contentTitle,
                contentId: contentId,
                contentType: contentType,
                ref: ref,
              );
            },
          ),
          _ShareRow(
            icon: PhosphorIcons.link(),
            label: 'Copy link',
            onTap: () async {
              Navigator.of(context).pop();
              await copyLink(
                contentId: contentId,
                contentType: contentType,
                ref: ref,
              );
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Link copied to clipboard'),
                    duration: Duration(seconds: 2),
                    behavior: SnackBarBehavior.floating,
                  ),
                );
              }
            },
          ),
          _ShareRow(
            icon: PhosphorIcons.dotsThreeOutline(),
            label: 'More…',
            onTap: () async {
              Navigator.of(context).pop();
              await shareNative(
                title: contentTitle,
                contentId: contentId,
                contentType: contentType,
                ref: ref,
                context: context,
              );
            },
          ),
          const SizedBox(height: Spacing.md),
        ],
      ),
    );
  }
}

class _ShareRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _ShareRow({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () {
        HapticFeedback.lightImpact();
        onTap();
      },
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: Spacing.xl,
          vertical: Spacing.md,
        ),
        child: Row(
          children: [
            Icon(icon, size: 24, color: AppColors.ink),
            const SizedBox(width: Spacing.lg),
            Text(
              label,
              style: AppTypography.bodyLarge.copyWith(
                color: AppColors.ink,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
