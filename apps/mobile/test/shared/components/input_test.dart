import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:creatorhub/shared/components/input.dart';

Widget _wrap(Widget child) => MaterialApp(home: Scaffold(body: child));

void main() {
  group('AppInput', () {
    testWidgets('renders label text when provided', (tester) async {
      await tester.pumpWidget(_wrap(const AppInput(label: 'Email')));
      expect(find.text('Email'), findsOneWidget);
    });

    testWidgets('renders hint text on the underlying TextField', (tester) async {
      await tester.pumpWidget(
        _wrap(AppInput(
          hint: 'you@example.com',
          controller: TextEditingController(),
        )),
      );

      final textField = tester.widget<TextField>(find.byType(TextField));
      expect(textField.decoration?.hintText, 'you@example.com');
    });

    testWidgets('fires onChanged when text is typed', (tester) async {
      var value = '';
      await tester.pumpWidget(
        _wrap(AppInput(onChanged: (v) => value = v)),
      );

      await tester.enterText(find.byType(TextField), 'hello');
      expect(value, 'hello');
    });

    testWidgets('is read-only when neither controller nor onChanged are provided',
        (tester) async {
      await tester.pumpWidget(_wrap(const AppInput(hint: 'display only')));
      final textField = tester.widget<TextField>(find.byType(TextField));
      expect(textField.readOnly, true);
    });

    testWidgets('is editable when a controller is provided', (tester) async {
      await tester.pumpWidget(
        _wrap(AppInput(controller: TextEditingController())),
      );
      final textField = tester.widget<TextField>(find.byType(TextField));
      expect(textField.readOnly, false);
    });

    testWidgets('is editable when onChanged is provided', (tester) async {
      await tester.pumpWidget(
        _wrap(AppInput(onChanged: (_) {})),
      );
      final textField = tester.widget<TextField>(find.byType(TextField));
      expect(textField.readOnly, false);
    });

    testWidgets('honours explicit readOnly=true even with controller',
        (tester) async {
      await tester.pumpWidget(
        _wrap(AppInput(
          controller: TextEditingController(),
          readOnly: true,
        )),
      );
      final textField = tester.widget<TextField>(find.byType(TextField));
      expect(textField.readOnly, true);
    });

    testWidgets('disables the field when enabled=false', (tester) async {
      await tester.pumpWidget(
        _wrap(AppInput(
          controller: TextEditingController(),
          enabled: false,
        )),
      );
      final textField = tester.widget<TextField>(find.byType(TextField));
      expect(textField.enabled, false);
    });

    testWidgets('shows error text from errorText', (tester) async {
      await tester.pumpWidget(
        _wrap(AppInput(
          controller: TextEditingController(),
          errorText: 'Invalid email',
        )),
      );
      expect(find.text('Invalid email'), findsOneWidget);
    });

    testWidgets('enforces maxLength when provided', (tester) async {
      await tester.pumpWidget(
        _wrap(AppInput(
          controller: TextEditingController(),
          maxLength: 5,
        )),
      );
      final textField = tester.widget<TextField>(find.byType(TextField));
      expect(textField.maxLength, 5);
    });
  });

  group('AppSearchInput', () {
    testWidgets('renders hint text', (tester) async {
      await tester.pumpWidget(
        _wrap(const AppSearchInput(hint: 'Search cities')),
      );

      final textField = tester.widget<TextField>(find.byType(TextField));
      expect(textField.decoration?.hintText, 'Search cities');
    });

    testWidgets('fires onSearch after debounce window', (tester) async {
      var lastQuery = '';
      await tester.pumpWidget(
        _wrap(AppSearchInput(
          debounceDuration: const Duration(milliseconds: 50),
          onSearch: (q) => lastQuery = q,
        )),
      );

      await tester.enterText(find.byType(TextField), 'Mumbai');
      // Before debounce completes, the callback has not fired.
      expect(lastQuery, '');

      await tester.pump(const Duration(milliseconds: 60));
      expect(lastQuery, 'Mumbai');
    });

    testWidgets('shows clear (close) icon once text is typed', (tester) async {
      await tester.pumpWidget(_wrap(const AppSearchInput()));

      expect(find.byIcon(Icons.close), findsNothing);

      await tester.enterText(find.byType(TextField), 'abc');
      await tester.pump();

      expect(find.byIcon(Icons.close), findsOneWidget);
    });

    testWidgets('tapping the clear icon empties the field and fires onSearch("")',
        (tester) async {
      var lastQuery = 'non-empty';
      await tester.pumpWidget(
        _wrap(AppSearchInput(
          debounceDuration: const Duration(milliseconds: 10),
          onSearch: (q) => lastQuery = q,
        )),
      );

      await tester.enterText(find.byType(TextField), 'hello');
      await tester.pump(const Duration(milliseconds: 20));
      expect(lastQuery, 'hello');

      await tester.tap(find.byIcon(Icons.close));
      await tester.pump();

      expect(lastQuery, '');
      final field = tester.widget<TextField>(find.byType(TextField));
      expect(field.controller!.text, '');
    });
  });
}
