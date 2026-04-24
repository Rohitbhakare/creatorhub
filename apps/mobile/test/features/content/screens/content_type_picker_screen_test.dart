import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

import 'package:creatorhub/features/content/providers/wizard_provider.dart';
import 'package:creatorhub/features/content/screens/content_type_picker_screen.dart';
import 'package:creatorhub/features/content/services/daily_prompt_service.dart';

const _seededPrompt = DailyPrompt(
  text: 'Write about the last place that surprised you.',
  index: 0,
);

Future<void> _setPhoneSize(WidgetTester tester) async {
  tester.view.physicalSize = const Size(390 * 3.0, 844 * 3.0);
  tester.view.devicePixelRatio = 3.0;
  addTearDown(() {
    tester.view.resetPhysicalSize();
    tester.view.resetDevicePixelRatio();
  });
}

Widget _wrap({MediaQueryData? mediaQuery, List<String> navLog = const []}) {
  final router = GoRouter(
    initialLocation: '/create',
    routes: [
      GoRoute(
        path: '/create',
        builder: (_, _) => const ContentTypePickerScreen(),
      ),
      GoRoute(
        path: '/content/wizard',
        builder: (_, state) {
          final extra = state.extra as Map<String, dynamic>?;
          final type = extra?['type'] as String? ?? '';
          navLog.add(type);
          return Scaffold(body: Center(child: Text('WIZARD:$type')));
        },
      ),
    ],
  );

  final app = MaterialApp.router(routerConfig: router);
  final mediaWrapped = mediaQuery == null
      ? app
      : MediaQuery(data: mediaQuery, child: app);

  return ProviderScope(
    overrides: [
      dailyPromptProvider.overrideWith((ref) async => _seededPrompt),
    ],
    child: mediaWrapped,
  );
}

void main() {
  group('ContentTypePickerScreen', () {
    testWidgets('renders four tile titles and exact descriptors',
        (tester) async {
      await _setPhoneSize(tester);
      await tester.pumpWidget(_wrap());
      await tester.pumpAndSettle();

      expect(find.text('Post'), findsOneWidget);
      expect(find.text('Itinerary'), findsOneWidget);
      expect(find.text('Event'), findsOneWidget);
      expect(find.text('Experience'), findsOneWidget);

      expect(find.text('Share a story, photo, or moment'), findsOneWidget);
      expect(find.text('Plan a route others can follow'), findsOneWidget);
      expect(find.text('Host a meet-up or gathering'), findsOneWidget);
      expect(find.text('Lead a paid tour. Arriving soon.'), findsOneWidget);
    });

    testWidgets('renders editorial heading + section label + prompt',
        (tester) async {
      await _setPhoneSize(tester);
      await tester.pumpWidget(_wrap());
      await tester.pumpAndSettle();

      expect(find.text("TODAY'S PAGE"), findsOneWidget);
      expect(find.text('Every place holds a story.'), findsOneWidget);
      expect(find.text("Which one's yours today?"), findsOneWidget);
      expect(find.text('OR START SOMETHING NEW'), findsOneWidget);
      expect(find.text('NEED A NUDGE?'), findsOneWidget);
      expect(find.text(_seededPrompt.text), findsOneWidget);
    });

    testWidgets('removes legacy KYC badges and "Coming in M2" label',
        (tester) async {
      await _setPhoneSize(tester);
      await tester.pumpWidget(_wrap());
      await tester.pumpAndSettle();

      expect(find.text('No KYC needed'), findsNothing);
      expect(find.text('KYC needed for paid'), findsNothing);
      expect(find.text('Free events only'), findsNothing);
      expect(find.text('Coming in M2'), findsNothing);
    });

    testWidgets('Continue-drafting card is not rendered in v1',
        (tester) async {
      await _setPhoneSize(tester);
      await tester.pumpWidget(_wrap());
      await tester.pumpAndSettle();

      expect(find.textContaining('Draft ·'), findsNothing);
    });

    testWidgets('tapping Post tile navigates to the post wizard',
        (tester) async {
      final navLog = <String>[];
      await _setPhoneSize(tester);
      await tester.pumpWidget(_wrap(navLog: navLog));
      await tester.pumpAndSettle();

      await tester.tap(find.text('Post'));
      await tester.pumpAndSettle();

      expect(navLog, [ContentType.post.name]);
      expect(find.textContaining('WIZARD:'), findsOneWidget);
    });

    testWidgets('tapping Experience does NOT navigate', (tester) async {
      final navLog = <String>[];
      await _setPhoneSize(tester);
      await tester.pumpWidget(_wrap(navLog: navLog));
      await tester.pumpAndSettle();

      await tester.tap(find.text('Experience'));
      await tester.pumpAndSettle();

      expect(navLog, isEmpty);
      expect(find.text('Experience'), findsOneWidget);
    });

    testWidgets('tapping Notify me shows toast without navigation',
        (tester) async {
      final navLog = <String>[];
      await _setPhoneSize(tester);
      await tester.pumpWidget(_wrap(navLog: navLog));
      await tester.pumpAndSettle();

      await tester.tap(find.text('Notify me'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));

      expect(
        find.text("We'll let you know when Experiences launch"),
        findsOneWidget,
      );
      expect(navLog, isEmpty);
    });

    testWidgets('reduce-motion skips translate animation', (tester) async {
      await _setPhoneSize(tester);
      await tester.pumpWidget(_wrap(
        mediaQuery: const MediaQueryData(disableAnimations: true),
      ));
      await tester.pump(const Duration(milliseconds: 10));

      expect(find.text('Post'), findsOneWidget);
      expect(find.text('Experience'), findsOneWidget);
    });
  });
}
