import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../shared/components/skeleton.dart';
import '../providers/vertical_section_provider.dart';
import '../utils/feed_navigation.dart';
import 'section_header.dart';
import 'content_card.dart';

/// Per-vertical content rail (DISC-FR-023).
/// Hidden entirely when the section returns empty or errors.
class VerticalSection extends ConsumerWidget {
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
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(verticalSectionProvider(vertical));

    return async.when(
      loading: () => _VerticalSkeleton(sectionTitle: sectionTitle, eyebrow: eyebrow),
      error: (_, _) => const SizedBox.shrink(),
      data: (items) {
        if (items.isEmpty) return const SizedBox.shrink();

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (eyebrow.isNotEmpty || sectionTitle.isNotEmpty)
              SectionHeader(
                eyebrow: eyebrow,
                title: sectionTitle,
                onSeeAll: () => context.push(
                  '/feed/vertical/$vertical',
                  extra: {'title': sectionTitle},
                ),
              ),
            SizedBox(
              height: 334,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                clipBehavior: Clip.none,
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
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

class _VerticalSkeleton extends StatelessWidget {
  final String sectionTitle;
  final String eyebrow;

  const _VerticalSkeleton({required this.sectionTitle, required this.eyebrow});

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
