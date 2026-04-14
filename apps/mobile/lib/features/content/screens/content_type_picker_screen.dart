import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart' show PhosphorIconsFill;

import '../../../shared/theme/colors.dart';
import '../../../shared/theme/typography.dart' as typ;
import '../../../shared/theme/spacing.dart';
import '../../../shared/theme/layout.dart';
import '../providers/wizard_provider.dart';
import '../widgets/content_type_card.dart';

/// Content type picker screen.
/// Displays 4 content types in a 2x2 grid. Tapping an enabled card
/// navigates to the wizard shell for that content type.
class ContentTypePickerScreen extends ConsumerWidget {
  const ContentTypePickerScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: Layout.screenPaddingH,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: Spacing.lg),

              // Back button
              GestureDetector(
                onTap: () {
                  HapticFeedback.lightImpact();
                  context.pop();
                },
                behavior: HitTestBehavior.opaque,
                child: const SizedBox(
                  width: Layout.minTapTarget,
                  height: Layout.minTapTarget,
                  child: Align(
                    alignment: Alignment.centerLeft,
                    child: Icon(
                      PhosphorIconsFill.arrowLeft,
                      size: 24,
                      color: AppColors.ink,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: Spacing.lg),

              // Title
              Text(
                'What would you like to create?',
                style: typ.AppTypography.h2,
              ),
              const SizedBox(height: Spacing.sm),
              Text(
                'Choose a content type to get started',
                style: typ.AppTypography.body.copyWith(
                  color: AppColors.muted,
                ),
              ),
              const SizedBox(height: Spacing.xxl),

              // 2x2 Grid
              Expanded(
                child: GridView.count(
                  crossAxisCount: 2,
                  mainAxisSpacing: Spacing.lg,
                  crossAxisSpacing: Spacing.lg,
                  childAspectRatio: 0.82,
                  physics: const NeverScrollableScrollPhysics(),
                  children: [
                    // Post
                    ContentTypeCard(
                      icon: PhosphorIconsFill.pencilSimple,
                      title: 'Post',
                      subtitle: 'Share your story',
                      badgeText: 'No KYC needed',
                      badgeColor: AppColors.success,
                      enabled: true,
                      onTap: () => _selectType(
                        context,
                        ref,
                        ContentType.post,
                      ),
                    ),

                    // Self-paced Itinerary
                    ContentTypeCard(
                      icon: PhosphorIconsFill.mapTrifold,
                      title: 'Itinerary',
                      subtitle: 'Share your route',
                      badgeText: 'KYC needed for paid',
                      badgeColor: AppColors.warning,
                      enabled: true,
                      onTap: () => _selectType(
                        context,
                        ref,
                        ContentType.selfPacedItinerary,
                      ),
                    ),

                    // Event (free events only in M1)
                    ContentTypeCard(
                      icon: PhosphorIconsFill.calendarBlank,
                      title: 'Event',
                      subtitle: 'Host a gathering',
                      badgeText: 'Free events only',
                      badgeColor: AppColors.success,
                      enabled: true,
                      onTap: () => _selectType(
                        context,
                        ref,
                        ContentType.event,
                      ),
                    ),

                    // Scheduled Experience (disabled)
                    const ContentTypeCard(
                      icon: PhosphorIconsFill.compass,
                      title: 'Experience',
                      subtitle: 'Lead an experience',
                      badgeText: 'Coming in M2',
                      badgeColor: AppColors.muted,
                      enabled: false,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _selectType(
    BuildContext context,
    WidgetRef ref,
    ContentType type,
  ) {
    // Initialize wizard state
    ref.read(wizardProvider.notifier).initWizard(type, 'travel');

    // Navigate to wizard shell
    context.push(
      '/content/wizard',
      extra: {
        'type': type.name,
        'vertical': 'travel',
      },
    );
  }
}
