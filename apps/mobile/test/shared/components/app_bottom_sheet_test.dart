import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:creatorhub/shared/components/app_bottom_sheet.dart';

Widget _wrap(Widget child) => MaterialApp(home: Scaffold(body: child));

void main() {
  group('AppBottomSheet', () {
    testWidgets('renders title and child when passed', (tester) async {
      await tester.pumpWidget(_wrap(const AppBottomSheet(
        title: 'Filters',
        child: Text('body-content'),
      )));

      expect(find.text('Filters'), findsOneWidget);
      expect(find.text('body-content'), findsOneWidget);
    });

    testWidgets('shows a close button by default', (tester) async {
      await tester.pumpWidget(_wrap(const AppBottomSheet(
        title: 't',
        child: SizedBox.shrink(),
      )));

      expect(find.byIcon(Icons.close), findsOneWidget);
    });

    testWidgets('hides the close button when showCloseButton=false', (tester) async {
      await tester.pumpWidget(_wrap(const AppBottomSheet(
        title: 't',
        showCloseButton: false,
        child: SizedBox.shrink(),
      )));

      expect(find.byIcon(Icons.close), findsNothing);
    });

    testWidgets('tapping close button pops the navigator', (tester) async {
      await tester.pumpWidget(MaterialApp(
        home: Scaffold(
          body: Builder(
            builder: (context) => Center(
              child: ElevatedButton(
                onPressed: () => showAppBottomSheet(
                  context: context,
                  title: 'S',
                  builder: (_) => const Text('inside'),
                ),
                child: const Text('open'),
              ),
            ),
          ),
        ),
      ));

      await tester.tap(find.text('open'));
      await tester.pumpAndSettle();

      expect(find.text('inside'), findsOneWidget);

      await tester.tap(find.byIcon(Icons.close));
      await tester.pumpAndSettle();

      expect(find.text('inside'), findsNothing);
    });
  });

  group('showAppBottomSheet', () {
    testWidgets('presents the sheet, and returns the value passed to Navigator.pop',
        (tester) async {
      Future<String?>? returnFuture;

      await tester.pumpWidget(MaterialApp(
        home: Scaffold(
          body: Builder(
            builder: (context) => Center(
              child: ElevatedButton(
                onPressed: () {
                  returnFuture = showAppBottomSheet<String>(
                    context: context,
                    title: 'Pick',
                    builder: (sheetCtx) => ElevatedButton(
                      onPressed: () => Navigator.of(sheetCtx).pop('selected'),
                      child: const Text('pick-value'),
                    ),
                  );
                },
                child: const Text('open'),
              ),
            ),
          ),
        ),
      ));

      await tester.tap(find.text('open'));
      await tester.pumpAndSettle();

      await tester.tap(find.text('pick-value'));
      await tester.pumpAndSettle();

      expect(await returnFuture, 'selected');
    });
  });
}
