import 'dart:async';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart' show PhosphorIconsFill;

import '../../../shared/theme/colors.dart';
import '../../../shared/theme/typography.dart' as typ;
import '../../../shared/theme/spacing.dart';
import '../../../shared/theme/layout.dart';
import '../../../shared/components/input.dart';
import '../../content/providers/wizard_provider.dart';

/// Post body editor — combines body text input + media grid.
///
/// Step 2 of the post wizard. Provides a multi-line text input with
/// a live character counter, an optional location tag chip (placeholder),
/// an image grid showing selected images, and an "Add images" button.
class PostBodyEditor extends ConsumerStatefulWidget {
  const PostBodyEditor({super.key});

  @override
  ConsumerState<PostBodyEditor> createState() => _PostBodyEditorState();
}

class _PostBodyEditorState extends ConsumerState<PostBodyEditor> {
  late final TextEditingController _bodyController;
  final ImagePicker _picker = ImagePicker();

  static const _maxChars = 1000;
  static const _maxImages = 5;

  @override
  void initState() {
    super.initState();
    final wizard = ref.read(wizardProvider);
    _bodyController = TextEditingController(text: wizard.body);
  }

  @override
  void dispose() {
    _bodyController.dispose();
    super.dispose();
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
        // TODO: wire up Firebase upload via media service
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

  @override
  Widget build(BuildContext context) {
    final wizard = ref.watch(wizardProvider);
    final charCount = wizard.body.length;

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(
        horizontal: Layout.screenPaddingH,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: Spacing.xl),

          // Section header
          Text('Write your story', style: typ.AppTypography.h3),
          const SizedBox(height: Spacing.sm),
          Text(
            'Share your experience with the community',
            style: typ.AppTypography.body.copyWith(color: AppColors.muted),
          ),
          const SizedBox(height: Spacing.xl),

          // Body text input
          AppInput(
            controller: _bodyController,
            label: 'Body',
            hint: 'Tell your story...',
            maxLines: 8,
            maxLength: _maxChars,
            keyboardType: TextInputType.multiline,
            textInputAction: TextInputAction.newline,
            onChanged: (value) {
              ref.read(wizardProvider.notifier).setBody(value);
            },
          ),

          // Character counter
          _CharacterCounter(current: charCount, max: _maxChars),
          const SizedBox(height: Spacing.xl),

          // Location tag placeholder
          _LocationTagChip(),
          const SizedBox(height: Spacing.xl),

          // Image section header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Photos',
                style: typ.AppTypography.h4,
              ),
              Text(
                '${wizard.media.length}/$_maxImages images',
                style: typ.AppTypography.caption,
              ),
            ],
          ),
          const SizedBox(height: Spacing.md),

          // Image grid
          if (wizard.media.isNotEmpty) ...[
            _ImageGrid(
              media: wizard.media,
              onRemove: _removeImage,
            ),
            const SizedBox(height: Spacing.md),
          ],

          // Add images button
          if (wizard.media.length < _maxImages)
            GestureDetector(
              onTap: _pickImages,
              behavior: HitTestBehavior.opaque,
              child: Container(
                width: double.infinity,
                height: 100,
                decoration: BoxDecoration(
                  color: AppColors.sunken,
                  borderRadius: BorderRadius.circular(Layout.cardRadius),
                  border: Border.all(
                    color: AppColors.border,
                    style: BorderStyle.solid,
                  ),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(
                      PhosphorIconsFill.images,
                      size: 28,
                      color: AppColors.softInk,
                    ),
                    const SizedBox(height: Spacing.sm),
                    Text(
                      wizard.media.isEmpty
                          ? 'Add images'
                          : 'Add more images',
                      style: typ.AppTypography.bodySmall
                          .copyWith(color: AppColors.muted),
                    ),
                  ],
                ),
              ),
            ),

          const SizedBox(height: Spacing.xxxl),
        ],
      ),
    );
  }
}

/// Live character counter with color thresholds.
/// < 850: muted, 850-999: amber/warning, 1000: danger.
class _CharacterCounter extends StatelessWidget {
  final int current;
  final int max;

  const _CharacterCounter({
    required this.current,
    required this.max,
  });

  @override
  Widget build(BuildContext context) {
    final Color color;
    if (current >= max) {
      color = AppColors.danger;
    } else if (current >= 850) {
      color = AppColors.warning;
    } else {
      color = AppColors.muted;
    }

    return Padding(
      padding: const EdgeInsets.only(top: Spacing.xs),
      child: Align(
        alignment: Alignment.centerRight,
        child: Text(
          '$current/$max',
          style: typ.AppTypography.caption.copyWith(color: color),
        ),
      ),
    );
  }
}

/// Placeholder location tag chip.
/// Actual Places integration works via API — this is a UI placeholder.
class _LocationTagChip extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        // TODO: open Places search bottom sheet (E1.x)
      },
      behavior: HitTestBehavior.opaque,
      child: Container(
        padding: const EdgeInsets.symmetric(
          horizontal: Spacing.md,
          vertical: Spacing.sm,
        ),
        decoration: BoxDecoration(
          color: AppColors.sunken,
          borderRadius: BorderRadius.circular(Layout.chipRadius),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              PhosphorIconsFill.mapPin,
              size: 16,
              color: AppColors.softInk,
            ),
            const SizedBox(width: Spacing.sm),
            Text(
              'Add location',
              style:
                  typ.AppTypography.bodySmall.copyWith(color: AppColors.muted),
            ),
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
          // Local file image thumbnail
          Image.file(
            File(item.uri),
            fit: BoxFit.cover,
            errorBuilder: (_, _, _) => Container(
              color: AppColors.sunken,
              child: const Center(
                child: Icon(
                  PhosphorIconsFill.imageSquare,
                  size: 32,
                  color: AppColors.softInk,
                ),
              ),
            ),
          ),

          // Remove button (top-right)
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
                  color: AppColors.white,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
