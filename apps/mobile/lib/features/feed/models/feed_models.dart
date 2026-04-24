// ── Feed data models ───────────────────────────────────────────

class FeedCreator {
  final String id;
  final String? displayName;
  final String? username;
  final String? avatarUrl;

  const FeedCreator({
    required this.id,
    this.displayName,
    this.username,
    this.avatarUrl,
  });

  factory FeedCreator.fromJson(Map<String, dynamic> json) => FeedCreator(
        id: json['id'] as String,
        displayName: json['display_name'] as String?,
        username: json['username'] as String?,
        avatarUrl: json['avatar_url'] as String?,
      );
}

/// Row-2 context chips payload for feed cards.
///
/// All fields optional — the UI picks up to 3 chips per card type and omits
/// any null/empty value. Wire format is snake_case JSON; see
/// [FeedTags.fromJson].
class FeedTags {
  final String? season;
  final String? tripStyle;
  final String? audience;

  /// One of: `'free' | '₹' | '₹₹' | '₹₹₹' | '₹₹₹₹'`.
  final String? budgetTier;
  final int? readTimeMin;
  final String? locationLabel;

  const FeedTags({
    this.season,
    this.tripStyle,
    this.audience,
    this.budgetTier,
    this.readTimeMin,
    this.locationLabel,
  });

  factory FeedTags.fromJson(Map<String, dynamic>? json) {
    if (json == null) return const FeedTags();
    return FeedTags(
      season: json['season'] as String?,
      tripStyle: json['trip_style'] as String?,
      audience: json['audience'] as String?,
      budgetTier: json['budget_tier'] as String?,
      readTimeMin: (json['read_time_min'] as num?)?.toInt(),
      locationLabel: json['location_label'] as String?,
    );
  }

  bool get isEmpty =>
      season == null &&
      tripStyle == null &&
      audience == null &&
      budgetTier == null &&
      readTimeMin == null &&
      locationLabel == null;
}

class FeedContentItem {
  final String id;
  final String type;
  final String title;
  final String vertical;
  final String pricingModel;
  final int pricePaisa;
  final int likeCount;
  final int commentCount;
  final int? durationMinutes;
  final String? startingCityId;
  final String? coverImageUrl;
  final DateTime? publishedAt;
  final FeedCreator? creator;
  final FeedTags tags;

  const FeedContentItem({
    required this.id,
    required this.type,
    required this.title,
    required this.vertical,
    required this.pricingModel,
    required this.pricePaisa,
    required this.likeCount,
    this.commentCount = 0,
    this.durationMinutes,
    this.startingCityId,
    this.coverImageUrl,
    this.publishedAt,
    this.creator,
    this.tags = const FeedTags(),
  });

  factory FeedContentItem.fromJson(Map<String, dynamic> json) => FeedContentItem(
        id: json['id'] as String,
        type: json['type'] as String,
        title: json['title'] as String,
        vertical: json['vertical'] as String,
        pricingModel: (json['pricing_model'] ?? 'free') as String,
        pricePaisa: (json['price_paisa'] ?? 0) as int,
        likeCount: (json['like_count'] ?? 0) as int,
        commentCount: (json['comment_count'] ?? 0) as int,
        durationMinutes: json['duration_minutes'] as int?,
        startingCityId: json['starting_city_id'] as String?,
        coverImageUrl: json['cover_image_url'] as String?,
        publishedAt: json['published_at'] != null
            ? DateTime.tryParse(json['published_at'] as String)
            : null,
        creator: json['creator'] != null
            ? FeedCreator.fromJson(json['creator'] as Map<String, dynamic>)
            : null,
        tags: FeedTags.fromJson(json['tags'] as Map<String, dynamic>?),
      );
}

class NearYouResult {
  final List<FeedContentItem> items;

  /// 0 = exact city, 1 = 200 km, 2 = 500 km, 3 = India-wide
  final int fallbackLevel;
  final String label;
  final List<String> fallbackCities;

  const NearYouResult({
    required this.items,
    required this.fallbackLevel,
    required this.label,
    required this.fallbackCities,
  });

  factory NearYouResult.fromJson(Map<String, dynamic> json) => NearYouResult(
        items: (json['items'] as List<dynamic>)
            .map((i) => FeedContentItem.fromJson(i as Map<String, dynamic>))
            .toList(),
        fallbackLevel: (json['fallback_level'] ?? 0) as int,
        label: (json['label'] ?? 'Near you') as String,
        fallbackCities: (json['fallback_cities'] as List<dynamic>?)
                ?.map((c) => c as String)
                .toList() ??
            [],
      );
}

class DiscoverCreator {
  final String id;
  final String? displayName;
  final String? username;
  final String? avatarUrl;
  final String vertical;

  const DiscoverCreator({
    required this.id,
    this.displayName,
    this.username,
    this.avatarUrl,
    required this.vertical,
  });

  factory DiscoverCreator.fromJson(Map<String, dynamic> json) => DiscoverCreator(
        id: json['id'] as String,
        displayName: json['display_name'] as String?,
        username: json['username'] as String?,
        avatarUrl: json['avatar_url'] as String?,
        vertical: json['vertical'] as String,
      );
}
