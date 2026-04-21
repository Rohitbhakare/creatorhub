import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/typography.dart';
import '../../../shared/components/skeleton.dart';
import '../providers/vertical_section_provider.dart';
import '../utils/feed_navigation.dart';
import '../widgets/feed_content_card.dart';

/// Full-list view for a single vertical — reached via "See all".
class VerticalSectionFullScreen extends ConsumerWidget {
  final String vertical;
  final String title;

  const VerticalSectionFullScreen({
    super.key,
    required this.vertical,
    required this.title,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(verticalSectionProvider(vertical));

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: Column(
          children: [
            _Header(title: title, onBack: () => context.pop()),
            Expanded(
              child: async.when(
                loading: () => _LoadingGrid(),
                error: (_, _) => _ErrorState(
                  onRetry: () => ref.invalidate(verticalSectionProvider(vertical)),
                ),
                data: (items) {
                  if (items.isEmpty) return const _EmptyState();
                  return GridView.builder(
                    padding: const EdgeInsets.fromLTRB(20, 8, 20, 28),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      mainAxisSpacing: 14,
                      crossAxisSpacing: 14,
                      childAspectRatio: 200 / 230,
                    ),
                    itemCount: items.length,
                    itemBuilder: (context, i) => FeedRailCard(
                      item: items[i],
                      onTap: () => openFeedItem(context, items[i]),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Header extends StatelessWidget {
  final String title;
  final VoidCallback onBack;
  const _Header({required this.title, required this.onBack});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 8, 20, 16),
      child: Row(
        children: [
          IconButton(
            onPressed: onBack,
            icon: const Icon(PhosphorIconsRegular.arrowLeft, size: 22, color: AppColors.ink),
          ),
          const SizedBox(width: 4),
          Expanded(
            child: Text(
              title,
              style: AppTypography.h2.copyWith(color: AppColors.ink),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}

class _LoadingGrid extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 28),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 14,
        crossAxisSpacing: 14,
        childAspectRatio: 200 / 230,
      ),
      itemCount: 6,
      itemBuilder: (_, _) => Container(
        clipBehavior: Clip.antiAlias,
        decoration: const BoxDecoration(borderRadius: BorderRadius.all(Radius.circular(14))),
        child: const SkeletonRect(height: 230),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(PhosphorIconsRegular.compass, size: 48, color: AppColors.hairlineStrong),
            const SizedBox(height: 12),
            Text('Nothing here yet', style: AppTypography.h3.copyWith(color: AppColors.inkSoft)),
            const SizedBox(height: 4),
            Text(
              'Check back soon — creators are publishing every week.',
              style: AppTypography.bodySmall.copyWith(color: AppColors.inkMuted),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  final VoidCallback onRetry;
  const _ErrorState({required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(PhosphorIconsRegular.warningCircle, size: 40, color: AppColors.inkMuted),
            const SizedBox(height: 10),
            Text("Couldn't load", style: AppTypography.bodySmall.copyWith(color: AppColors.inkSoft)),
            const SizedBox(height: 12),
            OutlinedButton(onPressed: onRetry, child: const Text('Retry')),
          ],
        ),
      ),
    );
  }
}
