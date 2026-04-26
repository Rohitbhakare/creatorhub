// ── Discover home surface models (DD-014, DD-015) ───────────────────

class HandpickedCollection {
  final String id;
  final String title;
  final String subtitle;
  final String kind;
  final int count;
  final String? coverUrl;

  const HandpickedCollection({
    required this.id,
    required this.title,
    required this.subtitle,
    required this.kind,
    required this.count,
    this.coverUrl,
  });

  factory HandpickedCollection.fromJson(Map<String, dynamic> json) =>
      HandpickedCollection(
        id: json['id'] as String,
        title: json['title'] as String,
        subtitle: json['subtitle'] as String,
        kind: json['kind'] as String,
        count: (json['count'] as num).toInt(),
        coverUrl: json['cover_url'] as String?,
      );
}

class DiscoverCity {
  final String cityId;
  final String name;
  final String? state;
  final int contentCount;

  const DiscoverCity({
    required this.cityId,
    required this.name,
    this.state,
    required this.contentCount,
  });

  factory DiscoverCity.fromJson(Map<String, dynamic> json) => DiscoverCity(
        cityId: json['city_id'] as String,
        name: json['name'] as String,
        state: json['state'] as String?,
        contentCount: (json['content_count'] as num).toInt(),
      );
}
