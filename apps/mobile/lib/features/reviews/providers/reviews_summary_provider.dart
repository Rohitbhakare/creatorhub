import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/providers/auth_provider.dart';

/// One recent review entry returned by the summary endpoint.
class ReviewSummaryRecent {
  final String reviewerName;
  final String? reviewerAvatarUrl;
  final int rating;
  final String body;
  final DateTime createdAt;

  const ReviewSummaryRecent({
    required this.reviewerName,
    this.reviewerAvatarUrl,
    required this.rating,
    required this.body,
    required this.createdAt,
  });

  factory ReviewSummaryRecent.fromJson(Map<String, dynamic> json) {
    final reviewer = json['reviewer'] as Map<String, dynamic>?;
    return ReviewSummaryRecent(
      reviewerName: (reviewer?['display_name'] ??
              reviewer?['displayName'] ??
              json['reviewer_name'] ??
              json['reviewerName'] ??
              'Anonymous') as String,
      reviewerAvatarUrl: (reviewer?['avatar_url'] ??
              reviewer?['avatarUrl'] ??
              json['reviewer_avatar_url'] ??
              json['reviewerAvatarUrl']) as String?,
      rating: (json['rating'] as num?)?.toInt() ?? 0,
      body: (json['body'] ??
              json['reviewer_text'] ??
              json['reviewerText'] ??
              '') as String,
      createdAt: DateTime.tryParse(
            (json['created_at'] ?? json['createdAt'] ?? '') as String,
          ) ??
          DateTime.now(),
    );
  }
}

/// Aggregate review summary for one piece of content.
///
/// Maps the response from `GET /api/v1/content/:contentId/reviews-summary`.
class ReviewsSummary {
  final double average;
  final int count;
  final Map<int, int> breakdown;
  final List<ReviewSummaryRecent> recent;

  const ReviewsSummary({
    required this.average,
    required this.count,
    required this.breakdown,
    required this.recent,
  });

  factory ReviewsSummary.empty() => const ReviewsSummary(
        average: 0,
        count: 0,
        breakdown: <int, int>{},
        recent: <ReviewSummaryRecent>[],
      );

  factory ReviewsSummary.fromJson(Map<String, dynamic> json) {
    final rawBreakdown = json['breakdown'];
    final breakdown = <int, int>{};
    if (rawBreakdown is Map) {
      rawBreakdown.forEach((key, value) {
        final star = key is int ? key : int.tryParse(key.toString());
        final n = value is num ? value.toInt() : int.tryParse('$value');
        if (star != null && n != null && star >= 1 && star <= 5) {
          breakdown[star] = n;
        }
      });
    }

    final rawRecent = json['recent'] as List<dynamic>? ?? <dynamic>[];
    final recent = rawRecent
        .whereType<Map<String, dynamic>>()
        .map(ReviewSummaryRecent.fromJson)
        .toList();

    return ReviewsSummary(
      average: (json['average'] as num?)?.toDouble() ?? 0.0,
      count: (json['count'] as num?)?.toInt() ?? 0,
      breakdown: breakdown,
      recent: recent,
    );
  }
}

/// Family provider keyed by `contentId`.
///
/// Hits `GET /api/v1/content/:contentId/reviews-summary` and returns a
/// typed [ReviewsSummary]. On 404 / empty payload returns
/// [ReviewsSummary.empty] so detail screens can render "Be the first to
/// review" without bubbling errors.
final reviewsSummaryProvider = FutureProvider.autoDispose
    .family<ReviewsSummary, String>((ref, contentId) async {
  final dio = ref.read(authServiceProvider).dio;

  try {
    final response = await dio.get(
      '/api/v1/content/$contentId/reviews-summary',
    );
    final body = response.data;
    if (body is! Map<String, dynamic>) return ReviewsSummary.empty();
    final data = body['data'];
    if (data is Map<String, dynamic>) {
      return ReviewsSummary.fromJson(data);
    }
    if (body.containsKey('average') || body.containsKey('count')) {
      return ReviewsSummary.fromJson(body);
    }
    return ReviewsSummary.empty();
  } on DioException catch (e) {
    if (e.response?.statusCode == 404) return ReviewsSummary.empty();
    throw Exception(
      e.response?.statusMessage ?? 'Failed to load review summary',
    );
  }
});
