# CLAUDE.md — Mobile (Flutter)

> Context for AI sessions working on the Flutter app. Read `.claude/instructions/ui-ux.md` before writing any UI code.

## What This App Is

The primary CreatorHub product — a Flutter app for iOS and Android. Mobile-first MVP.

## Stack

- **Flutter:** 3.41+ / Dart 3.x
- **State Management:** Riverpod (flutter_riverpod + riverpod_annotation)
- **Navigation:** GoRouter (declarative, deep links, auth guards)
- **Fonts:** google_fonts (Fraunces + Inter — never bundle fonts manually)
- **Images:** cached_network_image (blur placeholder hash required)
- **Icons:** phosphor_flutter
- **Animations:** flutter_animate
- **Secure Storage:** flutter_secure_storage (tokens, session)
- **HTTP:** dio (with auth interceptor that attaches Bearer token)

## Architecture

Feature-first folder structure:

```
lib/
├── features/
│   ├── auth/             # Phone OTP, Google/Apple, auth state
│   ├── onboarding/       # 5-step flow (location, verticals, creators, celebration)
│   ├── feed/             # Home feed, section-based
│   ├── content/          # Create/view posts, itineraries, experiences, events
│   ├── booking/          # Booking flow, payment, confirmation
│   ├── profile/          # View/edit profile, creator profile
│   ├── studio/           # Creator dashboard, earnings, content management
│   └── saved/            # Wishlists, saved lists
├── shared/
│   ├── components/       # Reusable widgets (Button, Card, Input, BottomSheet, Skeleton...)
│   ├── theme/            # colors.dart, typography.dart, spacing.dart, app_theme.dart, animations.dart
│   └── utils/            # formatPrice(), formatDuration(), formatDate()
└── app/
    ├── app.dart          # Root widget (ProviderScope → MaterialApp.router)
    ├── router.dart       # GoRouter config — all routes + auth redirect guards
    └── providers.dart    # Top-level Riverpod providers (auth, theme)
```

## Key Rules (from ui-ux.md)

- Coral `#E15A41` in exactly 8 contexts — never anywhere else
- Fraunces only for: display, H1, H2, post body text
- Skeleton shimmer for loading — NEVER spinner/ActivityIndicator
- SafeArea on every screen root
- 44dp minimum tap target
- Haptic feedback on all pressable elements
- `cached_network_image` with blur placeholder — never `Image.network`

## Running Locally

```bash
cd apps/mobile
flutter pub get
flutter run          # picks up connected device or simulator
flutter analyze      # must pass 0 errors, 0 warnings
```

## Bundle IDs

- iOS: `in.creatorhub.app`
- Android: `in.creatorhub.app`
