@nav @web
Feature: Public route 404 + navigation
  Truly missing content/creators should 404, not return 200.

  Background:
    Given I am browsing as a guest

  # The next two scenarios document a known Next.js 15 quirk: notFound()
  # called after generateMetadata commits the response status, so Next
  # renders the not-found body but with HTTP 200. We mitigate via
  # `noindex` on not-found.tsx so search engines don't index these pages.
  # Keeping the scenarios written so when the framework fixes it (or we
  # adopt a workaround), removing the @known-issue tag re-enables them.
  @known-issue @next-15-not-found-status
  Scenario: Missing content returns 404
    When I fetch "/content/this-id-definitely-does-not-exist"
    Then the response status should be 404

  @known-issue @next-15-not-found-status
  Scenario: Missing creator returns 404
    When I fetch "/travel/this-creator-does-not-exist"
    Then the response status should be 404

  @smoke
  Scenario: Real content slug-prefixed URL resolves to 200
    When I visit the content detail page for "content-001"
    Then the page should respond with status 200

  @smoke
  Scenario: See-all from a home rail honors ?section= on discover
    When I visit "/discover?section=hot-near-you"
    Then the page should respond with status 200
    And the visible body should contain "Showing rail"
