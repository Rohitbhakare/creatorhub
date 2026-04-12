import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../theme/colors.dart';
import '../theme/layout.dart';
import '../theme/spacing.dart';
import '../theme/animations.dart';
import '../theme/typography.dart' as typ;

/// Show an AppBottomSheet as a modal.
Future<T?> showAppBottomSheet<T>({
  required BuildContext context,
  required WidgetBuilder builder,
  String? title,
  bool isDismissible = true,
  bool enableDrag = true,
  bool showCloseButton = true,
  bool isScrollControlled = true,
}) {
  HapticFeedback.lightImpact();
  return showModalBottomSheet<T>(
    context: context,
    isScrollControlled: isScrollControlled,
    isDismissible: isDismissible,
    enableDrag: enableDrag,
    constraints: BoxConstraints(
      maxHeight:
          MediaQuery.of(context).size.height * Layout.sheetMaxHeightFactor,
    ),
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(
        top: Radius.circular(Layout.sheetRadius),
      ),
    ),
    builder: (context) => AppBottomSheet(
      title: title,
      showCloseButton: showCloseButton,
      child: builder(context),
    ),
  );
}

/// Bottom sheet wrapper with drag handle, title, close button.
class AppBottomSheet extends StatelessWidget {
  final String? title;
  final bool showCloseButton;
  final Widget child;

  const AppBottomSheet({
    super.key,
    this.title,
    this.showCloseButton = true,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: AnimatedPadding(
        duration: Anim.sheetDuration,
        curve: Anim.sheetCurve,
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Handle
            Padding(
              padding: const EdgeInsets.only(top: Spacing.lg),
              child: Container(
                width: Layout.sheetHandleWidth,
                height: Layout.sheetHandleHeight,
                decoration: BoxDecoration(
                  color: AppColors.line.withValues(alpha: 0.3),
                  borderRadius:
                      BorderRadius.circular(Layout.sheetHandleHeight / 2),
                ),
              ),
            ),

            // Title bar
            if (title != null || showCloseButton)
              Padding(
                padding: const EdgeInsets.fromLTRB(
                  Spacing.xl, Spacing.lg, Spacing.lg, Spacing.sm,
                ),
                child: Row(
                  children: [
                    if (title != null)
                      Expanded(
                        child: Text(title!, style: typ.AppTypography.h4),
                      ),
                    if (title == null) const Spacer(),
                    if (showCloseButton)
                      GestureDetector(
                        onTap: () {
                          HapticFeedback.lightImpact();
                          Navigator.of(context).pop();
                        },
                        child: Container(
                          width: 32,
                          height: 32,
                          decoration: const BoxDecoration(
                            color: AppColors.sunken,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.close,
                            size: 18,
                            color: AppColors.muted,
                          ),
                        ),
                      ),
                  ],
                ),
              ),

            // Content
            Flexible(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(
                  Spacing.xl, Spacing.sm, Spacing.xl, Spacing.xl,
                ),
                child: child,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
