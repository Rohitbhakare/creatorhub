import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../../features/auth/providers/auth_provider.dart';
import '../theme/colors.dart';
import '../theme/layout.dart';
import '../theme/spacing.dart';
import '../theme/typography.dart';
import 'button.dart';

// ── Report categories (TRUST-FR-001) ─────────────────────────────────

enum ReportReason {
  spam('Spam or misleading', "It's repetitive, irrelevant, or deceptive."),
  hateSpeech('Hate speech', 'It promotes hate or discrimination.'),
  misinformation('Misinformation', 'It contains false or misleading facts.'),
  nudity('Nudity or adult content', 'It shows inappropriate content.'),
  violence('Violence or harmful acts', 'It glorifies violence or self-harm.'),
  intellectual('Intellectual property', 'It violates copyright or trademark.'),
  other('Something else', 'It violates community guidelines in another way.');

  const ReportReason(this.label, this.sublabel);
  final String label;
  final String sublabel;
}

// ── Entry point ───────────────────────────────────────────────────────

/// Show the report sheet for any content item.
/// [contentId]: the UUID of the content being reported.
/// [contentType]: 'post' | 'itinerary' | 'experience' | 'event'
Future<void> showReportSheet(
  BuildContext context, {
  required String contentId,
  required String contentType,
}) {
  HapticFeedback.lightImpact();
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => _ReportSheet(contentId: contentId, contentType: contentType),
  );
}

// ── Sheet widget ──────────────────────────────────────────────────────

class _ReportSheet extends ConsumerStatefulWidget {
  final String contentId;
  final String contentType;

  const _ReportSheet({
    required this.contentId,
    required this.contentType,
  });

  @override
  ConsumerState<_ReportSheet> createState() => _ReportSheetState();
}

class _ReportSheetState extends ConsumerState<_ReportSheet> {
  ReportReason? _selected;
  final _descController = TextEditingController();
  bool _submitting = false;
  bool _submitted = false;
  String? _error;

  @override
  void dispose() {
    _descController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_selected == null) return;
    setState(() {
      _submitting = true;
      _error = null;
    });
    HapticFeedback.lightImpact();

    try {
      final dio = ref.read(authServiceProvider).dio;
      await dio.post('/api/v1/trust/reports', data: {
        'content_id': widget.contentId,
        'content_type': widget.contentType,
        'reason': _selected!.name,
        if (_descController.text.trim().isNotEmpty)
          'description': _descController.text.trim(),
      });
      if (mounted) setState(() => _submitted = true);
    } on DioException catch (e) {
      if (mounted) {
        setState(() {
          _error = (e.response?.data as Map<String, dynamic>?)?['title'] as String? ??
              'Could not submit report. Try again.';
          _submitting = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _error = 'Could not submit report. Try again.';
          _submitting = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.paddingOf(context).bottom;

    return Container(
      decoration: const BoxDecoration(
        color: AppColors.bg,
        borderRadius: BorderRadius.vertical(top: Radius.circular(Layout.sheetRadius)),
      ),
      padding: EdgeInsets.fromLTRB(
        Spacing.xl,
        Spacing.lg,
        Spacing.xl,
        bottom + Spacing.xl,
      ),
      child: _submitted ? _SuccessView(onDone: () => Navigator.of(context).pop()) : _FormView(
        selected: _selected,
        descController: _descController,
        submitting: _submitting,
        error: _error,
        onSelect: (r) {
          HapticFeedback.selectionClick();
          setState(() => _selected = r);
        },
        onSubmit: _submit,
      ),
    );
  }
}

// ── Form view ─────────────────────────────────────────────────────────

class _FormView extends StatelessWidget {
  final ReportReason? selected;
  final TextEditingController descController;
  final bool submitting;
  final String? error;
  final ValueChanged<ReportReason> onSelect;
  final VoidCallback onSubmit;

  const _FormView({
    required this.selected,
    required this.descController,
    required this.submitting,
    required this.error,
    required this.onSelect,
    required this.onSubmit,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Handle
        Center(
          child: Container(
            width: Layout.sheetHandleWidth,
            height: Layout.sheetHandleHeight,
            decoration: BoxDecoration(
              color: AppColors.hairlineStrong.withValues(alpha: 0.3),
              borderRadius: BorderRadius.circular(Layout.sheetHandleHeight / 2),
            ),
          ),
        ),
        const SizedBox(height: Spacing.lg),

        Text('Report content', style: AppTypography.h4),
        const SizedBox(height: Spacing.xs),
        Text(
          'Why are you reporting this?',
          style: AppTypography.body.copyWith(color: AppColors.inkSoft),
        ),
        const SizedBox(height: Spacing.lg),

        // Reason list
        ...ReportReason.values.map((r) => _ReasonTile(
              reason: r,
              isSelected: selected == r,
              onTap: () => onSelect(r),
            )),

        const SizedBox(height: Spacing.md),

        // Optional description
        if (selected != null) ...[
          TextField(
            controller: descController,
            maxLines: 3,
            maxLength: 300,
            style: AppTypography.body,
            decoration: InputDecoration(
              hintText: 'Add details (optional)',
              hintStyle: AppTypography.body.copyWith(color: AppColors.inkFaint),
              filled: true,
              fillColor: AppColors.surface,
              contentPadding: const EdgeInsets.all(Spacing.md),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(Layout.inputRadius),
                borderSide: const BorderSide(color: AppColors.hairline),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(Layout.inputRadius),
                borderSide: const BorderSide(color: AppColors.hairline),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(Layout.inputRadius),
                borderSide: const BorderSide(color: AppColors.ink, width: 1.5),
              ),
              counterText: '',
            ),
          ),
          const SizedBox(height: Spacing.md),
        ],

        // Error
        if (error != null) ...[
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(Spacing.md),
            decoration: BoxDecoration(
              color: AppColors.dangerSurface,
              borderRadius: BorderRadius.circular(Layout.cardRadius),
            ),
            child: Text(
              error!,
              style: AppTypography.bodySmall.copyWith(color: AppColors.danger),
            ),
          ),
          const SizedBox(height: Spacing.md),
        ],

        AppButton(
          label: submitting ? 'Submitting…' : 'Submit report',
          onPressed: selected == null || submitting ? null : onSubmit,
          variant: AppButtonVariant.primary,
          fullWidth: true,
        ),
      ],
    );
  }
}

class _ReasonTile extends StatelessWidget {
  final ReportReason reason;
  final bool isSelected;
  final VoidCallback onTap;

  const _ReasonTile({
    required this.reason,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Container(
        width: double.infinity,
        margin: const EdgeInsets.only(bottom: Spacing.sm),
        padding: const EdgeInsets.symmetric(
          horizontal: Spacing.md,
          vertical: Spacing.sm + 2,
        ),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primaryTint : AppColors.surface,
          borderRadius: BorderRadius.circular(Layout.cardRadius),
          border: Border.all(
            color: isSelected ? AppColors.coral : AppColors.hairline,
            width: isSelected ? 1.5 : 1.0,
          ),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    reason.label,
                    style: AppTypography.body.copyWith(
                      fontWeight: FontWeight.w500,
                      color: isSelected ? AppColors.coral : AppColors.ink,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    reason.sublabel,
                    style: AppTypography.caption.copyWith(color: AppColors.inkSoft),
                  ),
                ],
              ),
            ),
            if (isSelected)
              Container(
                width: 20,
                height: 20,
                decoration: const BoxDecoration(
                  color: AppColors.coral,
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.check, size: 13, color: Colors.white),
              )
            else
              Container(
                width: 20,
                height: 20,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: AppColors.hairlineStrong),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

// ── Success view ──────────────────────────────────────────────────────

class _SuccessView extends StatelessWidget {
  final VoidCallback onDone;

  const _SuccessView({required this.onDone});

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Center(
          child: Container(
            width: Layout.sheetHandleWidth,
            height: Layout.sheetHandleHeight,
            decoration: BoxDecoration(
              color: AppColors.hairlineStrong.withValues(alpha: 0.3),
              borderRadius: BorderRadius.circular(Layout.sheetHandleHeight / 2),
            ),
          ),
        ),
        const SizedBox(height: Spacing.xl),
        Container(
          width: 56,
          height: 56,
          decoration: BoxDecoration(
            color: AppColors.successSurface,
            shape: BoxShape.circle,
          ),
          child: Icon(
            PhosphorIcons.checkCircle(PhosphorIconsStyle.fill),
            size: 28,
            color: AppColors.success,
          ),
        ),
        const SizedBox(height: Spacing.lg),
        Text('Report submitted', style: AppTypography.h4),
        const SizedBox(height: Spacing.xs),
        Text(
          'Thanks for keeping CreatorHub safe. Our team will review this shortly.',
          style: AppTypography.body.copyWith(color: AppColors.inkSoft),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: Spacing.xl),
        AppButton(
          label: 'Done',
          onPressed: onDone,
          variant: AppButtonVariant.secondary,
          fullWidth: true,
        ),
      ],
    );
  }
}
