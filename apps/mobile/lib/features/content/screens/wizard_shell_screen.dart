import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart' show PhosphorIconsFill;

import '../../../shared/theme/colors.dart';
import '../../../shared/theme/typography.dart' as typ;
import '../../../shared/theme/spacing.dart';
import '../../../shared/theme/layout.dart';
import '../../../shared/components/button.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/wizard_provider.dart';
import '../services/draft_auto_save_service.dart';
import '../widgets/wizard_step_indicator.dart';
import '../widgets/steps/basics_step.dart';
import '../widgets/steps/pricing_step.dart';
import '../widgets/steps/review_step.dart';

/// The wizard shell screen — a reusable container for multi-step
/// content creation. Handles step navigation, auto-save, and
/// discard confirmation.
class WizardShellScreen extends ConsumerStatefulWidget {
  const WizardShellScreen({super.key});

  @override
  ConsumerState<WizardShellScreen> createState() => _WizardShellScreenState();
}

class _WizardShellScreenState extends ConsumerState<WizardShellScreen> {
  DraftAutoSaveService? _autoSave;

  @override
  void initState() {
    super.initState();

    // Start auto-save timer
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final dio = ref.read(authServiceProvider).dio;
      _autoSave = DraftAutoSaveService(ref: ref, dio: dio);
      _autoSave!.start();
    });
  }

  @override
  void dispose() {
    _autoSave?.dispose();
    super.dispose();
  }

  void _onBack() {
    HapticFeedback.lightImpact();
    final wizard = ref.read(wizardProvider);

    if (wizard.currentStep == 1) {
      // Show discard dialog
      _showDiscardDialog();
    } else {
      ref.read(wizardProvider.notifier).prevStep();
    }
  }

  void _onNext() {
    HapticFeedback.lightImpact();
    ref.read(wizardProvider.notifier).nextStep();
    _autoSave?.reset();
  }

  Future<void> _onPublish() async {
    unawaited(HapticFeedback.lightImpact());
    final wizard = ref.read(wizardProvider);
    if (!wizard.tncAccepted) return;

    ref.read(wizardProvider.notifier).markSaving();

    try {
      final dio = ref.read(authServiceProvider).dio;
      final contentId = wizard.contentId;

      if (contentId != null) {
        // Publish existing draft
        await dio.post('/api/v1/content/$contentId/publish');
      } else {
        // Create and publish in one call
        await dio.post('/api/v1/content', data: {
          'content_type': wizard.contentType.name,
          'title': wizard.title,
          'description': wizard.description,
          if (wizard.contentType == ContentType.post) 'body': wizard.body,
          'vertical': wizard.vertical,
          'tags': wizard.tags,
          'pricing_model': wizard.pricingModel,
          'price_paisa': wizard.pricePaisa,
          'status': 'published',
        });
      }

      ref.read(wizardProvider.notifier).markSaved();

      if (mounted) {
        // Navigate back to home or content list
        context.go('/');
      }
    } catch (e) {
      ref
          .read(wizardProvider.notifier)
          .markSaveError('Failed to publish. Please try again.');

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Failed to publish. Please try again.',
              style:
                  typ.AppTypography.bodySmall.copyWith(color: AppColors.white),
            ),
            backgroundColor: AppColors.danger,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(Layout.cardRadius),
            ),
          ),
        );
      }
    }
  }

  void _showDiscardDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.surface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(Layout.cardRadius),
        ),
        title: Text('Discard draft?', style: typ.AppTypography.h3),
        content: Text(
          'Your unsaved changes will be lost.',
          style: typ.AppTypography.body.copyWith(color: AppColors.muted),
        ),
        actions: [
          TextButton(
            onPressed: () {
              HapticFeedback.lightImpact();
              Navigator.of(context).pop();
            },
            child: Text(
              'Keep editing',
              style: typ.AppTypography.body.copyWith(
                fontWeight: FontWeight.w600,
                color: AppColors.ink,
              ),
            ),
          ),
          TextButton(
            onPressed: () {
              HapticFeedback.lightImpact();
              Navigator.of(context).pop();
              this.context.pop();
            },
            child: Text(
              'Discard',
              style: typ.AppTypography.body.copyWith(
                fontWeight: FontWeight.w600,
                color: AppColors.danger,
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final wizard = ref.watch(wizardProvider);

    return Scaffold(
      backgroundColor: AppColors.surface,
      body: SafeArea(
        child: Column(
          children: [
            const SizedBox(height: Spacing.sm),

            // Top bar with close button and save status
            Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: Layout.screenPaddingH,
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // Close button
                  GestureDetector(
                    onTap: _onBack,
                    behavior: HitTestBehavior.opaque,
                    child: const SizedBox(
                      width: Layout.minTapTarget,
                      height: Layout.minTapTarget,
                      child: Align(
                        alignment: Alignment.centerLeft,
                        child: Icon(
                          PhosphorIconsFill.x,
                          size: 24,
                          color: AppColors.ink,
                        ),
                      ),
                    ),
                  ),

                  // Save status indicator
                  _SaveStatusIndicator(wizard: wizard),
                ],
              ),
            ),

            // Step indicator
            WizardStepIndicator(
              currentStep: wizard.currentStep,
              totalSteps: wizard.totalSteps,
              stepName: wizard.currentStepName,
            ),
            const SizedBox(height: Spacing.sm),

            // Step content
            Expanded(child: _buildStepContent(wizard)),

            // Bottom navigation bar
            _BottomNavBar(
              currentStep: wizard.currentStep,
              totalSteps: wizard.totalSteps,
              canAdvance: wizard.canAdvance,
              isLastStep: wizard.isLastStep,
              isSaving: wizard.isSaving,
              onBack: _onBack,
              onNext: _onNext,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStepContent(WizardState wizard) {
    return switch (wizard.contentType) {
      ContentType.post => _buildPostStep(wizard.currentStep),
      ContentType.selfPacedItinerary =>
        _buildItineraryStep(wizard.currentStep),
      ContentType.event => _buildEventStep(wizard.currentStep),
      ContentType.scheduledExperience =>
        _buildExperienceStep(wizard.currentStep),
    };
  }

  Widget _buildPostStep(int step) {
    return switch (step) {
      1 => const BasicsStep(),
      2 => _buildPlaceholderStep('Media', 'Add photos to your post'),
      3 => ReviewStep(onPublish: _onPublish),
      _ => const SizedBox.shrink(),
    };
  }

  Widget _buildItineraryStep(int step) {
    return switch (step) {
      1 => const BasicsStep(),
      2 =>
        _buildPlaceholderStep('Details', 'Add destinations and day count'),
      3 => _buildPlaceholderStep('Itinerary', 'Build your day-by-day plan'),
      4 => _buildPlaceholderStep('Media', 'Add photos to your itinerary'),
      5 => const PricingStep(),
      6 => ReviewStep(onPublish: _onPublish),
      _ => const SizedBox.shrink(),
    };
  }

  Widget _buildEventStep(int step) {
    return switch (step) {
      1 => const BasicsStep(),
      2 => _buildPlaceholderStep('Details', 'Add event details'),
      3 => _buildPlaceholderStep('Media', 'Add photos to your event'),
      4 => const PricingStep(),
      5 => ReviewStep(onPublish: _onPublish),
      _ => const SizedBox.shrink(),
    };
  }

  Widget _buildExperienceStep(int step) {
    return switch (step) {
      1 => const BasicsStep(),
      2 => _buildPlaceholderStep('Details', 'Add experience details'),
      3 => _buildPlaceholderStep('Media', 'Add photos'),
      4 => const PricingStep(),
      5 => ReviewStep(onPublish: _onPublish),
      _ => const SizedBox.shrink(),
    };
  }

  /// Placeholder for steps not yet implemented (Media, Details, Itinerary).
  Widget _buildPlaceholderStep(String title, String subtitle) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: Layout.screenPaddingH,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              PhosphorIconsFill.wrench,
              size: 48,
              color: AppColors.softInk,
            ),
            const SizedBox(height: Spacing.lg),
            Text(title, style: typ.AppTypography.h3),
            const SizedBox(height: Spacing.sm),
            Text(
              subtitle,
              style: typ.AppTypography.body.copyWith(color: AppColors.muted),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: Spacing.sm),
            Text(
              'This step will be built in a future sprint',
              style: typ.AppTypography.caption,
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

/// Save status indicator showing saved/saving/error state.
class _SaveStatusIndicator extends StatelessWidget {
  final WizardState wizard;

  const _SaveStatusIndicator({required this.wizard});

  @override
  Widget build(BuildContext context) {
    if (wizard.isSaving) {
      return Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const SizedBox(
            width: 12,
            height: 12,
            child: CircularProgressIndicator(
              strokeWidth: 1.5,
              color: AppColors.muted,
            ),
          ),
          const SizedBox(width: Spacing.xs),
          Text(
            'Saving...',
            style: typ.AppTypography.caption,
          ),
        ],
      );
    }

    if (wizard.saveError != null) {
      return Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(
            PhosphorIconsFill.warningCircle,
            size: 14,
            color: AppColors.danger,
          ),
          const SizedBox(width: Spacing.xs),
          Text(
            'Save failed',
            style: typ.AppTypography.caption.copyWith(
              color: AppColors.danger,
            ),
          ),
        ],
      );
    }

    if (wizard.lastSavedAt != null) {
      return Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(
            PhosphorIconsFill.checkCircle,
            size: 14,
            color: AppColors.success,
          ),
          const SizedBox(width: Spacing.xs),
          Text(
            'Saved',
            style: typ.AppTypography.caption.copyWith(
              color: AppColors.success,
            ),
          ),
        ],
      );
    }

    // Not yet saved (no contentId)
    return const SizedBox.shrink();
  }
}

/// Bottom navigation bar with Back and Next/Publish buttons.
class _BottomNavBar extends StatelessWidget {
  final int currentStep;
  final int totalSteps;
  final bool canAdvance;
  final bool isLastStep;
  final bool isSaving;
  final VoidCallback onBack;
  final VoidCallback onNext;

  const _BottomNavBar({
    required this.currentStep,
    required this.totalSteps,
    required this.canAdvance,
    required this.isLastStep,
    required this.isSaving,
    required this.onBack,
    required this.onNext,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: Layout.screenPaddingH,
        vertical: Spacing.md,
      ),
      decoration: const BoxDecoration(
        color: AppColors.surface,
        border: Border(
          top: BorderSide(color: AppColors.border, width: 1),
        ),
      ),
      child: Row(
        children: [
          // Back button
          Expanded(
            child: AppButton(
              label: currentStep == 1 ? 'Cancel' : 'Back',
              onPressed: onBack,
              variant: AppButtonVariant.secondary,
              size: AppButtonSize.large,
              fullWidth: true,
              leadingIcon: currentStep > 1
                  ? PhosphorIconsFill.arrowLeft
                  : null,
            ),
          ),
          const SizedBox(width: Spacing.md),

          // Next / Publish button (last step uses Publish which is
          // handled by ReviewStep directly, so we still show Next
          // unless on the last step)
          if (!isLastStep)
            Expanded(
              child: AppButton(
                label: 'Next',
                onPressed: canAdvance ? onNext : null,
                variant: AppButtonVariant.primary,
                size: AppButtonSize.large,
                fullWidth: true,
                trailingIcon: PhosphorIconsFill.arrowRight,
              ),
            ),
        ],
      ),
    );
  }
}
