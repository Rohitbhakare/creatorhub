import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:creatorhub/features/content/config/create_tile_config.dart';
import 'package:creatorhub/features/content/widgets/create_tile.dart';

Widget _wrap(Widget child) {
  return MaterialApp(
    home: Scaffold(
      body: Padding(padding: const EdgeInsets.all(20), child: child),
    ),
  );
}

CreateTileSpec _postSpec() =>
    kCreateTiles.firstWhere((s) => s.title == 'Post');
CreateTileSpec _experienceSpec() =>
    kCreateTiles.firstWhere((s) => s.title == 'Experience');

void main() {
  group('CreateTile', () {
    testWidgets('renders title and descriptor from spec', (tester) async {
      await tester.pumpWidget(_wrap(CreateTile(spec: _postSpec())));
      await tester.pumpAndSettle();

      expect(find.text('Post'), findsOneWidget);
      expect(find.text('Share a story, photo, or moment'), findsOneWidget);
    });

    testWidgets('fires onTap when the active tile is tapped', (tester) async {
      var taps = 0;
      await tester.pumpWidget(_wrap(CreateTile(
        spec: _postSpec(),
        onTap: () => taps++,
      )));
      await tester.pumpAndSettle();

      await tester.tap(find.text('Post'));
      await tester.pumpAndSettle();

      expect(taps, 1);
    });

    testWidgets('coming-soon tile does not fire onTap when tapped',
        (tester) async {
      var tileTaps = 0;
      await tester.pumpWidget(_wrap(CreateTile(
        spec: _experienceSpec(),
        onTap: () => tileTaps++,
      )));
      await tester.pumpAndSettle();

      await tester.tap(find.text('Experience'));
      await tester.pumpAndSettle();

      expect(tileTaps, 0);
    });

    testWidgets('coming-soon tile renders a Notify me button that fires '
        'onNotifyMe independently', (tester) async {
      var tileTaps = 0;
      var notifyTaps = 0;
      await tester.pumpWidget(_wrap(CreateTile(
        spec: _experienceSpec(),
        onTap: () => tileTaps++,
        onNotifyMe: () => notifyTaps++,
      )));
      await tester.pumpAndSettle();

      expect(find.text('Notify me'), findsOneWidget);

      await tester.tap(find.text('Notify me'));
      await tester.pumpAndSettle();

      expect(notifyTaps, 1, reason: 'notify-me should fire');
      expect(tileTaps, 0, reason: 'tile onTap must not bubble');
    });

    testWidgets('accessible label combines title and descriptor',
        (tester) async {
      await tester.pumpWidget(_wrap(CreateTile(spec: _postSpec())));
      await tester.pumpAndSettle();

      expect(
        find.byWidgetPredicate((w) =>
            w is Semantics &&
            w.properties.label == 'Post: Share a story, photo, or moment'),
        findsOneWidget,
      );
    });
  });
}
