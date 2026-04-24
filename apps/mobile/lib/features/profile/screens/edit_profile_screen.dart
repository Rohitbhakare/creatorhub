import 'dart:io';

import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import '../../../shared/theme/colors.dart';
import '../../../shared/theme/typography.dart';
import '../../../shared/components/avatar.dart';
import '../../auth/providers/auth_provider.dart';

/// Edit Profile screen — form with dirty-state detection.
/// Fields: display_name (required), bio (280 chars), email (optional), avatar (tap to change).
/// Username editing available only for creators (30-day cooldown).
class EditProfileScreen extends ConsumerStatefulWidget {
  const EditProfileScreen({super.key});

  @override
  ConsumerState<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends ConsumerState<EditProfileScreen> {
  late TextEditingController _nameController;
  late TextEditingController _bioController;
  late TextEditingController _emailController;
  late TextEditingController _usernameController;

  bool _isSaving = false;
  bool _isDirty = false;

  @override
  void initState() {
    super.initState();
    final user = ref.read(authProvider).user;
    _nameController = TextEditingController(text: user?['display_name'] as String? ?? '');
    _bioController = TextEditingController(text: user?['bio'] as String? ?? '');
    _emailController = TextEditingController(text: user?['email'] as String? ?? '');
    _usernameController = TextEditingController(text: user?['username'] as String? ?? '');

    _nameController.addListener(_markDirty);
    _bioController.addListener(_markDirty);
    _emailController.addListener(_markDirty);
  }

  void _markDirty() {
    if (!_isDirty) setState(() => _isDirty = true);
  }

  @override
  void dispose() {
    _nameController.dispose();
    _bioController.dispose();
    _emailController.dispose();
    _usernameController.dispose();
    super.dispose();
  }

  Future<bool> _onWillPop() async {
    if (!_isDirty) return true;
    final result = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text('Discard changes?', style: AppTypography.h4),
        content: Text(
          'You have unsaved changes. Are you sure you want to go back?',
          style: AppTypography.body.copyWith(color: AppColors.inkSoft),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: Text('Keep Editing', style: AppTypography.body.copyWith(color: AppColors.inkSoft)),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: Text('Discard', style: AppTypography.body.copyWith(color: AppColors.danger)),
          ),
        ],
      ),
    );
    return result ?? false;
  }

  Future<ImageSource?> _showImageSourceSheet() {
    return showModalBottomSheet<ImageSource>(
      context: context,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 12),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.hairlineStrong,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 8),
              ListTile(
                leading: Icon(PhosphorIcons.image(PhosphorIconsStyle.regular),
                    color: AppColors.ink),
                title: Text('Choose from library', style: AppTypography.body),
                onTap: () => Navigator.of(context).pop(ImageSource.gallery),
              ),
              ListTile(
                leading: Icon(PhosphorIcons.camera(PhosphorIconsStyle.regular),
                    color: AppColors.ink),
                title: Text('Take photo', style: AppTypography.body),
                onTap: () => Navigator.of(context).pop(ImageSource.camera),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _pickAndUploadAvatar() async {
    final source = await _showImageSourceSheet();
    if (source == null || !mounted) return;

    final picked = await ImagePicker()
        .pickImage(source: source, imageQuality: 85, maxWidth: 512, maxHeight: 512);
    if (picked == null || !mounted) return;

    setState(() => _isSaving = true);
    try {
      final dio = ref.read(authServiceProvider).dio;
      final fileName = 'avatar_${DateTime.now().millisecondsSinceEpoch}.jpg';

      // Get storage path from API
      final signedRes = await dio.post('/api/v1/media/signed-url', data: {
        'file_name': fileName,
        'content_type': 'image/jpeg',
        'purpose': 'avatar',
      });
      final signedData =
          (signedRes.data as Map<String, dynamic>)['data'] as Map<String, dynamic>;
      final uploadPath = signedData['upload_url'] as String;

      // Upload to Firebase Storage
      final storageRef = FirebaseStorage.instance.ref(uploadPath);
      await storageRef.putFile(
        File(picked.path),
        SettableMetadata(contentType: 'image/jpeg'),
      );
      final downloadUrl = await storageRef.getDownloadURL();

      // Persist to profile
      await dio.put('/api/v1/users/me', data: {'avatar_url': downloadUrl});

      // Refresh auth state
      final profileRes = await dio.get('/api/v1/users/me');
      final profileData = profileRes.data as Map<String, dynamic>;
      ref
          .read(authProvider.notifier)
          .updateUser(profileData['data'] as Map<String, dynamic>);
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to upload photo. Try again.')),
        );
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  Future<void> _save() async {
    final name = _nameController.text.trim();
    if (name.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Display name is required')),
      );
      return;
    }

    setState(() => _isSaving = true);

    try {
      final dio = ref.read(authServiceProvider).dio;
      final body = <String, dynamic>{};

      final user = ref.read(authProvider).user;
      if (name != (user?['display_name'] as String? ?? '')) body['display_name'] = name;

      final bio = _bioController.text.trim();
      if (bio != (user?['bio'] as String? ?? '')) body['bio'] = bio;

      final email = _emailController.text.trim();
      if (email.isNotEmpty && email != (user?['email'] as String? ?? '')) body['email'] = email;

      if (body.isEmpty) {
        if (mounted) context.pop();
        return;
      }

      await dio.put('/api/v1/users/me', data: body);

      // Refresh local auth state
      final profileRes = await dio.get('/api/v1/users/me');
      final profileData = profileRes.data as Map<String, dynamic>;
      ref.read(authProvider.notifier).updateUser(profileData['data'] as Map<String, dynamic>);

      _isDirty = false;
      if (mounted) context.pop();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to save profile. Try again.')),
        );
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider.select((s) => s.user));
    final isCreator = user?['is_creator'] as bool? ?? false;
    final avatarUrl = user?['avatar_url'] as String?;
    final displayName = user?['display_name'] as String? ?? '';

    return PopScope(
      canPop: !_isDirty,
      onPopInvokedWithResult: (didPop, _) async {
        if (didPop) return;
        final shouldPop = await _onWillPop();
        if (shouldPop && mounted) context.pop();
      },
      child: Scaffold(
        backgroundColor: AppColors.bg,
        appBar: AppBar(
          backgroundColor: AppColors.bg,
          elevation: 0,
          scrolledUnderElevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.close, color: AppColors.ink),
            onPressed: () async {
              if (_isDirty) {
                final shouldPop = await _onWillPop();
                if (!shouldPop || !mounted) return;
              }
              if (mounted) context.pop();
            },
          ),
          title: Text('Edit Profile', style: AppTypography.h4),
          centerTitle: true,
          actions: [
            TextButton(
              key: const Key('edit_profile_save'),
              onPressed: _isSaving ? null : _save,
              child: _isSaving
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.coral),
                    )
                  : Text(
                      'Save',
                      style: AppTypography.body.copyWith(
                        color: AppColors.coral,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
            ),
          ],
        ),
        body: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          child: Column(
            children: [
              // Avatar
              GestureDetector(
                onTap: () {
                  HapticFeedback.selectionClick();
                  _pickAndUploadAvatar();
                },
                child: Stack(
                  children: [
                    Container(
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(color: AppColors.hairline, width: 1.5),
                      ),
                      child: AppAvatar(
                        imageUrl: avatarUrl,
                        name: displayName.isNotEmpty ? displayName : '?',
                        size: 84,
                      ),
                    ),
                    Positioned(
                      bottom: 0,
                      right: 0,
                      child: Container(
                        width: 28,
                        height: 28,
                        decoration: BoxDecoration(
                          color: AppColors.coral,
                          shape: BoxShape.circle,
                          border: Border.all(color: AppColors.surface, width: 2),
                        ),
                        child: const Icon(
                          Icons.camera_alt_rounded,
                          size: 14,
                          color: AppColors.surface,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Display name
              _FormField(
                fieldKey: const ValueKey('edit_profile_display_name'),
                label: 'Display Name',
                controller: _nameController,
                maxLength: 50,
                isRequired: true,
              ),
              const SizedBox(height: 16),

              // Username (creator only)
              if (isCreator) ...[
                _FormField(
                  label: 'Username',
                  controller: _usernameController,
                  maxLength: 30,
                  enabled: false, // Username change is a separate flow
                  hint: 'Username changes have a 30-day cooldown',
                ),
                const SizedBox(height: 16),
              ],

              // Bio
              _FormField(
                label: 'Bio',
                controller: _bioController,
                maxLength: 280,
                maxLines: 4,
              ),
              const SizedBox(height: 16),

              // Email
              _FormField(
                label: 'Email',
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
              ),
            ],
          ),
        ),
      ),
    );
  }

}

class _FormField extends StatelessWidget {
  final String label;
  final TextEditingController controller;
  final int? maxLength;
  final int maxLines;
  final bool enabled;
  final bool isRequired;
  final String? hint;
  final TextInputType? keyboardType;
  final Key? fieldKey;

  const _FormField({
    required this.label,
    required this.controller,
    this.maxLength,
    this.maxLines = 1,
    this.enabled = true,
    this.isRequired = false,
    this.hint,
    this.keyboardType,
    this.fieldKey,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(
              label,
              style: AppTypography.label.copyWith(
                color: AppColors.inkSoft,
                letterSpacing: 0.3,
              ),
            ),
            if (isRequired)
              Text(' *', style: AppTypography.label.copyWith(color: AppColors.danger)),
          ],
        ),
        const SizedBox(height: 6),
        TextField(
          key: fieldKey,
          controller: controller,
          maxLength: maxLength,
          maxLines: maxLines,
          enabled: enabled,
          keyboardType: keyboardType,
          style: AppTypography.body.copyWith(color: enabled ? AppColors.ink : AppColors.inkMuted),
          decoration: InputDecoration(
            filled: true,
            fillColor: enabled ? AppColors.surface : AppColors.surfaceAlt,
            hintText: hint,
            hintStyle: AppTypography.bodySmall.copyWith(color: AppColors.inkMuted),
            counterStyle: AppTypography.caption,
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: AppColors.hairline),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: AppColors.hairline),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: AppColors.coral, width: 1.5),
            ),
            disabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: AppColors.hairline),
            ),
          ),
        ),
      ],
    );
  }
}
