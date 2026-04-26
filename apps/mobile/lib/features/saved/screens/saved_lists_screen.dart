import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../../../shared/theme/colors.dart';
import '../../../shared/theme/layout.dart';
import '../../../shared/theme/spacing.dart';
import '../../../shared/theme/typography.dart' as typ;
import '../../../shared/components/button.dart';
import '../../../shared/components/empty_state.dart';
import '../../../shared/components/input.dart';
import '../../../shared/components/skeleton.dart';
import '../providers/saved_provider.dart';

/// Saved tab — Airbnb-style 2-column grid with mosaic covers.
class SavedListsScreen extends ConsumerStatefulWidget {
  const SavedListsScreen({super.key});

  @override
  ConsumerState<SavedListsScreen> createState() => _SavedListsScreenState();
}

class _SavedListsScreenState extends ConsumerState<SavedListsScreen> {
  bool _editMode = false;

  void _toggleEdit() {
    HapticFeedback.selectionClick();
    setState(() => _editMode = !_editMode);
  }

  void _showCreateListSheet() {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.bg,
      shape: const RoundedRectangleBorder(
        borderRadius:
            BorderRadius.vertical(top: Radius.circular(Layout.sheetRadius)),
      ),
      builder: (_) => Consumer(
        builder: (ctx, ref, _) => _CreateListSheet(
          onCreated: (name) async {
            await ref.read(savedListsProvider.notifier).createList(name);
          },
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(savedListsProvider);

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: RefreshIndicator(
          color: AppColors.coral,
          onRefresh: () async => ref.read(savedListsProvider.notifier).retry(),
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            slivers: [
              // ── Header ────────────────────────────────────────────
              SliverToBoxAdapter(
                child: _Header(
                  editMode: _editMode,
                  onEditToggle: _toggleEdit,
                  onAdd: _showCreateListSheet,
                ),
              ),

              // ── Content ───────────────────────────────────────────
              if (state.isLoading)
                const SliverToBoxAdapter(child: _Skeleton())
              else if (state.error != null && state.lists.isEmpty)
                SliverToBoxAdapter(
                  child: _SavedListsError(
                    error: state.error!,
                    onRetry: () => ref.read(savedListsProvider.notifier).retry(),
                  ),
                )
              else if (state.lists.isEmpty)
                SliverToBoxAdapter(
                  child: _SavedListsEmpty(onCreateList: _showCreateListSheet),
                )
              else ...[
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(20, 0, 20, 8),
                  sliver: SliverGrid(
                    delegate: SliverChildBuilderDelegate(
                      (context, i) => _ListCard(
                        list: state.lists[i],
                        editMode: _editMode,
                        onDelete: () async {
                          HapticFeedback.mediumImpact();
                          await ref
                              .read(savedListsProvider.notifier)
                              .deleteList(state.lists[i].id);
                        },
                      ),
                      childCount: state.lists.length,
                    ),
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 24,
                      childAspectRatio: 0.77,
                    ),
                  ),
                ),
                // ── Create new list row ───────────────────────────
                if (!_editMode)
                  SliverToBoxAdapter(
                    child: _NewListRow(onCreate: _showCreateListSheet),
                  ),
                const SliverToBoxAdapter(child: SizedBox(height: Spacing.xxxl)),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

// ── Header ────────────────────────────────────────────────────────

class _Header extends StatelessWidget {
  final bool editMode;
  final VoidCallback onEditToggle;
  final VoidCallback onAdd;

  const _Header({
    required this.editMode,
    required this.onEditToggle,
    required this.onAdd,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Expanded(
            child: Text(
              'Saved',
              style: GoogleFonts.fraunces(
                fontSize: 30,
                fontWeight: FontWeight.w700,
                color: AppColors.ink,
                letterSpacing: -0.5,
                height: 1.05,
              ),
            ),
          ),
          const SizedBox(width: 12),
          GestureDetector(
            onTap: onEditToggle,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 150),
              padding:
                  const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
              decoration: BoxDecoration(
                color: editMode ? AppColors.ink : AppColors.surfaceAlt,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                editMode ? 'Done' : 'Edit',
                style: typ.AppTypography.bodySmall.copyWith(
                  fontWeight: FontWeight.w600,
                  color: editMode ? AppColors.surface : AppColors.ink,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Saved List Card ──────────────────────────────────────────────────

class _ListCard extends StatelessWidget {
  final SavedList list;
  final bool editMode;
  final VoidCallback onDelete;

  const _ListCard({
    required this.list,
    required this.editMode,
    required this.onDelete,
  });

  String _subtitle() {
    if (list.itemCount > 0) {
      return '${list.itemCount} ${list.itemCount == 1 ? 'saved' : 'saved'}';
    }
    final diff = DateTime.now().difference(list.updatedAt);
    if (diff.inDays == 0) return 'Updated today';
    if (diff.inDays == 1) return 'Updated yesterday';
    return 'Empty';
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: editMode
          ? null
          : () {
              HapticFeedback.lightImpact();
              context.push('/saved/${list.id}');
            },
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Cover image area ────────────────────────────────
          Expanded(
            child: Stack(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(14),
                  child: _MosaicCover(urls: list.previewUrls),
                ),
                // Delete badge (edit mode)
                if (editMode)
                  Positioned(
                    top: 8,
                    left: 8,
                    child: GestureDetector(
                      onTap: onDelete,
                      child: Container(
                        width: 28,
                        height: 28,
                        decoration: const BoxDecoration(
                          color: Colors.red,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.remove,
                          color: Colors.white,
                          size: 18,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 10),
          // ── Name + subtitle ─────────────────────────────────
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 2),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  list.name,
                  style: typ.AppTypography.body.copyWith(
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                    color: AppColors.ink,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Text(
                  _subtitle(),
                  style: typ.AppTypography.caption.copyWith(
                    color: AppColors.inkSoft,
                  ),
                  maxLines: 1,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── Mosaic Cover ──────────────────────────────────────────────────

class _MosaicCover extends StatelessWidget {
  final List<String> urls;
  const _MosaicCover({required this.urls});

  Widget _img(String url) => CachedNetworkImage(
        imageUrl: url,
        fit: BoxFit.cover,
        placeholder: (_, _) =>
            Container(color: AppColors.surfaceAlt),
        errorWidget: (_, _, _) =>
            Container(color: AppColors.surfaceAlt),
      );

  @override
  Widget build(BuildContext context) {
    if (urls.isEmpty) return _CoverPlaceholder();

    if (urls.length == 1) {
      return SizedBox.expand(child: _img(urls[0]));
    }

    final u = urls.take(4).toList();

    // 4 images → 2×2 mosaic
    if (u.length >= 4) {
      return Column(
        children: [
          Expanded(
            child: Row(
              children: [
                Expanded(child: _img(u[0])),
                const SizedBox(width: 2),
                Expanded(child: _img(u[1])),
              ],
            ),
          ),
          const SizedBox(height: 2),
          Expanded(
            child: Row(
              children: [
                Expanded(child: _img(u[2])),
                const SizedBox(width: 2),
                Expanded(child: _img(u[3])),
              ],
            ),
          ),
        ],
      );
    }

    // 2–3 images → left column stacked + right single
    return Row(
      children: [
        Expanded(
          child: u.length == 3
              ? Column(
                  children: [
                    Expanded(child: _img(u[0])),
                    const SizedBox(height: 2),
                    Expanded(child: _img(u[1])),
                  ],
                )
              : _img(u[0]),
        ),
        const SizedBox(width: 2),
        Expanded(child: _img(u.last)),
      ],
    );
  }
}

class _CoverPlaceholder extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      color: const Color(0xFFF0EDE8),
      child: const Center(
        child: Icon(
          PhosphorIconsFill.bookmarkSimple,
          size: 36,
          color: Color(0xFFCCBFB2),
        ),
      ),
    );
  }
}

// ── Create new list row ──────────────────────────────────────────

class _NewListRow extends StatelessWidget {
  final VoidCallback onCreate;
  const _NewListRow({required this.onCreate});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        onCreate();
      },
      behavior: HitTestBehavior.opaque,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
        child: Row(
          children: [
            Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                border: Border.all(color: AppColors.hairlineStrong, width: 1.5),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(
                PhosphorIconsFill.plus,
                size: 22,
                color: AppColors.inkSoft,
              ),
            ),
            const SizedBox(width: 14),
            Text(
              'Create new list',
              style: typ.AppTypography.body.copyWith(
                fontWeight: FontWeight.w500,
                color: AppColors.ink,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Create List Sheet ─────────────────────────────────────────────

class _CreateListSheet extends StatefulWidget {
  final Future<void> Function(String name) onCreated;
  const _CreateListSheet({required this.onCreated});

  @override
  State<_CreateListSheet> createState() => _CreateListSheetState();
}

class _CreateListSheetState extends State<_CreateListSheet> {
  final _controller = TextEditingController();
  bool _isSaving = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final name = _controller.text.trim();
    if (name.isEmpty) return;
    setState(() => _isSaving = true);
    await widget.onCreated(name);
    if (mounted) Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: Spacing.xl,
        right: Spacing.xl,
        top: Spacing.xl,
        bottom: Spacing.xl + MediaQuery.of(context).viewInsets.bottom,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              width: Layout.sheetHandleWidth,
              height: Layout.sheetHandleHeight,
              decoration: BoxDecoration(
                color: AppColors.hairlineStrong.withValues(alpha: 0.3),
                borderRadius:
                    BorderRadius.circular(Layout.sheetHandleHeight / 2),
              ),
            ),
          ),
          const SizedBox(height: Spacing.xl),
          Text('New list', style: typ.AppTypography.h4),
          const SizedBox(height: Spacing.lg),
          AppInput(
            controller: _controller,
            label: 'List name',
            hint: 'e.g. Spiti valley ideas',
            autofocus: true,
            maxLength: 100,
            textInputAction: TextInputAction.done,
            onSubmitted: (_) => _submit(),
          ),
          const SizedBox(height: Spacing.xl),
          AppButton(
            label: 'Create',
            onPressed: _isSaving ? null : _submit,
            variant: AppButtonVariant.primary,
            fullWidth: true,
          ),
        ],
      ),
    );
  }
}

// ── Empty / Error / Skeleton ──────────────────────────────────────

class _SavedListsEmpty extends StatelessWidget {
  final VoidCallback onCreateList;
  const _SavedListsEmpty({required this.onCreateList});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 60),
      child: EmptyState(
        icon: PhosphorIconsFill.bookmarkSimple,
        title: 'Nothing saved yet',
        description:
            'Save places, itineraries and experiences to custom lists.',
        ctaLabel: 'Create a list',
        onCtaPressed: onCreateList,
      ),
    );
  }
}

class _SavedListsError extends StatelessWidget {
  final String error;
  final VoidCallback onRetry;
  const _SavedListsError({required this.error, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 60),
      child: EmptyState(
        icon: PhosphorIconsFill.wifiSlash,
        title: 'Could not load',
        description: error,
        ctaLabel: 'Try again',
        onCtaPressed: onRetry,
      ),
    );
  }
}

class _Skeleton extends StatelessWidget {
  const _Skeleton();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 0),
      child: GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          crossAxisSpacing: 12,
          mainAxisSpacing: 24,
          childAspectRatio: 0.77,
        ),
        itemCount: 4,
        itemBuilder: (_, __) => Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: SkeletonLoader(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(14),
                  child: const SkeletonRect(
                      height: double.infinity, borderRadius: 0),
                ),
              ),
            ),
            const SizedBox(height: 10),
            const SkeletonRect(width: 90, height: 14, borderRadius: 4),
            const SizedBox(height: 4),
            const SkeletonRect(width: 56, height: 11, borderRadius: 3),
          ],
        ),
      ),
    );
  }
}
