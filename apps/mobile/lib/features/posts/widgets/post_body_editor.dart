import 'dart:async';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../../../shared/components/markdown_toolbar.dart';
import '../../../shared/markdown/post_markdown_style.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/layout.dart';
import '../../../shared/theme/spacing.dart';
import '../../../shared/theme/typography.dart' as typ;
import '../../../shared/utils/firebase_storage.dart';
import '../../auth/providers/auth_provider.dart';
import '../../content/providers/wizard_provider.dart';
import '../../content/widgets/ai_helper_chip.dart';
import '../../content/widgets/location_picker_sheet.dart';

/// Post body editor — combines markdown body editor + media grid + location chip.
///
/// Step 2 of the post wizard. Body uses a 2-mode markdown editor (edit/preview)
/// with formatting toolbar. Plain-text legacy posts render unchanged.
class PostBodyEditor extends ConsumerStatefulWidget {
  const PostBodyEditor({super.key});

  @override
  ConsumerState<PostBodyEditor> createState() => _PostBodyEditorState();
}

class _PostBodyEditorState extends ConsumerState<PostBodyEditor> {
  late final TextEditingController _bodyController;
  late final FocusNode _bodyFocusNode;
  final ImagePicker _picker = ImagePicker();

  static const _maxChars = 10000;
  static const _maxImages = 5;

  bool _previewMode = false;
  bool _atLimit = false;

  @override
  void initState() {
    super.initState();
    final wizard = ref.read(wizardProvider);
    _bodyController = TextEditingController(text: wizard.body);
    _bodyFocusNode = FocusNode();
    _bodyFocusNode.addListener(_onFocusChanged);
    _atLimit = (wizard.body).characters.length >= _maxChars;
  }

  void _onFocusChanged() {
    // Rebuild to show/hide the toolbar.
    if (mounted) setState(() {});
  }

  @override
  void dispose() {
    _bodyFocusNode.removeListener(_onFocusChanged);
    _bodyFocusNode.dispose();
    _bodyController.dispose();
    super.dispose();
  }

  void _onBodyChanged(String value) {
    // Enforce 10,000 char cap gracefully — truncate + flag note.
    if (value.characters.length > _maxChars) {
      final truncated = value.characters.take(_maxChars).toString();
      _bodyController.value = TextEditingValue(
        text: truncated,
        selection: TextSelection.collapsed(offset: truncated.length),
      );
      ref.read(wizardProvider.notifier).setBody(truncated);
      if (!_atLimit) setState(() => _atLimit = true);
      return;
    }
    final atLimit = value.characters.length >= _maxChars;
    if (atLimit != _atLimit) setState(() => _atLimit = atLimit);
    ref.read(wizardProvider.notifier).setBody(value);
  }

  void _togglePreview() {
    HapticFeedback.selectionClick();
    setState(() => _previewMode = !_previewMode);
    if (_previewMode) {
      _bodyFocusNode.unfocus();
    }
  }

  Future<String?> _pickAndUploadInlineImage() async {
    try {
      final xFile = await _picker.pickImage(
        source: ImageSource.gallery,
        imageQuality: 85,
      );
      if (xFile == null) return null;
      final user = ref.read(authProvider).user;
      final uid = (user?['id'] as String?) ?? 'anonymous';
      final ts = DateTime.now().microsecondsSinceEpoch;
      final ext = xFile.path.contains('.')
          ? xFile.path.substring(xFile.path.lastIndexOf('.') + 1).toLowerCase()
          : 'jpg';
      final path = 'posts/$uid/inline/$ts.$ext';
      final url = await uploadFile(File(xFile.path), path);
      return url;
    } catch (e) {
      if (!mounted) return null;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Image upload failed: ${e.toString()}'),
          backgroundColor: AppColors.danger,
        ),
      );
      return null;
    }
  }

  Future<void> _pickImages() async {
    unawaited(HapticFeedback.lightImpact());
    final wizard = ref.read(wizardProvider);
    final remaining = _maxImages - wizard.media.length;
    if (remaining <= 0) return;

    try {
      final images = await _picker.pickMultiImage(
        limit: remaining,
        imageQuality: 85,
      );

      for (final xFile in images) {
        final id = DateTime.now().microsecondsSinceEpoch.toString();
        ref.read(wizardProvider.notifier).addMedia(
              MediaItem(
                id: id,
                uri: xFile.path,
                mimeType: 'image/jpeg',
              ),
            );
      }
    } catch (_) {
      // User cancelled or error — silently ignore
    }
  }

  void _removeImage(String id) {
    HapticFeedback.lightImpact();
    ref.read(wizardProvider.notifier).removeMedia(id);
  }

  Future<void> _openLocationPicker() async {
    unawaited(HapticFeedback.lightImpact());
    final picked = await showLocationPickerSheet(context);
    if (picked == null || !mounted) return;
    ref
        .read(wizardProvider.notifier)
        .setStartingCity(picked.id, cityName: picked.name);
  }

  void _clearLocation() {
    HapticFeedback.selectionClick();
    ref.read(wizardProvider.notifier).clearStartingCity();
  }

  @override
  Widget build(BuildContext context) {
    final wizard = ref.watch(wizardProvider);
    final showToolbar = !_previewMode && _bodyFocusNode.hasFocus;

    return Stack(
      children: [
        SingleChildScrollView(
          padding: EdgeInsets.only(
            left: Layout.screenPaddingH,
            right: Layout.screenPaddingH,
            bottom: showToolbar ? 56 : 0,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: Spacing.xl),

              _StepIntro(
                kicker: 'STEP 2 OF ${wizard.totalSteps}',
                headline: 'The moment, in your words.',
                subhead: 'Photos, place, and the story behind them.',
              ),
              const SizedBox(height: Spacing.xl),

              // ── Body header (label + AI chip + edit/preview toggle) ──
              Row(
                children: [
                  Text(
                    'Body',
                    style: typ.AppTypography.bodySmall.copyWith(
                      fontWeight: FontWeight.w600,
                      color: AppColors.inkSoft,
                    ),
                  ),
                  const SizedBox(width: Spacing.sm),
                  const AiHelperChip(),
                  const Spacer(),
                  _PreviewToggleButton(
                    previewMode: _previewMode,
                    onTap: _togglePreview,
                  ),
                ],
              ),
              const SizedBox(height: 6),

              // ── Body field (edit) or rendered markdown (preview) ──
              if (_previewMode)
                _PreviewSurface(text: _bodyController.text)
              else
                _BodyField(
                  controller: _bodyController,
                  focusNode: _bodyFocusNode,
                  onChanged: _onBodyChanged,
                ),

              const SizedBox(height: Spacing.xs),
              if (_atLimit)
                Text(
                  '10,000 character limit reached',
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: AppColors.danger,
                  ),
                )
              else
                const _Microtip(
                  'The first two lines are what hooks readers — make them count.',
                ),
              const SizedBox(height: Spacing.xl),

              // ── Location ─────────────────────────────────────────
              _LocationChip(
                cityName: wizard.startingCityName,
                onTap: _openLocationPicker,
                onClear: _clearLocation,
              ),
              const SizedBox(height: Spacing.xl),

              // ── Photos ───────────────────────────────────────────
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Photos', style: typ.AppTypography.h4),
                  Text(
                    '${wizard.media.length}/$_maxImages images',
                    style: typ.AppTypography.caption,
                  ),
                ],
              ),
              const SizedBox(height: Spacing.xs),
              const _Microtip('Up to 5 — the first image is your cover.'),
              const SizedBox(height: Spacing.md),

              if (wizard.media.isNotEmpty) ...[
                _ImageGrid(
                  media: wizard.media,
                  onRemove: _removeImage,
                ),
                const SizedBox(height: Spacing.md),
              ],

              if (wizard.media.length < _maxImages)
                GestureDetector(
                  onTap: _pickImages,
                  behavior: HitTestBehavior.opaque,
                  child: Container(
                    width: double.infinity,
                    height: 100,
                    decoration: BoxDecoration(
                      color: AppColors.surfaceAlt,
                      borderRadius: BorderRadius.circular(Layout.cardRadius),
                      border: Border.all(
                        color: AppColors.hairline,
                      ),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(
                          PhosphorIconsFill.images,
                          size: 28,
                          color: AppColors.inkMuted,
                        ),
                        const SizedBox(height: Spacing.sm),
                        Text(
                          wizard.media.isEmpty
                              ? 'Add images'
                              : 'Add more images',
                          style: typ.AppTypography.bodySmall
                              .copyWith(color: AppColors.inkSoft),
                        ),
                      ],
                    ),
                  ),
                ),

              const SizedBox(height: Spacing.xxxl),
            ],
          ),
        ),

        // Floating markdown toolbar — sits above keyboard while editing.
        if (showToolbar)
          Positioned(
            left: 0,
            right: 0,
            bottom: MediaQuery.of(context).viewInsets.bottom,
            child: MarkdownToolbar(
              controller: _bodyController,
              onImagePick: _pickAndUploadInlineImage,
              onPreviewToggle: _togglePreview,
            ),
          ),
      ],
    );
  }
}

class _BodyField extends StatelessWidget {
  final TextEditingController controller;
  final FocusNode focusNode;
  final ValueChanged<String> onChanged;

  const _BodyField({
    required this.controller,
    required this.focusNode,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    // Keep the visual border/padding consistent with AppInput while using a
    // raw TextField so we control multiline + character-cap behavior.
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(Layout.inputRadius),
        border: Border.all(
          color: focusNode.hasFocus ? AppColors.coral : AppColors.hairline,
          width: focusNode.hasFocus ? 1.5 : 1,
        ),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      child: TextField(
        controller: controller,
        focusNode: focusNode,
        maxLines: 12,
        minLines: 8,
        keyboardType: TextInputType.multiline,
        textInputAction: TextInputAction.newline,
        style: typ.AppTypography.body,
        decoration: const InputDecoration(
          hintText: 'Tell your story... (markdown supported)',
          border: InputBorder.none,
          isDense: true,
          contentPadding: EdgeInsets.zero,
        ),
        onChanged: onChanged,
      ),
    );
  }
}

class _PreviewSurface extends StatelessWidget {
  final String text;

  const _PreviewSurface({required this.text});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      constraints: const BoxConstraints(minHeight: 200),
      decoration: BoxDecoration(
        color: AppColors.surfaceAlt,
        borderRadius: BorderRadius.circular(Layout.inputRadius),
        border: Border.all(color: AppColors.hairline),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      child: text.trim().isEmpty
          ? Text(
              'Nothing to preview yet — switch back to write.',
              style: typ.AppTypography.bodySmall.copyWith(
                color: AppColors.inkMuted,
                fontStyle: FontStyle.italic,
              ),
            )
          : MarkdownBody(
              data: text,
              styleSheet: postMarkdownStyleSheet(context),
              sizedImageBuilder: postMarkdownImageBuilder,
              selectable: false,
            ),
    );
  }
}

class _PreviewToggleButton extends StatelessWidget {
  final bool previewMode;
  final VoidCallback onTap;

  const _PreviewToggleButton({
    required this.previewMode,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: Spacing.sm,
          vertical: Spacing.xs,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              previewMode
                  ? PhosphorIcons.pencilSimple()
                  : PhosphorIcons.eye(),
              size: 16,
              color: AppColors.inkSoft,
            ),
            const SizedBox(width: 4),
            Text(
              previewMode ? 'Edit' : 'Preview',
              style: typ.AppTypography.bodySmall.copyWith(
                color: AppColors.inkSoft,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StepIntro extends StatelessWidget {
  final String kicker;
  final String headline;
  final String subhead;

  const _StepIntro({
    required this.kicker,
    required this.headline,
    required this.subhead,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          kicker,
          style: GoogleFonts.inter(
            fontSize: 11,
            fontWeight: FontWeight.w500,
            letterSpacing: 1.2,
            color: AppColors.coral,
          ),
        ),
        const SizedBox(height: Spacing.sm),
        Text(
          headline,
          style: GoogleFonts.fraunces(
            fontSize: 28,
            fontWeight: FontWeight.w500,
            height: 1.15,
            color: AppColors.ink,
          ),
        ),
        const SizedBox(height: Spacing.xs),
        Text(
          subhead,
          style: GoogleFonts.fraunces(
            fontSize: 18,
            fontStyle: FontStyle.italic,
            fontWeight: FontWeight.w400,
            height: 1.25,
            color: AppColors.inkSoft,
          ),
        ),
      ],
    );
  }
}

class _Microtip extends StatelessWidget {
  final String text;
  const _Microtip(this.text);

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: GoogleFonts.inter(
        fontSize: 12,
        fontWeight: FontWeight.w400,
        height: 1.35,
        color: AppColors.inkMuted,
      ),
    );
  }
}

/// Coral pill when a city is selected, grey chip when empty. Tapping the
/// body opens the city picker; tapping the `x` on the filled state clears.
class _LocationChip extends StatelessWidget {
  final String? cityName;
  final VoidCallback onTap;
  final VoidCallback onClear;

  const _LocationChip({
    required this.cityName,
    required this.onTap,
    required this.onClear,
  });

  @override
  Widget build(BuildContext context) {
    final selected = cityName != null && cityName!.isNotEmpty;
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Container(
        padding: const EdgeInsets.symmetric(
          horizontal: Spacing.md,
          vertical: Spacing.sm,
        ),
        decoration: BoxDecoration(
          color: selected ? AppColors.coralSurface : AppColors.surfaceAlt,
          borderRadius: BorderRadius.circular(Layout.chipRadius),
          border: Border.all(
            color: selected ? AppColors.coral : AppColors.hairline,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              PhosphorIconsFill.mapPin,
              size: 16,
              color: selected ? AppColors.coral : AppColors.inkMuted,
            ),
            const SizedBox(width: Spacing.sm),
            Flexible(
              child: Text(
                selected ? cityName! : 'Add location',
                style: typ.AppTypography.bodySmall.copyWith(
                  fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
                  color: selected ? AppColors.ink : AppColors.inkSoft,
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ),
            if (selected) ...[
              const SizedBox(width: Spacing.sm),
              GestureDetector(
                onTap: onClear,
                behavior: HitTestBehavior.opaque,
                child: const Padding(
                  padding: EdgeInsets.all(Spacing.xs),
                  child: Icon(
                    PhosphorIconsFill.xCircle,
                    size: 18,
                    color: AppColors.inkSoft,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// 2-column image grid showing local file thumbnails.
class _ImageGrid extends StatelessWidget {
  final List<MediaItem> media;
  final ValueChanged<String> onRemove;

  const _ImageGrid({
    required this.media,
    required this.onRemove,
  });

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: Spacing.sm,
        mainAxisSpacing: Spacing.sm,
        childAspectRatio: 1.0,
      ),
      itemCount: media.length,
      itemBuilder: (context, index) {
        final item = media[index];
        return _ImageTile(
          item: item,
          onRemove: () => onRemove(item.id),
        );
      },
    );
  }
}

/// Single image tile with remove button overlay.
class _ImageTile extends StatelessWidget {
  final MediaItem item;
  final VoidCallback onRemove;

  const _ImageTile({
    required this.item,
    required this.onRemove,
  });

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(Layout.cardRadius),
      child: Stack(
        fit: StackFit.expand,
        children: [
          Image.file(
            File(item.uri),
            fit: BoxFit.cover,
            errorBuilder: (_, _, _) => Container(
              color: AppColors.surfaceAlt,
              child: const Center(
                child: Icon(
                  PhosphorIconsFill.imageSquare,
                  size: 32,
                  color: AppColors.inkMuted,
                ),
              ),
            ),
          ),
          Positioned(
            top: Spacing.xs,
            right: Spacing.xs,
            child: GestureDetector(
              onTap: onRemove,
              behavior: HitTestBehavior.opaque,
              child: Container(
                width: 28,
                height: 28,
                decoration: BoxDecoration(
                  color: AppColors.ink.withValues(alpha: 0.6),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  PhosphorIconsFill.x,
                  size: 14,
                  color: AppColors.surface,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
