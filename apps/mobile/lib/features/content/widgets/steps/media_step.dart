import 'dart:io';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart' show PhosphorIconsFill;

import '../../../../shared/theme/colors.dart';
import '../../../../shared/theme/typography.dart' as typ;
import '../../../../shared/theme/spacing.dart';
import '../../../../shared/theme/layout.dart';
import '../../providers/wizard_provider.dart';
import '../../services/media_upload_service.dart';

/// Media step — photo picker for itinerary, event, and experience wizards.
///
/// Picks images and uploads them via [MediaUploadService] so the photos
/// are persisted as `content_media` rows by the time the wizard reaches
/// the publish step. Without that pipeline the local file URIs would
/// vanish on publish (the API never sees them).
class MediaStep extends ConsumerStatefulWidget {
  const MediaStep({
    super.key,
    this.title,
    this.subtitle,
    required this.ensureDraft,
    this.storageFolder = 'content',
  });

  final String? title;
  final String? subtitle;
  final Future<void> Function() ensureDraft;
  final String storageFolder;

  @override
  ConsumerState<MediaStep> createState() => _MediaStepState();
}

class _MediaStepState extends ConsumerState<MediaStep> {
  static const _maxImages = 10;

  Future<void> _pickImages() async {
    final wizard = ref.read(wizardProvider);
    final remaining = _maxImages - wizard.media.length;
    await MediaUploadService.pickAndUpload(
      ref: ref,
      context: context,
      ensureDraft: widget.ensureDraft,
      remaining: remaining,
      storageFolder: widget.storageFolder,
    );
  }

  Future<void> _removeImage(String id) async {
    await MediaUploadService.removeMedia(ref: ref, mediaId: id);
  }

  Future<void> _retry(String id) async {
    await MediaUploadService.retryUpload(
      ref: ref,
      context: context,
      ensureDraft: widget.ensureDraft,
      mediaId: id,
      storageFolder: widget.storageFolder,
    );
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
              onRetry: _retry,
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
  final Future<void> Function(String) onRemove;
  final Future<void> Function(String) onRetry;

  const _MediaGrid({
    required this.media,
    required this.onRemove,
    required this.onRetry,
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
        return MediaTile(
          item: item,
          onRemove: () => onRemove(item.id),
          onRetry: () => onRetry(item.id),
        );
      },
    );
  }
}

/// Single media tile with upload-state overlay. Reused by the post body
/// editor as well, so it lives at file scope rather than as a private
/// underscore-prefixed class.
class MediaTile extends StatelessWidget {
  final MediaItem item;
  final VoidCallback onRemove;
  final VoidCallback onRetry;

  const MediaTile({
    super.key,
    required this.item,
    required this.onRemove,
    required this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(Layout.cardRadius),
      child: Stack(
        fit: StackFit.expand,
        children: [
          _Image(item: item),

          // Uploading overlay — soft veil + spinner
          if (item.isUploading)
            Container(
              color: AppColors.ink.withValues(alpha: 0.35),
              alignment: Alignment.center,
              child: const SizedBox(
                width: 22,
                height: 22,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor: AlwaysStoppedAnimation(AppColors.surface),
                ),
              ),
            ),

          // Failed overlay — tap-to-retry
          if (item.uploadFailed && !item.isUploading)
            GestureDetector(
              onTap: onRetry,
              behavior: HitTestBehavior.opaque,
              child: Container(
                color: AppColors.ink.withValues(alpha: 0.5),
                alignment: Alignment.center,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(
                      PhosphorIconsFill.arrowClockwise,
                      size: 22,
                      color: AppColors.surface,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Retry',
                      style: typ.AppTypography.caption.copyWith(
                        color: AppColors.surface,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ),

          // Remove button (always visible)
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

class _Image extends StatelessWidget {
  final MediaItem item;
  const _Image({required this.item});

  @override
  Widget build(BuildContext context) {
    final remote = item.remoteUrl;
    if (remote != null) {
      return CachedNetworkImage(
        imageUrl: remote,
        fit: BoxFit.cover,
        placeholder: (_, _) => Container(color: AppColors.surfaceAlt),
        errorWidget: (_, _, _) => _placeholder(),
      );
    }
    final local = item.localPath;
    if (local != null) {
      return Image.file(
        File(local),
        fit: BoxFit.cover,
        errorBuilder: (_, _, _) => _placeholder(),
      );
    }
    return _placeholder();
  }

  Widget _placeholder() {
    return Container(
      color: AppColors.surfaceAlt,
      child: const Center(
        child: Icon(
          PhosphorIconsFill.imageSquare,
          size: 32,
          color: AppColors.inkMuted,
        ),
      ),
    );
  }
}
