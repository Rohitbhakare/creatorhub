# Edge Case Review

Review current changes for missing edge cases.

## Instructions

1. Read the epic's `tasks.md` for the documented edge cases
2. Get the current diff: `git diff main...HEAD`
3. Review ALL changed files for uncovered edge cases:

### API Edge Cases
- [ ] Empty results return `[]` with 200, not 404
- [ ] Pagination with 0 results returns proper meta
- [ ] Concurrent requests handled (race conditions on seat holds, bookings)
- [ ] Duplicate submissions handled (idempotency keys where needed)
- [ ] Max limits enforced (5 images per post, 10 per experience, 1000 char text)
- [ ] Soft-deleted records excluded from queries
- [ ] Timezone handling (IST for all India dates)

### Mobile Edge Cases
- [ ] Empty states have illustration + title + description + CTA
- [ ] Loading states use skeleton shimmer (never spinner)
- [ ] Error states show actionable message with retry
- [ ] Offline behavior: graceful degradation, cached content, "You're offline" banner
- [ ] Keyboard dismisses on scroll
- [ ] Text overflow handled (ellipsis, maxLines)
- [ ] Image load failure shows placeholder
- [ ] Pull-to-refresh on all list screens
- [ ] Back navigation works correctly from every screen

### Business Logic Edge Cases
- [ ] Zero-price content handled (FREE badge, no payment flow)
- [ ] Minimum/maximum amounts handled (paisa edge cases)
- [ ] User booking their own experience blocked
- [ ] Creator without KYC blocked from publishing paid content
- [ ] Fully booked experience shows "Sold Out" not booking CTA
- [ ] Expired dates filtered from upcoming scheduled experiences

### Data Edge Cases
- [ ] Very long strings truncated/handled (200-char titles, 2000-char descriptions)
- [ ] Special characters in names, titles (unicode, emojis, RTL)
- [ ] Missing optional fields handled gracefully (null checks)
- [ ] Stale data on feed refresh
- [ ] Deep links to deleted/unpublished content → proper error

4. Report: covered, missing (must add), or deferred (acceptable for MVP)
5. For each missing case, specify where to add the handling
