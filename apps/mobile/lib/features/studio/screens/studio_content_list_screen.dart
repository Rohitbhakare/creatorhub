import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../../../shared/components/skeleton.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/spacing.dart';
import '../../../shared/theme/typography.dart';
import '../providers/studio_provider.dart';
import '../widgets/studio_content_widgets.dart';

/// Full-screen content list — opened via "See all" from Studio tab.
class StudioContentListScreen extends ConsumerStatefulWidget {
  const StudioContentListScreen({super.key});

  @override
  ConsumerState<StudioContentListScreen> createState() =>
      _StudioContentListScreenState();
}

class _StudioContentListScreenState
    extends ConsumerState<StudioContentListScreen> {
  final _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      ref.read(studioContentProvider.notifier).loadMore();
    }
  }

  @override
  Widget build(BuildContext context) {
    final contentState = ref.watch(studioContentProvider);

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.fromLTRB(4, 8, 20, 8),
              child: Row(
                children: [
                  IconButton(
                    icon: Icon(
                      PhosphorIcons.arrowLeft(PhosphorIconsStyle.regular),
                      size: 20,
                      color: AppColors.ink,
                    ),
                    onPressed: () {
                      HapticFeedback.lightImpact();
                      context.pop();
                    },
                  ),
                  Expanded(
                    child: Text(
                      'Your content',
                      style: GoogleFonts.fraunces(
                        fontSize: 20,
                        fontWeight: FontWeight.w600,
                        color: AppColors.ink,
                      ),
                    ),
                  ),
                  GestureDetector(
                    onTap: () {
                      HapticFeedback.lightImpact();
                      context.push('/content/create');
                    },
                    child: Text(
                      'Create',
                      style: AppTypography.bodySmall.copyWith(
                        color: AppColors.coral,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Filter chips
            StudioFilterChips(
              currentFilter: contentState.statusFilter,
              onChanged: (filter) {
                HapticFeedback.lightImpact();
                ref
                    .read(studioContentProvider.notifier)
                    .setStatusFilter(filter);
              },
            ),
            const SizedBox(height: Spacing.md),

            // Content list
            Expanded(
              child: contentState.isLoading
                  ? const StudioContentSkeleton()
                  : contentState.error != null && contentState.items.isEmpty
                      ? StudioContentError(
                          onRetry: () =>
                              ref.read(studioContentProvider.notifier).retry(),
                        )
                      : contentState.items.isEmpty
                          ? StudioContentEmpty(filter: contentState.statusFilter)
                          : ListView.separated(
                              controller: _scrollController,
                              padding: const EdgeInsets.fromLTRB(
                                  Spacing.mlg, 0, Spacing.mlg, Spacing.xxxl),
                              itemCount: contentState.items.length +
                                  (contentState.isLoadingMore ? 1 : 0),
                              separatorBuilder: (_, __) =>
                                  const SizedBox(height: Spacing.sm),
                              itemBuilder: (context, i) {
                                if (i == contentState.items.length) {
                                  return const Padding(
                                    padding: EdgeInsets.symmetric(
                                        vertical: Spacing.lg),
                                    child: Center(
                                      child: SkeletonRect(
                                          height: 100, borderRadius: 12),
                                    ),
                                  );
                                }
                                return StudioContentCard(
                                    item: contentState.items[i]);
                              },
                            ),
            ),
          ],
        ),
      ),
    );
  }
}
