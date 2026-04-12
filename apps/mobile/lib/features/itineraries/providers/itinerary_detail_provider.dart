import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/providers/auth_provider.dart';
import 'itinerary_wizard_provider.dart';

// ── Itinerary Detail State ────────────────────────────────────

class ItineraryDetail {
  final String id;
  final String title;
  final String description;
  final String vertical;
  final String pricingModel;
  final int pricePaisa;
  final int dayCount;
  final List<DayState> days;
  final List<String> mediaUrls;
  final ItineraryCreator creator;
  final int likeCount;
  final int commentCount;
  final int saveCount;
  final bool isLiked;
  final bool isSaved;
  final String? startingCityName;
  final List<String> destinationCityNames;
  final DateTime? createdAt;
  final DateTime? publishedAt;

  const ItineraryDetail({
    required this.id,
    required this.title,
    required this.description,
    required this.vertical,
    required this.pricingModel,
    required this.pricePaisa,
    required this.dayCount,
    required this.days,
    required this.mediaUrls,
    required this.creator,
    this.likeCount = 0,
    this.commentCount = 0,
    this.saveCount = 0,
    this.isLiked = false,
    this.isSaved = false,
    this.startingCityName,
    this.destinationCityNames = const [],
    this.createdAt,
    this.publishedAt,
  });

  /// Total spots across all days.
  int get totalSpots {
    int total = 0;
    for (final day in days) {
      total += day.spots.length;
    }
    return total;
  }

  /// Total distance across all days.
  double get totalDistanceKm {
    double total = 0;
    for (final day in days) {
      total += day.totalDistanceKm ?? 0;
    }
    return total;
  }

  bool get isFree => pricingModel == 'free';

  factory ItineraryDetail.fromJson(Map<String, dynamic> json) {
    final creatorJson = json['creator'] as Map<String, dynamic>? ?? {};
    final daysJson = json['days'] as List<dynamic>? ?? [];

    return ItineraryDetail(
      id: json['id'] as String,
      title: json['title'] as String? ?? '',
      description: json['description'] as String? ?? '',
      vertical: json['vertical'] as String? ?? '',
      pricingModel: json['pricing_model'] as String? ?? 'free',
      pricePaisa: json['price_paisa'] as int? ?? 0,
      dayCount: json['day_count'] as int? ?? 0,
      days: daysJson
          .map((d) => DayState.fromJson(d as Map<String, dynamic>))
          .toList(),
      mediaUrls: (json['media_urls'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          const [],
      creator: ItineraryCreator.fromJson(creatorJson),
      likeCount: json['like_count'] as int? ?? 0,
      commentCount: json['comment_count'] as int? ?? 0,
      saveCount: json['save_count'] as int? ?? 0,
      isLiked: json['is_liked'] as bool? ?? false,
      isSaved: json['is_saved'] as bool? ?? false,
      startingCityName: json['starting_city_name'] as String?,
      destinationCityNames: (json['destination_city_names'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          const [],
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'] as String)
          : null,
      publishedAt: json['published_at'] != null
          ? DateTime.tryParse(json['published_at'] as String)
          : null,
    );
  }
}

class ItineraryCreator {
  final String id;
  final String displayName;
  final String? avatarUrl;
  final bool isVerified;

  const ItineraryCreator({
    required this.id,
    required this.displayName,
    this.avatarUrl,
    this.isVerified = false,
  });

  factory ItineraryCreator.fromJson(Map<String, dynamic> json) {
    return ItineraryCreator(
      id: json['id'] as String? ?? '',
      displayName: json['display_name'] as String? ?? 'Creator',
      avatarUrl: json['avatar_url'] as String?,
      isVerified: json['is_verified'] as bool? ?? false,
    );
  }
}

// ── Provider ──────────────────────────────────────────────────

/// Family provider keyed by itinerary ID.
/// Returns an AsyncValue with loading, data, and error states.
final itineraryDetailProvider = FutureProvider.family
    .autoDispose<ItineraryDetail, String>((ref, id) async {
  final dio = ref.read(authServiceProvider).dio;

  try {
    final response = await dio.get('/api/v1/itineraries/$id');
    final responseData = response.data as Map<String, dynamic>;
    final data = responseData['data'] as Map<String, dynamic>;
    return ItineraryDetail.fromJson(data);
  } on DioException catch (e) {
    throw Exception(
      e.response?.statusMessage ?? 'Failed to load itinerary',
    );
  }
});
