import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:creatorhub/features/auth/providers/auth_provider.dart';
import 'package:creatorhub/features/feed/models/feed_models.dart';
import 'package:creatorhub/features/feed/widgets/content_card.dart';
import 'package:creatorhub/shared/theme/colors.dart';

class _FakeAuthNotifier extends AuthNotifier {
  @override
  AuthState build() => const AuthState(status: AuthStatus.guest);
}

void _resetPrefs() {
  // LocalSaveStore uses SharedPreferences — wire up an in-memory mock so
  // the guest save path runs without a platform channel.
  SharedPreferences.setMockInitialValues(const {});
}

FeedContentItem _item({
  String id = 'c1',
  String title = 'A weekend in Kasol',
  String type = 'post',
  int pricePaisa = 0,
  int likeCount = 0,
  int? durationMinutes,
  FeedCreator? creator,
  String? coverImageUrl,
  FeedTags tags = const FeedTags(),
}) =>
    FeedContentItem(
      id: id,
      type: type,
      title: title,
      vertical: 'travel',
      pricingModel: pricePaisa > 0 ? 'paid' : 'free',
      pricePaisa: pricePaisa,
      likeCount: likeCount,
      durationMinutes: durationMinutes,
      coverImageUrl: coverImageUrl,
      creator: creator,
      tags: tags,
    );

Widget _host(Widget child, {double width = 180}) {
  return ProviderScope(
    overrides: [authProvider.overrideWith(_FakeAuthNotifier.new)],
    child: MaterialApp(
      home: Scaffold(
        body: Center(child: SizedBox(width: width, child: child)),
      ),
    ),
  );
}

void main() {
  group('ContentCard · category tag', () {
    testWidgets('post → "Story"', (tester) async {
      await tester.pumpWidget(_host(ContentCard(
        item: _item(type: 'post'),
        variant: ContentCardVariant.grid,
      )));
      await tester.pump();
      // "Story" appears in both the header category tag and the row-2 fallback chip
      // when no tags are provided — assert at least one is visible.
      expect(find.text('Story'), findsAtLeastNWidgets(1));
    });

    testWidgets('post w/ read-time → "Story · 5 min"', (tester) async {
      await tester.pumpWidget(_host(ContentCard(
        item: _item(type: 'post', tags: const FeedTags(readTimeMin: 5)),
        variant: ContentCardVariant.grid,
      )));
      await tester.pump();
      expect(find.text('Story · 5 min'), findsOneWidget);
    });

    testWidgets('itinerary w/ duration → "Itinerary · 7d"', (tester) async {
      await tester.pumpWidget(_host(ContentCard(
        item: _item(type: 'itinerary', durationMinutes: 7 * 24 * 60),
        variant: ContentCardVariant.grid,
      )));
      await tester.pump();
      expect(find.text('Itinerary · 7d'), findsOneWidget);
    });

    testWidgets('itinerary w/o duration → bare "Itinerary"', (tester) async {
      await tester.pumpWidget(_host(ContentCard(
        item: _item(type: 'itinerary'),
        variant: ContentCardVariant.grid,
      )));
      await tester.pump();
      // "Itinerary" appears in both header tag and row-2 fallback with no tags.
      expect(find.text('Itinerary'), findsAtLeastNWidgets(1));
    });

    testWidgets('scheduled_experience → "Experience"', (tester) async {
      await tester.pumpWidget(_host(ContentCard(
        item: _item(type: 'scheduled_experience'),
        variant: ContentCardVariant.grid,
      )));
      await tester.pump();
      // "Experience" appears in both header tag and row-2 fallback with no tags.
      expect(find.text('Experience'), findsAtLeastNWidgets(1));
    });
  });

  group('ContentCard · price badge', () {
    testWidgets('paid content shows price pill on cover', (tester) async {
      await tester.pumpWidget(_host(ContentCard(
        item: _item(type: 'scheduled_experience', pricePaisa: 249900),
        variant: ContentCardVariant.grid,
      )));
      await tester.pump();
      expect(find.text('₹2,499'), findsOneWidget);
    });

    testWidgets('free content shows no price pill', (tester) async {
      await tester.pumpWidget(_host(ContentCard(
        item: _item(type: 'post'),
        variant: ContentCardVariant.grid,
      )));
      await tester.pump();
      expect(find.text('FREE'), findsNothing);
    });
  });

  group('ContentCard · title', () {
    testWidgets('renders the title', (tester) async {
      await tester.pumpWidget(_host(ContentCard(
        item: _item(title: 'A weekend in Kasol'),
        variant: ContentCardVariant.grid,
      )));
      await tester.pump();
      expect(find.text('A weekend in Kasol'), findsOneWidget);
    });

    testWidgets('long title ellipses at 2 lines', (tester) async {
      final longTitle =
          'A very very very very very very very very long title that should wrap to two lines and get ellipsis treatment';
      await tester.pumpWidget(_host(ContentCard(
        item: _item(title: longTitle),
        variant: ContentCardVariant.grid,
      )));
      await tester.pump();
      final textWidget = tester.widget<Text>(find.text(longTitle));
      expect(textWidget.maxLines, 2);
      expect(textWidget.overflow, TextOverflow.ellipsis);
    });
  });

  group('ContentCard · creator row', () {
    testWidgets('short name uses first token of displayName', (tester) async {
      await tester.pumpWidget(_host(ContentCard(
        item: _item(
          creator: const FeedCreator(id: 'u1', displayName: 'Priya Sharma'),
        ),
        variant: ContentCardVariant.grid,
      )));
      await tester.pump();
      expect(find.text('Priya'), findsOneWidget);
    });

    testWidgets('missing creator falls back to "Creator"', (tester) async {
      await tester.pumpWidget(_host(ContentCard(
        item: _item(),
        variant: ContentCardVariant.grid,
      )));
      await tester.pump();
      expect(find.text('Creator'), findsOneWidget);
    });

    testWidgets('likes > 0 renders count', (tester) async {
      await tester.pumpWidget(_host(ContentCard(
        item: _item(likeCount: 1200),
        variant: ContentCardVariant.grid,
      )));
      await tester.pump();
      expect(find.text('1.2K'), findsOneWidget);
    });

    testWidgets('zero likes hides the heart + count', (tester) async {
      await tester.pumpWidget(_host(ContentCard(
        item: _item(likeCount: 0),
        variant: ContentCardVariant.grid,
      )));
      await tester.pump();
      expect(find.text('0'), findsNothing);
    });
  });

  group('ContentCard · save toggle', () {
    testWidgets('unsaved card renders Save-for-later semantic button', (tester) async {
      _resetPrefs();
      await tester.pumpWidget(_host(ContentCard(
        item: _item(id: 'save-test'),
        variant: ContentCardVariant.grid,
      )));
      await tester.pump();

      expect(find.bySemanticsLabel('Save for later'), findsOneWidget);
    });

    testWidgets('tapping Save-for-later opens the save-to-list sheet', (tester) async {
      _resetPrefs();
      await tester.pumpWidget(_host(ContentCard(
        item: _item(id: 'save-test'),
        variant: ContentCardVariant.grid,
      )));
      await tester.pump();

      await tester.tap(find.bySemanticsLabel('Save for later'));
      await tester.pump(); // start sheet animation
      await tester.pump(const Duration(milliseconds: 300)); // complete animation

      // The SaveToListSheet header appears
      expect(find.text('Save to…'), findsOneWidget);
    });
  });

  group('ContentCard · rail variant sizing', () {
    testWidgets('rail variant uses railWidth', (tester) async {
      await tester.pumpWidget(_host(
        ContentCard(
          item: _item(),
          variant: ContentCardVariant.rail,
          railWidth: 170,
        ),
        width: 400,
      ));
      await tester.pump();
      final sized = find
          .byWidgetPredicate((w) => w is SizedBox && w.width == 170)
          .first;
      expect(sized, findsOneWidget);
    });
  });

  group('ContentCard · colors (sanity)', () {
    testWidgets('coral token is the expected hex', (tester) async {
      // Guard against accidental coral token drift — SOC-FR-004 + DD-013 require
      // the saved-bookmark fill to use exactly this value.
      expect(AppColors.coral.toARGB32(), 0xFFE15A41);
    });
  });

  group('ContentCard · row-2 chips', () {
    testWidgets('post shows location · read-time · audience', (tester) async {
      // Use 350px so 3 chips fit side-by-side without overflow.
      await tester.pumpWidget(_host(ContentCard(
        item: _item(
          type: 'post',
          tags: const FeedTags(
            locationLabel: 'Goa',
            readTimeMin: 3,
            audience: 'couple',
          ),
        ),
        variant: ContentCardVariant.grid,
      ), width: 350));
      await tester.pump();
      expect(find.text('Goa'), findsOneWidget);
      expect(find.text('3m read'), findsOneWidget);
      expect(find.text('Couple'), findsOneWidget);
    });

    // Itinerary row-2 chips: duration · locationLabel · season
    // (tripStyle and budgetTier are NOT rendered for itinerary type)
    testWidgets('itinerary shows season chip', (tester) async {
      await tester.pumpWidget(_host(ContentCard(
        item: _item(
          type: 'itinerary',
          tags: const FeedTags(
            season: 'monsoon',
            tripStyle: 'adventure',  // not rendered for itinerary
            budgetTier: '₹₹',        // not rendered for itinerary
          ),
        ),
        variant: ContentCardVariant.grid,
      ), width: 350));
      await tester.pump();
      expect(find.text('Monsoon'), findsOneWidget);
      // tripStyle and budgetTier are not part of itinerary meta items
      expect(find.text('Adventure'), findsNothing);
      expect(find.text('₹₹'), findsNothing);
    });

    testWidgets('free itinerary drops the budget chip', (tester) async {
      await tester.pumpWidget(_host(ContentCard(
        item: _item(
          type: 'itinerary',
          tags: const FeedTags(
            season: 'winter',
            tripStyle: 'chill',  // not rendered for itinerary
            budgetTier: 'free',  // not rendered for itinerary
          ),
        ),
        variant: ContentCardVariant.grid,
      ), width: 350));
      await tester.pump();
      // budgetTier and tripStyle are not rendered for itinerary — none appear
      expect(find.text('Free'), findsNothing);
      expect(find.text('free'), findsNothing);
      expect(find.text('Chill'), findsNothing);
      // season chip renders
      expect(find.text('Winter'), findsOneWidget);
    });

    testWidgets('scheduled_experience keeps the Free chip', (tester) async {
      await tester.pumpWidget(_host(ContentCard(
        item: _item(
          type: 'scheduled_experience',
          tags: const FeedTags(budgetTier: 'free'),
        ),
        variant: ContentCardVariant.grid,
      )));
      await tester.pump();
      expect(find.text('Free'), findsOneWidget);
    });

    testWidgets('event chips render in location · audience · budget order',
        (tester) async {
      // Use 350px so 3 chips fit side-by-side without overflow.
      await tester.pumpWidget(_host(ContentCard(
        item: _item(
          type: 'event',
          tags: const FeedTags(
            locationLabel: 'Mumbai',
            audience: 'group',
            budgetTier: '₹',
          ),
        ),
        variant: ContentCardVariant.grid,
      ), width: 350));
      await tester.pump();
      expect(find.text('Mumbai'), findsOneWidget);
      expect(find.text('Group'), findsOneWidget);
      expect(find.text('₹'), findsOneWidget);

      final mumbaiX = tester.getTopLeft(find.text('Mumbai')).dx;
      final groupX = tester.getTopLeft(find.text('Group')).dx;
      final budgetX = tester.getTopLeft(find.text('₹')).dx;
      expect(mumbaiX < groupX, isTrue);
      expect(groupX < budgetX, isTrue);
    });

    testWidgets('empty tags render nothing (creator row still visible)',
        (tester) async {
      await tester.pumpWidget(_host(ContentCard(
        item: _item(
          type: 'post',
          creator: const FeedCreator(id: 'u1', displayName: 'Priya Sharma'),
        ),
        variant: ContentCardVariant.grid,
      )));
      await tester.pump();
      // None of the chip-candidate labels should appear
      expect(find.text('Goa'), findsNothing);
      expect(find.text('3m read'), findsNothing);
      expect(find.text('Couple'), findsNothing);
      expect(find.text('Solo'), findsNothing);
      expect(find.text('Monsoon'), findsNothing);
      expect(find.text('Free'), findsNothing);
      // Regression sanity: creator row still rendered
      expect(find.text('Priya'), findsOneWidget);
    });
  });
}
