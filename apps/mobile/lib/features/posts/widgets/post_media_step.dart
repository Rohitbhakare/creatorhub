import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../content/providers/wizard_provider.dart';
import 'post_body_editor.dart';

/// Post media step — Step 2 of 3 in the post wizard.
///
/// Wraps [PostBodyEditor] and provides validation:
/// - Body must have at least 1 character
/// - At least 1 image must be selected
///
/// Note: validation errors are surfaced via [WizardState.validationErrors].
/// This widget simply renders the editor.
class PostMediaStep extends ConsumerWidget {
  const PostMediaStep({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Watch wizard state so we rebuild on changes
    ref.watch(wizardProvider);

    return const PostBodyEditor();
  }

  /// Static validation method — used by wizard state to check step 2.
  /// Body must have >= 1 character and at least 1 image selected.
  static List<String> validate(WizardState wizard) {
    return [
      if (wizard.body.trim().isEmpty) 'Post body is required',
      if (wizard.media.isEmpty) 'At least 1 image is required',
    ];
  }
}
