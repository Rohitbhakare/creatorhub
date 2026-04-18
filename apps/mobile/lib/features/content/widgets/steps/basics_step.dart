import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../shared/theme/colors.dart';
import '../../../../shared/theme/typography.dart' as typ;
import '../../../../shared/theme/spacing.dart';
import '../../../../shared/theme/layout.dart';
import '../../../../shared/components/input.dart';
import '../../providers/wizard_provider.dart';

/// Basics step — first step for all content types.
///
/// Collects title, description, and (for posts) body text.
/// Each field has a live character counter with color thresholds.
class BasicsStep extends ConsumerStatefulWidget {
  const BasicsStep({super.key});

  @override
  ConsumerState<BasicsStep> createState() => _BasicsStepState();
}

class _BasicsStepState extends ConsumerState<BasicsStep> {
  late final TextEditingController _titleController;
  late final TextEditingController _descriptionController;
  late final TextEditingController _bodyController;

  @override
  void initState() {
    super.initState();
    final wizard = ref.read(wizardProvider);
    _titleController = TextEditingController(text: wizard.title);
    _descriptionController = TextEditingController(text: wizard.description);
    _bodyController = TextEditingController(text: wizard.body);
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _bodyController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final wizard = ref.watch(wizardProvider);
    final isPost = wizard.contentType == ContentType.post;
    final titleMax = isPost ? 100 : 100;
    final titleMin = isPost ? 1 : 5;
    const descriptionMax = 280;
    const bodyMax = 1000;

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(
        horizontal: Layout.screenPaddingH,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: Spacing.xl),

          // Title
          Text(
            isPost ? 'Write your post' : 'Name your itinerary',
            style: typ.AppTypography.h3,
          ),
          const SizedBox(height: Spacing.sm),
          Text(
            isPost
                ? 'Give your post a compelling title'
                : 'A great title helps travelers find your itinerary',
            style: typ.AppTypography.body.copyWith(color: AppColors.inkSoft),
          ),
          const SizedBox(height: Spacing.xl),

          // Title input
          AppInput(
            controller: _titleController,
            label: 'Title',
            hint: isPost ? "What's on your mind?" : 'e.g. 3 Days in Hampi',
            maxLength: titleMax,
            textInputAction: TextInputAction.next,
            onChanged: (value) {
              ref.read(wizardProvider.notifier).setTitle(value);
            },
            errorText: wizard.title.trim().isNotEmpty &&
                    wizard.title.trim().length < titleMin
                ? 'At least $titleMin ${titleMin == 1 ? 'character' : 'characters'} required'
                : null,
          ),
          _CharacterCounter(
            current: wizard.title.length,
            max: titleMax,
          ),
          const SizedBox(height: Spacing.xl),

          // Description input
          AppInput(
            controller: _descriptionController,
            label: 'Description',
            hint: 'A short summary to hook readers...',
            maxLines: 3,
            maxLength: descriptionMax,
            textInputAction: TextInputAction.next,
            onChanged: (value) {
              ref.read(wizardProvider.notifier).setDescription(value);
            },
          ),
          _CharacterCounter(
            current: wizard.description.length,
            max: descriptionMax,
          ),

          // Body text (posts only)
          if (isPost) ...[
            const SizedBox(height: Spacing.xl),
            AppInput(
              controller: _bodyController,
              label: 'Body',
              hint: 'Tell your story...',
              maxLines: 8,
              maxLength: bodyMax,
              keyboardType: TextInputType.multiline,
              textInputAction: TextInputAction.newline,
              onChanged: (value) {
                ref.read(wizardProvider.notifier).setBody(value);
              },
            ),
            _CharacterCounter(
              current: wizard.body.length,
              max: bodyMax,
            ),
          ],

          const SizedBox(height: Spacing.xxxl),
        ],
      ),
    );
  }
}

/// Live character counter with color thresholds.
/// < 85%: muted, 85-99%: amber/warning, 100%: danger.
class _CharacterCounter extends StatelessWidget {
  final int current;
  final int max;

  const _CharacterCounter({
    required this.current,
    required this.max,
  });

  @override
  Widget build(BuildContext context) {
    final percentage = max > 0 ? (current / max * 100) : 0.0;

    final Color color;
    if (percentage >= 100) {
      color = AppColors.danger;
    } else if (percentage >= 85) {
      color = AppColors.warning;
    } else {
      color = AppColors.inkSoft;
    }

    return Padding(
      padding: const EdgeInsets.only(top: Spacing.xs),
      child: Align(
        alignment: Alignment.centerRight,
        child: Text(
          '$current / $max',
          style: typ.AppTypography.caption.copyWith(color: color),
        ),
      ),
    );
  }
}
