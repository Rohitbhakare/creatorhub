import 'dart:async';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart' show PhosphorIconsFill;

import '../../../../shared/theme/colors.dart';
import '../../../../shared/theme/typography.dart' as typ;
import '../../../../shared/theme/spacing.dart';
import '../../../../shared/theme/layout.dart';
import '../../providers/wizard_provider.dart';

/// Media step — photo picker for itinerary and event wizards.
///
/// Media is optional. The Next button stays enabled whether or not
/// photos are attached, since step 2 `validationErrors` returns empty.
class MediaStep extends ConsumerStatefulWidget {
  const MediaStep({super.key, this.title, this.subtitle});

  final String? title;
  final String? subtitle;

  @override
  ConsumerState<MediaStep> createState() => _MediaStepState();
}

class _MediaStepState extends ConsumerState<MediaStep> {
  final ImagePicker _picker = ImagePicker();

  static const _maxImages = 10;

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

  @override
  Widget build(BuildContext context) {
    final wizard = ref.watch(wizardProvider);

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(
        horizontal: Layout.screenPaddingH,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: Spacing.xl),

          Text(widget.title ?? 'Add photos', style: typ.AppTypography.h3),
          const SizedBox(height: Spacing.sm),
          Text(
            widget.subtitle ?? 'Photos are optional — you can skip this step.',
            style: typ.AppTypography.body.copyWith(color: AppColors.inkSoft),
          ),
          const SizedBox(height: Spacing.xl),

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
          const SizedBox(height: Spacing.md),

          if (wizard.media.isNotEmpty) ...[
            _MediaGrid(
              media: wizard.media,
              onRemove: _removeImage,
            ),
            const SizedBox(height: Spacing.md),
          ],

          if (wizard.media.length < _maxImages)
            GestureDetector(
              key: const ValueKey('media_step_add_photos'),
              onTap: _pickImages,
              behavior: HitTestBehavior.opaque,
              child: Container(
                width: double.infinity,
                height: 120,
                decoration: BoxDecoration(
                  color: AppColors.surfaceAlt,
                  borderRadius: BorderRadius.circular(Layout.cardRadius),
                  border: Border.all(color: AppColors.hairline),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(
                      PhosphorIconsFill.images,
                      size: 32,
                      color: AppColors.inkMuted,
                    ),
                    const SizedBox(height: Spacing.sm),
                    Text(
                      wizard.media.isEmpty
                          ? 'Add photos'
                          : 'Add more photos',
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
    );
  }
}

class _MediaGrid extends StatelessWidget {
  final List<MediaItem> media;
  final ValueChanged<String> onRemove;

  const _MediaGrid({required this.media, required this.onRemove});

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
        return _MediaTile(item: item, onRemove: () => onRemove(item.id));
      },
    );
  }
}

class _MediaTile extends StatelessWidget {
  final MediaItem item;
  final VoidCallback onRemove;

  const _MediaTile({required this.item, required this.onRemove});

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
