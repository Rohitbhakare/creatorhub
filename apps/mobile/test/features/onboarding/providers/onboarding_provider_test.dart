import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:creatorhub/features/onboarding/providers/onboarding_provider.dart';

void main() {
  group('OnboardingState.canAdvance', () {
    test('step 1 (profile) requires username + available + firstName', () {
      const s = OnboardingState();
      expect(s.canAdvance, isFalse);

      expect(
        s.copyWith(username: 'rohit', usernameAvailable: false).canAdvance,
        isFalse,
      );
      expect(
        s
            .copyWith(
              username: 'rohit',
              usernameAvailable: true,
              firstName: 'Rohit',
            )
            .canAdvance,
        isTrue,
      );
      expect(
        s
            .copyWith(
              username: 'rohit',
              usernameAvailable: true,
              firstName: '   ',
            )
            .canAdvance,
        isFalse,
      );
    });

    test('step 2 (location) requires a selected city id and name', () {
      const s = OnboardingState(currentStep: 2);
      expect(s.canAdvance, isFalse);
      expect(
        s.copyWith(selectedCityId: 'mumbai', selectedCityName: 'Mumbai')
            .canAdvance,
        isTrue,
      );
    });

    test('step 3 (verticals) requires at least 3 selections', () {
      const s = OnboardingState(currentStep: 3);
      expect(s.canAdvance, isFalse);
      expect(
        s.copyWith(selectedVerticals: const ['travel', 'food']).canAdvance,
        isFalse,
      );
      expect(
        s.copyWith(
          selectedVerticals: const ['travel', 'food', 'culture'],
        ).canAdvance,
        isTrue,
      );
    });

    test('steps 4 & 5 always allow advance', () {
      expect(const OnboardingState(currentStep: 4).canAdvance, isTrue);
      expect(const OnboardingState(currentStep: 5).canAdvance, isTrue);
    });

    test('unknown step never allows advance', () {
      expect(const OnboardingState(currentStep: 42).canAdvance, isFalse);
    });
  });

  group('OnboardingNotifier', () {
    ProviderContainer container() => ProviderContainer();

    test('initial state is step 1, nothing selected', () {
      final c = container();
      addTearDown(c.dispose);
      final s = c.read(onboardingProvider);

      expect(s.currentStep, 1);
      expect(s.username, isNull);
      expect(s.selectedVerticals, isEmpty);
      expect(s.followedCreatorIds, isEmpty);
      expect(s.isCompleted, isFalse);
    });

    test('prefillFromOAuth sets firstName, email, and emailVerified=true', () {
      final c = container();
      addTearDown(c.dispose);

      c.read(onboardingProvider.notifier).prefillFromOAuth(
            firstName: 'Priya',
            email: 'p@example.com',
          );
      final s = c.read(onboardingProvider);
      expect(s.firstName, 'Priya');
      expect(s.email, 'p@example.com');
      expect(s.emailVerified, isTrue);
    });

    test('setUsername defaults usernameAvailable to false', () {
      final c = container();
      addTearDown(c.dispose);

      c.read(onboardingProvider.notifier).setUsername('r');
      expect(c.read(onboardingProvider).username, 'r');
      expect(c.read(onboardingProvider).usernameAvailable, isFalse);

      c.read(onboardingProvider.notifier).setUsername('rohit', available: true);
      expect(c.read(onboardingProvider).usernameAvailable, isTrue);
    });

    test('setEmail resets emailVerified to false', () {
      final c = container();
      addTearDown(c.dispose);

      c.read(onboardingProvider.notifier).markEmailVerified();
      expect(c.read(onboardingProvider).emailVerified, isTrue);

      c.read(onboardingProvider.notifier).setEmail('new@x.com');
      expect(c.read(onboardingProvider).emailVerified, isFalse);
    });

    test('setCity updates id + name', () {
      final c = container();
      addTearDown(c.dispose);

      c.read(onboardingProvider.notifier).setCity('mumbai', 'Mumbai');
      final s = c.read(onboardingProvider);
      expect(s.selectedCityId, 'mumbai');
      expect(s.selectedCityName, 'Mumbai');
    });

    test('setVerticals ignores lists shorter than 3', () {
      final c = container();
      addTearDown(c.dispose);

      c
          .read(onboardingProvider.notifier)
          .setVerticals(['travel', 'food']);
      expect(c.read(onboardingProvider).selectedVerticals, isEmpty);

      c
          .read(onboardingProvider.notifier)
          .setVerticals(['travel', 'food', 'culture']);
      expect(
        c.read(onboardingProvider).selectedVerticals,
        ['travel', 'food', 'culture'],
      );
    });

    test('toggleFollow adds then removes a creator id', () {
      final c = container();
      addTearDown(c.dispose);

      c.read(onboardingProvider.notifier).toggleFollow('creator-1');
      expect(c.read(onboardingProvider).followedCreatorIds, {'creator-1'});

      c.read(onboardingProvider.notifier).toggleFollow('creator-1');
      expect(c.read(onboardingProvider).followedCreatorIds, isEmpty);
    });

    test('advanceStep requires canAdvance and stops at 5', () {
      final c = container();
      addTearDown(c.dispose);

      // Step 1 cannot advance with empty profile.
      c.read(onboardingProvider.notifier).advanceStep();
      expect(c.read(onboardingProvider).currentStep, 1);

      c.read(onboardingProvider.notifier).setUsername('r', available: true);
      c.read(onboardingProvider.notifier).setFirstName('Rohit');
      c.read(onboardingProvider.notifier).advanceStep();
      expect(c.read(onboardingProvider).currentStep, 2);

      c.read(onboardingProvider.notifier).setCity('goa', 'Goa');
      c.read(onboardingProvider.notifier).advanceStep();
      expect(c.read(onboardingProvider).currentStep, 3);

      c
          .read(onboardingProvider.notifier)
          .setVerticals(['a', 'b', 'c']);
      c.read(onboardingProvider.notifier).advanceStep();
      expect(c.read(onboardingProvider).currentStep, 4);

      c.read(onboardingProvider.notifier).advanceStep();
      expect(c.read(onboardingProvider).currentStep, 5);

      // Already at 5: no further advance.
      c.read(onboardingProvider.notifier).advanceStep();
      expect(c.read(onboardingProvider).currentStep, 5);
    });

    test('goBack decrements, stopping at 1', () {
      final c = container();
      addTearDown(c.dispose);

      c.read(onboardingProvider.notifier).setCity('goa', 'Goa');
      // Force advance by setting profile first.
      c.read(onboardingProvider.notifier).setUsername('r', available: true);
      c.read(onboardingProvider.notifier).setFirstName('R');
      c.read(onboardingProvider.notifier).advanceStep(); // -> 2
      expect(c.read(onboardingProvider).currentStep, 2);

      c.read(onboardingProvider.notifier).goBack();
      expect(c.read(onboardingProvider).currentStep, 1);

      // Already at 1: no further back.
      c.read(onboardingProvider.notifier).goBack();
      expect(c.read(onboardingProvider).currentStep, 1);
    });

    test('completeOnboarding jumps to step 5 and flags isCompleted=true', () {
      final c = container();
      addTearDown(c.dispose);

      c.read(onboardingProvider.notifier).completeOnboarding();
      final s = c.read(onboardingProvider);
      expect(s.currentStep, 5);
      expect(s.isCompleted, isTrue);
    });
  });
}
