import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import '../../../shared/components/empty_state.dart';
import '../../../shared/components/skeleton.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/spacing.dart';
import '../../../shared/theme/typography.dart';
import '../../feed/utils/feed_navigation.dart';
import '../../feed/widgets/content_card.dart';
import '../providers/category_browse_provider.dart';

/// DISC-FR-003 — Category browse: vertical → sub-category → leaf type → content.
class CategoryBrowseScreen extends ConsumerStatefulWidget {
  final String vertical;
  final String? initialSubCategoryId;

  const CategoryBrowseScreen({
    super.key,
    required this.vertical,
    this.initialSubCategoryId,
  });

  @override
  ConsumerState<CategoryBrowseScreen> createState() =>
      _CategoryBrowseScreenState();
}

class _CategoryBrowseScreenState extends ConsumerState<CategoryBrowseScreen> {
  late String? _selectedSubCategoryId;
  String? _selectedLeafType;
  final _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _selectedSubCategoryId = widget.initialSubCategoryId;
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  CategoryBrowseParams get _params => CategoryBrowseParams(
        vertical: widget.vertical,
        subCategoryId: _selectedSubCategoryId,
        leafType: _selectedLeafType,
      );

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 300) {
      ref.read(categoryBrowseProvider(_params).notifier).loadMore();
    }
  }

  void _selectSubCategory(String? id) {
    if (_selectedSubCategoryId == id) return;
    setState(() {
      _selectedSubCategoryId = id;
      _selectedLeafType = null;
    });
    ref.read(categoryBrowseProvider(_params).notifier).refresh();
  }

  void _selectLeafType(String? leaf) {
    if (_selectedLeafType == leaf) {
      setState(() => _selectedLeafType = null);
    } else {
      setState(() => _selectedLeafType = leaf);
    }
    ref.read(categoryBrowseProvider(_params).notifier).refresh();
  }

  String get _title {
    final v = widget.vertical;
    return v[0].toUpperCase() + v.substring(1);
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(categoryBrowseProvider(_params));

    final leafTypes = state.subCategories
        .where((sc) => sc.id == _selectedSubCategoryId)
        .expand((sc) => sc.leafTypes)
        .toList();

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: NestedScrollView(
          controller: _scrollController,
          headerSliverBuilder: (context, _) => [
            SliverToBoxAdapter(
              child: _TopBar(
                title: _title,
                onBack: () => Navigator.of(context).pop(),
              ),
            ),
            SliverToBoxAdapter(
              child: _SubCategoryChips(
                subCategories: state.subCategories,
                selectedId: _selectedSubCategoryId,
                onSelect: _selectSubCategory,
              ),
            ),
            if (leafTypes.isNotEmpty)
              SliverToBoxAdapter(
                child: _LeafTypeChips(
                  leafTypes: leafTypes,
                  selectedLeafType: _selectedLeafType,
                  onSelect: _selectLeafType,
                ),
              ),
            const SliverToBoxAdapter(child: SizedBox(height: Spacing.sm)),
          ],
          body: _ContentBody(state: state, params: _params),
        ),
      ),
    );
  }
}

// ── Top bar ───────────────────────────────────────────────────────────

class _TopBar extends StatelessWidget {
  final String title;
  final VoidCallback onBack;

  const _TopBar({required this.title, required this.onBack});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(8, 12, 20, 4),
      child: Row(
        children: [
          IconButton(
            icon: Icon(
              PhosphorIcons.arrowLeft(PhosphorIconsStyle.regular),
              color: AppColors.ink,
            ),
            onPressed: onBack,
          ),
          Text(
            title,
            style: GoogleFonts.fraunces(
              fontSize: 22,
              fontWeight: FontWeight.w600,
              color: AppColors.ink,
            ),
          ),
        ],
      ),
    );
  }
}

// ── Sub-category chip rail ────────────────────────────────────────────

class _SubCategoryChips extends StatelessWidget {
  final List<SubCategoryItem> subCategories;
  final String? selectedId;
  final void Function(String? id) onSelect;

  const _SubCategoryChips({
    required this.subCategories,
    required this.selectedId,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    if (subCategories.isEmpty) return const SizedBox.shrink();

    return SizedBox(
      height: 44,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: Spacing.mlg),
        separatorBuilder: (_, __) => const SizedBox(width: Spacing.xs),
        itemCount: subCategories.length + 1, // +1 for "All" chip
        itemBuilder: (_, i) {
          if (i == 0) {
            final isSelected = selectedId == null;
            return _FilterChip(
              label: 'All',
              isSelected: isSelected,
              onTap: () => onSelect(null),
            );
          }
          final sc = subCategories[i - 1];
          final isSelected = sc.id == selectedId;
          return _FilterChip(
            label: sc.name,
            count: sc.contentCount,
            isSelected: isSelected,
            onTap: () => onSelect(sc.id),
          );
        },
      ),
    );
  }
}

// ── Leaf type chip rail ───────────────────────────────────────────────

class _LeafTypeChips extends StatelessWidget {
  final List<String> leafTypes;
  final String? selectedLeafType;
  final void Function(String? leaf) onSelect;

  const _LeafTypeChips({
    required this.leafTypes,
    required this.selectedLeafType,
    required this.onSelect,
  });

  String _label(String leaf) {
    return leaf
        .replaceAll('_', ' ')
        .split(' ')
        .map((w) => w.isEmpty ? '' : w[0].toUpperCase() + w.substring(1))
        .join(' ');
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 36,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: Spacing.mlg),
        separatorBuilder: (_, __) => const SizedBox(width: Spacing.xs),
        itemCount: leafTypes.length,
        itemBuilder: (_, i) {
          final leaf = leafTypes[i];
          return _FilterChip(
            label: _label(leaf),
            isSelected: leaf == selectedLeafType,
            onTap: () => onSelect(leaf),
            small: true,
          );
        },
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final int? count;
  final bool isSelected;
  final VoidCallback onTap;
  final bool small;

  const _FilterChip({
    required this.label,
    required this.isSelected,
    required this.onTap,
    this.count,
    this.small = false,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        onTap();
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: EdgeInsets.symmetric(
          horizontal: small ? 12 : 14,
          vertical: small ? 4 : 6,
        ),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.ink : AppColors.surface,
          border: Border.all(
            color: isSelected ? AppColors.ink : AppColors.hairline,
          ),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              label,
              style: (small ? AppTypography.caption : AppTypography.bodySmall)
                  .copyWith(
                color: isSelected ? AppColors.surface : AppColors.ink,
                fontWeight:
                    isSelected ? FontWeight.w600 : FontWeight.w500,
              ),
            ),
            if (count != null && count! > 0) ...[
              const SizedBox(width: 4),
              Text(
                '$count',
                style: AppTypography.caption.copyWith(
                  color: isSelected
                      ? AppColors.surface.withValues(alpha: 0.7)
                      : AppColors.inkSoft,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

// ── Content body ─────────────────────────────────────────────────────

class _ContentBody extends ConsumerWidget {
  final CategoryBrowseState state;
  final CategoryBrowseParams params;

  const _ContentBody({required this.state, required this.params});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (state.isLoading) {
      return _ContentSkeleton();
    }

    if (state.error != null) {
      return Center(
        child: EmptyState(
          title: 'Something went wrong',
          description: state.error!,
          ctaLabel: 'Try again',
          onCtaPressed: () => ref.read(categoryBrowseProvider(params).notifier).refresh(),
        ),
      );
    }

    if (state.items.isEmpty) {
      return const Center(
        child: EmptyState(
          title: 'Nothing here yet',
          description: 'Be the first creator to publish in this category.',
        ),
      );
    }

    return GridView.builder(
      padding: const EdgeInsets.fromLTRB(
          Spacing.mlg, Spacing.sm, Spacing.mlg, Spacing.xxxl),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 0.65,
      ),
      itemCount: state.items.length + (state.isLoadingMore ? 2 : 0),
      itemBuilder: (context, i) {
        if (i >= state.items.length) {
          return const SkeletonRect(borderRadius: 12);
        }
        final item = state.items[i];
        return ContentCard(
          item: item,
          variant: ContentCardVariant.grid,
          onTap: () => openFeedItem(context, item),
        );
      },
    );
  }
}

class _ContentSkeleton extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      padding: const EdgeInsets.fromLTRB(
          Spacing.mlg, Spacing.sm, Spacing.mlg, Spacing.xxxl),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 0.65,
      ),
      itemCount: 6,
      itemBuilder: (_, __) => const SkeletonRect(borderRadius: 12),
    );
  }
}
