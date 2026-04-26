import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:google_fonts/google_fonts.dart';

import '../components/skeleton.dart' show SkeletonRect;
import '../theme/colors.dart';

/// Shared MarkdownStyleSheet for post bodies.
///
/// Mapped to AppTypography per DD-026: Fraunces 17/1.65 for paragraphs,
/// Fraunces 24/600 for h1, Fraunces 20/600 for h2. Coral budget is locked
/// to blockquote left-border + link color only — headings stay ink.
MarkdownStyleSheet postMarkdownStyleSheet(BuildContext context) {
  final TextStyle paragraph = GoogleFonts.fraunces(
    fontSize: 17,
    height: 1.65,
    fontWeight: FontWeight.w400,
    color: AppColors.ink,
  );

  final TextStyle h1 = GoogleFonts.fraunces(
    fontSize: 24,
    height: 1.25,
    fontWeight: FontWeight.w600,
    color: AppColors.ink,
  );

  final TextStyle h2 = GoogleFonts.fraunces(
    fontSize: 20,
    height: 1.3,
    fontWeight: FontWeight.w600,
    color: AppColors.ink,
  );

  final TextStyle blockquote = GoogleFonts.fraunces(
    fontSize: 17,
    height: 1.65,
    fontStyle: FontStyle.italic,
    fontWeight: FontWeight.w400,
    color: AppColors.inkSoft,
  );

  final TextStyle code = GoogleFonts.firaCode(
    fontSize: 14,
    height: 1.5,
    color: AppColors.ink,
  );

  return MarkdownStyleSheet(
    p: paragraph,
    pPadding: const EdgeInsets.only(bottom: 12),
    h1: h1,
    h1Padding: const EdgeInsets.only(top: 16, bottom: 8),
    h2: h2,
    h2Padding: const EdgeInsets.only(top: 14, bottom: 6),
    h3: paragraph.copyWith(fontSize: 18, fontWeight: FontWeight.w600),
    h4: paragraph.copyWith(fontSize: 17, fontWeight: FontWeight.w600),
    h5: paragraph.copyWith(fontSize: 16, fontWeight: FontWeight.w600),
    h6: paragraph.copyWith(fontSize: 15, fontWeight: FontWeight.w600),
    em: paragraph.copyWith(fontStyle: FontStyle.italic),
    strong: paragraph.copyWith(fontWeight: FontWeight.w700),
    a: paragraph.copyWith(
      color: AppColors.coralDeep,
      decoration: TextDecoration.underline,
      decorationColor: AppColors.coralDeep,
    ),
    blockquote: blockquote,
    blockquotePadding: const EdgeInsets.only(left: 16, top: 4, bottom: 4),
    blockquoteDecoration: const BoxDecoration(
      border: Border(
        left: BorderSide(color: AppColors.coral, width: 2),
      ),
    ),
    listBullet: paragraph,
    listIndent: 20,
    code: code,
    codeblockPadding: const EdgeInsets.all(12),
    codeblockDecoration: BoxDecoration(
      color: AppColors.surfaceSunk,
      borderRadius: BorderRadius.circular(8),
    ),
    horizontalRuleDecoration: const BoxDecoration(
      border: Border(
        top: BorderSide(color: AppColors.hairline, width: 1),
      ),
    ),
    img: paragraph,
  );
}

/// Builds inline images in markdown with rounded 12 corners and 16:9 default.
Widget postMarkdownImageBuilder(MarkdownImageConfig config) {
  return Padding(
    padding: const EdgeInsets.symmetric(vertical: 8),
    child: ClipRRect(
      borderRadius: BorderRadius.circular(12),
      child: AspectRatio(
        aspectRatio: 16 / 9,
        child: CachedNetworkImage(
          imageUrl: config.uri.toString(),
          fit: BoxFit.cover,
          placeholder: (_, _) => const SkeletonRect(borderRadius: 0),
          errorWidget: (_, _, _) => Container(
            color: AppColors.surfaceAlt,
            child: const Center(
              child: Icon(
                Icons.broken_image_outlined,
                color: AppColors.inkMuted,
              ),
            ),
          ),
        ),
      ),
    ),
  );
}
