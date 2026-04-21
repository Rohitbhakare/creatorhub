import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../shared/components/skeleton.dart';
import '../providers/vertical_section_provider.dart';
import '../utils/feed_navigation.dart';
import 'section_header.dart';
import 'feed_content_card.dart';

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
            SectionHeader(
              eyebrow: eyebrow,
              title: sectionTitle,
              onSeeAll: () => context.push(
                '/feed/vertical/$vertical',
                extra: {'title': sectionTitle},
              ),
            ),
            SizedBox(
              height: 230,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 20),
                itemCount: items.length,
                separatorBuilder: (_, _) => const SizedBox(width: 12),
                itemBuilder: (context, i) => FeedRailCard(
                  item: items[i],
                  onTap: () => openFeedItem(context, items[i]),
                ),
              ),
            ),
            const SizedBox(height: 28),
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
          height: 230,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 20),
            itemCount: 3,
            separatorBuilder: (_, _) => const SizedBox(width: 12),
            itemBuilder: (_, _) => Container(
              width: 200,
              clipBehavior: Clip.antiAlias,
              decoration: const BoxDecoration(borderRadius: BorderRadius.all(Radius.circular(14))),
              child: const SkeletonRect(height: 220),
            ),
          ),
        ),
        const SizedBox(height: 28),
      ],
    );
  }
}
