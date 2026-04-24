import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../shared/components/skeleton.dart';
import '../providers/editors_picks_provider.dart';
import '../utils/feed_navigation.dart';
import 'content_card.dart';
import 'section_header.dart';

/// DISC-FR-039 — "Editor's picks" horizontal rail.
/// Completely hidden (SizedBox.shrink) when the list is empty.
/// The section header uses the coral eyebrow to signal editorial curation.
class EditorPicksSection extends ConsumerWidget {
  const EditorPicksSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(editorPicksProvider);

    return async.when(
      loading: () => _EditorPicksSkeleton(),
      error: (_, __) => const SizedBox.shrink(),
      data: (items) {
        if (items.isEmpty) return const SizedBox.shrink();

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SectionHeader(
              eyebrow: "EDITOR'S PICKS",
              title: 'Handpicked for you',
              onSeeAll: null,
            ),
            SizedBox(
              height: 334,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                clipBehavior: Clip.none,
                padding:
                    const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                itemCount: items.length,
                separatorBuilder: (_, __) => const SizedBox(width: 12),
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

class _EditorPicksSkeleton extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: const [
              SkeletonRect(height: 12, width: 100),
              SizedBox(height: 6),
              SkeletonRect(height: 20, width: 180),
            ],
          ),
        ),
        SizedBox(
          height: 334,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
            itemCount: 3,
            separatorBuilder: (_, __) => const SizedBox(width: 12),
            itemBuilder: (_, __) => const SkeletonRect(
              width: 170,
              height: 318,
              borderRadius: 12,
            ),
          ),
        ),
      ],
    );
  }
}
