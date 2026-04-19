import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../features/auth/widgets/soft_auth_sheet.dart';

/// Legacy shim — delegates to the v2 [showSoftAuthSheet].
///
/// New call sites should use [showSoftAuthSheet] directly with a typed
/// [SoftAuthTrigger]. This helper stays to preserve existing callers in
/// `engagement_bar.dart` without a breaking signature change.
Future<bool> showSoftAuthWall(
  BuildContext context,
  WidgetRef ref,
  String actionDescription,
) {
  final trigger = _triggerFromDescription(actionDescription);
  return showSoftAuthSheet(context, ref, trigger: trigger);
}

SoftAuthTrigger _triggerFromDescription(String text) {
  final t = text.toLowerCase();
  if (t.contains('save')) return SoftAuthTrigger.save;
  if (t.contains('follow')) return SoftAuthTrigger.follow;
  if (t.contains('book')) return SoftAuthTrigger.book;
  if (t.contains('comment')) return SoftAuthTrigger.comment;
  return SoftAuthTrigger.like;
}
