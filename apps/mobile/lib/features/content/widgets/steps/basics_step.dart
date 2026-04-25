import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../shared/theme/colors.dart';
import '../../../../shared/theme/typography.dart' as typ;
import '../../../../shared/theme/spacing.dart';
import '../../../../shared/theme/layout.dart';
import '../../../../shared/components/input.dart';
import '../../providers/wizard_provider.dart';
import '../ai_helper_chip.dart';

/// Basics step — first step for all content types.
///
/// Post flow: title + description only. The body moved to step 2 so the
/// creator writes the story in one place alongside photos.
class BasicsStep extends ConsumerStatefulWidget {
  const BasicsStep({super.key});

  @override
  ConsumerState<BasicsStep> createState() => _BasicsStepState();
}

class _BasicsStepState extends ConsumerState<BasicsStep> {
  late final TextEditingController _titleController;
  late final TextEditingController _descriptionController;

  @override
  void initState() {
    super.initState();
    final wizard = ref.read(wizardProvider);
    _titleController = TextEditingController(text: wizard.title);
    _descriptionController = TextEditingController(text: wizard.description);
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final wizard = ref.watch(wizardProvider);
    final isPost = wizard.contentType == ContentType.post;
    final isEvent = wizard.contentType == ContentType.event;
    const titleMax = 100;
    final titleMin = isPost ? 1 : 5;
    // SRS CRT-FR-013: events allow up to 500 chars in description
    final descriptionMax = isEvent ? 500 : 280;

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(
        horizontal: Layout.screenPaddingH,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: Spacing.xl),

          _StepIntro(
            kicker: 'STEP 1 OF ${wizard.totalSteps}',
            headline: isPost ? 'Start with a spark.' : 'Name your itinerary.',
            subhead: isPost
                ? 'Give this story a name.'
                : 'A great title helps travelers find it.',
          ),
          const SizedBox(height: Spacing.xl),

          _FieldHeader(
            label: 'Title',
            trailing: isPost ? const AiHelperChip() : null,
          ),
          AppInput(
            controller: _titleController,
            hint: isPost ? "What's on your mind?" : 'e.g. 3 Days in Hampi',
            maxLength: titleMax,
            textInputAction: TextInputAction.next,
            onChanged: ref.read(wizardProvider.notifier).setTitle,
            errorText: wizard.title.trim().isNotEmpty &&
                    wizard.title.trim().length < titleMin
                ? 'At least $titleMin ${titleMin == 1 ? 'character' : 'characters'} required'
                : null,
          ),
          const SizedBox(height: Spacing.xs),
          const _Microtip('A great title makes readers stop scrolling.'),
          const SizedBox(height: Spacing.lg),

          const _FieldHeader(label: 'Description'),
          AppInput(
            controller: _descriptionController,
            hint: 'A short summary to hook readers...',
            maxLines: 3,
            maxLength: descriptionMax,
            textInputAction: TextInputAction.next,
            onChanged: ref.read(wizardProvider.notifier).setDescription,
          ),
          const SizedBox(height: Spacing.xs),
          const _Microtip(
              'One line that tells people why this matters.'),

          const SizedBox(height: Spacing.xxxl),
        ],
      ),
    );
  }
}

class _StepIntro extends StatelessWidget {
  final String kicker;
  final String headline;
  final String subhead;

  const _StepIntro({
    required this.kicker,
    required this.headline,
    required this.subhead,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          kicker,
          style: GoogleFonts.inter(
            fontSize: 11,
            fontWeight: FontWeight.w500,
            letterSpacing: 1.2,
            color: AppColors.coral,
          ),
        ),
        const SizedBox(height: Spacing.sm),
        Text(
          headline,
          style: GoogleFonts.fraunces(
            fontSize: 28,
            fontWeight: FontWeight.w500,
            height: 1.15,
            color: AppColors.ink,
          ),
        ),
        const SizedBox(height: Spacing.xs),
        Text(
          subhead,
          style: GoogleFonts.fraunces(
            fontSize: 18,
            fontStyle: FontStyle.italic,
            fontWeight: FontWeight.w400,
            height: 1.25,
            color: AppColors.inkSoft,
          ),
        ),
      ],
    );
  }
}

class _FieldHeader extends StatelessWidget {
  final String label;
  final Widget? trailing;

  const _FieldHeader({required this.label, this.trailing});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        children: [
          Text(
            label,
            style: typ.AppTypography.bodySmall.copyWith(
              fontWeight: FontWeight.w600,
              color: AppColors.inkSoft,
            ),
          ),
          if (trailing != null) ...[
            const SizedBox(width: Spacing.sm),
            trailing!,
          ],
        ],
      ),
    );
  }
}

class _Microtip extends StatelessWidget {
  final String text;
  const _Microtip(this.text);

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: GoogleFonts.inter(
        fontSize: 12,
        fontWeight: FontWeight.w400,
        height: 1.35,
        color: AppColors.inkMuted,
      ),
    );
  }
}
