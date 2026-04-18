import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../../../shared/components/button.dart';
import '../../../shared/components/skeleton.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/typography.dart';
import '../../legal/providers/dpdpa_provider.dart';

/// PrivacySettingsScreen — DPDPA compliance screen.
/// Accessible from You tab → Privacy & Data row.
class PrivacySettingsScreen extends ConsumerWidget {
  const PrivacySettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(
            PhosphorIcons.arrowLeft(PhosphorIconsStyle.regular),
            color: AppColors.ink,
            size: 22,
          ),
          onPressed: () {
            HapticFeedback.selectionClick();
            context.pop();
          },
        ),
        title: Text('Privacy & Data', style: AppTypography.h4),
        centerTitle: false,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // ── 1. Your Data ──────────────────────────────────
              const _SectionHeader(title: 'Your Data'),
              const SizedBox(height: 12),
              _DataExportCard(),
              const SizedBox(height: 24),

              // ── 2. Account Deletion ───────────────────────────
              const _SectionHeader(title: 'Account Deletion'),
              const SizedBox(height: 12),
              _DeletionSection(),
              const SizedBox(height: 24),

              // ── 3. Consent History ────────────────────────────
              const _SectionHeader(title: 'Consent History'),
              const SizedBox(height: 12),
              _ConsentHistoryCard(),
              const SizedBox(height: 24),

              // ── 4. Legal ─────────────────────────────────────
              const _SectionHeader(title: 'Legal'),
              const SizedBox(height: 12),
              _LegalLinksCard(),
              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── Section Header ────────────────────────────────────────────

class _SectionHeader extends StatelessWidget {
  final String title;
  const _SectionHeader({required this.title});

  @override
  Widget build(BuildContext context) {
    return Text(
      title.toUpperCase(),
      style: AppTypography.label.copyWith(
        color: AppColors.inkMuted,
        letterSpacing: 0.8,
      ),
    );
  }
}

// ─── Data Export Card ─────────────────────────────────────────

class _DataExportCard extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final actionsAsync = ref.watch(dpdpaActionsProvider);
    final isLoading = actionsAsync.isLoading;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.hairline, width: 0.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                PhosphorIcons.downloadSimple(PhosphorIconsStyle.regular),
                size: 20,
                color: AppColors.ink,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  'Download your data',
                  style: AppTypography.body.copyWith(fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            'Export a copy of your profile, content, bookings, and reviews as JSON.',
            style: AppTypography.bodySmall.copyWith(color: AppColors.inkSoft),
          ),
          const SizedBox(height: 14),
          AppButton(
            label: 'Request Data Export',
            variant: AppButtonVariant.secondary,
            fullWidth: true,
            isLoading: isLoading,
            onPressed: () => unawaited(_onExport(context, ref)),
          ),
        ],
      ),
    );
  }

  Future<void> _onExport(BuildContext context, WidgetRef ref) async {
    HapticFeedback.lightImpact();
    try {
      await ref.read(dpdpaActionsProvider.notifier).exportData();
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Data export ready — check your downloads.',
              style: AppTypography.bodySmall.copyWith(color: AppColors.surface),
            ),
            backgroundColor: AppColors.success,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (_) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Failed to export data. Please try again.',
              style: AppTypography.bodySmall.copyWith(color: AppColors.surface),
            ),
            backgroundColor: AppColors.danger,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }
}

// ─── Deletion Section ─────────────────────────────────────────

class _DeletionSection extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final deletionAsync = ref.watch(deletionStatusProvider);

    return deletionAsync.when(
      loading: () => const SkeletonRect(height: 110, borderRadius: 14),
      error: (e, s) => _DeletionError(),
      data: (status) {
        if (status.isPending && status.scheduledFor != null) {
          return _DeletionPendingCard(
            scheduledFor: status.scheduledFor!,
            onCancel: () => unawaited(_onCancelDeletion(context, ref)),
          );
        }
        return _DeleteAccountCard(
          onDelete: () => unawaited(_onRequestDeletion(context, ref)),
        );
      },
    );
  }

  Future<void> _onRequestDeletion(BuildContext context, WidgetRef ref) async {
    HapticFeedback.heavyImpact();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => _DeleteAccountDialog(context: ctx),
    );

    if (confirmed != true || !context.mounted) return;

    try {
      final scheduledFor =
          await ref.read(dpdpaActionsProvider.notifier).requestDeletion();
      if (context.mounted) {
        final date =
            '${scheduledFor.day}/${scheduledFor.month}/${scheduledFor.year}';
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Deletion scheduled for $date. You can cancel within 30 days.',
              style: AppTypography.bodySmall.copyWith(color: AppColors.surface),
            ),
            backgroundColor: AppColors.warning,
            behavior: SnackBarBehavior.floating,
            duration: const Duration(seconds: 5),
          ),
        );
      }
    } catch (_) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Failed to schedule deletion. Please try again.',
              style: AppTypography.bodySmall.copyWith(color: AppColors.surface),
            ),
            backgroundColor: AppColors.danger,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  Future<void> _onCancelDeletion(BuildContext context, WidgetRef ref) async {
    HapticFeedback.lightImpact();
    try {
      await ref.read(dpdpaActionsProvider.notifier).cancelDeletion();
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Account deletion cancelled. Your account is safe.',
              style: AppTypography.bodySmall.copyWith(color: AppColors.surface),
            ),
            backgroundColor: AppColors.success,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (_) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Failed to cancel deletion. Please try again.',
              style: AppTypography.bodySmall.copyWith(color: AppColors.surface),
            ),
            backgroundColor: AppColors.danger,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }
}

class _DeleteAccountCard extends StatelessWidget {
  final VoidCallback onDelete;
  const _DeleteAccountCard({required this.onDelete});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.hairline, width: 0.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                PhosphorIcons.trash(PhosphorIconsStyle.regular),
                size: 20,
                color: AppColors.danger,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  'Delete Account',
                  style: AppTypography.body.copyWith(
                    fontWeight: FontWeight.w600,
                    color: AppColors.danger,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            'Permanently delete your account and all associated data. A 30-day grace period applies.',
            style: AppTypography.bodySmall.copyWith(color: AppColors.inkSoft),
          ),
          const SizedBox(height: 14),
          AppButton(
            label: 'Delete my account',
            variant: AppButtonVariant.danger,
            fullWidth: true,
            onPressed: onDelete,
          ),
        ],
      ),
    );
  }
}

class _DeletionPendingCard extends StatelessWidget {
  final DateTime scheduledFor;
  final VoidCallback onCancel;

  const _DeletionPendingCard({
    required this.scheduledFor,
    required this.onCancel,
  });

  @override
  Widget build(BuildContext context) {
    final dateStr =
        '${scheduledFor.day}/${scheduledFor.month}/${scheduledFor.year}';

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.warningSurface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.warning.withValues(alpha: 0.4)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                PhosphorIcons.warning(PhosphorIconsStyle.fill),
                size: 20,
                color: AppColors.warning,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  'Deletion scheduled for $dateStr',
                  style: AppTypography.body.copyWith(
                    fontWeight: FontWeight.w600,
                    color: AppColors.warning,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            'Your account and all data will be permanently deleted on this date. You can cancel anytime before then.',
            style: AppTypography.bodySmall.copyWith(
              color: AppColors.warning,
            ),
          ),
          const SizedBox(height: 12),
          GestureDetector(
            onTap: () {
              HapticFeedback.selectionClick();
              onCancel();
            },
            child: Text(
              'Cancel deletion',
              style: AppTypography.bodySmall.copyWith(
                color: AppColors.warning,
                fontWeight: FontWeight.w600,
                decoration: TextDecoration.underline,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _DeletionError extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surfaceAlt,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.hairline, width: 0.5),
      ),
      child: Text(
        'Unable to load deletion status. Please try again later.',
        style: AppTypography.bodySmall.copyWith(color: AppColors.inkSoft),
      ),
    );
  }
}

// ─── Delete Account Confirmation Dialog ───────────────────────

class _DeleteAccountDialog extends StatelessWidget {
  final BuildContext context;
  const _DeleteAccountDialog({required this.context});

  @override
  Widget build(BuildContext buildContext) {
    return AlertDialog(
      backgroundColor: AppColors.surface,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      title: Text('Delete Account?', style: AppTypography.h4),
      content: Text(
        'Your account will be scheduled for permanent deletion in 30 days. '
        'All your content, bookings, and data will be erased. '
        'You can cancel within this grace period.',
        style: AppTypography.body.copyWith(color: AppColors.inkSoft, height: 1.5),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(buildContext).pop(false),
          child: Text(
            'Keep account',
            style: AppTypography.body.copyWith(color: AppColors.inkSoft),
          ),
        ),
        TextButton(
          onPressed: () {
            HapticFeedback.heavyImpact();
            Navigator.of(buildContext).pop(true);
          },
          child: Text(
            'Delete',
            style: AppTypography.body.copyWith(color: AppColors.danger),
          ),
        ),
      ],
    );
  }
}

// ─── Consent History Card ─────────────────────────────────────

class _ConsentHistoryCard extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final consentAsync = ref.watch(consentStatusProvider);

    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.hairline, width: 0.5),
      ),
      clipBehavior: Clip.antiAlias,
      child: consentAsync.when(
        loading: () => const Padding(
          padding: EdgeInsets.all(16),
          child: Column(
            children: [
              SkeletonRect(height: 20, borderRadius: 4),
              SizedBox(height: 12),
              SkeletonRect(height: 20, borderRadius: 4),
              SizedBox(height: 12),
              SkeletonRect(height: 20, borderRadius: 4),
            ],
          ),
        ),
        error: (e, s) => Padding(
          padding: const EdgeInsets.all(16),
          child: Text(
            'Unable to load consent history.',
            style: AppTypography.bodySmall.copyWith(color: AppColors.inkSoft),
          ),
        ),
        data: (status) => Column(
          children: [
            _ConsentRow(
              label: 'Terms of Service',
              version: status.termsOfService,
            ),
            const Divider(height: 0.5, thickness: 0.5, color: AppColors.hairline, indent: 16),
            _ConsentRow(
              label: 'Privacy Policy',
              version: status.privacyPolicy,
            ),
            const Divider(height: 0.5, thickness: 0.5, color: AppColors.hairline, indent: 16),
            _ConsentRow(
              label: 'Content T&C',
              version: status.contentTnc,
            ),
          ],
        ),
      ),
    );
  }
}

class _ConsentRow extends StatelessWidget {
  final String label;
  final String? version;

  const _ConsentRow({required this.label, this.version});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          Expanded(
            child: Text(label, style: AppTypography.body),
          ),
          Text(
            version != null ? 'Accepted $version' : 'Not yet accepted',
            style: AppTypography.bodySmall.copyWith(
              color: version != null ? AppColors.success : AppColors.inkMuted,
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Legal Links Card ─────────────────────────────────────────

class _LegalLinksCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.hairline, width: 0.5),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        children: [
          _LegalRow(
            label: 'Terms of Service',
            onTap: () => context.push('/legal/terms'),
          ),
          const Divider(height: 0.5, thickness: 0.5, color: AppColors.hairline, indent: 48),
          _LegalRow(
            label: 'Privacy Policy',
            onTap: () => context.push('/legal/privacy'),
          ),
          const Divider(height: 0.5, thickness: 0.5, color: AppColors.hairline, indent: 48),
          _LegalRow(
            label: 'Community Guidelines',
            onTap: () => context.push('/legal/guidelines'),
          ),
        ],
      ),
    );
  }
}

class _LegalRow extends StatelessWidget {
  final String label;
  final VoidCallback onTap;

  const _LegalRow({required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () {
        HapticFeedback.selectionClick();
        onTap();
      },
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            Icon(
              PhosphorIcons.fileText(PhosphorIconsStyle.regular),
              size: 20,
              color: AppColors.ink,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(label, style: AppTypography.body),
            ),
            Icon(
              PhosphorIcons.caretRight(PhosphorIconsStyle.regular),
              size: 16,
              color: AppColors.inkMuted,
            ),
          ],
        ),
      ),
    );
  }
}
