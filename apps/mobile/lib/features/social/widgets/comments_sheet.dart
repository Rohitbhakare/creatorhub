import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart' show PhosphorIconsFill;

import '../../../shared/components/avatar.dart';
import '../../../shared/components/empty_state.dart';
import '../../../shared/components/skeleton.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/layout.dart';
import '../../../shared/theme/spacing.dart';
import '../../../shared/theme/typography.dart' as typ;
import '../../../shared/utils/format.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/comments_provider.dart';

/// Show the comments bottom sheet for a given content item.
Future<void> showCommentsSheet(BuildContext context, String contentId, int initialCount) {
  HapticFeedback.lightImpact();
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: AppColors.bg,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(Layout.sheetRadius)),
    ),
    builder: (ctx) => CommentsSheet(contentId: contentId, initialCount: initialCount),
  );
}

/// Comment bottom sheet — 75% height, threaded, paginated.
class CommentsSheet extends ConsumerWidget {
  final String contentId;
  final int initialCount;

  const CommentsSheet({
    super.key,
    required this.contentId,
    required this.initialCount,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final commentsState = ref.watch(commentsProvider(contentId));
    final userId = ref.watch(authProvider.select((s) => s.user?['id'] as String?));
    final screenHeight = MediaQuery.of(context).size.height;

    return SizedBox(
      height: screenHeight * 0.75,
      child: Column(
        children: [
          // Header
          _Header(contentId: contentId, count: commentsState.items.length),
          const Divider(height: 1, color: AppColors.hairline),

          // Comment list
          Expanded(
            child: _CommentList(
              contentId: contentId,
              state: commentsState,
              currentUserId: userId,
            ),
          ),

          const Divider(height: 1, color: AppColors.hairline),

          // Input bar
          _CommentInput(contentId: contentId, state: commentsState),
        ],
      ),
    );
  }
}

// ── Header ────────────────────────────────────────────────────────

class _Header extends ConsumerWidget {
  final String contentId;
  final int count;

  const _Header({required this.contentId, required this.count});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(Spacing.xl, Spacing.lg, Spacing.md, Spacing.md),
      child: Row(
        children: [
          Expanded(
            child: Text(
              count == 0 ? 'Comments' : 'Comments ($count)',
              style: typ.AppTypography.h4,
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
              decoration: const BoxDecoration(color: AppColors.surfaceAlt, shape: BoxShape.circle),
              child: const Icon(Icons.close, size: 18, color: AppColors.inkSoft),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Comment List ──────────────────────────────────────────────────

class _CommentList extends ConsumerWidget {
  final String contentId;
  final CommentsState state;
  final String? currentUserId;

  const _CommentList({
    required this.contentId,
    required this.state,
    required this.currentUserId,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (state.isLoading) {
      return const _CommentsSkeleton();
    }
    if (state.error != null) {
      return EmptyState(
        icon: PhosphorIconsFill.wifiSlash,
        title: 'Could not load',
        description: state.error!,
        ctaLabel: 'Retry',
        onCtaPressed: () => ref.read(commentsProvider(contentId).notifier).retry(),
      );
    }
    if (state.items.isEmpty) {
      return const EmptyState(
        icon: PhosphorIconsFill.chatCircle,
        title: 'No comments yet',
        description: 'Be the first to share your thoughts.',
      );
    }

    return NotificationListener<ScrollNotification>(
      onNotification: (n) {
        if (n is ScrollEndNotification && n.metrics.extentAfter < 200) {
          ref.read(commentsProvider(contentId).notifier).loadMore();
        }
        return false;
      },
      child: ListView.builder(
        padding: const EdgeInsets.symmetric(vertical: Spacing.sm),
        itemCount: state.items.length + (state.isLoadingMore ? 1 : 0),
        itemBuilder: (context, index) {
          if (index >= state.items.length) {
            return const Padding(
              padding: EdgeInsets.all(Spacing.lg),
              child: Center(child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.coral)),
            );
          }
          final comment = state.items[index];
          return _CommentTile(
            comment: comment,
            contentId: contentId,
            currentUserId: currentUserId,
            isReply: false,
          );
        },
      ),
    );
  }
}

// ── Comment Tile ──────────────────────────────────────────────────

class _CommentTile extends ConsumerWidget {
  final Comment comment;
  final String contentId;
  final String? currentUserId;
  final bool isReply;

  const _CommentTile({
    required this.comment,
    required this.contentId,
    required this.currentUserId,
    required this.isReply,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isOwn = currentUserId != null && comment.author?.id == currentUserId;

    if (comment.isDeleted && comment.replies.isEmpty) {
      return const SizedBox.shrink(); // fully gone
    }

    return Padding(
      padding: EdgeInsets.only(
        left: isReply ? Spacing.xxxl : Layout.screenPaddingH,
        right: Layout.screenPaddingH,
        top: Spacing.sm,
        bottom: Spacing.sm,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (isReply)
            Container(
              margin: const EdgeInsets.only(bottom: Spacing.xs, left: -Spacing.lg),
              width: 2,
              height: 16,
              color: AppColors.hairline,
            ),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Avatar
              AppAvatar(
                imageUrl: comment.author?.avatarUrl,
                name: comment.author?.displayName ?? '?',
                size: isReply ? 28 : 36,
              ),
              const SizedBox(width: Spacing.md),

              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Username + time
                    Row(
                      children: [
                        Text(
                          comment.author?.displayName ?? 'User',
                          style: typ.AppTypography.bodySmall.copyWith(fontWeight: FontWeight.w600),
                        ),
                        if (comment.isEdited)
                          Padding(
                            padding: const EdgeInsets.only(left: Spacing.xs),
                            child: Text(
                              '· Edited',
                              style: typ.AppTypography.caption.copyWith(color: AppColors.inkMuted),
                            ),
                          ),
                        const Spacer(),
                        Text(
                          formatTimeAgo(comment.createdAt),
                          style: typ.AppTypography.caption.copyWith(color: AppColors.inkMuted),
                        ),
                      ],
                    ),
                    const SizedBox(height: Spacing.xs),

                    // Body
                    comment.isDeleted
                        ? Text(
                            '[Deleted]',
                            style: typ.AppTypography.bodySmall
                                .copyWith(color: AppColors.inkMuted, fontStyle: FontStyle.italic),
                          )
                        : Text(comment.body ?? '', style: typ.AppTypography.bodySmall),

                    const SizedBox(height: Spacing.xs),

                    // Actions row
                    if (!comment.isDeleted)
                      Row(
                        children: [
                          if (!isReply) // Only top-level can be replied to
                            _ActionButton(
                              label: 'Reply',
                              onTap: () {
                                HapticFeedback.lightImpact();
                                ref.read(commentsProvider(contentId).notifier).setReplyTo(
                                      comment.id,
                                      comment.author?.username ?? comment.author?.displayName,
                                    );
                              },
                            ),
                          if (isOwn) ...[
                            const SizedBox(width: Spacing.md),
                            _ActionButton(
                              label: 'Edit',
                              onTap: () => _showEditDialog(context, ref),
                            ),
                            const SizedBox(width: Spacing.md),
                            _ActionButton(
                              label: 'Delete',
                              isDestructive: true,
                              onTap: () => _confirmDelete(context, ref),
                            ),
                          ],
                        ],
                      ),
                  ],
                ),
              ),
            ],
          ),

          // Replies
          if (comment.replies.isNotEmpty)
            ...comment.replies.map(
              (reply) => _CommentTile(
                comment: reply,
                contentId: contentId,
                currentUserId: currentUserId,
                isReply: true,
              ),
            ),
        ],
      ),
    );
  }

  void _showEditDialog(BuildContext context, WidgetRef ref) {
    final controller = TextEditingController(text: comment.body);
    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Edit comment'),
        content: TextField(
          controller: controller,
          maxLength: 500,
          maxLines: 4,
          decoration: const InputDecoration(
            hintText: 'Edit your comment...',
            border: OutlineInputBorder(),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () async {
              final body = controller.text.trim();
              if (body.isEmpty) return;
              Navigator.of(ctx).pop();
              await ref.read(commentsProvider(contentId).notifier).editComment(comment.id, body);
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  void _confirmDelete(BuildContext context, WidgetRef ref) {
    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete comment?'),
        content: const Text('This cannot be undone.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.of(ctx).pop();
              await ref.read(commentsProvider(contentId).notifier).deleteComment(comment.id);
            },
            child: Text('Delete', style: TextStyle(color: AppColors.danger)),
          ),
        ],
      ),
    );
  }
}

class _ActionButton extends StatelessWidget {
  final String label;
  final VoidCallback onTap;
  final bool isDestructive;

  const _ActionButton({
    required this.label,
    required this.onTap,
    this.isDestructive = false,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Text(
        label,
        style: typ.AppTypography.caption.copyWith(
          color: isDestructive ? AppColors.danger : AppColors.inkSoft,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }
}

// ── Comment Input ─────────────────────────────────────────────────

class _CommentInput extends ConsumerStatefulWidget {
  final String contentId;
  final CommentsState state;

  const _CommentInput({required this.contentId, required this.state});

  @override
  ConsumerState<_CommentInput> createState() => _CommentInputState();
}

class _CommentInputState extends ConsumerState<_CommentInput> {
  final _controller = TextEditingController();
  bool _isSending = false;
  int _charCount = 0;

  @override
  void initState() {
    super.initState();
    _controller.addListener(() => setState(() => _charCount = _controller.text.length));
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    final body = _controller.text.trim();
    if (body.isEmpty || _isSending) return;
    setState(() => _isSending = true);
    final ok = await ref.read(commentsProvider(widget.contentId).notifier).addComment(body);
    if (ok) _controller.clear();
    if (mounted) setState(() => _isSending = false);
  }

  @override
  Widget build(BuildContext context) {
    final replyToName = widget.state.replyToName;
    final authState = ref.watch(authProvider);
    final avatarUrl = authState.user?['avatar_url'] as String?;
    final displayName = authState.user?['display_name'] as String? ?? 'Me';

    return SafeArea(
      child: AnimatedPadding(
        duration: const Duration(milliseconds: 150),
        curve: Curves.easeOut,
        padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Reply indicator
            if (replyToName != null)
              Container(
                color: AppColors.surfaceAlt,
                padding: const EdgeInsets.symmetric(
                  horizontal: Layout.screenPaddingH,
                  vertical: Spacing.xs,
                ),
                child: Row(
                  children: [
                    Text(
                      'Replying to @$replyToName',
                      style: typ.AppTypography.caption.copyWith(color: AppColors.inkSoft),
                    ),
                    const Spacer(),
                    GestureDetector(
                      onTap: () {
                        HapticFeedback.lightImpact();
                        ref.read(commentsProvider(widget.contentId).notifier).clearReplyTo();
                      },
                      child: const Icon(Icons.close, size: 16, color: AppColors.inkSoft),
                    ),
                  ],
                ),
              ),

            Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: Layout.screenPaddingH,
                vertical: Spacing.md,
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  // Avatar
                  AppAvatar(imageUrl: avatarUrl, name: displayName, size: 32),
                  const SizedBox(width: Spacing.md),

                  // Input
                  Expanded(
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(maxHeight: 100),
                      child: TextField(
                        controller: _controller,
                        maxLength: 500,
                        maxLines: null,
                        textInputAction: TextInputAction.newline,
                        style: typ.AppTypography.bodySmall,
                        decoration: InputDecoration(
                          hintText: replyToName != null
                              ? '@$replyToName '
                              : 'Add a comment…',
                          hintStyle: typ.AppTypography.bodySmall.copyWith(color: AppColors.inkMuted),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(20),
                            borderSide: const BorderSide(color: AppColors.hairline),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(20),
                            borderSide: const BorderSide(color: AppColors.hairline),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(20),
                            borderSide: const BorderSide(color: AppColors.coral),
                          ),
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: Spacing.md,
                            vertical: Spacing.sm,
                          ),
                          counterText: _charCount > 450 ? '${500 - _charCount}' : '',
                          counterStyle: typ.AppTypography.caption.copyWith(
                            color: _charCount > 480 ? AppColors.danger : AppColors.inkMuted,
                          ),
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(width: Spacing.sm),

                  // Send button
                  GestureDetector(
                    onTap: _charCount > 0 ? _send : null,
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 150),
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: _charCount > 0 ? AppColors.coral : AppColors.surfaceAlt,
                        shape: BoxShape.circle,
                      ),
                      child: _isSending
                          ? const Padding(
                              padding: EdgeInsets.all(8),
                              child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.surface),
                            )
                          : Icon(
                              PhosphorIconsFill.paperPlaneTilt,
                              size: 18,
                              color: _charCount > 0 ? AppColors.surface : AppColors.inkMuted,
                            ),
                    ),
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

// ── Skeleton ──────────────────────────────────────────────────────

class _CommentsSkeleton extends StatelessWidget {
  const _CommentsSkeleton();

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      padding: const EdgeInsets.symmetric(vertical: Spacing.sm),
      itemCount: 5,
      itemBuilder: (_, __) => Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: Layout.screenPaddingH,
          vertical: Spacing.sm,
        ),
        child: const SkeletonLoader(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SkeletonCircle(size: 36),
              SizedBox(width: Spacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SkeletonLine(width: 120, height: 12),
                    SizedBox(height: Spacing.xs),
                    SkeletonLine(height: 12),
                    SizedBox(height: 4),
                    SkeletonLine(width: 200, height: 12),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
