@auth @modal @web
Feature: Contextual sign-in modal
  Action buttons (Save, Like, Follow, Comment, Book) should open the
  contextual sign-in modal — not redirect to /signin.

  Background:
    Given I am browsing as a guest

  # Modal-click scenarios are tagged @known-issue while we settle the
  # dev-mode SSR-streaming hydration race — Playwright dispatches the
  # click before React binds onClick, so setRequest() never fires and
  # the modal stays closed. Reproduces only in next-dev + playwright;
  # production build + manual click works correctly.
  @known-issue @next-dev-hydration-race
  Scenario: Clicking Save on a content page opens the modal, not a redirect
    When I visit the content detail page for "content-001"
    And I click the "Save" button
    Then a sign-in modal should be visible
    And the modal should mention the title of the content
    And the URL should still be the content detail page

  @smoke
  Scenario: Pressing Esc closes the modal
    Given I have opened the sign-in modal from the Save button on "content-001"
    When I press Escape
    Then the sign-in modal should be hidden

  @smoke
  Scenario: Clicking the scrim closes the modal
    Given I have opened the sign-in modal from the Save button on "content-001"
    When I click outside the modal dialog
    Then the sign-in modal should be hidden

  @known-issue @next-dev-hydration-race
  Scenario: Clicking "Sign in to comment" stub opens the modal
    When I visit the content detail page for "content-001"
    And I click the "Sign in to comment" stub
    Then a sign-in modal should be visible
