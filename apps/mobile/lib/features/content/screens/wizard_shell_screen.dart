import 'dart:async';

import 'package:dio/dio.dart';
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
import '../widgets/steps/media_step.dart';
import '../widgets/steps/pricing_step.dart';
import '../widgets/steps/review_step.dart';
import '../../posts/widgets/post_media_step.dart';
import '../../itineraries/widgets/trip_overview_step.dart';
import '../../itineraries/screens/day_builder_screen.dart';
import '../../events/providers/event_wizard_provider.dart';
import '../../events/widgets/event_details_step.dart';

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
  bool _creatingDraft = false;

  @override
  void initState() {
    super.initState();

    WidgetsBinding.instance.addPostFrameCallback((_) {
      final wizard = ref.read(wizardProvider);
      final dio = ref.read(authServiceProvider).dio;

      // Events: create the stub draft upfront so event_occurrences row exists.
      // Guard against re-entry if the user navigates back before the POST completes.
      if (wizard.contentType == ContentType.event &&
          wizard.contentId == null &&
          !_creatingDraft) {
        _creatingDraft = true;
        _createEventDraft(dio, wizard.vertical);
      }

      // Start auto-save timer
      _autoSave = DraftAutoSaveService(ref: ref, dio: dio);
      _autoSave!.start();
    });
  }

  /// Create the event draft via POST /api/v1/events and store the contentId.
  Future<void> _createEventDraft(Dio dio, String vertical) async {
    try {
      final response = await dio.post('/api/v1/events', data: {
        'type': 'event',
        'vertical': vertical.isNotEmpty ? vertical : 'travel',
      });
      final data =
          (response.data as Map<String, dynamic>)['data'] as Map<String, dynamic>;
      final contentId = data['id'] as String;
      ref.read(wizardProvider.notifier).setContentId(contentId);
    } catch (_) {
      // Draft creation failed — will retry on next save attempt
    } finally {
      _creatingDraft = false;
    }
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
    final wizard = ref.read(wizardProvider);

    // Events: save event-specific fields when leaving the Details step
    if (wizard.contentType == ContentType.event &&
        wizard.currentStep == 2 &&
        wizard.contentId != null) {
      unawaited(_saveEventDetails(
        ref.read(authServiceProvider).dio,
        wizard.contentId!,
      ));
    }

    ref.read(wizardProvider.notifier).nextStep();
    _autoSave?.reset();
  }

  /// Save event-specific fields (venue, dates, capacity) to PUT /api/v1/events/:id.
  Future<void> _saveEventDetails(Dio dio, String contentId) async {
    final eventState = ref.read(eventWizardProvider);
    final payload = eventState.toApiPayload();
    if (payload.isEmpty) return;

    try {
      await dio.put('/api/v1/events/$contentId', data: payload);
    } catch (_) {
      // Fire and forget — auto-save will retry
    }
  }

  Future<void> _onPublish() async {
    unawaited(HapticFeedback.lightImpact());
    final wizard = ref.read(wizardProvider);
    if (!wizard.tncAccepted) return;

    ref.read(wizardProvider.notifier).markSaving();

    try {
      final dio = ref.read(authServiceProvider).dio;
      final contentId = wizard.contentId;

      if (wizard.contentType == ContentType.event) {
        // Events: always publish via event-specific endpoint (requires contentId)
        if (contentId == null) {
          ref.read(wizardProvider.notifier).markSaveError(
            'Draft not ready. Please wait a moment and try again.',
          );
          return;
        }
        await dio.post(
          '/api/v1/${wizard.contentType.apiPath}/$contentId/publish',
          data: {'tnc_accepted': true},
        );
      } else if (contentId != null) {
        // Publish existing draft (posts, itineraries)
        await dio.post(
          '/api/v1/${wizard.contentType.apiPath}/$contentId/publish',
          data: {'tnc_accepted': true},
        );
      } else {
        // Create and publish in one call (posts only — drafts not pre-created)
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
        final successMessage = switch (wizard.contentType) {
          ContentType.post => 'Post published!',
          ContentType.selfPacedItinerary => 'Itinerary published!',
          ContentType.event => 'Event published!',
          ContentType.scheduledExperience => 'Experience published!',
        };
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              successMessage,
              style:
                  typ.AppTypography.bodySmall.copyWith(color: AppColors.surface),
            ),
            backgroundColor: AppColors.success,
            behavior: SnackBarBehavior.floating,
            duration: const Duration(seconds: 3),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(Layout.cardRadius),
            ),
          ),
        );
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
                  typ.AppTypography.bodySmall.copyWith(color: AppColors.surface),
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
        backgroundColor: AppColors.bg,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(Layout.cardRadius),
        ),
        title: Text('Discard draft?', style: typ.AppTypography.h3),
        content: Text(
          'Your unsaved changes will be lost.',
          style: typ.AppTypography.body.copyWith(color: AppColors.inkSoft),
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
      backgroundColor: AppColors.bg,
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
      2 => const PostMediaStep(),
      3 => ReviewStep(onPublish: _onPublish),
      _ => const SizedBox.shrink(),
    };
  }

  Widget _buildItineraryStep(int step) {
    return switch (step) {
      1 => const BasicsStep(),
      2 => const TripOverviewStep(),
      3 => const DayBuilderStep(),
      4 => const MediaStep(
          title: 'Add photos',
          subtitle: 'Show travelers what to expect on this trip.',
        ),
      5 => const PricingStep(),
      6 => ReviewStep(onPublish: _onPublish),
      _ => const SizedBox.shrink(),
    };
  }

  Widget _buildEventStep(int step) {
    return switch (step) {
      1 => const BasicsStep(),
      2 => const EventDetailsStep(),
      3 => const MediaStep(
          title: 'Add event photos',
          subtitle: 'Help attendees visualize the event.',
        ),
      4 => const _FreeEventPricingStep(),
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
              color: AppColors.inkMuted,
            ),
            const SizedBox(height: Spacing.lg),
            Text(title, style: typ.AppTypography.h3),
            const SizedBox(height: Spacing.sm),
            Text(
              subtitle,
              style: typ.AppTypography.body.copyWith(color: AppColors.inkSoft),
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

/// Free-only pricing step for events (M1). Paid events ship in M2 —
/// this step locks the wizard's pricing_model to 'free' on entry.
class _FreeEventPricingStep extends ConsumerStatefulWidget {
  const _FreeEventPricingStep();

  @override
  ConsumerState<_FreeEventPricingStep> createState() =>
      _FreeEventPricingStepState();
}

class _FreeEventPricingStepState extends ConsumerState<_FreeEventPricingStep> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final wizard = ref.read(wizardProvider);
      if (wizard.pricingModel != 'free' || wizard.pricePaisa != 0) {
        ref.read(wizardProvider.notifier).setPricing('free', 0);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(
        horizontal: Layout.screenPaddingH,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: Spacing.xl),
          Text('Pricing', style: typ.AppTypography.h3),
          const SizedBox(height: Spacing.sm),
          Text(
            'Events are free during the M1 private alpha.',
            style: typ.AppTypography.body.copyWith(color: AppColors.inkSoft),
          ),
          const SizedBox(height: Spacing.xl),
          Container(
            padding: const EdgeInsets.all(Layout.cardPadding),
            decoration: BoxDecoration(
              color: AppColors.surfaceAlt,
              borderRadius: BorderRadius.circular(Layout.cardRadius),
              border: Border.all(color: AppColors.hairline),
            ),
            child: Row(
              children: [
                const Icon(
                  PhosphorIconsFill.gift,
                  size: 28,
                  color: AppColors.coral,
                ),
                const SizedBox(width: Spacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Free event', style: typ.AppTypography.h4),
                      const SizedBox(height: Spacing.xs),
                      Text(
                        'Paid events open up in M2 once payouts are wired.',
                        style: typ.AppTypography.caption,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: Spacing.xxxl),
        ],
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
              color: AppColors.inkSoft,
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
        color: AppColors.bg,
        border: Border(
          top: BorderSide(color: AppColors.hairline, width: 1),
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
