import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/typography.dart';
import '../providers/near_you_provider.dart';
import '../providers/vertical_section_provider.dart';
import '../providers/discover_provider.dart';
import '../providers/user_city_provider.dart';
import '../widgets/near_you_section.dart';
import '../widgets/vertical_section.dart';
import '../widgets/discover_section.dart';
import 'location_picker_screen.dart';

/// Home Feed — section-based magazine layout (DISC-FR-001).
/// Section order (DISC-FR-021):
///   1. Near You
///   2. Per-vertical content rails (Travel, Stories)
///   3. Discover something new
///
/// No greeting block (DD-011).
/// All sections fetch independently and hide on empty/error.
class HomeFeedScreen extends ConsumerStatefulWidget {
  const HomeFeedScreen({super.key});

  @override
  ConsumerState<HomeFeedScreen> createState() => _HomeFeedScreenState();
}

class _HomeFeedScreenState extends ConsumerState<HomeFeedScreen> {
  final _refreshKey = GlobalKey<RefreshIndicatorState>();

  Future<void> _refresh() async {
    ref.invalidate(nearYouProvider);
    ref.invalidate(verticalSectionProvider('travel'));
    ref.invalidate(verticalSectionProvider('stories'));
    ref.invalidate(discoverProvider);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      body: SafeArea(
        child: RefreshIndicator(
          key: _refreshKey,
          color: AppColors.coral,
          onRefresh: _refresh,
          child: CustomScrollView(
            slivers: [
              // ── Top Bar (sticky) ────────────────────────────
              SliverPersistentHeader(
                pinned: true,
                delegate: _FeedTopBarDelegate(
                  onLocationTap: _openLocationPicker,
                ),
              ),
              // ── Vertical Filter Chips (DD-011) ──────────────
              const SliverToBoxAdapter(child: _VerticalChipRow()),
              const SliverToBoxAdapter(child: SizedBox(height: 20)),
              // ── Near You ─────────────────────────────────────
              const SliverToBoxAdapter(child: NearYouSection()),
              // ── Travel vertical rail ─────────────────────────
              const SliverToBoxAdapter(
                child: VerticalSection(
                  vertical: 'travel',
                  eyebrow: 'TRAVEL',
                  sectionTitle: 'Trips worth your weekend',
                ),
              ),
              // ── Stories vertical rail ────────────────────────
              const SliverToBoxAdapter(
                child: VerticalSection(
                  vertical: 'stories',
                  eyebrow: 'STORIES WORTH READING',
                  sectionTitle: 'From the people who go',
                ),
              ),
              // ── Discover creators ────────────────────────────
              const SliverToBoxAdapter(child: DiscoverSection()),
              // ── Honesty footer (DISC-FR-001) ─────────────────
              const SliverToBoxAdapter(child: _HonestyFooter()),
              const SliverToBoxAdapter(child: SizedBox(height: 20)),
            ],
          ),
        ),
      ),
    );
  }

  void _openLocationPicker() {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const LocationPickerScreen(),
    );
  }
}

// ── Top Bar ────────────────────────────────────────────────────

class _FeedTopBarDelegate extends SliverPersistentHeaderDelegate {
  final VoidCallback onLocationTap;
  const _FeedTopBarDelegate({required this.onLocationTap});

  @override
  double get minExtent => 52;
  @override
  double get maxExtent => 52;

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    return Container(
      height: maxExtent,
      color: AppColors.surface,
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        children: [
          Expanded(child: _LocationChip(onTap: onLocationTap)),
          const SizedBox(width: 12),
          const _IconBtn(icon: PhosphorIconsRegular.bell),
        ],
      ),
    );
  }

  @override
  bool shouldRebuild(covariant _FeedTopBarDelegate old) => false;
}

class _LocationChip extends ConsumerWidget {
  final VoidCallback onTap;
  const _LocationChip({required this.onTap});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cityName = ref.watch(userCityProvider).cityName ?? 'Set location';

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
        decoration: BoxDecoration(
          color: AppColors.sunken,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: AppColors.border, width: 0.5),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Coral map-pin (context #3 in 8 coral uses)
            const Icon(PhosphorIconsFill.mapPin, size: 13, color: AppColors.coral),
            const SizedBox(width: 5),
            Text(
              cityName,
              style: AppTypography.bodySmall.copyWith(
                color: AppColors.ink,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(width: 4),
            const Icon(Icons.expand_more, size: 14, color: AppColors.muted),
          ],
        ),
      ),
    );
  }
}

class _IconBtn extends StatelessWidget {
  final IconData icon;
  const _IconBtn({required this.icon});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 36,
      height: 36,
      decoration: BoxDecoration(
        color: AppColors.sunken,
        shape: BoxShape.circle,
        border: Border.all(color: AppColors.border, width: 0.5),
      ),
      child: Icon(icon, size: 18, color: AppColors.ink),
    );
  }
}

// ── Vertical Filter Chips (DISC-FR-031) ────────────────────────

class _VerticalChipRow extends StatefulWidget {
  const _VerticalChipRow();

  @override
  State<_VerticalChipRow> createState() => _VerticalChipRowState();
}

class _VerticalChipRowState extends State<_VerticalChipRow> {
  String _selected = 'all';

  static const _chips = [
    _Chip('all', 'All', null),
    _Chip('travel', 'Travel', PhosphorIconsRegular.mountains),
    _Chip('stories', 'Stories', PhosphorIconsRegular.bookOpen),
  ];

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 36,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 20),
        itemCount: _chips.length,
        separatorBuilder: (_, _) => const SizedBox(width: 8),
        itemBuilder: (context, i) {
          final chip = _chips[i];
          final isActive = _selected == chip.id;

          return GestureDetector(
            onTap: () => setState(() => _selected = chip.id),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 150),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
              decoration: BoxDecoration(
                color: isActive ? AppColors.ink : AppColors.sunken,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(
                  color: isActive ? AppColors.ink : AppColors.border,
                  width: 0.5,
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (chip.icon != null) ...[
                    Icon(
                      chip.icon,
                      size: 12,
                      color: isActive ? AppColors.white : AppColors.muted,
                    ),
                    const SizedBox(width: 5),
                  ],
                  Text(
                    chip.label,
                    style: AppTypography.label.copyWith(
                      color: isActive ? AppColors.white : AppColors.muted,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

class _Chip {
  final String id;
  final String label;
  final IconData? icon;
  const _Chip(this.id, this.label, this.icon);
}

// ── Honesty Footer (DISC-FR-001) ───────────────────────────────

class _HonestyFooter extends StatelessWidget {
  const _HonestyFooter();

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(20, 8, 20, 0),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.sunken,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(
        children: [
          Container(
            width: 28,
            height: 28,
            decoration: BoxDecoration(
              color: AppColors.white,
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(PhosphorIconsRegular.heart, size: 14, color: AppColors.ink),
          ),
          const SizedBox(height: 10),
          Text(
            '"Hand-picked by our team this week. No algorithm, no infinite scroll."',
            style: AppTypography.postBody.copyWith(
              fontSize: 13,
              color: AppColors.ink,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 6),
          Text(
            'Refreshed every Monday · CreatorHub',
            style: AppTypography.caption.copyWith(color: AppColors.softInk),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}
