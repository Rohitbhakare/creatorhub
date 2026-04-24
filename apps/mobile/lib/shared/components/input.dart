import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../theme/colors.dart';
import '../theme/layout.dart';
import '../theme/typography.dart' as typ;

/// Standard text input with label, helper text, error state.
///
/// When `maxLength` is set, a right-aligned character counter is rendered
/// below the field with threshold colors (muted → amber → danger). Set
/// `showCounter: false` to suppress it for fixed-length formats (PAN,
/// Aadhaar, IFSC, OTP) where the counter reads as noise.
class AppInput extends StatelessWidget {
  final TextEditingController? controller;
  final FocusNode? focusNode;
  final String? label;
  final String? hint;
  final String? helperText;
  final String? errorText;
  final bool enabled;
  final bool autofocus;
  final int maxLines;
  final int? maxLength;
  final bool showCounter;
  final TextInputType? keyboardType;
  final TextInputAction? textInputAction;
  final List<TextInputFormatter>? inputFormatters;
  final ValueChanged<String>? onChanged;
  final VoidCallback? onEditingComplete;
  final ValueChanged<String>? onSubmitted;
  final Widget? prefix;
  final Widget? suffix;
  final bool obscureText;

  /// Whether the field is read-only. When null (the default), the field
  /// auto-resolves to read-only if neither a `controller` nor `onChanged`
  /// is provided — enforcing SRS C-20's rule that every input must either
  /// capture typed text or declare itself display-only.
  final bool? readOnly;

  const AppInput({
    super.key,
    this.controller,
    this.focusNode,
    this.label,
    this.hint,
    this.helperText,
    this.errorText,
    this.enabled = true,
    this.autofocus = false,
    this.maxLines = 1,
    this.maxLength,
    this.showCounter = true,
    this.keyboardType,
    this.textInputAction,
    this.inputFormatters,
    this.onChanged,
    this.onEditingComplete,
    this.onSubmitted,
    this.prefix,
    this.suffix,
    this.obscureText = false,
    this.readOnly,
  });

  bool get _effectiveReadOnly =>
      readOnly ?? (controller == null && onChanged == null);

  bool get _shouldShowCounter =>
      maxLength != null && showCounter && controller != null;

  @override
  Widget build(BuildContext context) {
    return Opacity(
      opacity: enabled ? 1.0 : 0.4,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          if (label != null)
            Padding(
              padding: const EdgeInsets.only(bottom: 6),
              child: Text(label!, style: typ.AppTypography.bodySmall.copyWith(
                fontWeight: FontWeight.w600,
                color: AppColors.inkSoft,
              )),
            ),
          TextField(
            controller: controller,
            focusNode: focusNode,
            enabled: enabled,
            readOnly: _effectiveReadOnly,
            autofocus: autofocus,
            maxLines: maxLines,
            maxLength: maxLength,
            keyboardType: keyboardType,
            textInputAction: textInputAction,
            inputFormatters: inputFormatters,
            onChanged: onChanged,
            onEditingComplete: onEditingComplete,
            onSubmitted: onSubmitted,
            obscureText: obscureText,
            style: typ.AppTypography.body,
            decoration: InputDecoration(
              hintText: hint,
              prefixIcon: prefix,
              suffixIcon: suffix,
              errorText: errorText,
              helperText: helperText,
              counterText: '',
            ),
          ),
          if (_shouldShowCounter)
            _AppInputCounter(controller: controller!, max: maxLength!),
        ],
      ),
    );
  }
}

class _AppInputCounter extends StatelessWidget {
  final TextEditingController controller;
  final int max;

  const _AppInputCounter({required this.controller, required this.max});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 6),
      child: Align(
        alignment: Alignment.centerRight,
        child: ListenableBuilder(
          listenable: controller,
          builder: (_, _) {
            final current = controller.text.characters.length;
            final pct = max > 0 ? (current / max) * 100 : 0;
            final Color color;
            if (pct >= 100) {
              color = AppColors.danger;
            } else if (pct >= 85) {
              color = AppColors.warning;
            } else {
              color = AppColors.inkMuted;
            }
            return Text(
              '$current / $max',
              style: typ.AppTypography.caption.copyWith(color: color),
            );
          },
        ),
      ),
    );
  }
}

/// Search input with search icon, clear button, and debounced search.
class AppSearchInput extends StatefulWidget {
  final ValueChanged<String>? onSearch;
  final String hint;
  final Duration debounceDuration;
  final TextEditingController? controller;

  const AppSearchInput({
    super.key,
    this.onSearch,
    this.hint = 'Search...',
    this.debounceDuration = const Duration(milliseconds: 300),
    this.controller,
  });

  @override
  State<AppSearchInput> createState() => _AppSearchInputState();
}

class _AppSearchInputState extends State<AppSearchInput> {
  late final TextEditingController _controller;
  Timer? _debounce;

  @override
  void initState() {
    super.initState();
    _controller = widget.controller ?? TextEditingController();
  }

  @override
  void dispose() {
    _debounce?.cancel();
    if (widget.controller == null) _controller.dispose();
    super.dispose();
  }

  void _onChanged(String value) {
    _debounce?.cancel();
    _debounce = Timer(widget.debounceDuration, () {
      widget.onSearch?.call(value);
    });
    setState(() {}); // rebuild for clear button visibility
  }

  void _clear() {
    _controller.clear();
    widget.onSearch?.call('');
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: _controller,
      onChanged: _onChanged,
      style: typ.AppTypography.body,
      textInputAction: TextInputAction.search,
      decoration: InputDecoration(
        hintText: widget.hint,
        prefixIcon: const Icon(Icons.search, size: 20, color: AppColors.inkMuted),
        suffixIcon: _controller.text.isNotEmpty
            ? GestureDetector(
                onTap: _clear,
                child: const Icon(Icons.close, size: 18, color: AppColors.inkMuted),
              )
            : null,
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(Layout.inputRadius),
          borderSide: const BorderSide(color: AppColors.hairline),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(Layout.inputRadius),
          borderSide: const BorderSide(color: AppColors.hairline),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(Layout.inputRadius),
          borderSide: const BorderSide(color: AppColors.coral, width: 1.5),
        ),
        filled: true,
        fillColor: AppColors.surfaceAlt,
      ),
    );
  }
}
