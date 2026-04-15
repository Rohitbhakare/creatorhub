import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../features/auth/providers/auth_provider.dart';
import '../features/notifications/services/fcm_service.dart';
import '../shared/theme/app_theme.dart';
import 'router.dart';

class CreatorHubApp extends ConsumerWidget {
  const CreatorHubApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);

    // Initialize FCM once the user becomes authenticated.
    // ref.listen fires on every auth state change — FcmService.initialize
    // is idempotent so calling it more than once is safe.
    ref.listen<AuthState>(authProvider, (previous, next) {
      if (next.isAuthenticated) {
        final dio = ref.read(authServiceProvider).dio;
        FcmService.initialize(dio);
      }
      if (!next.isAuthenticated) {
        // Reset so FCM re-registers on the next login.
        FcmService.reset();
      }
    });

    // Set system UI overlay style
    SystemChrome.setSystemUIOverlayStyle(
      SystemUiOverlayStyle.dark.copyWith(
        statusBarColor: Colors.transparent,
      ),
    );

    return MaterialApp.router(
      title: 'CreatorHub',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      routerConfig: router,
    );
  }
}
