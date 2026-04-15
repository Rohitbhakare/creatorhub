import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/providers/auth_provider.dart';

// ── Data Models ───────────────────────────────────────────────────

class ReviewerSummary {
  final String id;
  final String? displayName;
  final String? avatarUrl;
  final String? username;

  const ReviewerSummary({
    required this.id,
    this.displayName,
    this.avatarUrl,
    this.username,
  });

  factory ReviewerSummary.fromJson(Map<String, dynamic> json) {
    return ReviewerSummary(
      id: json['id'] as String? ?? '',
      displayName: json['displayName'] as String?,
      avatarUrl: json['avatarUrl'] as String?,
      username: json['username'] as String?,
    );
  }
}

class Review {
  final String id;
  final String bookingId;
  final String contentId;
  final String reviewerId;
  final String creatorId;
  final int rating;
  final String? reviewerText;
  final String? creatorResponse;
  final bool isRevealed;
  final DateTime? revealedAt;
  final DateTime createdAt;
  final ReviewerSummary? reviewer;

  const Review({
    required this.id,
    required this.bookingId,
    required this.contentId,
    required this.reviewerId,
    required this.creatorId,
    required this.rating,
    this.reviewerText,
    this.creatorResponse,
    required this.isRevealed,
    this.revealedAt,
    required this.createdAt,
    this.reviewer,
  });

  /// Days remaining until reveal (0 if already revealed or in the past).
  int get daysUntilReveal {
    if (isRevealed || revealedAt == null) return 0;
    final diff = revealedAt!.difference(DateTime.now()).inDays;
    return diff < 0 ? 0 : diff;
  }

  factory Review.fromJson(Map<String, dynamic> json) {
    final reviewerJson = json['reviewer'] as Map<String, dynamic>?;
    return Review(
      id: json['id'] as String? ?? '',
      bookingId: json['bookingId'] as String? ?? '',
      contentId: json['contentId'] as String? ?? '',
      reviewerId: json['reviewerId'] as String? ?? '',
      creatorId: json['creatorId'] as String? ?? '',
      rating: json['rating'] as int? ?? 0,
      reviewerText: json['reviewerText'] as String?,
      creatorResponse: json['creatorResponse'] as String?,
      isRevealed: json['isRevealed'] as bool? ?? false,
      revealedAt: json['revealedAt'] != null
          ? DateTime.tryParse(json['revealedAt'] as String)
          : null,
      createdAt: DateTime.tryParse(json['createdAt'] as String? ?? '') ??
          DateTime.now(),
      reviewer:
          reviewerJson != null ? ReviewerSummary.fromJson(reviewerJson) : null,
    );
  }
}

class ReviewsResult {
  final List<Review> items;
  final double averageRating;
  final String? nextCursor;

  const ReviewsResult({
    required this.items,
    required this.averageRating,
    this.nextCursor,
  });
}

// ── Providers ─────────────────────────────────────────────────────

/// Reviews for a content piece.
/// Family keyed by contentId.
final reviewsProvider = FutureProvider.autoDispose
    .family<ReviewsResult, String>((ref, contentId) async {
  final dio = ref.read(authServiceProvider).dio;

  try {
    final response =
        await dio.get('/api/v1/content/$contentId/reviews');
    final body = response.data as Map<String, dynamic>;
    final data = body['data'] as List<dynamic>? ?? [];
    final meta = body['meta'] as Map<String, dynamic>? ?? {};

    final items = data
        .map((e) => Review.fromJson(e as Map<String, dynamic>))
        .toList();

    return ReviewsResult(
      items: items,
      averageRating: (meta['average_rating'] as num?)?.toDouble() ?? 0.0,
      nextCursor: meta['next_cursor'] as String?,
    );
  } on DioException catch (e) {
    throw Exception(e.response?.statusMessage ?? 'Failed to load reviews');
  }
});

/// Single review by ID.
final reviewDetailProvider =
    FutureProvider.autoDispose.family<Review, String>((ref, reviewId) async {
  final dio = ref.read(authServiceProvider).dio;

  try {
    final response = await dio.get('/api/v1/reviews/$reviewId');
    final data =
        (response.data as Map<String, dynamic>)['data'] as Map<String, dynamic>;
    return Review.fromJson(data);
  } on DioException catch (e) {
    throw Exception(e.response?.statusMessage ?? 'Failed to load review');
  }
});

// ── Submit Review Notifier ─────────────────────────────────────────

class SubmitReviewState {
  final bool isLoading;
  final String? error;
  final String? submittedId;

  const SubmitReviewState({
    this.isLoading = false,
    this.error,
    this.submittedId,
  });

  SubmitReviewState copyWith({
    bool? isLoading,
    String? error,
    String? submittedId,
  }) {
    return SubmitReviewState(
      isLoading: isLoading ?? this.isLoading,
      error: error ?? this.error,
      submittedId: submittedId ?? this.submittedId,
    );
  }
}

class SubmitReviewNotifier extends AsyncNotifier<SubmitReviewState> {
  @override
  Future<SubmitReviewState> build() async => const SubmitReviewState();

  Future<bool> submit({
    required String bookingId,
    required int rating,
    required String reviewerText,
  }) async {
    state = const AsyncValue.loading();

    try {
      final dio = ref.read(authServiceProvider).dio;
      final response = await dio.post('/api/v1/reviews', data: {
        'booking_id': bookingId,
        'rating': rating,
        'reviewer_text': reviewerText,
      });

      final data =
          (response.data as Map<String, dynamic>)['data'] as Map<String, dynamic>;
      final id = data['id'] as String;

      state = AsyncValue.data(
        SubmitReviewState(submittedId: id),
      );
      return true;
    } on DioException catch (e) {
      final message = _parseError(e);
      state = AsyncValue.data(
        SubmitReviewState(error: message),
      );
      return false;

    } catch (_) {
      state = const AsyncValue.data(
        SubmitReviewState(error: 'Something went wrong. Please try again.'),
      );
      return false;
    }
  }

  String _parseError(DioException e) {
    final body = e.response?.data;
    if (body is Map<String, dynamic>) {
      final error = body['error'] as Map<String, dynamic>?;
      if (error != null) {
        return error['detail'] as String? ?? 'Failed to submit review';
      }
    }
    return e.response?.statusMessage ?? 'Failed to submit review';
  }
}

final submitReviewProvider =
    AsyncNotifierProvider<SubmitReviewNotifier, SubmitReviewState>(
  SubmitReviewNotifier.new,
);
