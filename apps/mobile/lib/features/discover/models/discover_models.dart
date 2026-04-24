// ── Discover data models ──────────────────────────────────────────────────────

class EditorialTheme {
  final String subCategory;
  final String displayName;
  final int contentCount;
  final String? coverImageUrl;

  const EditorialTheme({
    required this.subCategory,
    required this.displayName,
    required this.contentCount,
    this.coverImageUrl,
  });

  factory EditorialTheme.fromJson(Map<String, dynamic> json) => EditorialTheme(
        subCategory: json['sub_category'] as String,
        displayName: json['display_name'] as String,
        contentCount: (json['content_count'] as num).toInt(),
        coverImageUrl: json['cover_image_url'] as String?,
      );
}

class DiscoverCreator {
  final String id;
  final String? displayName;
  final String? username;
  final String? avatarUrl;
  final String vertical;
  final int contentCount;
  final int followerCount;

  const DiscoverCreator({
    required this.id,
    this.displayName,
    this.username,
    this.avatarUrl,
    required this.vertical,
    this.contentCount = 0,
    this.followerCount = 0,
  });

  factory DiscoverCreator.fromJson(Map<String, dynamic> json) => DiscoverCreator(
        id: json['id'] as String,
        displayName: json['display_name'] as String?,
        username: json['username'] as String?,
        avatarUrl: json['avatar_url'] as String?,
        vertical: json['vertical'] as String? ?? 'travel',
        contentCount: (json['content_count'] as num?)?.toInt() ?? 0,
        followerCount: (json['follower_count'] as num?)?.toInt() ?? 0,
      );
}

class DiscoverCreatorsResult {
  final List<DiscoverCreator> creators;
  final String label;

  const DiscoverCreatorsResult({required this.creators, required this.label});

  factory DiscoverCreatorsResult.fromJson(Map<String, dynamic> json) =>
      DiscoverCreatorsResult(
        creators: (json['creators'] as List<dynamic>)
            .map((e) => DiscoverCreator.fromJson(e as Map<String, dynamic>))
            .toList(),
        label: json['label'] as String? ?? 'Creators to follow',
      );
}

class DiscoverExperience {
  final String id;
  final String title;
  final String? coverImageUrl;
  final int pricePaisa;
  final String pricingModel;
  final String? cityName;
  final String? creatorName;
  final int? seatsRemaining;

  const DiscoverExperience({
    required this.id,
    required this.title,
    this.coverImageUrl,
    required this.pricePaisa,
    required this.pricingModel,
    this.cityName,
    this.creatorName,
    this.seatsRemaining,
  });

  factory DiscoverExperience.fromJson(Map<String, dynamic> json) => DiscoverExperience(
        id: json['id'] as String,
        title: json['title'] as String,
        coverImageUrl: json['cover_image_url'] as String?,
        pricePaisa: (json['price_paisa'] as num?)?.toInt() ?? 0,
        pricingModel: json['pricing_model'] as String? ?? 'free',
        cityName: json['city_name'] as String?,
        creatorName: json['creator_name'] as String?,
        seatsRemaining: (json['seats_remaining'] as num?)?.toInt(),
      );
}

// ── Search models ─────────────────────────────────────────────────────────────

class SearchContentSuggestion {
  final String id;
  final String title;
  final String type;
  final String vertical;
  final String? creatorName;

  const SearchContentSuggestion({
    required this.id,
    required this.title,
    required this.type,
    required this.vertical,
    this.creatorName,
  });

  factory SearchContentSuggestion.fromJson(Map<String, dynamic> json) =>
      SearchContentSuggestion(
        id: json['id'] as String,
        title: json['title'] as String,
        type: json['type'] as String,
        vertical: json['vertical'] as String,
        creatorName: json['creator_name'] as String?,
      );
}

class SearchCitySuggestion {
  final String id;
  final String name;
  final String? state;

  const SearchCitySuggestion({required this.id, required this.name, this.state});

  factory SearchCitySuggestion.fromJson(Map<String, dynamic> json) => SearchCitySuggestion(
        id: json['id'] as String,
        name: json['name'] as String,
        state: json['state'] as String?,
      );
}

class SearchCreatorSuggestion {
  final String id;
  final String? displayName;
  final String? username;
  final String? avatarUrl;

  const SearchCreatorSuggestion({
    required this.id,
    this.displayName,
    this.username,
    this.avatarUrl,
  });

  factory SearchCreatorSuggestion.fromJson(Map<String, dynamic> json) =>
      SearchCreatorSuggestion(
        id: json['id'] as String,
        displayName: json['display_name'] as String?,
        username: json['username'] as String?,
        avatarUrl: json['avatar_url'] as String?,
      );
}

class SearchSuggestionsResult {
  final List<SearchContentSuggestion> content;
  final List<SearchCitySuggestion> cities;
  final List<SearchCreatorSuggestion> creators;

  const SearchSuggestionsResult({
    required this.content,
    required this.cities,
    required this.creators,
  });

  bool get isEmpty => content.isEmpty && cities.isEmpty && creators.isEmpty;

  factory SearchSuggestionsResult.fromJson(Map<String, dynamic> json) =>
      SearchSuggestionsResult(
        content: (json['content'] as List<dynamic>)
            .map((e) => SearchContentSuggestion.fromJson(e as Map<String, dynamic>))
            .toList(),
        cities: (json['cities'] as List<dynamic>)
            .map((e) => SearchCitySuggestion.fromJson(e as Map<String, dynamic>))
            .toList(),
        creators: (json['creators'] as List<dynamic>)
            .map((e) => SearchCreatorSuggestion.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}
