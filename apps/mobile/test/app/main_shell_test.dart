import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import 'package:creatorhub/app/main_shell.dart';
import 'package:creatorhub/shared/theme/colors.dart';

Widget _wrap(int currentIndex, void Function(int) onTabTap) {
  return MaterialApp(
    home: MainShell(
      currentIndex: currentIndex,
      onTabTap: onTabTap,
      child: const SizedBox.shrink(),
    ),
  );
}

void main() {
  group('MainShell — 5-tab bottom navigation', () {
    testWidgets('bar sits on surface with top-edge shadow', (tester) async {
      await tester.pumpWidget(_wrap(0, (_) {}));

      final decoratedBoxes = find.byType(DecoratedBox);
      final navDecorations = tester
          .widgetList<DecoratedBox>(decoratedBoxes)
          .map((d) => d.decoration as BoxDecoration)
          .where((d) =>
              d.color == AppColors.surface && d.boxShadow != null)
          .toList();

      expect(
        navDecorations.any(
          (d) =>
              d.boxShadow!.length == AppColors.bottomNavTopShadow.length &&
              d.boxShadow!.first.offset.dy < 0,
        ),
        isTrue,
        reason: 'BottomNav must render with an upward top-edge shadow',
      );
    });

    testWidgets('active tab renders coral-tint pill + coral label',
        (tester) async {
      await tester.pumpWidget(_wrap(0, (_) {}));

      final homeIconFinder =
          find.byIcon(PhosphorIcons.house(PhosphorIconsStyle.fill));
      expect(homeIconFinder, findsOneWidget);

      final homeContainer = tester.firstWidget<Container>(
        find.ancestor(of: homeIconFinder, matching: find.byType(Container)),
      );
      final decoration = homeContainer.decoration as BoxDecoration;
      expect(decoration.color, AppColors.primaryTint);

      final label = tester.widget<Text>(find.text('Home'));
      expect(label.style?.color, AppColors.coral);
    });

    testWidgets('inactive tab uses inkMuted icon + label', (tester) async {
      await tester.pumpWidget(_wrap(0, (_) {}));

      final discoverLabel = tester.widget<Text>(find.text('Discover'));
      expect(discoverLabel.style?.color, AppColors.inkMuted);
    });

    testWidgets('renders 5 tabs: Home · Discover · Create · Saved · You',
        (tester) async {
      await tester.pumpWidget(_wrap(0, (_) {}));

      for (final label in ['Home', 'Discover', 'Create', 'Saved', 'You']) {
        expect(find.text(label), findsOneWidget, reason: 'expected $label tab');
      }
    });

    testWidgets('tap on a tab fires onTabTap with its index', (tester) async {
      final taps = <int>[];
      await tester.pumpWidget(_wrap(0, taps.add));

      await tester.tap(find.text('Discover'));
      await tester.tap(find.text('Create'));
      await tester.tap(find.text('Saved'));
      await tester.tap(find.text('You'));
      await tester.pumpAndSettle();

      expect(taps, [1, 2, 3, 4]);
    });
  });
}
