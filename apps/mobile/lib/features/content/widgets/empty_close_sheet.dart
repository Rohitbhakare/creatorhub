import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../shared/components/button.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/layout.dart';
import '../../../shared/theme/spacing.dart';
import '../../../shared/theme/typography.dart' as typ;

/// Empty-close prompt sheet (DD-033).
///
/// Shown when the user taps the X (or back from Step 1) on a wizard with
/// any unsaved input — including the case where a stub draft has already
/// been created on the API but not yet published.
///
/// Two outcomes:
/// - "Save draft" → calls [onSaveDraft]. The shell flushes pending edits
///   via the auto-save service and pops; the server keeps the draft row.
/// - "Discard"   → calls [onDiscard]. The shell DELETEs the draft row (if
///   one was created) and pops.
///
/// The callbacks are responsible for closing the sheet (`Navigator.pop`)
/// and the wizard route (`context.pop`) — this widget only renders the UI.
Future<void> showEmptyCloseSheet(
  BuildContext context, {
  required VoidCallback onDiscard,
  required VoidCallback onSaveDraft,
}) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: AppColors.surface,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(
        top: Radius.circular(Layout.sheetRadius),
      ),
    ),
    builder: (ctx) => _EmptyCloseSheet(
      onDiscard: onDiscard,
      onSaveDraft: onSaveDraft,
    ),
  );
}

class _EmptyCloseSheet extends StatelessWidget {
  final VoidCallback onDiscard;
  final VoidCallback onSaveDraft;

  const _EmptyCloseSheet({
    required this.onDiscard,
    required this.onSaveDraft,
  });

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(
          Layout.screenPaddingH,
          Spacing.lg,
          Layout.screenPaddingH,
          Spacing.xl,
        ),
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
                  color: AppColors.hairlineStrong.withValues(alpha: 0.3),
                  borderRadius:
                      BorderRadius.circular(Layout.sheetHandleHeight / 2),
                ),
              ),
            ),
            const SizedBox(height: Spacing.xl),

            Text('Save your progress?', style: typ.AppTypography.h3),
            const SizedBox(height: Spacing.sm),
            Text(
              "You haven't published yet — save it as a draft to come back to.",
              style:
                  typ.AppTypography.body.copyWith(color: AppColors.inkSoft),
            ),
            const SizedBox(height: Spacing.xl),

            // Primary CTA — Save draft (coral, full-width)
            AppButton(
              label: 'Save draft',
              onPressed: () {
                HapticFeedback.lightImpact();
                onSaveDraft();
              },
              variant: AppButtonVariant.primary,
              size: AppButtonSize.large,
              fullWidth: true,
            ),
            const SizedBox(height: Spacing.sm),

            // Secondary CTA — Discard (outline)
            AppButton(
              label: 'Discard',
              onPressed: () {
                HapticFeedback.lightImpact();
                onDiscard();
              },
              variant: AppButtonVariant.secondary,
              size: AppButtonSize.large,
              fullWidth: true,
            ),
          ],
        ),
      ),
    );
  }
}
