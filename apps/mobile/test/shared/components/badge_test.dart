import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:creatorhub/shared/components/badge.dart';
import 'package:creatorhub/shared/theme/colors.dart';

Widget _wrap(Widget child) => MaterialApp(home: Scaffold(body: child));

void main() {
  group('CategoryBadge', () {
    testWidgets('renders the provided label', (tester) async {
      await tester.pumpWidget(_wrap(const CategoryBadge(
        label: 'Beach',
        slug: 'beach',
      )));

      expect(find.text('Beach'), findsOneWidget);
    });

    testWidgets('uses the vertical color when slug is known', (tester) async {
      final travelSlug = AppColors.verticalColors.keys.first;
      final expectedColor = AppColors.verticalColors[travelSlug]!;

      await tester.pumpWidget(_wrap(CategoryBadge(
        label: 'X',
        slug: travelSlug,
      )));

      final textWidget = tester.widget<Text>(find.text('X'));
      expect(textWidget.style?.color, expectedColor);
    });

    testWidgets('falls back to inkSoft when slug is unknown (never gray surface)',
        (tester) async {
      await tester.pumpWidget(_wrap(const CategoryBadge(
        label: 'X',
        slug: 'definitely-not-real-slug',
      )));

      final textWidget = tester.widget<Text>(find.text('X'));
      expect(textWidget.style?.color, AppColors.inkSoft);
    });
  });

  group('StatusBadge', () {
    testWidgets('renders label text', (tester) async {
      await tester.pumpWidget(_wrap(const StatusBadge(label: 'Published')));
      expect(find.text('Published'), findsOneWidget);
    });

    testWidgets('paints success surface when type=success', (tester) async {
      await tester.pumpWidget(_wrap(const StatusBadge(
        label: 'Published',
        type: StatusBadgeType.success,
      )));

      final container = tester.widget<Container>(
        find.ancestor(
          of: find.text('Published'),
          matching: find.byType(Container),
        ).first,
      );
      final decoration = container.decoration as BoxDecoration;
      expect(decoration.color, AppColors.successSurface);
    });
  });

  group('NotificationDot', () {
    testWidgets('is a coral circle of the requested size', (tester) async {
      await tester.pumpWidget(_wrap(const NotificationDot(size: 10)));

      final box = tester.getSize(find.byType(NotificationDot));
      expect(box.width, 10);
      expect(box.height, 10);

      final container = tester.widget<Container>(find.byType(Container));
      final decoration = container.decoration as BoxDecoration;
      expect(decoration.color, AppColors.coral);
      expect(decoration.shape, BoxShape.circle);
    });
  });

  group('CountBadge', () {
    testWidgets('renders nothing when count <= 0', (tester) async {
      await tester.pumpWidget(_wrap(const CountBadge(count: 0)));
      expect(find.byType(Container), findsNothing);
    });

    testWidgets('renders the count as text when positive', (tester) async {
      await tester.pumpWidget(_wrap(const CountBadge(count: 3)));
      expect(find.text('3'), findsOneWidget);
    });

    testWidgets('renders "99+" when count exceeds 99', (tester) async {
      await tester.pumpWidget(_wrap(const CountBadge(count: 250)));
      expect(find.text('99+'), findsOneWidget);
    });
  });
}
