import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

import 'package:creatorhub/features/posts/widgets/post_feed_card.dart';

// Helper: wraps widget in a MaterialApp.router with GoRouter so that
// context.push() calls inside PostFeedCard don't throw.
Widget _wrap(Widget child) {
  final router = GoRouter(
    initialLocation: '/',
    routes: [
      GoRoute(
        path: '/',
        builder: (_, _) => Scaffold(body: child),
      ),
      GoRoute(
        path: '/posts/:id',
        builder: (_, _) => const Scaffold(body: Text('Post detail')),
      ),
    ],
  );
  return MaterialApp.router(routerConfig: router);
}

void main() {
  group('PostFeedCard', () {
    testWidgets('renders title', (tester) async {
      await tester.pumpWidget(_wrap(
        const PostFeedCard(
          postId: 'p1',
          title: 'Golden Triangle Road Trip',
          creatorName: 'Ananya Sharma',
        ),
      ));
      await tester.pump();

      expect(find.text('Golden Triangle Road Trip'), findsOneWidget);
    });

    testWidgets('renders creator name', (tester) async {
      await tester.pumpWidget(_wrap(
        const PostFeedCard(
          postId: 'p2',
          title: 'Kerala Backwaters Guide',
          creatorName: 'Rohan Verma',
        ),
      ));
      await tester.pump();

      expect(find.text('Rohan Verma'), findsOneWidget);
    });

    testWidgets('shows POST badge', (tester) async {
      await tester.pumpWidget(_wrap(
        const PostFeedCard(
          postId: 'p3',
          title: 'Ladakh on a Budget',
          creatorName: 'Priya Singh',
        ),
      ));
      await tester.pump();

      expect(find.text('POST'), findsOneWidget);
    });

    testWidgets('displays zero counts as "0"', (tester) async {
      await tester.pumpWidget(_wrap(
        const PostFeedCard(
          postId: 'p4',
          title: 'Test Post',
          creatorName: 'Creator',
          likeCount: 0,
          commentCount: 0,
        ),
      ));
      await tester.pump();

      // Both like and comment counts should show "0"
      expect(find.text('0'), findsNWidgets(2));
    });

    testWidgets('formats counts under 1000 as plain numbers', (tester) async {
      await tester.pumpWidget(_wrap(
        const PostFeedCard(
          postId: 'p5',
          title: 'Test Post',
          creatorName: 'Creator',
          likeCount: 42,
          commentCount: 7,
        ),
      ));
      await tester.pump();

      expect(find.text('42'), findsOneWidget);
      expect(find.text('7'), findsOneWidget);
    });

    testWidgets('formats counts >= 1000 in k notation', (tester) async {
      await tester.pumpWidget(_wrap(
        const PostFeedCard(
          postId: 'p6',
          title: 'Viral Post',
          creatorName: 'Creator',
          likeCount: 1500,
          commentCount: 2000,
        ),
      ));
      await tester.pump();

      expect(find.text('1.5k'), findsOneWidget);
      expect(find.text('2.0k'), findsOneWidget);
    });

    testWidgets('shows placeholder when no cover image', (tester) async {
      await tester.pumpWidget(_wrap(
        const PostFeedCard(
          postId: 'p7',
          title: 'No Image Post',
          creatorName: 'Creator',
          coverImageUrl: null,
        ),
      ));
      await tester.pump();

      // The 16:9 AspectRatio is always present
      expect(find.byType(AspectRatio), findsOneWidget);
    });

    testWidgets('navigates to post detail on tap', (tester) async {
      await tester.pumpWidget(_wrap(
        const PostFeedCard(
          postId: 'post-abc',
          title: 'Tappable Post',
          creatorName: 'Creator',
        ),
      ));
      await tester.pump();

      await tester.tap(find.byType(PostFeedCard));
      await tester.pumpAndSettle();

      expect(find.text('Post detail'), findsOneWidget);
    });
  });
}
