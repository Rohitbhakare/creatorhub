import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../features/auth/providers/auth_provider.dart';
import '../features/auth/screens/phone_otp_screen.dart';
import '../features/content/screens/content_type_picker_screen.dart';
import '../features/content/screens/wizard_shell_screen.dart';
import '../features/posts/screens/post_detail_screen.dart';
import '../features/events/screens/event_detail_screen.dart';
import '../features/itineraries/screens/itinerary_detail_screen.dart';
import '../features/onboarding/screens/welcome_screen.dart';
import '../features/onboarding/screens/location_screen.dart';
import '../features/onboarding/screens/vertical_picker_screen.dart';
import '../features/onboarding/screens/suggested_creators_screen.dart';
import '../features/onboarding/screens/celebration_screen.dart';
import '../features/feed/screens/home_feed_screen.dart';

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
      final location = state.matchedLocation;
      final isOnAuthScreen = location == '/auth';
      final isOnWelcome = location == '/welcome';
      final isOnOnboarding = location.startsWith('/onboarding');
      final isOnContent = location.startsWith('/content');

      // Still loading — stay put
      if (isLoading) return null;

      // Content creation requires authentication (not guest)
      if (isOnContent && !isAuth) {
        return '/auth';
      }

      // Not authenticated and not guest — redirect to welcome
      if (!isAuth && !isGuest && !isOnAuthScreen && !isOnWelcome) {
        return '/welcome';
      }

      // Authenticated — check onboarding completion
      if (isAuth && !isOnOnboarding) {
        final user = authState.user;
        final onboardingCompleted = user?['onboarding_completed_at'];
        if (onboardingCompleted == null) {
          // Onboarding not complete — redirect to location step
          // (unless already on auth/welcome, let them finish auth first)
          if (!isOnAuthScreen && !isOnWelcome) {
            return '/onboarding/location';
          }
        }
      }

      // Authenticated or guest trying to go to auth or welcome — redirect home
      if ((isAuth || isGuest) && (isOnAuthScreen || isOnWelcome)) {
        // If authenticated but onboarding not done, go to onboarding
        if (isAuth) {
          final user = authState.user;
          final onboardingCompleted = user?['onboarding_completed_at'];
          if (onboardingCompleted == null) {
            return '/onboarding/location';
          }
        }
        return '/';
      }

      return null; // No redirect
    },
    routes: [
      // Welcome
      GoRoute(
        path: '/welcome',
        builder: (context, state) => const WelcomeScreen(),
      ),

      // Auth
      GoRoute(
        path: '/auth',
        builder: (context, state) => const PhoneOtpScreen(),
      ),

      // Onboarding flow
      GoRoute(
        path: '/onboarding/location',
        builder: (context, state) => const LocationScreen(),
      ),
      GoRoute(
        path: '/onboarding/verticals',
        builder: (context, state) => const VerticalPickerScreen(),
      ),
      GoRoute(
        path: '/onboarding/creators',
        builder: (context, state) => const SuggestedCreatorsScreen(),
      ),
      GoRoute(
        path: '/onboarding/celebration',
        builder: (context, state) => const CelebrationScreen(),
      ),

      // Posts
      GoRoute(
        path: '/posts/:id',
        builder: (context, state) => PostDetailScreen(
          postId: state.pathParameters['id']!,
        ),
      ),

      // Itineraries
      GoRoute(
        path: '/itineraries/:id',
        builder: (context, state) => ItineraryDetailScreen(
          itineraryId: state.pathParameters['id']!,
        ),
      ),

      // Events
      GoRoute(
        path: '/events/:id',
        builder: (context, state) => EventDetailScreen(
          eventId: state.pathParameters['id']!,
        ),
      ),

      // Content creation
      GoRoute(
        path: '/content/create',
        builder: (context, state) => const ContentTypePickerScreen(),
      ),
      GoRoute(
        path: '/content/wizard',
        builder: (context, state) => const WizardShellScreen(),
      ),

      // Home feed
      GoRoute(
        path: '/',
        builder: (context, state) => const HomeFeedScreen(),
      ),
    ],
  );
});
