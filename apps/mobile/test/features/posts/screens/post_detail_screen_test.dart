import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

import 'package:creatorhub/features/posts/providers/post_detail_provider.dart';
import 'package:creatorhub/features/posts/screens/post_detail_screen.dart';

// ── Helpers ───────────────────────────────────────────────────────

// Sets phone dimensions so the hero carousel (width × 0.75) doesn't fill the
// entire 800×600 default test viewport, allowing the content sliver to render.
Future<void> _setPhoneSize(WidgetTester tester) async {
  tester.view.physicalSize = const Size(390 * 3.0, 844 * 3.0);
  tester.view.devicePixelRatio = 3.0;
  addTearDown(() {
    tester.view.resetPhysicalSize();
    tester.view.resetDevicePixelRatio();
  });
}

PostDetailState _loadedState({
  String id = 'post-1',
  String title = 'Ladakh in Summer',
  String body = 'The mountains were breathtaking.',
  String creatorName = 'Priya Shah',
  String? creatorUsername = 'priya',
  String? creatorId = 'creator-1',
  String? locationName,
  List<PostMediaItem> media = const [],
  List<String> tags = const [],
  int likeCount = 0,
  bool isLiked = false,
  bool isSaved = false,
}) {
  return PostDetailState(
    id: id,
    title: title,
    body: body,
    creatorName: creatorName,
    creatorUsername: creatorUsername,
    creatorId: creatorId,
    locationName: locationName,
    media: media,
    tags: tags,
    likeCount: likeCount,
    isLiked: isLiked,
    isSaved: isSaved,
  );
}

Widget _wrap(String postId, PostDetailState state) {
  final router = GoRouter(
    initialLocation: '/posts/$postId',
    routes: [
      GoRoute(
        path: '/posts/:id',
        builder: (_, routeState) =>
            PostDetailScreen(postId: routeState.pathParameters['id']!),
      ),
    ],
  );

  return ProviderScope(
    overrides: [
      postDetailProvider(postId).overrideWith((ref) async => state),
    ],
    child: MaterialApp.router(routerConfig: router),
  );
}

Widget _wrapError(String postId, String errorMsg) {
  final router = GoRouter(
    initialLocation: '/posts/$postId',
    routes: [
      GoRoute(
        path: '/posts/:id',
        builder: (_, routeState) =>
            PostDetailScreen(postId: routeState.pathParameters['id']!),
      ),
    ],
  );

  return ProviderScope(
    overrides: [
      postDetailProvider(postId).overrideWith(
        (ref) async => throw Exception(errorMsg),
      ),
    ],
    child: MaterialApp.router(routerConfig: router),
  );
}

// Drains Dio connection-timeout timers created by AnalyticsService.contentViewed
// so the test can dispose cleanly without a "Timer still pending" assertion.
Future<void> _drainTimers(WidgetTester tester) =>
    tester.pump(const Duration(seconds: 15));

// ── Tests ─────────────────────────────────────────────────────────

void main() {
  group('PostDetailScreen', () {
    testWidgets('renders post title', (tester) async {
      await _setPhoneSize(tester);
      final state = _loadedState(title: 'Ladakh in Summer');
      await tester.pumpWidget(_wrap('post-1', state));
      await tester.pump();

      expect(find.text('Ladakh in Summer'), findsOneWidget);
      await _drainTimers(tester);
    });

    testWidgets('renders body text', (tester) async {
      await _setPhoneSize(tester);
      final state = _loadedState(body: 'The mountains were breathtaking.');
      await tester.pumpWidget(_wrap('post-1', state));
      await tester.pump();

      expect(find.text('The mountains were breathtaking.'), findsOneWidget);
      await _drainTimers(tester);
    });

    testWidgets('renders creator display name', (tester) async {
      await _setPhoneSize(tester);
      final state = _loadedState(creatorName: 'Priya Shah');
      await tester.pumpWidget(_wrap('post-1', state));
      await tester.pump();

      expect(find.text('Priya Shah'), findsOneWidget);
      await _drainTimers(tester);
    });

    testWidgets('renders location chip when locationName is provided',
        (tester) async {
      await _setPhoneSize(tester);
      final state = _loadedState(locationName: 'Leh, Ladakh');
      await tester.pumpWidget(_wrap('post-1', state));
      await tester.pump();

      expect(find.text('Leh, Ladakh'), findsOneWidget);
      await _drainTimers(tester);
    });

    testWidgets('omits location chip when locationName is null',
        (tester) async {
      await _setPhoneSize(tester);
      final state = _loadedState();
      await tester.pumpWidget(_wrap('post-1', state));
      await tester.pump();

      expect(find.text('Leh, Ladakh'), findsNothing);
      await _drainTimers(tester);
    });

    testWidgets('renders tags as #tag chips', (tester) async {
      await _setPhoneSize(tester);
      final state = _loadedState(tags: ['mountains', 'travel']);
      await tester.pumpWidget(_wrap('post-1', state));
      await tester.pump();

      expect(find.text('#mountains'), findsOneWidget);
      expect(find.text('#travel'), findsOneWidget);
      await _drainTimers(tester);
    });

    testWidgets('shows Follow button in creator header', (tester) async {
      await _setPhoneSize(tester);
      final state = _loadedState();
      await tester.pumpWidget(_wrap('post-1', state));
      await tester.pump();

      expect(find.text('Follow'), findsOneWidget);
      await _drainTimers(tester);
    });

    testWidgets('shows like count in engagement bar when > 0', (tester) async {
      await _setPhoneSize(tester);
      final state = _loadedState(likeCount: 42);
      await tester.pumpWidget(_wrap('post-1', state));
      await tester.pump();

      expect(find.text('42'), findsOneWidget);
      await _drainTimers(tester);
    });

    testWidgets('shows error state with "Post not found" title', (tester) async {
      await _setPhoneSize(tester);
      await tester.pumpWidget(_wrapError('post-bad', 'Network request failed'));
      await tester.pumpAndSettle(); // EmptyState has no looping animations — safe to settle

      expect(find.text('Post not found'), findsOneWidget);
    });

    testWidgets('shows retry button in error state', (tester) async {
      await _setPhoneSize(tester);
      await tester.pumpWidget(_wrapError('post-bad', 'Network request failed'));
      await tester.pumpAndSettle();

      expect(find.text('Try again'), findsOneWidget);
    });
  });
}
