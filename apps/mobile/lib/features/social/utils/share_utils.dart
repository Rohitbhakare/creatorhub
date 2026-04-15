import 'package:dio/dio.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/providers/auth_provider.dart';

/// Canonical URL for a content item on the web.
String canonicalUrl(String contentType, String contentId) {
  // Placeholder until E2.10 web goes live — uses content ID as slug.
  const base = 'https://creatorhub.in';
  return switch (contentType) {
    'post' => '$base/posts/$contentId',
    'itinerary' => '$base/itineraries/$contentId',
    'event' => '$base/events/$contentId',
    _ => '$base/c/$contentId',
  };
}

/// Fire-and-forget share analytics event.
Future<void> recordShare(
  WidgetRef ref, {
  required String contentId,
  required String platform,
}) async {
  try {
    final dio = ref.read(authServiceProvider).dio;
    await dio.post(
      '/api/v1/content/$contentId/share',
      data: {'platform': platform},
    );
  } on DioException {
    // Analytics — non-critical, ignore failures
  }
}

/// Share via native share sheet (text + URL).
Future<void> shareNative({
  required String title,
  required String contentId,
  required String contentType,
  required WidgetRef ref,
}) async {
  final url = canonicalUrl(contentType, contentId);
  final shareText = 'Check out "$title" on CreatorHub: $url';

  // Use platform channel to trigger native share
  try {
    const channel = MethodChannel('creatorhub/share');
    await channel.invokeMethod<void>('share', {'text': shareText});
  } catch (_) {
    // Fallback: copy to clipboard
    await Clipboard.setData(ClipboardData(text: shareText));
  }

  await recordShare(ref, contentId: contentId, platform: 'other');
}

/// Share to WhatsApp via deep link.
Future<void> shareWhatsApp({
  required String title,
  required String contentId,
  required String contentType,
  required WidgetRef ref,
}) async {
  final url = canonicalUrl(contentType, contentId);
  final text = Uri.encodeComponent('Check out "$title" on CreatorHub: $url');
  final waUrl = 'whatsapp://send?text=$text';

  try {
    const channel = MethodChannel('creatorhub/share');
    await channel.invokeMethod<void>('launch', {'url': waUrl});
  } catch (_) {
    // WhatsApp not installed — copy link fallback
    await Clipboard.setData(ClipboardData(text: '$title — $url'));
  }

  await recordShare(ref, contentId: contentId, platform: 'whatsapp');
}

/// Copy canonical URL to clipboard and show feedback.
Future<void> copyLink({
  required String contentId,
  required String contentType,
  required WidgetRef ref,
}) async {
  final url = canonicalUrl(contentType, contentId);
  await Clipboard.setData(ClipboardData(text: url));
  await recordShare(ref, contentId: contentId, platform: 'copy_link');
}
