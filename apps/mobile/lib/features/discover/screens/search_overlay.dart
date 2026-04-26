import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/typography.dart';
import '../../../shared/components/initial_avatar.dart';
import '../../../shared/components/skeleton.dart';
import '../models/discover_models.dart';
import '../providers/search_provider.dart';

/// Full-screen search overlay (DISC-FR-033).
///
/// Shown when the search field is tapped on the Discover tab.
/// Displays recent searches as chips (up to 5), then live suggestions
/// grouped by type (content / cities / creators) as the user types.
/// Minimum 2 chars before suggestions fire.
class SearchOverlay extends ConsumerStatefulWidget {
  final void Function(String query) onQuerySubmitted;
  final void Function(String contentId, String contentType)? onContentTap;
  final void Function(String cityId, String cityName)? onCityTap;
  final void Function(String creatorId)? onCreatorTap;

  const SearchOverlay({
    super.key,
    required this.onQuerySubmitted,
    this.onContentTap,
    this.onCityTap,
    this.onCreatorTap,
  });

  @override
  ConsumerState<SearchOverlay> createState() => _SearchOverlayState();
}

class _SearchOverlayState extends ConsumerState<SearchOverlay> {
  final _ctrl = TextEditingController();
  final _focus = FocusNode();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _focus.requestFocus());
    _ctrl.addListener(() {
      ref.read(searchQueryProvider.notifier).set(_ctrl.text);
    });
  }

  @override
  void dispose() {
    _ctrl.dispose();
    _focus.dispose();
    super.dispose();
  }

  void _submit(String q) {
    final trimmed = q.trim();
    if (trimmed.isEmpty) return;
    HapticFeedback.selectionClick();
    ref.read(recentSearchesProvider.notifier).add(trimmed);
    widget.onQuerySubmitted(trimmed);
  }

  @override
  Widget build(BuildContext context) {
    final query = ref.watch(searchQueryProvider);
    final recent = ref.watch(recentSearchesProvider);
    final suggestionsAsync = ref.watch(searchSuggestionsProvider);

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: Column(
          children: [
            // Search bar row
            Container(
              color: AppColors.surface,
              padding: const EdgeInsets.fromLTRB(8, 12, 16, 12),
              child: Row(
                children: [
                  IconButton(
                    icon: Icon(
                      PhosphorIcons.caretLeft(PhosphorIconsStyle.regular),
                      color: AppColors.ink,
                      size: 20,
                    ),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                  Expanded(
                    child: Container(
                      height: 44,
                      decoration: BoxDecoration(
                        color: AppColors.surfaceAlt,
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Row(
                        children: [
                          const SizedBox(width: 14),
                          Icon(
                            PhosphorIcons.magnifyingGlass(PhosphorIconsStyle.regular),
                            size: 16,
                            color: AppColors.inkMuted,
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: TextField(
                              controller: _ctrl,
                              focusNode: _focus,
                              style: AppTypography.body.copyWith(color: AppColors.ink),
                              decoration: InputDecoration(
                                hintText: 'Search trips, creators, cities…',
                                hintStyle: AppTypography.body.copyWith(
                                  color: AppColors.inkFaint,
                                ),
                                border: InputBorder.none,
                                isDense: true,
                                contentPadding: EdgeInsets.zero,
                              ),
                              textInputAction: TextInputAction.search,
                              onSubmitted: _submit,
                            ),
                          ),
                          if (query.isNotEmpty)
                            GestureDetector(
                              onTap: () {
                                _ctrl.clear();
                                ref.read(searchQueryProvider.notifier).clear();
                              },
                              child: Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 12),
                                child: Icon(
                                  PhosphorIcons.x(PhosphorIconsStyle.regular),
                                  size: 14,
                                  color: AppColors.inkMuted,
                                ),
                              ),
                            ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const Divider(height: 1, color: AppColors.hairline),

            // Content area
            Expanded(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
                children: [
                  if (query.trim().length < 2) ...[
                    // Recent searches
                    if (recent.isNotEmpty) ...[
                      _SectionLabel(label: 'Recent', trailing: GestureDetector(
                        onTap: () => ref.read(recentSearchesProvider.notifier).clear(),
                        child: Text(
                          'Clear',
                          style: AppTypography.caption.copyWith(color: AppColors.coral),
                        ),
                      )),
                      const SizedBox(height: 10),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: recent.map((r) => _RecentChip(
                          label: r,
                          onTap: () {
                            _ctrl.text = r;
                            _ctrl.selection = TextSelection.fromPosition(
                              TextPosition(offset: r.length),
                            );
                            _submit(r);
                          },
                          onRemove: () =>
                              ref.read(recentSearchesProvider.notifier).remove(r),
                        )).toList(),
                      ),
                    ] else ...[
                      const SizedBox(height: 48),
                      Center(
                        child: Column(
                          children: [
                            Icon(
                              PhosphorIcons.magnifyingGlass(PhosphorIconsStyle.regular),
                              size: 40,
                              color: AppColors.hairlineStrong,
                            ),
                            const SizedBox(height: 12),
                            Text(
                              'Search trips, places, creators',
                              style: AppTypography.body.copyWith(color: AppColors.inkMuted),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ] else ...[
                    // Live suggestions
                    suggestionsAsync.when(
                      loading: () => const _SuggestionsSkeleton(),
                      error: (_, _) => const SizedBox.shrink(),
                      data: (result) {
                        if (result == null || result.isEmpty) {
                          return Center(
                            child: Padding(
                              padding: const EdgeInsets.only(top: 48),
                              child: Text(
                                'No results for "${_ctrl.text}"',
                                style: AppTypography.body.copyWith(color: AppColors.inkMuted),
                              ),
                            ),
                          );
                        }
                        return _SuggestionsList(
                          query: query,
                          result: result,
                          onContentTap: (s) {
                            ref.read(recentSearchesProvider.notifier).add(s.title);
                            widget.onContentTap?.call(s.id, s.type);
                          },
                          onCityTap: (c) {
                            ref.read(recentSearchesProvider.notifier).add(c.name);
                            widget.onCityTap?.call(c.id, c.name);
                          },
                          onCreatorTap: (c) {
                            widget.onCreatorTap?.call(c.id);
                          },
                        );
                      },
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Suggestions list ───────────────────────────────────────────────────────────

class _SuggestionsList extends StatelessWidget {
  final String query;
  final SearchSuggestionsResult result;
  final void Function(SearchContentSuggestion) onContentTap;
  final void Function(SearchCitySuggestion) onCityTap;
  final void Function(SearchCreatorSuggestion) onCreatorTap;

  const _SuggestionsList({
    required this.query,
    required this.result,
    required this.onContentTap,
    required this.onCityTap,
    required this.onCreatorTap,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (result.content.isNotEmpty) ...[
          _SectionLabel(label: 'Content'),
          const SizedBox(height: 4),
          ...result.content.map((s) => _ContentSuggestionRow(
            suggestion: s,
            highlight: query,
            onTap: () => onContentTap(s),
          )),
          const SizedBox(height: 16),
        ],
        if (result.cities.isNotEmpty) ...[
          _SectionLabel(label: 'Places'),
          const SizedBox(height: 4),
          ...result.cities.map((c) => _CitySuggestionRow(
            suggestion: c,
            highlight: query,
            onTap: () => onCityTap(c),
          )),
          const SizedBox(height: 16),
        ],
        if (result.creators.isNotEmpty) ...[
          _SectionLabel(label: 'Creators'),
          const SizedBox(height: 4),
          ...result.creators.map((c) => _CreatorSuggestionRow(
            suggestion: c,
            onTap: () => onCreatorTap(c),
          )),
        ],
      ],
    );
  }
}

class _ContentSuggestionRow extends StatelessWidget {
  final SearchContentSuggestion suggestion;
  final String highlight;
  final VoidCallback onTap;

  const _ContentSuggestionRow({
    required this.suggestion,
    required this.highlight,
    required this.onTap,
  });

  String get _typeLabel {
    switch (suggestion.type) {
      case 'post': return 'Story';
      case 'self_paced_itinerary': return 'Itinerary';
      case 'scheduled_experience': return 'Experience';
      case 'event': return 'Event';
      default: return suggestion.type;
    }
  }

  @override
  Widget build(BuildContext context) {
    return _SuggestionRow(
      icon: PhosphorIcons.magnifyingGlass(PhosphorIconsStyle.regular),
      title: suggestion.title,
      highlight: highlight,
      subtitle: suggestion.creatorName != null
          ? '$_typeLabel · ${suggestion.creatorName}'
          : _typeLabel,
      onTap: onTap,
    );
  }
}

class _CitySuggestionRow extends StatelessWidget {
  final SearchCitySuggestion suggestion;
  final String highlight;
  final VoidCallback onTap;

  const _CitySuggestionRow({
    required this.suggestion,
    required this.highlight,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return _SuggestionRow(
      icon: PhosphorIcons.mapPin(PhosphorIconsStyle.regular),
      iconColor: AppColors.coral,
      title: suggestion.name,
      highlight: highlight,
      subtitle: suggestion.state != null ? 'City · ${suggestion.state}' : 'City',
      onTap: onTap,
    );
  }
}

class _CreatorSuggestionRow extends StatelessWidget {
  final SearchCreatorSuggestion suggestion;
  final VoidCallback onTap;

  const _CreatorSuggestionRow({required this.suggestion, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final name = suggestion.displayName ?? suggestion.username ?? 'Creator';
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 10),
        child: Row(
          children: [
            InitialAvatar(name: name, avatarUrl: suggestion.avatarUrl, size: 36),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(name,
                      style: AppTypography.body.copyWith(color: AppColors.ink)),
                  if (suggestion.username != null)
                    Text('@${suggestion.username}',
                        style: AppTypography.caption.copyWith(color: AppColors.inkMuted)),
                ],
              ),
            ),
            Icon(PhosphorIcons.arrowUpLeft(PhosphorIconsStyle.regular),
                size: 14, color: AppColors.inkFaint),
          ],
        ),
      ),
    );
  }
}

// ── Generic suggestion row with bold-highlight ────────────────────────────────

class _SuggestionRow extends StatelessWidget {
  final IconData icon;
  final Color? iconColor;
  final String title;
  final String highlight;
  final String subtitle;
  final VoidCallback onTap;

  const _SuggestionRow({
    required this.icon,
    this.iconColor,
    required this.title,
    required this.highlight,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 10),
        child: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: AppColors.surfaceAlt,
                shape: BoxShape.circle,
              ),
              alignment: Alignment.center,
              child: Icon(icon, size: 16, color: iconColor ?? AppColors.inkMuted),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _HighlightText(text: title, highlight: highlight),
                  const SizedBox(height: 2),
                  Text(subtitle,
                      style: AppTypography.caption.copyWith(color: AppColors.inkMuted)),
                ],
              ),
            ),
            Icon(PhosphorIcons.arrowUpLeft(PhosphorIconsStyle.regular),
                size: 14, color: AppColors.inkFaint),
          ],
        ),
      ),
    );
  }
}

/// Renders [text] with [highlight] substring in bold (case-insensitive).
class _HighlightText extends StatelessWidget {
  final String text;
  final String highlight;

  const _HighlightText({required this.text, required this.highlight});

  @override
  Widget build(BuildContext context) {
    if (highlight.isEmpty) {
      return Text(text, style: AppTypography.body.copyWith(color: AppColors.ink));
    }
    final lower = text.toLowerCase();
    final h = highlight.toLowerCase();
    final idx = lower.indexOf(h);
    if (idx < 0) {
      return Text(text, style: AppTypography.body.copyWith(color: AppColors.ink));
    }
    return RichText(
      text: TextSpan(
        style: AppTypography.body.copyWith(color: AppColors.ink),
        children: [
          if (idx > 0) TextSpan(text: text.substring(0, idx)),
          TextSpan(
            text: text.substring(idx, idx + h.length),
            style: AppTypography.body.copyWith(
              color: AppColors.ink,
              fontWeight: FontWeight.w700,
            ),
          ),
          if (idx + h.length < text.length)
            TextSpan(text: text.substring(idx + h.length)),
        ],
      ),
    );
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

class _SectionLabel extends StatelessWidget {
  final String label;
  final Widget? trailing;
  const _SectionLabel({required this.label, this.trailing});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Text(
          label.toUpperCase(),
          style: AppTypography.label.copyWith(
            color: AppColors.inkMuted,
            letterSpacing: 0.7,
            fontSize: 10,
          ),
        ),
        if (trailing != null) ...[const Spacer(), trailing!],
      ],
    );
  }
}

class _RecentChip extends StatelessWidget {
  final String label;
  final VoidCallback onTap;
  final VoidCallback onRemove;

  const _RecentChip({required this.label, required this.onTap, required this.onRemove});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.fromLTRB(12, 7, 8, 7),
        decoration: BoxDecoration(
          color: AppColors.surfaceAlt,
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: AppColors.hairline, width: 0.5),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(PhosphorIcons.clockCounterClockwise(PhosphorIconsStyle.regular),
                size: 12, color: AppColors.inkMuted),
            const SizedBox(width: 5),
            Text(label, style: AppTypography.bodySmall.copyWith(color: AppColors.inkSoft)),
            const SizedBox(width: 6),
            GestureDetector(
              onTap: onRemove,
              child: Icon(PhosphorIcons.x(PhosphorIconsStyle.regular),
                  size: 11, color: AppColors.inkFaint),
            ),
          ],
        ),
      ),
    );
  }
}

class _SuggestionsSkeleton extends StatelessWidget {
  const _SuggestionsSkeleton();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: List.generate(4, (i) => Padding(
        padding: const EdgeInsets.only(bottom: 16),
        child: Row(
          children: [
            const SkeletonRect(width: 36, height: 36, borderRadius: 999),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SkeletonLine(width: 180 - (i * 20).toDouble(), height: 14),
                const SizedBox(height: 6),
                const SkeletonLine(width: 100, height: 11),
              ],
            ),
          ],
        ),
      )),
    );
  }
}
