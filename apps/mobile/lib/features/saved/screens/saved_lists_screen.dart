import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart' show PhosphorIconsFill;

import '../../../shared/theme/colors.dart';
import '../../../shared/theme/layout.dart';
import '../../../shared/theme/spacing.dart';
import '../../../shared/theme/typography.dart' as typ;
import '../../../shared/components/button.dart';
import '../../../shared/components/empty_state.dart';
import '../../../shared/components/input.dart';
import '../../../shared/components/skeleton.dart';
import '../providers/saved_provider.dart';

/// 2-column grid of saved wishlists.
/// Accessed from You tab → "Saved" row.
class SavedListsScreen extends ConsumerWidget {
  const SavedListsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(savedListsProvider);

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: const Icon(PhosphorIconsFill.arrowLeft, color: AppColors.ink, size: 22),
          onPressed: () {
            HapticFeedback.lightImpact();
            context.pop();
          },
        ),
        title: Text('Saved', style: typ.AppTypography.h4),
        centerTitle: false,
        actions: [
          IconButton(
            icon: const Icon(PhosphorIconsFill.plus, color: AppColors.ink, size: 22),
            onPressed: () {
              HapticFeedback.lightImpact();
              _showCreateListSheet(context, ref);
            },
          ),
        ],
      ),
      body: switch (state) {
        SavedListsState(isLoading: true) => const _SavedListsSkeleton(),
        SavedListsState(error: final e) when e != null => _SavedListsError(
            error: e,
            onRetry: () => ref.read(savedListsProvider.notifier).retry(),
          ),
        _ => state.lists.isEmpty
            ? _SavedListsEmpty(onCreateList: () => _showCreateListSheet(context, ref))
            : _SavedListsGrid(lists: state.lists),
      },
    );
  }

  void _showCreateListSheet(BuildContext context, WidgetRef ref) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(Layout.sheetRadius)),
      ),
      builder: (ctx) => _CreateListSheet(
        onCreated: (name) async {
          await ref.read(savedListsProvider.notifier).createList(name);
        },
      ),
    );
  }
}

// ── Grid ─────────────────────────────────────────────────────────

class _SavedListsGrid extends StatelessWidget {
  final List<SavedList> lists;

  const _SavedListsGrid({required this.lists});

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      padding: const EdgeInsets.all(Layout.screenPaddingH),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: Spacing.md,
        mainAxisSpacing: Spacing.md,
        childAspectRatio: 0.85,
      ),
      itemCount: lists.length + 1, // +1 for "New list" card
      itemBuilder: (context, index) {
        if (index == lists.length) return const _NewListCard();
        return _ListCard(list: lists[index]);
      },
    );
  }
}

// ── List Card ─────────────────────────────────────────────────────

class _ListCard extends StatelessWidget {
  final SavedList list;

  const _ListCard({required this.list});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        context.push('/saved/${list.id}');
      },
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(Layout.cardRadius),
          border: Border.all(color: AppColors.border),
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Cover image
            Expanded(
              child: Stack(
                fit: StackFit.expand,
                children: [
                  if (list.coverUrl != null)
                    CachedNetworkImage(
                      imageUrl: list.coverUrl!,
                      fit: BoxFit.cover,
                      placeholder: (_, _) => const SkeletonRect(height: double.infinity, borderRadius: 0),
                      errorWidget: (_, _, _) => _CoverPlaceholder(),
                    )
                  else
                    _CoverPlaceholder(),

                  // Item count pill
                  Positioned(
                    top: Spacing.sm,
                    right: Spacing.sm,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: Spacing.sm,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.ink.withValues(alpha: 0.7),
                        borderRadius: BorderRadius.circular(100),
                      ),
                      child: Text(
                        '${list.itemCount}',
                        style: typ.AppTypography.caption.copyWith(
                          color: AppColors.white,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Name + meta
            Padding(
              padding: const EdgeInsets.all(Spacing.sm),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    list.name,
                    style: typ.AppTypography.bodySmall.copyWith(fontWeight: FontWeight.w600),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    _formatUpdatedAt(list.updatedAt),
                    style: typ.AppTypography.caption.copyWith(color: AppColors.softInk),
                    maxLines: 1,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatUpdatedAt(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inDays == 0) return 'today';
    if (diff.inDays == 1) return 'yesterday';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    if (diff.inDays < 30) return '${(diff.inDays / 7).floor()}w ago';
    return '${(diff.inDays / 30).floor()}mo ago';
  }
}

class _CoverPlaceholder extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.sunken,
      child: const Center(
        child: Icon(PhosphorIconsFill.bookmarkSimple, size: 32, color: AppColors.softInk),
      ),
    );
  }
}

// ── New List Card ────────────────────────────────────────────────

class _NewListCard extends StatelessWidget {
  const _NewListCard();

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        // Trigger parent create sheet via nearest ancestor
        // This taps are handled by the parent Scaffold's action button
        final scaffold = Scaffold.maybeOf(context);
        if (scaffold != null) {
          // We can't easily call parent methods here; navigate to create flow
          // instead show via a simple dialog approach
        }
        _showCreateListFromCard(context);
      },
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(Layout.cardRadius),
          border: Border.all(
            color: AppColors.border,
            width: 1.5,
            style: BorderStyle.solid,
          ),
        ),
        child: const Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(PhosphorIconsFill.plus, size: 28, color: AppColors.muted),
            SizedBox(height: Spacing.sm),
            Text(
              'New list',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w500,
                color: AppColors.muted,
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showCreateListFromCard(BuildContext context) {
    // Find the Consumer and trigger the create sheet
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(Layout.sheetRadius)),
      ),
      builder: (ctx) => Consumer(
        builder: (context, ref, _) => _CreateListSheet(
          onCreated: (name) async {
            await ref.read(savedListsProvider.notifier).createList(name);
          },
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
                color: AppColors.line.withValues(alpha: 0.3),
                borderRadius: BorderRadius.circular(Layout.sheetHandleHeight / 2),
              ),
            ),
          ),
          const SizedBox(height: Spacing.xl),
          Text('New wishlist', style: typ.AppTypography.h4),
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
    return EmptyState(
      icon: PhosphorIconsFill.bookmarkSimple,
      title: 'No wishlists yet',
      description: 'Save places, itineraries and experiences to custom lists.',
      ctaLabel: 'Create a list',
      onCtaPressed: onCreateList,
    );
  }
}

class _SavedListsError extends StatelessWidget {
  final String error;
  final VoidCallback onRetry;

  const _SavedListsError({required this.error, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return EmptyState(
      icon: PhosphorIconsFill.wifiSlash,
      title: 'Could not load',
      description: error,
      ctaLabel: 'Try again',
      onCtaPressed: onRetry,
    );
  }
}

class _SavedListsSkeleton extends StatelessWidget {
  const _SavedListsSkeleton();

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      padding: const EdgeInsets.all(Layout.screenPaddingH),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: Spacing.md,
        mainAxisSpacing: Spacing.md,
        childAspectRatio: 0.85,
      ),
      itemCount: 4,
      itemBuilder: (_, __) => const SkeletonLoader(
        child: SkeletonRect(height: double.infinity),
      ),
    );
  }
}
