import 'package:flutter_test/flutter_test.dart';

import 'package:creatorhub/features/feed/models/feed_models.dart';

void main() {
  group('FeedTags.fromJson', () {
    test('null json produces an empty tags object', () {
      final tags = FeedTags.fromJson(null);
      expect(tags.isEmpty, isTrue);
      expect(tags.season, isNull);
      expect(tags.tripStyle, isNull);
      expect(tags.audience, isNull);
      expect(tags.budgetTier, isNull);
      expect(tags.readTimeMin, isNull);
      expect(tags.locationLabel, isNull);
    });

    test('parses all six fields from snake_case wire format', () {
      final tags = FeedTags.fromJson(const {
        'season': 'monsoon',
        'trip_style': 'adventure',
        'audience': 'couple',
        'budget_tier': '₹₹',
        'read_time_min': 3,
        'location_label': 'Goa',
      });
      expect(tags.season, 'monsoon');
      expect(tags.tripStyle, 'adventure');
      expect(tags.audience, 'couple');
      expect(tags.budgetTier, '₹₹');
      expect(tags.readTimeMin, 3);
      expect(tags.locationLabel, 'Goa');
      expect(tags.isEmpty, isFalse);
    });

    test('coerces read_time_min from num (double) to int', () {
      // JSON decoders sometimes hand back a double even when the wire
      // value is whole — `(num?).toInt()` should handle both.
      final tags = FeedTags.fromJson(const {'read_time_min': 4.0});
      expect(tags.readTimeMin, 4);
      expect(tags.readTimeMin, isA<int>());
    });

    test('missing fields are left null without throwing', () {
      final tags = FeedTags.fromJson(const {'season': 'winter'});
      expect(tags.season, 'winter');
      expect(tags.tripStyle, isNull);
      expect(tags.readTimeMin, isNull);
      expect(tags.isEmpty, isFalse);
    });
  });

  group('FeedContentItem.fromJson · tags', () {
    test('parses nested tags block', () {
      final item = FeedContentItem.fromJson(const {
        'id': 'c1',
        'type': 'post',
        'title': 'Kasol weekend',
        'vertical': 'travel',
        'tags': {
          'location_label': 'Kasol',
          'read_time_min': 3,
          'audience': 'solo',
        },
      });
      expect(item.tags.locationLabel, 'Kasol');
      expect(item.tags.readTimeMin, 3);
      expect(item.tags.audience, 'solo');
    });

    test('missing tags key yields an empty FeedTags', () {
      final item = FeedContentItem.fromJson(const {
        'id': 'c1',
        'type': 'post',
        'title': 'Kasol weekend',
        'vertical': 'travel',
      });
      expect(item.tags.isEmpty, isTrue);
    });
  });
}
