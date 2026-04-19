// @social — F05: Social Interactions  |  @saved — F08: Saved Lists
//
// Run with: patrol test --target integration_test/scenarios/social_scenarios.dart

import 'package:patrol/patrol.dart';

import '../hooks/global_hooks.dart';
import '../steps/auth_steps.dart';
import '../steps/content_steps.dart';
import '../steps/social_steps.dart';
import '../support/app_world.dart';

void socialScenarios() {
  // ── F05-S01: Authenticated user likes a post ──────────────────────────────
  patrolTest(
    'F05-S01: Authenticated user likes a post and like count increases',
    tags: ['social', 'smoke', 'critical'],
    ($) async {
      await beforeScenario($);
      final state = ScenarioState();
      await givenTheAppIsLaunched($);
      await givenIAmLoggedInAsTraveler($);
      await givenIAmOnSeedPostDetail($);

      await givenPostIsNotLiked($);
      await givenLikeCountRecorded($, state);
      await whenITapLikeButton($);
      await thenLikeButtonShouldBeActive($);
      await thenLikeCountIncreasedByOne($, state);
    },
  );

  // ── F05-S02: User can unlike a post ──────────────────────────────────────
  patrolTest(
    'F05-S02: User can unlike a post by tapping like again',
    tags: ['social', 'like', 'toggle'],
    ($) async {
      await beforeScenario($);
      await givenTheAppIsLaunched($);
      await givenIAmLoggedInAsTraveler($);
      await givenIAmOnSeedPostDetail($);

      await givenPostIsLiked($);
      await whenITapLikeButton($);
      await thenLikeButtonShouldBeInactive($);
    },
  );

  // ── F05-S03: User saves content to an existing list ───────────────────────
  patrolTest(
    'F05-S03: User saves content to an existing list',
    tags: ['social', 'save', 'critical'],
    ($) async {
      await beforeScenario($);
      await givenTheAppIsLaunched($);
      await givenIAmLoggedInAsTraveler($);
      await givenIAmOnSeedPostDetail($);

      await whenITapSaveButton($);
      await thenIShouldSeeSaveToListSheet($);
      await whenITapFirstListOption($);
      await whenITap($, 'Done');
      await thenSaveButtonShouldBeActive($);
    },
  );

  // ── F05-S04: User saves content to a new list ────────────────────────────
  patrolTest(
    'F05-S04: User saves content to a new list',
    tags: ['social', 'save', 'newlist'],
    ($) async {
      await beforeScenario($);
      await givenTheAppIsLaunched($);
      await givenIAmLoggedInAsTraveler($);
      await givenIAmOnSeedPostDetail($);

      await whenITapSaveButton($);
      await thenIShouldSeeSaveToListSheet($);
      await whenITapNewListButton($);
      await whenIEnterListName($, 'Bucket List');
      await whenITapCreateList($);
      // Sheet must still be open after creating the new list.
      await thenIShouldSeeSaveToListSheet($);
      await whenITap($, 'Done');
      await thenSaveButtonShouldBeActive($);
    },
  );

  // ── F05-S05: User follows a creator from post detail ──────────────────────
  patrolTest(
    'F05-S05: User follows a creator from their post detail',
    tags: ['social', 'follow', 'critical'],
    ($) async {
      await beforeScenario($);
      await givenTheAppIsLaunched($);
      await givenIAmLoggedInAsTraveler($);
      await givenIAmOnSeedPostDetail($);

      await givenIAmNotFollowingPostCreator($);
      await whenITap($, 'Follow');
      await thenButtonShouldShowFollowing($);
    },
  );

  // ── F05-S06: Share bottom sheet shows WhatsApp ───────────────────────────
  patrolTest(
    'F05-S06: User taps share and sees WhatsApp as first option',
    tags: ['social', 'share'],
    ($) async {
      await beforeScenario($);
      await givenTheAppIsLaunched($);
      await givenIAmLoggedInAsTraveler($);
      await givenIAmOnSeedPostDetail($);

      await whenITapShareButton($);
      await thenIShouldSeeShareBottomSheet($);
      await thenIShouldSee($, 'Copy link');
    },
  );
}

void main() => socialScenarios();
