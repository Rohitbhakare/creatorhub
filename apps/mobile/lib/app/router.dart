import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
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
import '../features/feed/screens/search_placeholder_screen.dart';
import '../features/studio/screens/studio_tab_screen.dart';
import '../features/profile/screens/you_tab_screen.dart';
import '../features/profile/screens/edit_profile_screen.dart';
import '../features/profile/screens/profile_view_screen.dart';
import '../features/kyc/screens/kyc_status_screen.dart';
import '../features/kyc/screens/kyc_wizard_screen.dart';
import '../features/notifications/screens/notification_preferences_screen.dart';
import '../features/saved/screens/saved_lists_screen.dart';
import '../features/saved/screens/saved_list_detail_screen.dart';
import '../features/experiences/screens/experience_detail_screen.dart';
import '../features/experiences/screens/create_experience_wizard.dart';
import '../features/reviews/screens/write_review_screen.dart';
import '../features/reviews/screens/review_detail_screen.dart';
import '../features/booking/screens/my_bookings_screen.dart';
import '../features/booking/screens/booking_detail_screen.dart';
import '../features/booking/screens/booking_confirmation_screen.dart';
import '../features/legal/screens/legal_screen.dart';
import '../features/settings/screens/privacy_settings_screen.dart';
import 'main_shell.dart';

/// Notifier that triggers GoRouter redirect re-evaluation when auth state changes.
class _AuthChangeNotifier extends ChangeNotifier {
  _AuthChangeNotifier(Ref ref) {
    ref.listen(authProvider, (_, __) {
      notifyListeners();
    });
  }
}

// GoRouter provider — created once, redirects re-evaluate via refreshListenable
final routerProvider = Provider<GoRouter>((ref) {
  final refreshNotifier = _AuthChangeNotifier(ref);

  return GoRouter(
    initialLocation: '/welcome',
    debugLogDiagnostics: false,
    refreshListenable: refreshNotifier,
    redirect: (context, state) {
      final authState = ref.read(authProvider);
      final isAuth = authState.isAuthenticated;
      final isGuest = authState.isGuest;
      final isLoading = authState.isLoading;
      final location = state.matchedLocation;
      final isOnAuthScreen = location == '/auth';
      final isOnWelcome = location == '/welcome';
      final isOnOnboarding = location.startsWith('/onboarding');
      final isOnContent = location.startsWith('/content');

      if (kDebugMode) {
        final onbComplete = authState.user?['onboarding_completed_at'];
        debugPrint('[Router] redirect: location=$location '
            'auth=${authState.status.name} '
            'onboarding_completed=${onbComplete != null}');
      }

      // Still loading — stay put
      if (isLoading) return null;

      // Content creation requires authentication (not guest)
      if (isOnContent && !isAuth) {
        if (kDebugMode) debugPrint('[Router] → /auth (content needs auth)');
        return '/auth';
      }

      // Not authenticated and not guest — redirect to welcome
      if (!isAuth && !isGuest && !isOnAuthScreen && !isOnWelcome) {
        if (kDebugMode) debugPrint('[Router] → /welcome (not authenticated)');
        return '/welcome';
      }

      // Authenticated — check onboarding completion
      if (isAuth && !isOnOnboarding) {
        final user = authState.user;
        final onboardingCompleted = user?['onboarding_completed_at'];
        if (onboardingCompleted == null) {
          if (!isOnAuthScreen && !isOnWelcome) {
            if (kDebugMode) debugPrint('[Router] → /onboarding/location (onboarding incomplete)');
            return '/onboarding/location';
          }
        }
      }

      // Authenticated or guest trying to go to auth or welcome — redirect home
      if ((isAuth || isGuest) && (isOnAuthScreen || isOnWelcome)) {
        if (isAuth) {
          final user = authState.user;
          final onboardingCompleted = user?['onboarding_completed_at'];
          if (onboardingCompleted == null) {
            if (kDebugMode) debugPrint('[Router] → /onboarding/location (from welcome/auth)');
            return '/onboarding/location';
          }
        }
        if (kDebugMode) debugPrint('[Router] → /home (already authed, go home)');
        return '/home';
      }

      if (kDebugMode) debugPrint('[Router] → no redirect');
      return null;
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

      // ── Main Tab Shell ────────────────────────────────────
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) {
          return MainShell(
            currentIndex: navigationShell.currentIndex,
            child: navigationShell,
            onTabTap: (index) {
              if (index == 2) {
                // Create+ tab — navigate to content picker instead of tab switch
                context.push('/content/create');
                return;
              }
              navigationShell.goBranch(
                index > 2 ? index - 1 : index, // Adjust for Create+ not being a real branch
                initialLocation: index == navigationShell.currentIndex,
              );
            },
          );
        },
        branches: [
          // Tab 0: Home
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/home',
                builder: (context, state) => const HomeFeedScreen(),
              ),
            ],
          ),
          // Tab 1: Search
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/search',
                builder: (context, state) => const SearchPlaceholderScreen(),
              ),
            ],
          ),
          // Tab 3: Studio (index 2 in branches, but tab index 3 — Create+ is virtual)
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/studio',
                builder: (context, state) => const StudioTabScreen(),
              ),
            ],
          ),
          // Tab 4: You (index 3 in branches)
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/you',
                builder: (context, state) => const YouTabScreen(),
              ),
            ],
          ),
        ],
      ),

      // ── Overlay routes (pushed on top of tabs) ────────────

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

      // Experiences
      GoRoute(
        path: '/experiences/create',
        builder: (context, state) => const CreateExperienceWizard(),
      ),
      GoRoute(
        path: '/experiences/:id',
        builder: (context, state) => ExperienceDetailScreen(
          id: state.pathParameters['id']!,
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

      // Profile
      GoRoute(
        path: '/profile/edit',
        builder: (context, state) => const EditProfileScreen(),
      ),
      GoRoute(
        path: '/profile/:id',
        builder: (context, state) => ProfileViewScreen(
          userId: state.pathParameters['id']!,
        ),
      ),

      // KYC
      GoRoute(
        path: '/kyc',
        builder: (context, state) => const KycStatusScreen(),
      ),
      GoRoute(
        path: '/kyc/wizard',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>?;
          final resubmit = extra?['resubmit'] as bool? ?? false;
          return KycWizardScreen(resubmit: resubmit);
        },
      ),

      // Notifications
      GoRoute(
        path: '/notifications/preferences',
        builder: (context, state) => const NotificationPreferencesScreen(),
      ),

      // Saved lists
      GoRoute(
        path: '/saved',
        builder: (context, state) => const SavedListsScreen(),
      ),
      GoRoute(
        path: '/saved/:listId',
        builder: (context, state) => SavedListDetailScreen(
          listId: state.pathParameters['listId']!,
        ),
      ),

      // Bookings
      GoRoute(
        path: '/bookings',
        builder: (context, state) => const MyBookingsScreen(),
      ),
      GoRoute(
        path: '/bookings/:id',
        builder: (context, state) => BookingDetailScreen(
          bookingId: state.pathParameters['id']!,
        ),
      ),
      GoRoute(
        path: '/bookings/:id/confirmed',
        builder: (context, state) => BookingConfirmationScreen(
          bookingId: state.pathParameters['id']!,
        ),
      ),

      // Reviews
      GoRoute(
        path: '/reviews/write/:bookingId',
        builder: (context, state) => WriteReviewScreen(
          bookingId: state.pathParameters['bookingId']!,
        ),
      ),
      GoRoute(
        path: '/reviews/:id',
        builder: (context, state) => ReviewDetailScreen(
          reviewId: state.pathParameters['id']!,
        ),
      ),

      // Privacy & Data (DPDPA)
      GoRoute(
        path: '/privacy-settings',
        builder: (context, state) => const PrivacySettingsScreen(),
      ),

      // Legal documents
      GoRoute(
        path: '/legal/:type',
        builder: (context, state) => LegalScreen(
          type: state.pathParameters['type']!,
        ),
      ),

      // Legacy root redirect
      GoRoute(
        path: '/',
        redirect: (_, __) => '/home',
      ),
    ],
  );
});
