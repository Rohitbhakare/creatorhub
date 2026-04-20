import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

/// Find the TextField inside an AppInput whose label matches [label].
///
/// AppInput renders its label as a sibling Text of the internal TextField
/// (both are children of a Column). `find.widgetWithText(TextField, label)`
/// fails because the label is not a descendant of the TextField. This helper
/// walks up to the nearest Column ancestor of the label Text, then finds the
/// TextField within it.
Finder findInputByLabel(String label) {
  final column = find
      .ancestor(
        of: find.text(label),
        matching: find.byType(Column),
      )
      .first;
  return find.descendant(of: column, matching: find.byType(TextField)).first;
}
