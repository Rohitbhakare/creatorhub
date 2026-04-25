import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../../../../shared/theme/colors.dart';
import '../../../../shared/theme/typography.dart' as typ;
import '../../../../shared/theme/spacing.dart';
import '../../../../shared/theme/layout.dart';
import '../../../../shared/components/input.dart';
import '../../providers/wizard_provider.dart';
import '../../providers/sub_categories_provider.dart';
import '../ai_helper_chip.dart';

/// Basics step — first step for all content types.
///
/// Post flow: title + description only.
/// Non-post flows: sub-category picker + leaf-type chips + group-size chips
/// (itinerary/experience) + difficulty chips (adventure / trekking / wildlife)
/// + title + description.
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

  void _openSubCategoryPicker(
    BuildContext context,
    WizardState wizard,
  ) {
    HapticFeedback.selectionClick();
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(Layout.sheetRadius),
        ),
      ),
      builder: (_) => _SubCategorySheet(
        vertical: wizard.vertical,
        selectedId: wizard.subCategoryId,
        onSelected: (id) {
          ref.read(wizardProvider.notifier).setSubCategory(id);
          Navigator.of(context).pop();
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final wizard = ref.watch(wizardProvider);
    final isPost = wizard.contentType == ContentType.post;
    final isItinerary = wizard.contentType == ContentType.selfPacedItinerary;
    final isExperience =
        wizard.contentType == ContentType.scheduledExperience;
    final showGroupSize = isItinerary || isExperience;
    const titleMax = 100;
    final titleMin = isPost ? 1 : 5;
    // SRS CRT-FR-013: events allow up to 500 chars in description
    final isEvent = wizard.contentType == ContentType.event;
    final descriptionMax = isEvent ? 500 : 280;

    // Find the selected sub-category label for the picker button
    SubCategory? selectedSubCat;
    if (!isPost && wizard.subCategoryId != null) {
      final cats = subCategoriesForVertical(wizard.vertical);
      try {
        selectedSubCat =
            cats.firstWhere((c) => c.id == wizard.subCategoryId);
      } catch (_) {
        selectedSubCat = null;
      }
    }

    final showDifficulty = !isPost &&
        slugRequiresDifficulty(selectedSubCat?.slug);

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
            headline: _headline(wizard.contentType),
            subhead: _subhead(wizard.contentType),
          ),
          const SizedBox(height: Spacing.xl),

          // ── Sub-category picker (non-post only) ──────────────────
          if (!isPost) ...[
            const _FieldHeader(label: 'Category'),
            _SubCategoryButton(
              selected: selectedSubCat,
              hasError: wizard.title.isNotEmpty &&
                  (wizard.subCategoryId == null ||
                      wizard.subCategoryId!.isEmpty),
              onTap: () => _openSubCategoryPicker(context, wizard),
            ),
            const SizedBox(height: Spacing.lg),

            // Leaf type chips — only visible once a category is chosen
            if (selectedSubCat != null) ...[
              const _FieldHeader(label: 'Trip Length'),
              const SizedBox(height: Spacing.sm),
              _ChipRow<LeafType>(
                items: kLeafTypes,
                selectedId: wizard.leafType,
                idOf: (lt) => lt.id,
                labelOf: (lt) => lt.label,
                prefixOf: (_) => null,
                onTap: (id) {
                  HapticFeedback.selectionClick();
                  ref.read(wizardProvider.notifier).setLeafType(
                        wizard.leafType == id ? null : id,
                      );
                },
              ),
              const SizedBox(height: Spacing.lg),
            ],

            // Group size chips — itinerary + experience only
            if (showGroupSize && selectedSubCat != null) ...[
              const _FieldHeader(label: 'Group Size'),
              const SizedBox(height: Spacing.sm),
              _ChipRow<GroupSize>(
                items: kGroupSizes,
                selectedId: wizard.groupSize,
                idOf: (g) => g.id,
                labelOf: (g) => g.label,
                prefixOf: (_) => null,
                onTap: (id) {
                  HapticFeedback.selectionClick();
                  ref.read(wizardProvider.notifier).setGroupSize(
                        wizard.groupSize == id ? null : id,
                      );
                },
              ),
              const SizedBox(height: Spacing.lg),
            ],

            // Difficulty chips — only for adventure / trekking / wildlife
            if (showDifficulty) ...[
              const _FieldHeader(label: 'Difficulty'),
              const SizedBox(height: Spacing.sm),
              _ChipRow<DifficultyOption>(
                items: kDifficultyOptions,
                selectedId: wizard.difficulty,
                idOf: (d) => d.id,
                labelOf: (d) => d.label,
                prefixOf: (d) => d.emoji,
                onTap: (id) {
                  HapticFeedback.selectionClick();
                  ref.read(wizardProvider.notifier).setDifficulty(
                        wizard.difficulty == id ? null : id,
                      );
                },
              ),
              const SizedBox(height: Spacing.lg),
            ],
          ],

          // ── Title ────────────────────────────────────────────────
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

          // ── Description ──────────────────────────────────────────
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
          const _Microtip('One line that tells people why this matters.'),

          const SizedBox(height: Spacing.xxxl),
        ],
      ),
    );
  }

  String _headline(ContentType type) => switch (type) {
        ContentType.post => 'Start with a spark.',
        ContentType.selfPacedItinerary => 'Name your itinerary.',
        ContentType.event => 'Name your event.',
        ContentType.scheduledExperience => 'Name your experience.',
      };

  String _subhead(ContentType type) => switch (type) {
        ContentType.post => 'Give this story a name.',
        ContentType.selfPacedItinerary =>
          'A great title helps travelers find it.',
        ContentType.event => 'Pick a category and a clear name.',
        ContentType.scheduledExperience =>
          'Pick a category and a clear name.',
      };
}

// ── Sub-Category Selector Button ──────────────────────────────────

class _SubCategoryButton extends StatelessWidget {
  final SubCategory? selected;
  final bool hasError;
  final VoidCallback onTap;

  const _SubCategoryButton({
    required this.selected,
    required this.hasError,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isChosen = selected != null;
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 140),
        curve: Curves.easeInOut,
        height: Layout.minTapTarget + 4,
        padding: const EdgeInsets.symmetric(horizontal: Spacing.lg),
        decoration: BoxDecoration(
          color: isChosen ? AppColors.primaryTint : AppColors.surfaceAlt,
          borderRadius: BorderRadius.circular(Layout.inputRadius),
          border: Border.all(
            color: hasError
                ? AppColors.danger
                : isChosen
                    ? AppColors.coral
                    : AppColors.hairlineStrong,
            width: isChosen ? 1.5 : 1.0,
          ),
        ),
        child: Row(
          children: [
            if (isChosen) ...[
              Text(
                selected!.emoji,
                style: const TextStyle(fontSize: 18),
              ),
              const SizedBox(width: Spacing.sm),
            ] else ...[
              const Icon(
                PhosphorIconsRegular.squaresFour,
                size: 18,
                color: AppColors.inkMuted,
              ),
              const SizedBox(width: Spacing.sm),
            ],
            Expanded(
              child: Text(
                isChosen ? selected!.label : 'Choose a category',
                style: typ.AppTypography.body.copyWith(
                  color: isChosen ? AppColors.coral : AppColors.inkMuted,
                  fontWeight: isChosen ? FontWeight.w600 : FontWeight.w400,
                ),
              ),
            ),
            Icon(
              PhosphorIconsRegular.caretDown,
              size: 16,
              color: isChosen ? AppColors.coral : AppColors.inkMuted,
            ),
          ],
        ),
      ),
    );
  }
}

// ── Sub-Category Bottom Sheet ─────────────────────────────────────

class _SubCategorySheet extends StatelessWidget {
  final String vertical;
  final String? selectedId;
  final void Function(String id) onSelected;

  const _SubCategorySheet({
    required this.vertical,
    required this.selectedId,
    required this.onSelected,
  });

  @override
  Widget build(BuildContext context) {
    final categories = subCategoriesForVertical(vertical);
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;

    return DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.75,
      minChildSize: 0.5,
      maxChildSize: 0.92,
      builder: (context, scrollController) {
        return Container(
          decoration: const BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.vertical(
              top: Radius.circular(Layout.sheetRadius),
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Drag handle
              Center(
                child: Padding(
                  padding: const EdgeInsets.only(top: Spacing.md),
                  child: Container(
                    width: Layout.sheetHandleWidth,
                    height: Layout.sheetHandleHeight,
                    decoration: BoxDecoration(
                      color: AppColors.hairlineStrong,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: Spacing.lg),

              // Header
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: Layout.screenPaddingH,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Pick a category', style: typ.AppTypography.h3),
                    const SizedBox(height: Spacing.xs),
                    Text(
                      'This helps your content reach the right audience.',
                      style: typ.AppTypography.bodySmall.copyWith(
                        color: AppColors.inkMuted,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: Spacing.lg),

              // Grid
              Expanded(
                child: GridView.builder(
                  controller: scrollController,
                  padding: EdgeInsets.fromLTRB(
                    Layout.screenPaddingH,
                    0,
                    Layout.screenPaddingH,
                    Spacing.xxxl + bottomInset,
                  ),
                  gridDelegate:
                      const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    mainAxisSpacing: Spacing.md,
                    crossAxisSpacing: Spacing.md,
                    childAspectRatio: 2.2,
                  ),
                  itemCount: categories.length,
                  itemBuilder: (context, index) {
                    final cat = categories[index];
                    final isSelected = cat.id == selectedId;
                    return _SubCatTile(
                      category: cat,
                      isSelected: isSelected,
                      onTap: () {
                        HapticFeedback.selectionClick();
                        onSelected(cat.id);
                      },
                    );
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _SubCatTile extends StatelessWidget {
  final SubCategory category;
  final bool isSelected;
  final VoidCallback onTap;

  const _SubCatTile({
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
        duration: const Duration(milliseconds: 140),
        curve: Curves.easeInOut,
        padding: const EdgeInsets.symmetric(
          horizontal: Spacing.md,
          vertical: Spacing.sm,
        ),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primaryTint : AppColors.surfaceAlt,
          borderRadius: BorderRadius.circular(Layout.cardRadius),
          border: Border.all(
            color:
                isSelected ? AppColors.coral : AppColors.hairlineStrong,
            width: isSelected ? 1.5 : 1.0,
          ),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Text(
              category.emoji,
              style: const TextStyle(fontSize: 22),
            ),
            const SizedBox(width: Spacing.sm),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    category.label,
                    style: typ.AppTypography.bodySmall.copyWith(
                      fontWeight: FontWeight.w600,
                      color: isSelected ? AppColors.coral : AppColors.ink,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  Text(
                    category.subtitle,
                    style: typ.AppTypography.caption.copyWith(
                      color: isSelected
                          ? AppColors.coralDeep
                          : AppColors.inkMuted,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Generic Chip Row ──────────────────────────────────────────────

/// A horizontally-scrolling row of selection chips.
/// Generic over [T] — pass idOf / labelOf / prefixOf extractors.
class _ChipRow<T> extends StatelessWidget {
  final List<T> items;
  final String? selectedId;
  final String Function(T) idOf;
  final String Function(T) labelOf;
  final String? Function(T) prefixOf;
  final void Function(String id) onTap;

  const _ChipRow({
    required this.items,
    required this.selectedId,
    required this.idOf,
    required this.labelOf,
    required this.prefixOf,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: Layout.minTapTarget,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: EdgeInsets.zero,
        itemCount: items.length,
        separatorBuilder: (_, _) => const SizedBox(width: Spacing.sm),
        itemBuilder: (context, index) {
          final item = items[index];
          final id = idOf(item);
          final isSelected = id == selectedId;
          final prefix = prefixOf(item);
          return _SelectChip(
            label: prefix != null ? '$prefix  ${labelOf(item)}' : labelOf(item),
            isSelected: isSelected,
            onTap: () => onTap(id),
          );
        },
      ),
    );
  }
}

// ── Selection Chip ────────────────────────────────────────────────

class _SelectChip extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _SelectChip({
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 120),
        curve: Curves.easeInOut,
        constraints: const BoxConstraints(
          minHeight: Layout.minTapTarget,
          minWidth: Layout.minTapTarget,
        ),
        padding: const EdgeInsets.symmetric(
          horizontal: Spacing.lg,
          vertical: Spacing.sm,
        ),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primaryTint : AppColors.surface,
          borderRadius: BorderRadius.circular(Layout.chipRadius),
          border: Border.all(
            color:
                isSelected ? AppColors.coral : AppColors.hairlineStrong,
            width: isSelected ? 1.5 : 1.0,
          ),
        ),
        alignment: Alignment.center,
        child: Text(
          label,
          style: typ.AppTypography.bodySmall.copyWith(
            fontWeight: FontWeight.w600,
            color: isSelected ? AppColors.coral : AppColors.inkSoft,
          ),
        ),
      ),
    );
  }
}

// ── Step Intro ────────────────────────────────────────────────────

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

// ── Field Header ──────────────────────────────────────────────────

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

// ── Microtip ──────────────────────────────────────────────────────

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
