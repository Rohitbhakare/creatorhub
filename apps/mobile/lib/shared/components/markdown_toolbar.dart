import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../theme/colors.dart';
import '../theme/spacing.dart';

/// Floating markdown formatting toolbar designed to sit just above the
/// keyboard while editing post bodies. Caller is responsible for
/// positioning (e.g. inside `Padding(bottom: MediaQuery.viewInsets.bottom)`).
///
/// Buttons mutate [controller]'s text + selection at the cursor:
/// H1, H2, Bold, Italic, UL, OL, Quote, Link, Image, Divider, Preview.
class MarkdownToolbar extends StatefulWidget {
  final TextEditingController controller;

  /// Caller picks + uploads the image; widget inserts the returned URL
  /// (or no-ops if the future resolves to null).
  final Future<String?> Function() onImagePick;

  /// Toggle preview/render mode in the parent screen.
  final VoidCallback onPreviewToggle;

  const MarkdownToolbar({
    super.key,
    required this.controller,
    required this.onImagePick,
    required this.onPreviewToggle,
  });

  @override
  State<MarkdownToolbar> createState() => _MarkdownToolbarState();
}

class _MarkdownToolbarState extends State<MarkdownToolbar> {
  TextEditingController get _c => widget.controller;

  // ── Selection helpers ─────────────────────────────────────────

  TextSelection _selection() {
    final s = _c.selection;
    if (!s.isValid) {
      return TextSelection.collapsed(offset: _c.text.length);
    }
    return s;
  }

  void _setText(String text, int cursor) {
    _c.value = TextEditingValue(
      text: text,
      selection: TextSelection.collapsed(offset: cursor),
    );
  }

  /// Insert [text] at the current cursor (or replace the selection).
  void _insertAtCursor(String text) {
    final sel = _selection();
    final t = _c.text;
    final start = sel.start;
    final end = sel.end;
    final next = t.replaceRange(start, end, text);
    _setText(next, start + text.length);
  }

  /// Wrap the current selection with [open] and [close]. If the
  /// selection is empty, inserts a placeholder between the markers.
  void _wrapSelection(String open, String close, {String placeholder = ''}) {
    final sel = _selection();
    final t = _c.text;
    final start = sel.start;
    final end = sel.end;
    final selected = t.substring(start, end);
    final inner = selected.isEmpty ? placeholder : selected;
    final next = t.replaceRange(start, end, '$open$inner$close');
    final cursor = selected.isEmpty
        ? start + open.length // park cursor inside the markers
        : start + open.length + inner.length + close.length;
    _setText(next, cursor);
  }

  /// Insert [prefix] at the start of the line containing the cursor.
  /// If the line already starts with [prefix] this is a no-op.
  void _insertPrefix(String prefix) {
    final sel = _selection();
    final t = _c.text;
    final start = sel.start;
    // String.lastIndexOf requires a non-negative start; cursor at 0 means
    // the line starts at 0, so short-circuit before calling lastIndexOf.
    final lineStart = start == 0 ? 0 : t.lastIndexOf('\n', start - 1) + 1;
    final lineSlice = t.substring(lineStart);
    if (lineSlice.startsWith(prefix)) return;
    final needsLeadingNewline = lineStart > 0 &&
        lineStart == start &&
        !t.substring(0, start).endsWith('\n');
    final insert = needsLeadingNewline ? '\n$prefix' : prefix;
    final next = t.replaceRange(lineStart, lineStart, insert);
    _setText(next, start + insert.length);
  }

  // ── Button actions ────────────────────────────────────────────

  Future<void> _onImage() async {
    final url = await widget.onImagePick();
    if (url == null || url.isEmpty) return;
    _insertAtCursor('![]($url)');
  }

  // ── Build ─────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 48,
      decoration: const BoxDecoration(
        color: AppColors.surface,
        border: Border(top: BorderSide(color: AppColors.hairline)),
      ),
      padding: const EdgeInsets.symmetric(
        horizontal: Spacing.sm,
        vertical: Spacing.xs,
      ),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: [
            _IconBtn(
              icon: PhosphorIcons.textHOne(),
              tooltip: 'Heading 1',
              onTap: () => _insertPrefix('# '),
            ),
            _IconBtn(
              icon: PhosphorIcons.textHTwo(),
              tooltip: 'Heading 2',
              onTap: () => _insertPrefix('## '),
            ),
            _IconBtn(
              icon: PhosphorIcons.textB(),
              tooltip: 'Bold',
              onTap: () => _wrapSelection('**', '**', placeholder: 'bold'),
            ),
            _IconBtn(
              icon: PhosphorIcons.textItalic(),
              tooltip: 'Italic',
              onTap: () => _wrapSelection('*', '*', placeholder: 'italic'),
            ),
            _IconBtn(
              icon: PhosphorIcons.listBullets(),
              tooltip: 'Bulleted list',
              onTap: () => _insertPrefix('- '),
            ),
            _IconBtn(
              icon: PhosphorIcons.listNumbers(),
              tooltip: 'Numbered list',
              onTap: () => _insertPrefix('1. '),
            ),
            _IconBtn(
              icon: PhosphorIcons.quotes(),
              tooltip: 'Quote',
              onTap: () => _insertPrefix('> '),
            ),
            _IconBtn(
              icon: PhosphorIcons.link(),
              tooltip: 'Link',
              onTap: () =>
                  _wrapSelection('[', '](url)', placeholder: 'link text'),
            ),
            _IconBtn(
              icon: PhosphorIcons.image(),
              tooltip: 'Insert image',
              onTap: _onImage,
            ),
            _IconBtn(
              icon: PhosphorIcons.minus(),
              tooltip: 'Divider',
              onTap: () => _insertAtCursor('\n\n---\n\n'),
            ),
            _IconBtn(
              icon: PhosphorIcons.eye(),
              tooltip: 'Preview',
              onTap: widget.onPreviewToggle,
            ),
          ],
        ),
      ),
    );
  }
}

class _IconBtn extends StatelessWidget {
  final IconData icon;
  final String tooltip;
  final VoidCallback onTap;

  const _IconBtn({
    required this.icon,
    required this.tooltip,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: Spacing.sm),
      child: Tooltip(
        message: tooltip,
        child: InkWell(
          borderRadius: BorderRadius.circular(8),
          onTap: () {
            HapticFeedback.selectionClick();
            onTap();
          },
          child: SizedBox(
            width: 36,
            height: 36,
            child: Icon(icon, size: 20, color: AppColors.ink),
          ),
        ),
      ),
    );
  }
}
