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
  group('MainShell — SRS C-28 bottom navigation v2', () {
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

    testWidgets('active non-FAB tab renders coral-tint pill + coral label',
        (tester) async {
      await tester.pumpWidget(_wrap(0, (_) {}));

      // Active Home tab: icon container with primaryTint background.
      final homeIconFinder =
          find.byIcon(PhosphorIcons.house(PhosphorIconsStyle.fill));
      expect(homeIconFinder, findsOneWidget);

      final homeContainer = tester.firstWidget<Container>(
        find.ancestor(of: homeIconFinder, matching: find.byType(Container)),
      );
      final decoration = homeContainer.decoration as BoxDecoration;
      expect(decoration.color, AppColors.primaryTint);

      // Active label is coral.
      final label = tester.widget<Text>(find.text('Home'));
      expect(label.style?.color, AppColors.coral);
    });

    testWidgets('inactive tab uses inkMuted icon + label', (tester) async {
      await tester.pumpWidget(_wrap(0, (_) {}));

      final discoverLabel = tester.widget<Text>(find.text('Discover'));
      expect(discoverLabel.style?.color, AppColors.inkMuted);
    });

    testWidgets('centre Create slot is a 52dp coral FAB with glow',
        (tester) async {
      await tester.pumpWidget(_wrap(0, (_) {}));

      final fabIcon = find.byIcon(PhosphorIcons.plus(PhosphorIconsStyle.bold));
      expect(fabIcon, findsOneWidget);

      final fabContainer = tester.firstWidget<Container>(
        find.ancestor(of: fabIcon, matching: find.byType(Container)),
      );
      expect(fabContainer.constraints?.maxWidth, 52);
      expect(fabContainer.constraints?.maxHeight, 52);

      final decoration = fabContainer.decoration as BoxDecoration;
      expect(decoration.color, AppColors.coral);
      expect(decoration.shape, BoxShape.circle);
      expect(decoration.boxShadow, AppColors.fabGlowShadow);
    });

    testWidgets('tap on a tab fires onTabTap with its index', (tester) async {
      final taps = <int>[];
      await tester.pumpWidget(_wrap(0, taps.add));

      await tester.tap(find.text('Studio'));
      await tester.tap(find.text('You'));
      await tester.pumpAndSettle();

      expect(taps, [3, 4]);
    });

    testWidgets('create FAB tap fires index 2', (tester) async {
      final taps = <int>[];
      await tester.pumpWidget(_wrap(0, taps.add));

      await tester.tap(find.byIcon(PhosphorIcons.plus(PhosphorIconsStyle.bold)));
      await tester.pumpAndSettle();

      expect(taps, [2]);
    });
  });
}
