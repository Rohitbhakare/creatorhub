import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart' show PhosphorIconsFill;

import '../../../shared/components/button.dart';
import '../../../shared/components/skeleton.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/layout.dart';
import '../../../shared/theme/spacing.dart';
import '../../../shared/theme/typography.dart' as typ;
import '../providers/saved_provider.dart';

/// Show the "Save to…" bottom sheet for a content item.
Future<void> showSaveToListSheet(
  BuildContext context,
  WidgetRef ref,
  String contentId,
) {
  HapticFeedback.lightImpact();
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: AppColors.surface,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(Layout.sheetRadius)),
    ),
    builder: (ctx) => SaveToListSheet(contentId: contentId),
  );
}

/// Pinterest-style multi-select save sheet.
class SaveToListSheet extends ConsumerStatefulWidget {
  final String contentId;

  const SaveToListSheet({super.key, required this.contentId});

  @override
  ConsumerState<SaveToListSheet> createState() => _SaveToListSheetState();
}

class _SaveToListSheetState extends ConsumerState<SaveToListSheet> {
  late Set<String> _selected;
  bool _initialized = false;
  bool _isSaving = false;
  bool _showCreateInput = false;
  final _createController = TextEditingController();

  @override
  void dispose() {
    _createController.dispose();
    super.dispose();
  }

  void _initSelection(Set<String> currentlySaved) {
    if (!_initialized) {
      _selected = Set.from(currentlySaved);
      _initialized = true;
    }
  }

  void _toggle(String listId) {
    HapticFeedback.lightImpact();
    setState(() {
      if (_selected.contains(listId)) {
        _selected.remove(listId);
      } else {
        _selected.add(listId);
      }
    });
  }

  Future<void> _createAndSelect() async {
    final name = _createController.text.trim();
    if (name.isEmpty) return;
    final newList = await ref.read(savedListsProvider.notifier).createList(name);
    if (newList != null) {
      setState(() {
        _selected.add(newList.id);
        _showCreateInput = false;
        _createController.clear();
      });
    }
  }

  Future<void> _done() async {
    setState(() => _isSaving = true);
    await ref.read(saveStatusProvider(widget.contentId).notifier).applySelection(_selected.toList());
    if (mounted) Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final savedState = ref.watch(savedListsProvider);
    final savedStatus = ref.watch(saveStatusProvider(widget.contentId));
    _initSelection(savedStatus);

    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle
          Padding(
            padding: const EdgeInsets.only(top: Spacing.lg),
            child: Container(
              width: Layout.sheetHandleWidth,
              height: Layout.sheetHandleHeight,
              decoration: BoxDecoration(
                color: AppColors.line.withValues(alpha: 0.3),
                borderRadius: BorderRadius.circular(Layout.sheetHandleHeight / 2),
              ),
            ),
          ),

          // Header
          Padding(
            padding: const EdgeInsets.fromLTRB(Spacing.xl, Spacing.lg, Spacing.xl, Spacing.sm),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Save to…', style: typ.AppTypography.h4),
                      Text(
                        'Pick one or more of your wishlists',
                        style: typ.AppTypography.bodySmall.copyWith(color: AppColors.muted),
                      ),
                    ],
                  ),
                ),
                GestureDetector(
                  onTap: () {
                    HapticFeedback.lightImpact();
                    Navigator.of(context).pop();
                  },
                  child: Container(
                    width: 32,
                    height: 32,
                    decoration: const BoxDecoration(color: AppColors.sunken, shape: BoxShape.circle),
                    child: const Icon(Icons.close, size: 18, color: AppColors.muted),
                  ),
                ),
              ],
            ),
          ),

          // List items
          ConstrainedBox(
            constraints: BoxConstraints(
              maxHeight: MediaQuery.of(context).size.height * 0.4,
            ),
            child: savedState.isLoading
                ? const _ListsSkeleton()
                : ListView.builder(
                    shrinkWrap: true,
                    itemCount: savedState.lists.length,
                    itemBuilder: (context, index) {
                      final list = savedState.lists[index];
                      final isChecked = _selected.contains(list.id);
                      return _ListRow(
                        list: list,
                        isChecked: isChecked,
                        onTap: () => _toggle(list.id),
                      );
                    },
                  ),
          ),

          // Create new list row
          if (!_showCreateInput)
            ListTile(
              contentPadding: const EdgeInsets.symmetric(horizontal: Spacing.xl),
              leading: Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: AppColors.sunken,
                  borderRadius: BorderRadius.circular(Layout.cardRadius),
                ),
                child: const Icon(PhosphorIconsFill.plus, size: 20, color: AppColors.muted),
              ),
              title: Text('Create new list', style: typ.AppTypography.bodySmall),
              onTap: () {
                HapticFeedback.lightImpact();
                setState(() => _showCreateInput = true);
              },
            )
          else
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: Spacing.xl, vertical: Spacing.sm),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _createController,
                      autofocus: true,
                      maxLength: 100,
                      style: typ.AppTypography.bodySmall,
                      decoration: InputDecoration(
                        hintText: 'e.g. Spiti valley ideas',
                        hintStyle: typ.AppTypography.bodySmall.copyWith(color: AppColors.softInk),
                        counterText: '',
                        isDense: true,
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: Spacing.md,
                          vertical: Spacing.sm,
                        ),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide: const BorderSide(color: AppColors.coral),
                        ),
                      ),
                      onSubmitted: (_) => _createAndSelect(),
                    ),
                  ),
                  const SizedBox(width: Spacing.sm),
                  GestureDetector(
                    onTap: _createAndSelect,
                    child: Container(
                      width: 36,
                      height: 36,
                      decoration: const BoxDecoration(
                        color: AppColors.coral,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(PhosphorIconsFill.check, size: 18, color: AppColors.white),
                    ),
                  ),
                  const SizedBox(width: Spacing.xs),
                  GestureDetector(
                    onTap: () => setState(() {
                      _showCreateInput = false;
                      _createController.clear();
                    }),
                    child: Container(
                      width: 36,
                      height: 36,
                      decoration: const BoxDecoration(
                        color: AppColors.sunken,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.close, size: 18, color: AppColors.muted),
                    ),
                  ),
                ],
              ),
            ),

          const Divider(height: 1, color: AppColors.border),

          // Done button
          Padding(
            padding: const EdgeInsets.fromLTRB(Spacing.xl, Spacing.lg, Spacing.xl, Spacing.xl),
            child: AppButton(
              label: _isSaving ? 'Saving…' : 'Done',
              onPressed: _isSaving ? null : _done,
              variant: AppButtonVariant.primary,
              fullWidth: true,
            ),
          ),
        ],
      ),
    );
  }
}

// ── List Row ──────────────────────────────────────────────────────

class _ListRow extends StatelessWidget {
  final SavedList list;
  final bool isChecked;
  final VoidCallback onTap;

  const _ListRow({
    required this.list,
    required this.isChecked,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: Spacing.xl, vertical: Spacing.xs),
      onTap: onTap,
      leading: ClipRRect(
        borderRadius: BorderRadius.circular(8),
        child: SizedBox(
          width: 48,
          height: 48,
          child: list.coverUrl != null
              ? CachedNetworkImage(
                  imageUrl: list.coverUrl!,
                  fit: BoxFit.cover,
                  placeholder: (_, _) => const SkeletonRect(height: double.infinity, borderRadius: 0),
                  errorWidget: (_, _, _) => _Placeholder(),
                )
              : _Placeholder(),
        ),
      ),
      title: Text(
        list.name,
        style: typ.AppTypography.bodySmall.copyWith(fontWeight: FontWeight.w600),
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      ),
      subtitle: Text(
        '${list.itemCount} item${list.itemCount == 1 ? '' : 's'} · updated ${_relativeTime(list.updatedAt)}',
        style: typ.AppTypography.caption.copyWith(color: AppColors.softInk),
      ),
      trailing: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        width: 24,
        height: 24,
        decoration: BoxDecoration(
          color: isChecked ? AppColors.coral : Colors.transparent,
          border: Border.all(
            color: isChecked ? AppColors.coral : AppColors.border,
            width: 2,
          ),
          borderRadius: BorderRadius.circular(6),
        ),
        child: isChecked
            ? const Icon(PhosphorIconsFill.check, size: 14, color: AppColors.white)
            : null,
      ),
    );
  }

  String _relativeTime(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inDays == 0) return 'today';
    if (diff.inDays == 1) return 'yesterday';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return '${(diff.inDays / 7).floor()}w ago';
  }
}

class _Placeholder extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.sunken,
      child: const Center(child: Icon(PhosphorIconsFill.bookmarkSimple, size: 20, color: AppColors.softInk)),
    );
  }
}

class _ListsSkeleton extends StatelessWidget {
  const _ListsSkeleton();

  @override
  Widget build(BuildContext context) {
    return Column(
      children: List.generate(
        3,
        (_) => const Padding(
          padding: EdgeInsets.symmetric(horizontal: Spacing.xl, vertical: Spacing.sm),
          child: SkeletonLoader(
            child: Row(
              children: [
                SkeletonRect(width: 48, height: 48),
                SizedBox(width: Spacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      SkeletonLine(width: 140, height: 14),
                      SizedBox(height: 4),
                      SkeletonLine(width: 100, height: 12),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
