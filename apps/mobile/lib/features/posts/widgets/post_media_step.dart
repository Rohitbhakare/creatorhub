import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../content/providers/wizard_provider.dart';
import 'post_body_editor.dart';

/// Post media step — Step 2 of 3 in the post wizard.
///
/// Wraps [PostBodyEditor]. Body is required (validated on step 1); media
/// attachments are optional — text-only posts are a first-class format.
class PostMediaStep extends ConsumerWidget {
  const PostMediaStep({super.key, required this.ensureDraft});

  final Future<void> Function() ensureDraft;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ref.watch(wizardProvider);
    return PostBodyEditor(ensureDraft: ensureDraft);
  }
}
