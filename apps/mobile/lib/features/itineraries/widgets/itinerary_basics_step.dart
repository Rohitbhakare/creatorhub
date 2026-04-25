import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../shared/theme/colors.dart';
import '../../../shared/theme/spacing.dart';
import '../../../shared/theme/layout.dart';
import '../../../shared/components/input.dart';
import '../../content/providers/wizard_provider.dart';

// ── Category definitions ───────────────────────────────────────────────

class _Category {
  final String id;
  final String emoji;
  final String label;
  final String sublabel;

  const _Category(this.id, this.emoji, this.label, this.sublabel);
}

const _categories = [
  _Category('adventure', '🏔', 'Adventure', 'Trails, peaks & raw nature'),
  _Category('road_trips', '🚗', 'Road Trip', 'Scenic drives & open roads'),
  _Category('food_trails', '🍜', 'Food Trail', 'Local bites & hidden gems'),
  _Category('heritage_culture', '🏛', 'Cultural', 'History, art & heritage'),
  _Category('weekend_getaway', '🌅', 'Weekend', 'Quick escapes, big feels'),
  _Category('budget_travel', '🎒', 'Budget', 'More experience, less spend'),
  _Category('luxury', '✨', 'Luxury', 'Curated & elevated stays'),
  _Category('other', '🌍', 'Other', 'Your own kind of journey'),
];

// ── Step widget ────────────────────────────────────────────────────────

class ItineraryBasicsStep extends ConsumerStatefulWidget {
  const ItineraryBasicsStep({super.key});

  @override
  ConsumerState<ItineraryBasicsStep> createState() =>
      _ItineraryBasicsStepState();
}

class _ItineraryBasicsStepState extends ConsumerState<ItineraryBasicsStep> {
  late final TextEditingController _titleController;
  late final TextEditingController _descController;
  late final TextEditingController _tagController;
  final _tagFocusNode = FocusNode();

  @override
  void initState() {
    super.initState();
    final wizard = ref.read(wizardProvider);
    _titleController = TextEditingController(text: wizard.title);
    _descController = TextEditingController(text: wizard.description);
    _tagController = TextEditingController();
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descController.dispose();
    _tagController.dispose();
    _tagFocusNode.dispose();
    super.dispose();
  }

  void _addTag(String raw) {
    final tag = raw.trim().replaceAll('#', '').replaceAll(',', '');
    if (tag.isEmpty) return;
    final wizard = ref.read(wizardProvider);
    if (wizard.tags.length >= 5) return;
    if (wizard.tags.contains(tag)) return;
    ref.read(wizardProvider.notifier).setTags([...wizard.tags, tag]);
    _tagController.clear();
  }

  void _removeTag(String tag) {
    HapticFeedback.selectionClick();
    final wizard = ref.read(wizardProvider);
    ref
        .read(wizardProvider.notifier)
        .setTags(wizard.tags.where((t) => t != tag).toList());
  }

  @override
  Widget build(BuildContext context) {
    final wizard = ref.watch(wizardProvider);
    final selected = wizard.subCategoryId;
    final hasCategory = selected != null && selected.isNotEmpty;

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: Layout.screenPaddingH),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: Spacing.xl),

          // ── Editorial header ───────────────────────────────
          Text(
            'STEP 1 OF ${wizard.totalSteps}',
            style: GoogleFonts.inter(
              fontSize: 11,
              fontWeight: FontWeight.w500,
              letterSpacing: 1.4,
              color: AppColors.coral,
            ),
          ),
          const SizedBox(height: Spacing.sm),
          Text(
            'What kind of\njourney?',
            style: GoogleFonts.fraunces(
              fontSize: 30,
              fontWeight: FontWeight.w600,
              height: 1.12,
              color: AppColors.ink,
            ),
          ),
          const SizedBox(height: Spacing.xs),
          Text(
            'Pick a style. Your travelers will thank you.',
            style: GoogleFonts.fraunces(
              fontSize: 16,
              fontStyle: FontStyle.italic,
              fontWeight: FontWeight.w400,
              height: 1.3,
              color: AppColors.inkSoft,
            ),
          ),
          const SizedBox(height: Spacing.xl),

          // ── Category grid ──────────────────────────────────
          GridView.count(
            crossAxisCount: 2,
            crossAxisSpacing: Spacing.sm,
            mainAxisSpacing: Spacing.sm,
            childAspectRatio: 1.55,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            children: [
              for (final cat in _categories)
                _CategoryCard(
                  category: cat,
                  isSelected: selected == cat.id,
                  onTap: () {
                    HapticFeedback.selectionClick();
                    ref.read(wizardProvider.notifier).setSubCategory(
                          selected == cat.id ? null : cat.id,
                        );
                  },
                ),
            ],
          ),

          // ── Itinerary details (slide in after category pick) ──
          AnimatedCrossFade(
            duration: const Duration(milliseconds: 220),
            crossFadeState: hasCategory
                ? CrossFadeState.showSecond
                : CrossFadeState.showFirst,
            firstChild: const SizedBox(height: Spacing.xxxl),
            secondChild: _DetailsSection(
              titleController: _titleController,
              descController: _descController,
              tagController: _tagController,
              tagFocusNode: _tagFocusNode,
              tags: wizard.tags,
              onAddTag: _addTag,
              onRemoveTag: _removeTag,
            ),
          ),
        ],
      ),
    );
  }
}

// ── Category card ──────────────────────────────────────────────────────

class _CategoryCard extends StatelessWidget {
  final _Category category;
  final bool isSelected;
  final VoidCallback onTap;

  const _CategoryCard({
    required this.category,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 160),
        padding: const EdgeInsets.all(Spacing.md),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primaryTint : AppColors.surface,
          borderRadius: BorderRadius.circular(Layout.cardRadius),
          border: Border.all(
            color: isSelected ? AppColors.coral : AppColors.hairlineStrong,
            width: isSelected ? 1.5 : 1.0,
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: AppColors.coral.withValues(alpha: 0.12),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ]
              : [
                  const BoxShadow(
                    color: Color(0x0A16161A),
                    blurRadius: 4,
                    offset: Offset(0, 1),
                  ),
                ],
        ),
        child: Stack(
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  category.emoji,
                  style: const TextStyle(fontSize: 26),
                ),
                const Spacer(),
                Text(
                  category.label,
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: isSelected ? AppColors.coral : AppColors.ink,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  category.sublabel,
                  style: GoogleFonts.inter(
                    fontSize: 10.5,
                    fontWeight: FontWeight.w400,
                    color: AppColors.inkMuted,
                    height: 1.3,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
            if (isSelected)
              Positioned(
                top: 0,
                right: 0,
                child: Container(
                  width: 18,
                  height: 18,
                  decoration: const BoxDecoration(
                    color: AppColors.coral,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.check,
                    size: 11,
                    color: Colors.white,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

// ── Details section (title + description + tags) ───────────────────────

class _DetailsSection extends ConsumerWidget {
  final TextEditingController titleController;
  final TextEditingController descController;
  final TextEditingController tagController;
  final FocusNode tagFocusNode;
  final List<String> tags;
  final ValueChanged<String> onAddTag;
  final ValueChanged<String> onRemoveTag;

  const _DetailsSection({
    required this.titleController,
    required this.descController,
    required this.tagController,
    required this.tagFocusNode,
    required this.tags,
    required this.onAddTag,
    required this.onRemoveTag,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final wizard = ref.watch(wizardProvider);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: Spacing.xl),

        // Divider with label
        Row(
          children: [
            Expanded(
              child: Container(
                height: 1,
                color: AppColors.hairline,
              ),
            ),
            Padding(
              padding:
                  const EdgeInsets.symmetric(horizontal: Spacing.md),
              child: Text(
                'ABOUT YOUR JOURNEY',
                style: GoogleFonts.inter(
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 1.2,
                  color: AppColors.inkFaint,
                ),
              ),
            ),
            Expanded(
              child: Container(
                height: 1,
                color: AppColors.hairline,
              ),
            ),
          ],
        ),
        const SizedBox(height: Spacing.xl),

        // Title
        _FieldLabel('Title'),
        const SizedBox(height: Spacing.xs),
        AppInput(
          controller: titleController,
          hint: 'e.g. 3 Days in Coorg — A Planter\'s Trail',
          maxLength: 100,
          textInputAction: TextInputAction.next,
          onChanged: ref.read(wizardProvider.notifier).setTitle,
          errorText: wizard.title.trim().isNotEmpty &&
                  wizard.title.trim().length < 5
              ? 'At least 5 characters required'
              : null,
        ),
        const SizedBox(height: Spacing.xs),
        Text(
          'A great title stops the scroll.',
          style: GoogleFonts.inter(
            fontSize: 11.5,
            color: AppColors.inkMuted,
          ),
        ),

        const SizedBox(height: Spacing.lg),

        // Description
        _FieldLabel('Description'),
        const SizedBox(height: Spacing.xs),
        AppInput(
          controller: descController,
          hint: 'The one line that makes someone want to go.',
          maxLines: 3,
          maxLength: 280,
          textInputAction: TextInputAction.next,
          onChanged: ref.read(wizardProvider.notifier).setDescription,
        ),

        const SizedBox(height: Spacing.lg),

        // Tags
        Row(
          children: [
            _FieldLabel('Hashtags'),
            const SizedBox(width: Spacing.sm),
            Container(
              padding: const EdgeInsets.symmetric(
                  horizontal: Spacing.sm, vertical: 2),
              decoration: BoxDecoration(
                color: AppColors.surfaceAlt,
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                '${tags.length}/5',
                style: GoogleFonts.inter(
                  fontSize: 10.5,
                  fontWeight: FontWeight.w500,
                  color: AppColors.inkMuted,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: Spacing.xs),

        // Tag chips
        if (tags.isNotEmpty) ...[
          Wrap(
            spacing: Spacing.sm,
            runSpacing: Spacing.sm,
            children: [
              for (final tag in tags)
                _TagChip(tag: tag, onRemove: () => onRemoveTag(tag)),
            ],
          ),
          const SizedBox(height: Spacing.sm),
        ],

        // Tag input (hidden when max reached)
        if (tags.length < 5)
          _TagInput(
            controller: tagController,
            focusNode: tagFocusNode,
            onSubmit: onAddTag,
          ),

        const SizedBox(height: Spacing.xxxl + Spacing.xl),
      ],
    );
  }
}

// ── Small helper widgets ───────────────────────────────────────────────

class _FieldLabel extends StatelessWidget {
  final String text;
  const _FieldLabel(this.text);

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: GoogleFonts.inter(
        fontSize: 12,
        fontWeight: FontWeight.w600,
        color: AppColors.inkSoft,
        letterSpacing: 0.2,
      ),
    );
  }
}

class _TagChip extends StatelessWidget {
  final String tag;
  final VoidCallback onRemove;

  const _TagChip({required this.tag, required this.onRemove});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: Spacing.md,
        vertical: Spacing.xs + 2,
      ),
      decoration: BoxDecoration(
        color: AppColors.surfaceAlt,
        borderRadius: BorderRadius.circular(Layout.chipRadius),
        border: Border.all(color: AppColors.hairline),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            '#$tag',
            style: GoogleFonts.inter(
              fontSize: 13,
              fontWeight: FontWeight.w500,
              color: AppColors.ink,
            ),
          ),
          const SizedBox(width: Spacing.xs),
          GestureDetector(
            onTap: onRemove,
            behavior: HitTestBehavior.opaque,
            child: const Padding(
              padding: EdgeInsets.only(left: 2),
              child: Icon(
                Icons.close,
                size: 14,
                color: AppColors.inkMuted,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _TagInput extends StatelessWidget {
  final TextEditingController controller;
  final FocusNode focusNode;
  final ValueChanged<String> onSubmit;

  const _TagInput({
    required this.controller,
    required this.focusNode,
    required this.onSubmit,
  });

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      focusNode: focusNode,
      textInputAction: TextInputAction.done,
      style: GoogleFonts.inter(
        fontSize: 14,
        color: AppColors.ink,
      ),
      decoration: InputDecoration(
        hintText: 'e.g. Coorg, monsoon, photography',
        hintStyle: GoogleFonts.inter(
          fontSize: 14,
          color: AppColors.inkFaint,
        ),
        prefixText: '# ',
        prefixStyle: GoogleFonts.inter(
          fontSize: 14,
          fontWeight: FontWeight.w500,
          color: AppColors.inkMuted,
        ),
        filled: true,
        fillColor: AppColors.surfaceAlt,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: Spacing.md,
          vertical: Spacing.md,
        ),
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
          borderSide:
              const BorderSide(color: AppColors.ink, width: 1.5),
        ),
        counterText: '',
        suffixIcon: GestureDetector(
          onTap: () => onSubmit(controller.text),
          child: const Padding(
            padding: EdgeInsets.all(Spacing.md),
            child: Icon(Icons.add, size: 18, color: AppColors.coral),
          ),
        ),
      ),
      onSubmitted: onSubmit,
      onChanged: (val) {
        if (val.endsWith(',') || val.endsWith(' ')) {
          onSubmit(val);
        }
      },
    );
  }
}
