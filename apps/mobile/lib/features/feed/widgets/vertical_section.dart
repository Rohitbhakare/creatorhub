import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/typography.dart';
import '../../../shared/components/skeleton.dart';
import '../providers/vertical_section_provider.dart';
import '../providers/sub_categories_provider.dart';
import '../utils/feed_navigation.dart';
import 'section_header.dart';
import 'content_card.dart';

/// Per-vertical content rail with sub-category filter chips (DISC-FR-023).
/// Hidden entirely when the section returns empty or errors.
///
/// [subCategoryId] — if non-null, filters to that sub-category.
class VerticalSection extends ConsumerStatefulWidget {
  final String vertical;
  final String sectionTitle;
  final String eyebrow;

  const VerticalSection({
    super.key,
    required this.vertical,
    required this.sectionTitle,
    required this.eyebrow,
  });

  @override
  ConsumerState<VerticalSection> createState() => _VerticalSectionState();
}

class _VerticalSectionState extends ConsumerState<VerticalSection> {
  String? _activeSubCatId; // null = All

  @override
  Widget build(BuildContext context) {
    final params = VerticalSectionParams(
      widget.vertical,
      subCategoryId: _activeSubCatId,
    );
    final async = ref.watch(verticalSectionProvider(params));
    final subCatsAsync = ref.watch(subCategoriesProvider(widget.vertical));

    return async.when(
      loading: () => _VerticalSkeleton(
        sectionTitle: widget.sectionTitle,
        eyebrow: widget.eyebrow,
      ),
      error: (_, _) => const SizedBox.shrink(),
      data: (items) {
        if (items.isEmpty && _activeSubCatId == null) return const SizedBox.shrink();

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (widget.eyebrow.isNotEmpty || widget.sectionTitle.isNotEmpty)
              SectionHeader(
                eyebrow: widget.eyebrow,
                title: widget.sectionTitle,
                onSeeAll: () => context.push(
                  '/feed/vertical/${widget.vertical}',
                  extra: {'title': widget.sectionTitle},
                ),
              ),

            // Sub-category chip rail
            subCatsAsync.when(
              loading: () => const SizedBox.shrink(),
              error: (_, _) => const SizedBox.shrink(),
              data: (cats) {
                if (cats.isEmpty) return const SizedBox.shrink();
                return _SubCatChipRail(
                  vertical: widget.vertical,
                  cats: cats,
                  activeId: _activeSubCatId,
                  onSelect: (id) {
                    HapticFeedback.selectionClick();
                    setState(() => _activeSubCatId = id);
                  },
                );
              },
            ),

            if (items.isEmpty)
              const SizedBox(height: 32)
            else
              SizedBox(
                height: 334,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  clipBehavior: Clip.none,
                  padding:
                      const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                  itemCount: items.length,
                  separatorBuilder: (_, _) => const SizedBox(width: 12),
                  itemBuilder: (context, i) => ContentCard(
                    item: items[i],
                    variant: ContentCardVariant.rail,
                    railWidth: 170,
                    onTap: () => openFeedItem(context, items[i]),
                  ),
                ),
              ),
          ],
        );
      },
    );
  }
}

// ── Sub-category horizontal chip rail ────────────────────────────────────────

class _SubCatChipRail extends StatelessWidget {
  final String vertical;
  final List<SubCategory> cats;
  final String? activeId;
  final void Function(String? id) onSelect;

  const _SubCatChipRail({
    required this.vertical,
    required this.cats,
    required this.activeId,
    required this.onSelect,
  });

  static const _maxVisible = 6;

  @override
  Widget build(BuildContext context) {
    final visible = cats.take(_maxVisible).toList();
    final hasMore = cats.length > _maxVisible;

    return SizedBox(
      height: 46,
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 20),
        child: Row(
          children: [
            // "All" chip
            _SubCatChip(
              label: 'All',
              selected: activeId == null,
              onTap: () => onSelect(null),
            ),
            const SizedBox(width: 8),
            // Category chips
            ...visible.map((cat) => Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: _SubCatChip(
                    label: cat.name,
                    selected: activeId == cat.id,
                    onTap: () => onSelect(cat.id),
                  ),
                )),
            // More chip
            if (hasMore)
              _SubCatChip(
                label: 'More ›',
                selected: false,
                onTap: () => context.push('/discover/category/$vertical'),
              ),
          ],
        ),
      ),
    );
  }
}

class _SubCatChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _SubCatChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 130),
        height: 30,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: selected ? AppColors.ink : Colors.transparent,
          border: Border.all(
            color: selected ? AppColors.ink : AppColors.hairlineStrong,
            width: 1,
          ),
          borderRadius: BorderRadius.circular(999),
        ),
        child: Text(
          label,
          style: AppTypography.caption.copyWith(
            color: selected ? AppColors.surface : AppColors.ink,
            fontSize: 12,
            fontWeight: FontWeight.w500,
            height: 1.0,
          ),
        ),
      ),
    );
  }
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

class _VerticalSkeleton extends StatelessWidget {
  final String sectionTitle;
  final String eyebrow;

  const _VerticalSkeleton({
    required this.sectionTitle,
    required this.eyebrow,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.fromLTRB(20, 0, 20, 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SkeletonLine(width: 100, height: 11),
              SizedBox(height: 4),
              SkeletonLine(width: 180, height: 20),
            ],
          ),
        ),
        SizedBox(
          height: 334,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 20),
            itemCount: 3,
            separatorBuilder: (_, _) => const SizedBox(width: 12),
            itemBuilder: (_, _) => const SizedBox(
              width: 170,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SizedBox(
                    width: 170,
                    height: 212,
                    child: SkeletonRect(borderRadius: 12),
                  ),
                  SizedBox(height: 8),
                  SkeletonLine(height: 13),
                  SizedBox(height: 6),
                  SkeletonLine(width: 100, height: 11),
                  SizedBox(height: 6),
                  SkeletonLine(width: 130, height: 20),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}
