import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../theme/colors.dart';
import '../theme/typography.dart';

/// Renders post body text in Fraunces 14 / 1.65 with a 3-line truncation +
/// "Show all" CTA. Tap the CTA → [onShowAll] (typically navigates to a detail
/// screen, or expands inline if [allowInlineExpand] is true).
class ExpandableText extends StatefulWidget {
  final String text;
  final int maxLines;
  final TextStyle? style;
  final VoidCallback? onShowAll;

  /// When true, "Show all" expands inline instead of firing [onShowAll].
  final bool allowInlineExpand;

  const ExpandableText({
    super.key,
    required this.text,
    this.maxLines = 3,
    this.style,
    this.onShowAll,
    this.allowInlineExpand = false,
  });

  @override
  State<ExpandableText> createState() => _ExpandableTextState();
}

class _ExpandableTextState extends State<ExpandableText> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    final style = widget.style ?? AppTypography.postBody;

    return LayoutBuilder(
      builder: (context, constraints) {
        final tp = TextPainter(
          text: TextSpan(text: widget.text, style: style),
          maxLines: widget.maxLines,
          textDirection: TextDirection.ltr,
        )..layout(maxWidth: constraints.maxWidth);

        final overflows = tp.didExceedMaxLines;
        final showTruncated = overflows && !_expanded;

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              widget.text,
              style: style,
              maxLines: showTruncated ? widget.maxLines : null,
              overflow: showTruncated ? TextOverflow.ellipsis : TextOverflow.visible,
            ),
            if (overflows && !_expanded) ...[
              const SizedBox(height: 6),
              GestureDetector(
                onTap: () {
                  HapticFeedback.selectionClick();
                  if (widget.allowInlineExpand && widget.onShowAll == null) {
                    setState(() => _expanded = true);
                  } else {
                    widget.onShowAll?.call();
                  }
                },
                child: Text(
                  'Show all',
                  style: AppTypography.label.copyWith(
                    color: AppColors.inkSoft,
                    fontWeight: FontWeight.w600,
                    fontSize: 13,
                  ),
                ),
              ),
            ],
          ],
        );
      },
    );
  }
}
