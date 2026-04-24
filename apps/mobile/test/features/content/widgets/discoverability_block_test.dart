import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:creatorhub/features/content/widgets/discoverability_block.dart';
import 'package:creatorhub/shared/constants/discoverability.dart';

Widget _wrap(Widget child) {
  return MaterialApp(
    home: Scaffold(
      body: Padding(
        padding: const EdgeInsets.all(16),
        // The block has horizontally-scrollable rows — give it a finite
        // width so list views can lay out.
        child: SizedBox(width: 400, child: child),
      ),
    ),
  );
}

void main() {
  group('DiscoverabilityBlock', () {
    testWidgets('renders all 6 season pills', (tester) async {
      await tester.pumpWidget(
        _wrap(
          DiscoverabilityBlock(
            season: null,
            tripStyle: null,
            audience: null,
            onSeasonChanged: (_) {},
            onTripStyleChanged: (_) {},
            onAudienceChanged: (_) {},
          ),
        ),
      );
      await tester.pump();

      expect(kSeasons.length, 6);

      // The Season row is a horizontally-scrolling ListView — off-screen
      // items aren't laid out until scrolled. Walk through each pill via
      // `scrollUntilVisible` (targeting the first horizontal Scrollable in
      // the tree, which is the Season row) so all 6 are built and asserted.
      final horizontalScrollables = find.byWidgetPredicate(
        (w) => w is Scrollable && w.axisDirection == AxisDirection.right,
      );
      final seasonScrollable = horizontalScrollables.first;

      for (final value in kSeasons) {
        await tester.scrollUntilVisible(
          find.text(labelForFacet(value)),
          100,
          scrollable: seasonScrollable,
        );
        expect(
          find.text(labelForFacet(value)),
          findsOneWidget,
          reason: 'expected season pill "$value" to render',
        );
      }
    });

    testWidgets('tapping monsoon fires onSeasonChanged("monsoon")',
        (tester) async {
      String? captured;
      bool called = false;
      await tester.pumpWidget(
        _wrap(
          DiscoverabilityBlock(
            season: null,
            tripStyle: null,
            audience: null,
            onSeasonChanged: (v) {
              called = true;
              captured = v;
            },
            onTripStyleChanged: (_) {},
            onAudienceChanged: (_) {},
          ),
        ),
      );
      await tester.pump();

      await tester.tap(find.text(labelForFacet('monsoon')));
      await tester.pump();

      expect(called, isTrue);
      expect(captured, 'monsoon');
    });

    testWidgets(
        'tapping the already-selected pill clears it (emits null)',
        (tester) async {
      String? captured = 'initial';
      bool called = false;
      await tester.pumpWidget(
        _wrap(
          DiscoverabilityBlock(
            season: 'monsoon',
            tripStyle: null,
            audience: null,
            onSeasonChanged: (v) {
              called = true;
              captured = v;
            },
            onTripStyleChanged: (_) {},
            onAudienceChanged: (_) {},
          ),
        ),
      );
      await tester.pump();

      await tester.tap(find.text(labelForFacet('monsoon')));
      await tester.pump();

      expect(called, isTrue);
      expect(captured, isNull);
    });

    testWidgets('includeTripStyle=false hides the Style row',
        (tester) async {
      await tester.pumpWidget(
        _wrap(
          DiscoverabilityBlock(
            season: null,
            tripStyle: null,
            audience: null,
            includeTripStyle: false,
            onSeasonChanged: (_) {},
            onTripStyleChanged: (_) {},
            onAudienceChanged: (_) {},
          ),
        ),
      );
      await tester.pump();

      expect(find.text('Style'), findsNothing);
      for (final value in kTripStyles) {
        expect(find.text(labelForFacet(value)), findsNothing);
      }
    });

    test('labelForFacet handles title-casing and year_round override', () {
      expect(labelForFacet('spring'), 'Spring');
      expect(labelForFacet('nightlife'), 'Nightlife');
      expect(labelForFacet('year_round'), 'Year-round');
      expect(labelForFacet('family'), 'Family');
    });
  });
}
