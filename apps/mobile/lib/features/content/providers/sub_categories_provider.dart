/// Sub-category data for the Basics step sub-category picker.
///
/// Each [SubCategory] holds the data needed to render an emoji tile in the
/// 2-column grid bottom sheet.  The [slug] is the wire-format value sent to
/// the API via `sub_category_id` and also used to decide whether to show the
/// Difficulty row (only for adventure / trekking / wildlife slugs).
///
/// Kept as a pure-Dart constant file — no Riverpod provider needed; the data
/// is entirely static and shared by the picker sheet and the wizard state.
library;

class SubCategory {
  final String id;
  final String slug;
  final String emoji;
  final String label;
  final String subtitle;

  const SubCategory({
    required this.id,
    required this.slug,
    required this.emoji,
    required this.label,
    required this.subtitle,
  });
}

// ── Travel sub-categories ─────────────────────────────────────────

const List<SubCategory> kTravelSubCategories = [
  SubCategory(
    id: 'sc_city_guides',
    slug: 'city_guides',
    emoji: '🏙️',
    label: 'City Guides',
    subtitle: 'Urban escapes',
  ),
  SubCategory(
    id: 'sc_hidden_gems',
    slug: 'hidden_gems',
    emoji: '💎',
    label: 'Hidden Gems',
    subtitle: 'Off the beaten path',
  ),
  SubCategory(
    id: 'sc_food_trails',
    slug: 'food_trails',
    emoji: '🍜',
    label: 'Food Trails',
    subtitle: 'Eat your way around',
  ),
  SubCategory(
    id: 'sc_adventure',
    slug: 'adventure',
    emoji: '🧗',
    label: 'Adventure',
    subtitle: 'Thrills & outdoors',
  ),
  SubCategory(
    id: 'sc_trekking',
    slug: 'trekking',
    emoji: '🥾',
    label: 'Trekking',
    subtitle: 'Trails & summits',
  ),
  SubCategory(
    id: 'sc_heritage_culture',
    slug: 'heritage_culture',
    emoji: '🏛️',
    label: 'Heritage & Culture',
    subtitle: 'History & art',
  ),
  SubCategory(
    id: 'sc_nature_wildlife',
    slug: 'nature_wildlife',
    emoji: '🦁',
    label: 'Nature & Wildlife',
    subtitle: 'Flora & fauna',
  ),
  SubCategory(
    id: 'sc_spiritual',
    slug: 'spiritual',
    emoji: '🙏',
    label: 'Spiritual',
    subtitle: 'Temples & retreats',
  ),
  SubCategory(
    id: 'sc_road_trips',
    slug: 'road_trips',
    emoji: '🚗',
    label: 'Road Trips',
    subtitle: 'Miles of freedom',
  ),
  SubCategory(
    id: 'sc_budget_travel',
    slug: 'budget_travel',
    emoji: '💸',
    label: 'Budget Travel',
    subtitle: 'More miles, less money',
  ),
  SubCategory(
    id: 'sc_luxury',
    slug: 'luxury',
    emoji: '✨',
    label: 'Luxury',
    subtitle: 'Indulge yourself',
  ),
  SubCategory(
    id: 'sc_solo_travel',
    slug: 'solo_travel',
    emoji: '🎒',
    label: 'Solo Travel',
    subtitle: 'Just you & the world',
  ),
];

// ── Stories sub-categories ────────────────────────────────────────

const List<SubCategory> kStoriesSubCategories = [
  SubCategory(
    id: 'sc_travel_stories',
    slug: 'travel_stories',
    emoji: '✈️',
    label: 'Travel Stories',
    subtitle: 'Your journey, your words',
  ),
  SubCategory(
    id: 'sc_local_culture',
    slug: 'local_culture',
    emoji: '🎭',
    label: 'Local Culture',
    subtitle: 'People & traditions',
  ),
  SubCategory(
    id: 'sc_food_stories',
    slug: 'food_stories',
    emoji: '🍛',
    label: 'Food Stories',
    subtitle: 'Taste memories',
  ),
  SubCategory(
    id: 'sc_photo_essays',
    slug: 'photo_essays',
    emoji: '📸',
    label: 'Photo Essays',
    subtitle: 'Tell it in pictures',
  ),
  SubCategory(
    id: 'sc_tips_guides',
    slug: 'tips_guides',
    emoji: '📝',
    label: 'Tips & Guides',
    subtitle: 'Practical wisdom',
  ),
];

/// Returns the correct sub-category list for a given vertical slug.
/// Falls back to travel if the vertical is unrecognised.
List<SubCategory> subCategoriesForVertical(String vertical) {
  return vertical == 'stories' ? kStoriesSubCategories : kTravelSubCategories;
}

/// Returns `true` if the given sub-category slug should display the
/// Difficulty picker (adventure, trekking, or wildlife content).
bool slugRequiresDifficulty(String? slug) {
  if (slug == null) return false;
  return slug.contains('adventure') ||
      slug.contains('trekking') ||
      slug.contains('wildlife');
}

// ── Leaf-type data ────────────────────────────────────────────────

/// A leaf type is an optional deeper classification within a sub-category
/// (e.g. "Weekend Getaway" or "Day Trip" within any travel category).
class LeafType {
  final String id;
  final String label;

  const LeafType({required this.id, required this.label});
}

/// Universal leaf types available across all travel sub-categories.
const List<LeafType> kLeafTypes = [
  LeafType(id: 'day_trip', label: 'Day Trip'),
  LeafType(id: 'weekend_getaway', label: 'Weekend Getaway'),
  LeafType(id: 'week_long', label: 'Week Long'),
  LeafType(id: 'extended', label: 'Extended'),
];

// ── Group size data ───────────────────────────────────────────────

/// Group size options for itineraries and experiences.
class GroupSize {
  final String id;
  final String label;

  const GroupSize({required this.id, required this.label});
}

const List<GroupSize> kGroupSizes = [
  GroupSize(id: 'solo', label: 'Solo'),
  GroupSize(id: 'small', label: 'Small (2–6)'),
  GroupSize(id: 'medium', label: 'Medium (7–15)'),
  GroupSize(id: 'large', label: 'Large (16+)'),
];

// ── Difficulty data ───────────────────────────────────────────────

class DifficultyOption {
  final String id;
  final String label;
  final String emoji;

  const DifficultyOption({
    required this.id,
    required this.label,
    required this.emoji,
  });
}

const List<DifficultyOption> kDifficultyOptions = [
  DifficultyOption(id: 'easy', label: 'Easy', emoji: '🟢'),
  DifficultyOption(id: 'moderate', label: 'Moderate', emoji: '🟡'),
  DifficultyOption(id: 'tough', label: 'Tough', emoji: '🔴'),
];
