import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/discover_provider.dart';
import 'section_header.dart';
import 'feed_content_card.dart';

/// Discover creators from outside user's picked verticals (DISC-FR-025).
/// Hidden when empty — no state shown.
class DiscoverSection extends ConsumerWidget {
  const DiscoverSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(discoverProvider);

    return async.when(
      loading: () => const SizedBox.shrink(),
      error: (_, _) => const SizedBox.shrink(),
      data: (creators) {
        if (creators.isEmpty) return const SizedBox.shrink();

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SectionHeader(
              eyebrow: 'WORTH FOLLOWING',
              title: 'Creators we like this month',
            ),
            SizedBox(
              height: 200,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 20),
                itemCount: creators.length,
                separatorBuilder: (_, _) => const SizedBox(width: 12),
                itemBuilder: (context, i) {
                  final creator = creators[i];
                  return DiscoverCreatorCard(
                    displayName: creator.displayName ?? creator.username ?? 'Creator',
                    avatarUrl: creator.avatarUrl,
                    vertical: creator.vertical,
                  );
                },
              ),
            ),
            const SizedBox(height: 28),
          ],
        );
      },
    );
  }
}
