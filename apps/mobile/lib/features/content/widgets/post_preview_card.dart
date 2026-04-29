import 'dart:io';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart' show PhosphorIconsFill;

import '../../../shared/markdown/post_markdown_style.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/layout.dart';
import '../../../shared/theme/spacing.dart';
import '../providers/wizard_provider.dart';

/// In-wizard mini preview of a post, drawn live from [WizardState].
/// Shown on the Review step so the creator sees roughly how their
/// post will look in the feed before publishing.
class PostPreviewCard extends ConsumerWidget {
  const PostPreviewCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final wizard = ref.watch(wizardProvider);
    final title = wizard.title.trim();
    final body = wizard.body.trim();
    final cityName = wizard.startingCityName;
    final cover = wizard.media.isNotEmpty ? wizard.media.first : null;

    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(Layout.cardRadius),
        boxShadow: AppColors.cardRaisedShadow,
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          AspectRatio(
            aspectRatio: 16 / 9,
            child: cover == null
                ? _GradientFallback(seed: title.isEmpty ? 'post' : title)
                : (cover.remoteUrl != null
                    ? CachedNetworkImage(
                        imageUrl: cover.remoteUrl!,
                        fit: BoxFit.cover,
                        placeholder: (_, _) => _GradientFallback(
                          seed: title.isEmpty ? 'post' : title,
                        ),
                        errorWidget: (_, _, _) => _GradientFallback(
                          seed: title.isEmpty ? 'post' : title,
                        ),
                      )
                    : (cover.localPath != null
                        ? Image.file(
                            File(cover.localPath!),
                            fit: BoxFit.cover,
                            errorBuilder: (_, _, _) => _GradientFallback(
                              seed: title.isEmpty ? 'post' : title,
                            ),
                          )
                        : _GradientFallback(
                            seed: title.isEmpty ? 'post' : title,
                          ))),
          ),
          Padding(
            padding: const EdgeInsets.all(Spacing.lg),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title.isEmpty ? 'Your title' : title,
                  style: GoogleFonts.fraunces(
                    fontSize: 20,
                    fontWeight: FontWeight.w500,
                    height: 1.25,
                    color: title.isEmpty ? AppColors.inkMuted : AppColors.ink,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                if (cityName != null && cityName.isNotEmpty) ...[
                  const SizedBox(height: Spacing.sm),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(
                        PhosphorIconsFill.mapPin,
                        size: 14,
                        color: AppColors.coral,
                      ),
                      const SizedBox(width: 4),
                      Flexible(
                        child: Text(
                          cityName,
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                            color: AppColors.coral,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ],
                const SizedBox(height: Spacing.md),
                if (body.isEmpty)
                  Text(
                    'Your story preview will appear here.',
                    style: GoogleFonts.fraunces(
                      fontSize: 14,
                      fontStyle: FontStyle.italic,
                      color: AppColors.inkMuted,
                    ),
                  )
                else
                  // Render the body as markdown so headings, lists, bold,
                  // links etc. match how the post will appear in the feed.
                  // SingleChildScrollView (non-scrolling) gives MarkdownBody
                  // unbounded vertical space inside a fixed 110px viewport,
                  // so long bodies clip instead of overflowing the RenderFlex
                  // (ClipRect+ConstrainedBox clips paint but not layout, so
                  // it tripped the "overflowed by N pixels" assertion).
                  SizedBox(
                    height: 110,
                    child: SingleChildScrollView(
                      physics: const NeverScrollableScrollPhysics(),
                      child: MarkdownBody(
                        data: body,
                        styleSheet: postMarkdownStyleSheet(context),
                        sizedImageBuilder: postMarkdownImageBuilder,
                        selectable: false,
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _GradientFallback extends StatelessWidget {
  final String seed;
  const _GradientFallback({required this.seed});

  @override
  Widget build(BuildContext context) {
    final hash = seed.codeUnits.fold<int>(0, (acc, c) => acc + c);
    const palette = [
      [Color(0xFFFAECE7), Color(0xFFF5C4B3)],
      [Color(0xFFE6F1FB), Color(0xFFB5D4F4)],
      [Color(0xFFEAF3DE), Color(0xFFC0DD97)],
      [Color(0xFFF3EAFB), Color(0xFFCFB5F4)],
    ];
    final stops = palette[hash % palette.length];
    return DecoratedBox(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: stops,
        ),
      ),
    );
  }
}
