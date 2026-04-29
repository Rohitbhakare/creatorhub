import 'dart:async';
import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';

import '../../../shared/theme/colors.dart';
import '../../../shared/theme/typography.dart' as typ;
import '../../../shared/utils/firebase_storage.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/wizard_provider.dart';

/// Pipeline that handles picking, uploading, and persisting cover/gallery
/// images for the publishing wizard.
///
/// Why this exists: every wizard variant (post / itinerary / event /
/// experience) used to keep picked files as local file URIs in
/// [WizardState.media] and never upload them anywhere — at publish time
/// the API had zero `content_media` rows for the post, so the photos
/// "vanished" on the published feed and detail screens.
///
/// The pipeline:
/// 1. User picks N images via [ImagePicker.pickMultiImage].
/// 2. Each picked image is added to wizard state immediately with
///    `isUploading: true` and the local path so the grid shows the
///    thumbnail without a flash of empty state.
/// 3. We ensure a content draft exists (so the API has somewhere to
///    attach the media). The draft creation callback comes from the
///    wizard shell (which owns a re-entrancy guard).
/// 4. For each item, in parallel: upload to Firebase Storage, then POST
///    `/api/v1/media/content/:contentId`. On success, swap the item to
///    `remoteUrl + serverId, isUploading: false`. On failure, mark
///    `uploadFailed: true` so the tile shows a retry overlay.
///
/// Removal mirrors the lifecycle — if the item already has a `serverId`,
/// fire `DELETE /api/v1/media/:id` before dropping it from local state.
class MediaUploadService {
  MediaUploadService._();

  /// Pick up to [remaining] images, push each into wizard state with
  /// `isUploading: true`, then upload + persist concurrently. Reports
  /// failures via a SnackBar but does not throw — the failed item stays
  /// in state with `uploadFailed: true` so the user can retry or remove.
  static Future<void> pickAndUpload({
    required WidgetRef ref,
    required BuildContext context,
    required Future<void> Function() ensureDraft,
    required int remaining,
    required String storageFolder,
  }) async {
    if (remaining <= 0) return;
    unawaited(HapticFeedback.lightImpact());

    // Capture the messenger before any await — the analyzer (and best
    // practice) want us to avoid using the BuildContext across async
    // gaps. The messenger remains valid even if the widget is later
    // disposed; `_toast` no-ops in that case.
    final messenger = ScaffoldMessenger.maybeOf(context);

    final picker = ImagePicker();
    final List<XFile> picked;
    try {
      picked = await picker.pickMultiImage(
        limit: remaining,
        imageQuality: 85,
      );
    } catch (_) {
      return;
    }
    if (picked.isEmpty) return;

    final notifier = ref.read(wizardProvider.notifier);
    final items = <MediaItem>[];
    for (final file in picked) {
      final id = DateTime.now().microsecondsSinceEpoch.toString() +
          file.path.hashCode.toString();
      final item = MediaItem(
        id: id,
        localPath: file.path,
        mimeType: 'image/jpeg',
        isUploading: true,
      );
      items.add(item);
      notifier.addMedia(item);
    }

    // Make sure the draft row exists before we try to attach media to it.
    // ensureDraft is idempotent on the wizard side.
    await ensureDraft();
    final contentId = ref.read(wizardProvider).contentId;
    if (contentId == null) {
      // Draft creation failed — flip every just-added item to failed so
      // the user can retry once they have connectivity.
      for (final item in items) {
        notifier.updateMedia(
          item.id,
          item.copyWith(isUploading: false, uploadFailed: true),
        );
      }
      _toast(messenger, 'Could not create draft. Try again in a moment.');
      return;
    }

    final dio = ref.read(authServiceProvider).dio;
    final user = ref.read(authProvider).user;
    final uid = (user?['id'] as String?) ?? 'anonymous';

    // Track display_order monotonically using existing media count.
    final baseOrder = ref.read(wizardProvider).media.length - items.length;

    await Future.wait([
      for (var i = 0; i < items.length; i++)
        _uploadOne(
          ref: ref,
          dio: dio,
          contentId: contentId,
          uid: uid,
          item: items[i],
          displayOrder: baseOrder + i,
          storageFolder: storageFolder,
          onError: (msg) => _toast(messenger, msg),
        ),
    ]);
  }

  /// Remove one item — issues DELETE on the server if it has been
  /// persisted, then drops it from wizard state. Falls back to local
  /// removal if the server delete fails (avoids a stuck UI).
  static Future<void> removeMedia({
    required WidgetRef ref,
    required String mediaId,
  }) async {
    unawaited(HapticFeedback.lightImpact());
    final state = ref.read(wizardProvider);
    final item = state.media.where((m) => m.id == mediaId).firstOrNull;
    if (item == null) return;
    if (item.serverId != null) {
      try {
        final dio = ref.read(authServiceProvider).dio;
        await dio.delete('/api/v1/media/${item.serverId}');
      } catch (_) {
        // best-effort — still remove locally so UI doesn't get stuck
      }
    }
    ref.read(wizardProvider.notifier).removeMedia(mediaId);
  }

  /// Retry a previously-failed upload. Reuses the existing local path.
  static Future<void> retryUpload({
    required WidgetRef ref,
    required BuildContext context,
    required Future<void> Function() ensureDraft,
    required String mediaId,
    required String storageFolder,
  }) async {
    final messenger = ScaffoldMessenger.maybeOf(context);
    final state = ref.read(wizardProvider);
    final item = state.media.where((m) => m.id == mediaId).firstOrNull;
    if (item == null || item.localPath == null) return;

    ref.read(wizardProvider.notifier).updateMedia(
          mediaId,
          item.copyWith(isUploading: true, uploadFailed: false),
        );

    await ensureDraft();
    final contentId = ref.read(wizardProvider).contentId;
    if (contentId == null) {
      ref.read(wizardProvider.notifier).updateMedia(
            mediaId,
            item.copyWith(isUploading: false, uploadFailed: true),
          );
      _toast(messenger, 'Could not create draft. Try again in a moment.');
      return;
    }

    final dio = ref.read(authServiceProvider).dio;
    final user = ref.read(authProvider).user;
    final uid = (user?['id'] as String?) ?? 'anonymous';
    final displayOrder = ref
        .read(wizardProvider)
        .media
        .indexWhere((m) => m.id == mediaId);

    await _uploadOne(
      ref: ref,
      dio: dio,
      contentId: contentId,
      uid: uid,
      item: item,
      displayOrder: displayOrder >= 0 ? displayOrder : 0,
      storageFolder: storageFolder,
      onError: (msg) => _toast(messenger, msg),
    );
  }

  // ── Internals ─────────────────────────────────────────────────

  static Future<void> _uploadOne({
    required WidgetRef ref,
    required Dio dio,
    required String contentId,
    required String uid,
    required MediaItem item,
    required int displayOrder,
    required String storageFolder,
    required void Function(String) onError,
  }) async {
    final notifier = ref.read(wizardProvider.notifier);
    final localPath = item.localPath;
    if (localPath == null) {
      notifier.updateMedia(
        item.id,
        item.copyWith(isUploading: false, uploadFailed: true),
      );
      return;
    }
    final ts = DateTime.now().microsecondsSinceEpoch;
    final ext = localPath.contains('.')
        ? localPath.substring(localPath.lastIndexOf('.') + 1).toLowerCase()
        : 'jpg';
    final path = '$storageFolder/$uid/$contentId/$ts.$ext';

    try {
      final url = await uploadFile(File(localPath), path);

      final response = await dio.post(
        '/api/v1/media/content/$contentId',
        data: {
          'media_type': 'image',
          'url': url,
          'display_order': displayOrder,
        },
      );

      final data = (response.data as Map<String, dynamic>)['data']
          as Map<String, dynamic>;
      final serverId = data['id'] as String;

      notifier.updateMedia(
        item.id,
        item.copyWith(
          isUploading: false,
          uploadFailed: false,
          remoteUrl: url,
          serverId: serverId,
        ),
      );
    } catch (e) {
      notifier.updateMedia(
        item.id,
        item.copyWith(isUploading: false, uploadFailed: true),
      );
      onError('Upload failed for one image. Tap the tile to retry.');
    }
  }

  static void _toast(ScaffoldMessengerState? messenger, String message) {
    if (messenger == null) return;
    messenger.showSnackBar(
      SnackBar(
        content: Text(
          message,
          style: typ.AppTypography.bodySmall.copyWith(
            color: AppColors.surface,
          ),
        ),
        backgroundColor: AppColors.danger,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }
}

