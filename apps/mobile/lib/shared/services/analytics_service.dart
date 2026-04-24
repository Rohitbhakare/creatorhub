import 'package:dio/dio.dart';

/// ANL-FR-001: Thin analytics wrapper.
/// Calls POST /api/v1/analytics/track — fire-and-forget.
/// Never throws — analytics must never break the user flow.
class AnalyticsService {
  static Future<void> track(
    Dio dio,
    String eventName, {
    Map<String, dynamic> properties = const {},
    String? sessionId,
  }) async {
    try {
      await dio.post(
        '/api/v1/analytics/track',
        data: {
          'event_name': eventName,
          'properties': properties,
          if (sessionId != null) 'session_id': sessionId,
          'platform': 'mobile',
        },
      );
    } catch (_) {
      // Non-critical — swallow all errors
    }
  }

  // Named helpers — keep event_name strings in one place.

  static Future<void> contentViewed(Dio dio, String contentId, String contentType) =>
      track(dio, 'content_viewed', properties: {
        'content_id': contentId,
        'content_type': contentType,
      });

  static Future<void> contentLiked(Dio dio, String contentId, {required bool liked}) =>
      track(dio, liked ? 'content_liked' : 'content_unliked',
          properties: {'content_id': contentId});

  static Future<void> creatorFollowed(Dio dio, String targetId, {required bool followed}) =>
      track(dio, followed ? 'creator_followed' : 'creator_unfollowed',
          properties: {'target_id': targetId});

  static Future<void> contentSaved(Dio dio, String contentId, {required bool saved}) =>
      track(dio, saved ? 'content_saved' : 'content_unsaved',
          properties: {'content_id': contentId});

  static Future<void> searchPerformed(Dio dio, String query, int resultCount) =>
      track(dio, 'search_performed', properties: {
        'query': query,
        'result_count': resultCount,
      });

  static Future<void> categoryBrowsed(Dio dio, String vertical, {String? subCategoryId}) =>
      track(dio, 'category_browsed', properties: {
        'vertical': vertical,
        if (subCategoryId != null) 'sub_category_id': subCategoryId,
      });
}
