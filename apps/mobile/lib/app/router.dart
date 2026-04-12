import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../features/auth/providers/auth_provider.dart';
import '../features/auth/screens/phone_otp_screen.dart';

// GoRouter provider — rebuilds on auth state changes
final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);

  return GoRouter(
    initialLocation: '/',
    debugLogDiagnostics: false,
    redirect: (context, state) {
      final isAuth = authState.isAuthenticated;
      final isGuest = authState.isGuest;
      final isLoading = authState.isLoading;
      final isOnAuthScreen = state.matchedLocation == '/auth';

      // Still loading — stay put
      if (isLoading) return null;

      // Not authenticated and not guest — redirect to auth
      if (!isAuth && !isGuest && !isOnAuthScreen) return '/auth';

      // Authenticated or guest trying to go to auth — redirect to home
      if ((isAuth || isGuest) && isOnAuthScreen) return '/';

      return null; // No redirect
    },
    routes: [
      // Auth
      GoRoute(
        path: '/auth',
        builder: (context, state) => const PhoneOtpScreen(),
      ),

      // Main shell (placeholder until E0.5+ builds real screens)
      GoRoute(
        path: '/',
        builder: (context, state) => const _PlaceholderHome(),
      ),
    ],
  );
});

// Temporary placeholder until home feed is built
class _PlaceholderHome extends ConsumerWidget {
  const _PlaceholderHome();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final theme = Theme.of(context);

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('CreatorHub', style: theme.textTheme.displaySmall),
              const SizedBox(height: 8),
              Text(
                authState.isGuest ? 'Browsing as guest' : 'Welcome back!',
                style: theme.textTheme.bodyLarge?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
              if (authState.isGuest || authState.isAuthenticated) ...[
                const SizedBox(height: 24),
                TextButton(
                  onPressed: () => ref.read(authProvider.notifier).signOut(),
                  child: const Text('Sign out'),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
