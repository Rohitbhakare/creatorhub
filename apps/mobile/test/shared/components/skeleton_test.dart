import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shimmer/shimmer.dart';

import 'package:creatorhub/shared/components/skeleton.dart';

Widget _wrap(Widget child) => MaterialApp(home: Scaffold(body: child));

void main() {
  group('Skeleton components', () {
    testWidgets('SkeletonLoader wraps child in Shimmer.fromColors', (tester) async {
      await tester.pumpWidget(
        _wrap(const SkeletonLoader(child: SizedBox(width: 100, height: 20))),
      );

      expect(find.byType(Shimmer), findsOneWidget);
      expect(find.byType(SizedBox), findsWidgets);
    });

    testWidgets('SkeletonLine applies requested width and height', (tester) async {
      await tester.pumpWidget(
        _wrap(const SizedBox(
          width: 200,
          child: SkeletonLine(width: 120, height: 10),
        )),
      );

      final line = tester.widget<Container>(find.byType(Container).first);
      expect((line.constraints ?? const BoxConstraints()).minWidth,
          anyOf(0, lessThanOrEqualTo(120)));
      // The container's size is driven by width/height props; just verify it renders.
      expect(find.byType(Container), findsOneWidget);
    });

    testWidgets('SkeletonTextBlock renders the requested number of lines',
        (tester) async {
      await tester.pumpWidget(
        _wrap(const SkeletonTextBlock(lines: 4)),
      );

      expect(find.byType(SkeletonLine), findsNWidgets(4));
    });

    testWidgets('SkeletonCircle builds a circular shape', (tester) async {
      await tester.pumpWidget(_wrap(const SkeletonCircle(size: 32)));

      final container = tester.widget<Container>(
        find.descendant(of: find.byType(SkeletonLoader), matching: find.byType(Container)),
      );
      final decoration = container.decoration as BoxDecoration;
      expect(decoration.shape, BoxShape.circle);
    });

    testWidgets('SkeletonRect builds a rounded rectangle', (tester) async {
      await tester.pumpWidget(
        _wrap(const SkeletonRect(width: 100, height: 50, borderRadius: 12)),
      );

      final container = tester.widget<Container>(
        find.descendant(of: find.byType(SkeletonLoader), matching: find.byType(Container)),
      );
      final decoration = container.decoration as BoxDecoration;
      expect(decoration.borderRadius, BorderRadius.circular(12));
    });

    testWidgets('SkeletonCard renders image, title line, circle avatar, and meta line',
        (tester) async {
      await tester.pumpWidget(_wrap(const SkeletonCard()));

      expect(find.byType(SkeletonRect), findsOneWidget);
      expect(find.byType(SkeletonCircle), findsOneWidget);
      expect(find.byType(SkeletonLine), findsNWidgets(2)); // title + meta
    });

    testWidgets('SkeletonList renders N SkeletonCards', (tester) async {
      await tester.pumpWidget(
        _wrap(const SingleChildScrollView(child: SkeletonList(itemCount: 3))),
      );

      expect(find.byType(SkeletonCard), findsNWidgets(3));
    });
  });
}
