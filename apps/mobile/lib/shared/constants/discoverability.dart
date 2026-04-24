/// Discoverability facet enums shared across the 3 publish wizards
/// (itinerary, event, scheduled experience) and the home-feed row-2
/// context chips.
///
/// Wire-format values — these are the exact snake_case strings the API
/// accepts on `PUT /api/v1/itineraries/:id`, `PUT /api/v1/events/:id`,
/// and `PUT /api/v1/experiences/:id` inside the `facets` object.
///
/// Kept dart-pure (no imports from features/*) so the feed, the capture
/// UI, and tests can all depend on it without pulling in wizard code.
library;

/// Travel seasons. `year_round` covers content that isn't season-bound.
const List<String> kSeasons = <String>[
  'spring',
  'summer',
  'monsoon',
  'autumn',
  'winter',
  'year_round',
];

/// Trip styles — the vibe of the itinerary/event/experience.
const List<String> kTripStyles = <String>[
  'adventure',
  'chill',
  'cultural',
  'nightlife',
  'wellness',
  'foodie',
  'offbeat',
];

/// Who the content is for.
const List<String> kAudiences = <String>[
  'solo',
  'couple',
  'family',
  'friends',
  'group',
];
