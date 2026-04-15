@booking
Feature: Experience Booking
  As an authenticated traveler
  I want to book a paid experience
  So that I can participate in curated travel activities

  Background:
    Given the app is launched
    And I am logged in as booker

  @smoke @critical @razorpay
  Scenario: User successfully books a paid experience via Razorpay UPI
    Given I am on the experience detail screen for the seed experience
    And the experience is not fully booked
    When I tap "Book Now"
    Then I should see the booking confirmation sheet
    And I should see the price breakdown with base price, GST, and platform fee
    And I should see "UPI" as the default payment method
    When I tap "Pay Now"
    Then I should see the Razorpay payment screen
    When I enter UPI ID "success@razorpay"
    And I complete the Razorpay payment flow
    Then I should be on the booking confirmation screen
    And I should see "Booking Confirmed!"
    And I should see the booking ID

  @booking @capacity
  Scenario: User sees Sold Out state when experience is fully booked
    Given the seed experience is at full capacity
    When I am on the experience detail screen for the seed experience
    Then I should not see "Book Now"
    And I should see "Sold Out"

  @booking @my_bookings
  Scenario: User views their bookings list after booking
    Given I have an existing confirmed booking
    When I tap the "You" tab
    And I tap "My Bookings"
    Then I should be on the my bookings screen
    And I should see at least 1 booking card
    And the booking card should show the experience title
    And the booking card should show the booking status "Confirmed"
    When I tap the booking card
    Then I should be on the booking detail screen
    And I should see the experience name
    And I should see the experience date and time
    And I should see the creator's name and contact

  @booking @cancel
  Scenario: User cancels a booking before the experience date
    Given I have a cancellable booking for the seed experience
    When I navigate to that booking's detail screen
    And I tap "Cancel Booking"
    And I confirm cancellation
    Then the booking status should show "Cancelled"
    And I should see the refund policy message

  @booking @review @after_experience
  Scenario: User writes a review after an experience is completed
    Given I have a completed booking for the seed experience
    When I navigate to that booking's detail screen
    And I tap "Write a Review"
    Then I should be on the write review screen
    When I select rating "5 stars"
    And I enter review text "Absolutely magical. The guide was knowledgeable and the views were stunning."
    And I tap "Submit Review"
    Then I should see "Review submitted"
    And I should see the blind review notice "Your review will be revealed after 14 days or when the creator responds"
