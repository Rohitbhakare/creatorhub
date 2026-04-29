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
import '../widgets/empty_close_sheet.dart';
import '../widgets/publish_celebration.dart';
import '../widgets/wizard_step_indicator.dart';
import '../widgets/steps/basics_step.dart';
import '../widgets/steps/media_step.dart';
import '../widgets/steps/pricing_step.dart';
import '../widgets/steps/review_step.dart';
import '../../posts/widgets/post_media_step.dart';
import '../../itineraries/widgets/itinerary_basics_step.dart';
import '../../itineraries/widgets/trip_overview_step.dart';
import '../../itineraries/screens/day_builder_screen.dart';
import '../../events/providers/event_wizard_provider.dart';
import '../../events/widgets/event_details_step.dart';
import '../../experiences/providers/experience_provider.dart';
import '../../experiences/widgets/experience_details_step.dart';
import '../../kyc/providers/kyc_provider.dart';
import '../../studio/providers/studio_provider.dart';

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
  /// Tracks whether the stub draft row has been created on the API.
  /// Stays false from initState until the user types into Step 1 OR
  /// presses Next — that's when [_ensureDraft] fires for the first time.
  /// Used by the close handler to decide whether to DELETE on discard.
  bool _draftCreated = false;

  @override
  void initState() {
    super.initState();

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final dio = ref.read(authServiceProvider).dio;

      // Auto-save service. The draft row is created lazily on the first
      // dirty tick (DD-031) — see [_ensureDraft] — so opening + immediately
      // closing the wizard no longer leaves an orphan content row.
      _autoSave = DraftAutoSaveService(
        ref: ref,
        dio: dio,
        ensureDraft: _ensureDraft,
      );
      _autoSave!.start();
    });
  }

  /// Lazily create the stub draft if one hasn't been created yet.
  ///
  /// Endpoint per content type (each accepts `{type, vertical}`):
  ///   post                → POST /api/v1/posts
  ///   selfPacedItinerary  → POST /api/v1/itineraries
  ///   event               → POST /api/v1/events
  ///   scheduledExperience → POST /api/v1/experiences
  ///
  /// Idempotent: safe to call from multiple sources (Next press, auto-save
  /// tick, publish flush). Re-entry is guarded with [_creatingDraft].
  Future<void> _ensureDraft() async {
    final wizard = ref.read(wizardProvider);
    if (wizard.contentId != null) return;
    if (_creatingDraft) return;

    _creatingDraft = true;
    try {
      final dio = ref.read(authServiceProvider).dio;
      final response = await dio.post('/api/v1/${wizard.contentType.apiPath}',
          data: {
            'type': wizard.contentType.apiType,
            'vertical': wizard.vertical.isNotEmpty ? wizard.vertical : 'travel',
          });
      final data = (response.data as Map<String, dynamic>)['data']
          as Map<String, dynamic>;
      final contentId = data['id'] as String;
      if (!mounted) return;
      ref.read(wizardProvider.notifier).setContentId(contentId);
      _draftCreated = true;
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

  /// X button: exit immediately if pristine; prompt with the empty-close
  /// sheet if the user has typed anything OR a draft was created.
  void _onClose() {
    HapticFeedback.lightImpact();
    final wizard = ref.read(wizardProvider);
    if (!wizard.isDirty && !_draftCreated) {
      // Pristine — nothing to save, no draft on the server. Just pop.
      if (mounted) context.pop();
      return;
    }
    _showEmptyCloseSheet();
  }

  /// Top-bar shortcut — flush pending edits to the server and exit without
  /// the discard/save sheet. Equivalent to picking "Save draft" in the
  /// close sheet, just one tap shorter.
  Future<void> _onSaveDraftAndExit() async {
    unawaited(HapticFeedback.lightImpact());
    await _ensureDraft();
    await _autoSave?.flushNow();
    if (!mounted) return;
    ref.read(studioContentProvider.notifier).retry();
    context.pop();
  }

  /// Show the empty-close bottom sheet (DD-033).
  ///
  /// "Save draft" → flush pending edits and pop.
  /// "Discard"    → DELETE the draft row if one was created and pop.
  void _showEmptyCloseSheet() {
    showEmptyCloseSheet(
      context,
      onSaveDraft: () async {
        Navigator.of(context).pop();
        await _ensureDraft();
        await _autoSave?.flushNow();
        if (mounted) context.pop();
      },
      onDiscard: () async {
        Navigator.of(context).pop();
        await _discardAndExit();
      },
    );
  }

  /// Silently delete the stub draft (if one was created) and pop.
  Future<void> _discardAndExit() async {
    final contentId = ref.read(wizardProvider).contentId;
    if (contentId != null) {
      try {
        final dio = ref.read(authServiceProvider).dio;
        await dio.delete('/api/v1/content/$contentId');
        ref.read(studioContentProvider.notifier).retry();
      } catch (_) {
        // Best-effort — exit regardless
      }
    }
    if (mounted) context.pop();
  }

  /// Trash icon: confirm then hard-delete the draft and exit.
  void _onDelete() {
    HapticFeedback.lightImpact();
    final wizard = ref.read(wizardProvider);
    final contentId = wizard.contentId;

    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.bg,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(Layout.cardRadius),
        ),
        title: Text('Delete draft?', style: typ.AppTypography.h3),
        content: Text(
          'This draft will be permanently deleted and cannot be recovered.',
          style: typ.AppTypography.body.copyWith(color: AppColors.inkSoft),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: Text(
              'Keep editing',
              style: typ.AppTypography.body.copyWith(
                fontWeight: FontWeight.w600,
                color: AppColors.ink,
              ),
            ),
          ),
          TextButton(
            onPressed: () async {
              unawaited(HapticFeedback.lightImpact());
              Navigator.of(ctx).pop();
              if (contentId != null) {
                try {
                  final dio = ref.read(authServiceProvider).dio;
                  await dio.delete('/api/v1/content/$contentId');
                  // Refresh studio list so the deleted draft disappears
                  ref.read(studioContentProvider.notifier).retry();
                } catch (_) {
                  // Best-effort — exit regardless
                }
              }
              if (mounted) context.pop();
            },
            child: Text(
              'Delete',
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

  /// Back arrow in bottom nav: navigate to the previous step.
  void _onBack() {
    HapticFeedback.lightImpact();
    final wizard = ref.read(wizardProvider);

    if (wizard.currentStep == 1) {
      if (!wizard.isDirty && !_draftCreated) {
        if (mounted) context.pop();
      } else {
        _showEmptyCloseSheet();
      }
    } else {
      ref.read(wizardProvider.notifier).prevStep();
    }
  }

  void _onNext() {
    HapticFeedback.lightImpact();
    final wizard = ref.read(wizardProvider);

    // First Next press lazily creates the stub draft. Fire-and-forget;
    // the auto-save tick will retry if this pre-flight fails.
    if (wizard.contentId == null) {
      unawaited(_ensureDraft());
    }

    // Events: save event-specific fields when leaving the Details step
    if (wizard.contentType == ContentType.event &&
        wizard.currentStep == 2 &&
        wizard.contentId != null) {
      unawaited(_saveEventDetails(
        ref.read(authServiceProvider).dio,
        wizard.contentId!,
      ));
    }

    // Experiences: persist cancellation policy + meeting point on leaving Step 2
    if (wizard.contentType == ContentType.scheduledExperience &&
        wizard.currentStep == 2 &&
        wizard.contentId != null) {
      unawaited(_saveExperienceDetails(
        ref.read(authServiceProvider).dio,
        wizard.contentId!,
      ));
    }

    // Itineraries: send day_count so the API creates itinerary_days rows
    if (wizard.contentType == ContentType.selfPacedItinerary &&
        wizard.currentStep == 2 &&
        wizard.contentId != null) {
      unawaited(_saveItineraryDayCount(
        ref.read(authServiceProvider).dio,
        wizard.contentId!,
        wizard.dayCount,
      ));
    }

    ref.read(wizardProvider.notifier).nextStep();
    _autoSave?.reset();
  }

  /// Save event-specific fields (venue, dates, capacity) to PUT /api/v1/events/:id.
  /// Also sends the Discoverability facets captured on the step (PR 2) so the
  /// event's content row gets its `facets` JSONB populated via the
  /// event-update endpoint alongside the venue/date columns.
  Future<void> _saveEventDetails(Dio dio, String contentId) async {
    final eventState = ref.read(eventWizardProvider);
    final wizard = ref.read(wizardProvider);
    final payload = <String, dynamic>{
      ...eventState.toApiPayload(),
      'facets': buildFacetsPayload(wizard),
    };
    if (payload.isEmpty) return;

    try {
      await dio.put('/api/v1/events/$contentId', data: payload);
    } catch (_) {
      // Fire and forget — auto-save will retry
    }
  }

  /// Save experience-specific fields (cancellation policy, meeting point) when
  /// leaving the Details step.
  ///
  /// Cancellation policy goes via PUT `/experiences/:id` (content-level).
  /// Meeting point + reveal-hours must use the dedicated
  /// PUT `/experiences/:id/meeting-point` endpoint — the bulk PUT silently
  /// drops `meeting_point` keys.
  Future<void> _saveExperienceDetails(Dio dio, String contentId) async {
    final expState = ref.read(createExperienceProvider);
    try {
      await dio.put('/api/v1/experiences/$contentId', data: {
        'cancellation_policy': expState.cancellationPolicy,
      });
    } catch (_) {
      // Fire and forget — non-blocking
    }

    final mp = expState.meetingPoint;
    if (mp != null && mp.publicAreaName.isNotEmpty) {
      try {
        await dio.put('/api/v1/experiences/$contentId/meeting-point', data: {
          'public_area_name': mp.publicAreaName,
          if (mp.lat != null) 'lat': mp.lat,
          if (mp.lng != null) 'lng': mp.lng,
          if (mp.privateExactName != null)
            'private_exact_name': mp.privateExactName,
          if (mp.privateLat != null) 'private_lat': mp.privateLat,
          if (mp.privateLng != null) 'private_lng': mp.privateLng,
          'reveal_hours_before': mp.revealHoursBefore,
        });
      } catch (_) {
        // Fire and forget
      }
    }
  }

  /// Send day_count to PUT /api/v1/itineraries/:id so the API syncs itinerary_days rows.
  Future<void> _saveItineraryDayCount(
    Dio dio,
    String contentId,
    int dayCount,
  ) async {
    try {
      await dio.put('/api/v1/itineraries/$contentId', data: {'day_count': dayCount});
    } catch (_) {
      // Fire and forget
    }
  }

  Future<void> _onPublish() async {
    unawaited(HapticFeedback.lightImpact());
    final wizard = ref.read(wizardProvider);
    if (!wizard.tncAccepted) return;

    // KYC gate — paid events require a verified KYC. Surface the KYC
    // wizard inline if status != 'verified' instead of failing with a
    // 4xx after the publish call.
    if (wizard.contentType == ContentType.event &&
        wizard.pricingModel == 'paid' &&
        wizard.pricePaisa > 0) {
      final kycAsync = ref.read(kycStatusProvider);
      final status = kycAsync.maybeWhen(
        data: (info) => info.status,
        orElse: () => null,
      );
      if (status != 'verified') {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Verify KYC to publish paid events.',
              style: typ.AppTypography.bodySmall
                  .copyWith(color: AppColors.surface),
            ),
            backgroundColor: AppColors.ink,
            behavior: SnackBarBehavior.floating,
          ),
        );
        context.push('/kyc');
        return;
      }
    }

    // Flush pending edits (title/body/etc.) to the draft before publishing,
    // otherwise the server-side publish validators see the stale row and
    // reject with "Post title must be between 5 and 100 characters" when
    // the periodic auto-save tick hasn't fired yet. flushNow bypasses the
    // tick's isDirty guards so it runs unconditionally.
    if (wizard.contentId != null) {
      await _autoSave?.flushNow();
    }

    ref.read(wizardProvider.notifier).markSaving();

    try {
      final dio = ref.read(authServiceProvider).dio;
      final contentId = ref.read(wizardProvider).contentId;

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

      // Refresh studio so the just-published post appears in the list and
      // the "Published" pill count + stats card update without requiring a
      // manual pull-to-refresh.
      ref.read(studioContentProvider.notifier).retry();
      ref.invalidate(studioStatsProvider);

      if (mounted) {
        await PublishCelebration.show(
          context,
          contentType: wizard.contentType,
        );
        if (mounted) context.go('/');
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

  @override
  Widget build(BuildContext context) {
    final wizard = ref.watch(wizardProvider);

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: Column(
          children: [
            const SizedBox(height: Spacing.sm),

            // Top bar: [X close] [save status centered] [trash delete]
            Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: Layout.screenPaddingH,
              ),
              child: Row(
                children: [
                  // Close button
                  GestureDetector(
                    onTap: _onClose,
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

                  // Save status — centered
                  Expanded(
                    child: Center(
                      child: _SaveStatusIndicator(wizard: wizard),
                    ),
                  ),

                  // Save draft text button — explicit shortcut so creators
                  // don't have to discover it via the close-sheet.
                  if (wizard.isDirty || _draftCreated)
                    GestureDetector(
                      onTap: _onSaveDraftAndExit,
                      behavior: HitTestBehavior.opaque,
                      child: Container(
                        height: Layout.minTapTarget,
                        padding: const EdgeInsets.symmetric(
                          horizontal: Spacing.sm,
                        ),
                        alignment: Alignment.center,
                        child: Text(
                          'Save draft',
                          style: typ.AppTypography.bodySmall.copyWith(
                            fontWeight: FontWeight.w600,
                            color: AppColors.coral,
                          ),
                        ),
                      ),
                    ),

                  // Delete (trash) icon — only shown when a draft exists
                  if (wizard.contentId != null)
                    GestureDetector(
                      onTap: _onDelete,
                      behavior: HitTestBehavior.opaque,
                      child: const SizedBox(
                        width: Layout.minTapTarget,
                        height: Layout.minTapTarget,
                        child: Align(
                          alignment: Alignment.centerRight,
                          child: Icon(
                            PhosphorIconsFill.trash,
                            size: 20,
                            color: AppColors.inkMuted,
                          ),
                        ),
                      ),
                    )
                  else if (!(wizard.isDirty || _draftCreated))
                    const SizedBox(width: Layout.minTapTarget),
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
      2 => PostMediaStep(ensureDraft: _ensureDraft),
      3 => ReviewStep(onPublish: _onPublish),
      _ => const SizedBox.shrink(),
    };
  }

  Widget _buildItineraryStep(int step) {
    return switch (step) {
      1 => const ItineraryBasicsStep(),
      2 => const TripOverviewStep(),
      3 => const DayBuilderStep(),
      4 => MediaStep(
          title: 'Add photos',
          subtitle: 'Show travelers what to expect on this trip.',
          ensureDraft: _ensureDraft,
          storageFolder: 'itineraries',
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
      3 => MediaStep(
          title: 'Add event photos',
          subtitle: 'Help attendees visualize the event.',
          ensureDraft: _ensureDraft,
          storageFolder: 'events',
        ),
      4 => const PricingStep(),
      5 => ReviewStep(onPublish: _onPublish),
      _ => const SizedBox.shrink(),
    };
  }

  Widget _buildExperienceStep(int step) {
    return switch (step) {
      1 => const BasicsStep(),
      2 => const ExperienceDetailsStep(),
      3 => MediaStep(
          title: 'Add experience photos',
          subtitle: 'Show participants what to expect.',
          ensureDraft: _ensureDraft,
          storageFolder: 'experiences',
        ),
      4 => const PricingStep(),
      5 => ReviewStep(onPublish: _onPublish),
      _ => const SizedBox.shrink(),
    };
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
