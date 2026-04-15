# E1.8 — Studio Tab (Creator Dashboard)

> **SRS refs:** STUD-FR-001–004, DD-029, DD-034
> **Wireframe refs:** Screen 06 (Studio tab — new creator + established creator)
> **Depends on:** E0.3 (auth), E1.1 (content framework), E1.6 (profiles), E1.7 (social — follow counts)
> **Note:** Earnings card (STUD-FR-004) depends on E2.3 Payments — show placeholder/info card in M1.

---

## Market Research — Creator Dashboard UX Patterns

### YouTube Studio
- **Hero alert:** Shows most urgent action — "Your video is processing", "New copyright claim", "Milestone: 1000 subscribers!" Priority-ranked. Dismissible.
- **Stats overview:** Subscribers, watch time, views — last 28 days with trend arrows. Compact stat tiles.
- **Content list:** Sortable by date, views, comments. Status pills (Public, Draft, Unlisted). Thumbnail + title + stats.
- **Monetization card:** Estimated revenue, RPM, playback-based CPM. Separate tab.

### Instagram Professional Dashboard
- **Action items:** "Complete your profile", "Start a paid partnership", "Try Reels" — prioritized cards.
- **Account insights:** Reach, engagement, followers. Simple numbers, no complex charts in mobile.
- **Content list:** Grid with engagement overlays. Filter by type (Reels, Posts, Stories).

### Substack Dashboard
- **Stats:** Subscriber count, open rate, free vs paid. Clean typography, no charts.
- **Content list:** Posts with status (published, draft, scheduled). Quick edit actions.
- **Earnings:** Gross revenue, payout schedule, next payout.

### Best Practices for CreatorHub
1. **Priority-ranked contextual alerts** — YouTube Studio's approach is the gold standard. One hero alert at a time, dismissible, with clear CTA.
2. **Stats as tiles, not charts** — MVP keeps it simple (per SRS STUD-FR-003). Four tiles: Views, Saves, Bookings, Followers. Use formatCount() for large numbers.
3. **Content list with filter pills** — Instagram-style filter chips. Show status, type, engagement counts.
4. **Earnings as info card for M1** — Since payments (E2.3) aren't built yet, show an informational card explaining payouts are available when publishing paid content. Will transform into real earnings card in M2.
5. **Two states** — Empty (new creator) vs populated (established creator). Wireframe Screen 06 shows both.

---

## Architecture Overview

### API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/studio/alerts` | Required | Get highest-priority undismissed alert |
| PUT | `/api/v1/studio/alerts/:alertId/dismiss` | Required | Dismiss an alert |
| GET | `/api/v1/studio/stats` | Required | Get creator stats (views, saves, bookings, followers) |
| GET | `/api/v1/studio/content` | Required | List own content with filters (status, type) |

**Note:** Content list largely reuses existing `/api/v1/content/me/drafts` and content listing logic. Studio endpoint extends it with status filters (published, draft, archived) and engagement metrics.

### DB Tables (already exist)

- `studio_alerts` (migration 007) — id, user_id, alert_type, priority, payload (JSONB), cta_target, expires_at, dismissed_at
- `content` (migration 005) — has status, like_count, comment_count, save_count
- `users` (migration 002) — follower_count, following_count, content_count

### Alert Priority Engine

```
blocker (priority 100)      → KYC incomplete blocking publish
time_sensitive (priority 80) → Upcoming departure, expiring event
celebration (priority 60)    → First booking, milestone followers
activity (priority 40)       → New comments, new followers
quiet_state (priority 0)     → No alerts → show "Start your first piece" encouragement
```

Alerts are inserted by background processes (cron or event triggers — V1 complexity). For M1, we'll seed alerts when relevant actions happen:
- On first sign-up → insert "Get started" quiet_state alert
- Content publish → insert "celebration" alert
- Follow milestone (10, 50, 100) → insert celebration alert

---

## Task Breakdown

### T1 · Studio service (API)
**Files:** `apps/api/src/services/studio.service.ts`
**SRS:** STUD-FR-001, STUD-FR-002, STUD-FR-003

- `getTopAlert(userId)` — SELECT from studio_alerts WHERE user_id = ? AND dismissed_at IS NULL AND (expires_at IS NULL OR expires_at > now()) ORDER BY priority DESC LIMIT 1. If no alerts, return quiet_state default.
- `dismissAlert(userId, alertId)` — UPDATE studio_alerts SET dismissed_at = now() WHERE id = ? AND user_id = ?. Owner check.
- `getCreatorStats(userId)` — SELECT follower_count from users + aggregate content stats (total views, total saves, total bookings from content table).
- `listCreatorContent(userId, status?, type?, cursor, limit)` — SELECT from content WHERE user_id = ? with filters. Include engagement counts. Ordered by updated_at DESC. Cursor pagination.

**Tests:** ~12 tests

---

### T2 · Studio handlers + routes (API)
**Files:** `apps/api/src/handlers/studio.ts`, `apps/api/src/routes/studio.routes.ts`

- GET `/api/v1/studio/alerts` → getTopAlert
- PUT `/api/v1/studio/alerts/:alertId/dismiss` → dismissAlert
- GET `/api/v1/studio/stats` → getCreatorStats
- GET `/api/v1/studio/content?status=published&type=post&cursor=X&limit=20` → listCreatorContent

**Tests:** ~10 handler tests

---

### T3 · Studio tab screen — full implementation (Mobile)
**Files:** Replace `studio_placeholder_screen.dart` with `apps/mobile/lib/features/studio/screens/studio_tab_screen.dart`
**SRS:** STUD-FR-001–004, Screen 06

**Layout (from wireframe):**
1. **Top bar:** "Studio" title (Fraunces 22px) + notification bell + avatar
2. **Alert hero card:**
   - Blocker: red-tinted background (#FFF5F1 + #F8C2B0 border), coral circle icon, "Needs your attention" eyebrow
   - Quiet state: warm gray (#F2EEE8), pen icon, "Get started" eyebrow, "Start your first piece" title + body + Create CTA
   - Dismiss: X button, fires PUT dismiss
3. **Stats grid:** 4-column grid tiles (Views, Saves, Books, Followers). Fraunces 19px values. "—" for zero/null. "This week" section label.
4. **Content section:** "Your content" label + "+ Create" button. Filter chips: Published · N, Drafts · N, Archived. Content rows: 44px thumb + title + meta + price. Tap draft → resume wizard. Tap published → navigate to detail.
5. **Earnings card (M1 placeholder):** Info card style — "You only need to set up payouts when you publish paid content." Will be replaced by real earnings in E2.3.
6. **Empty state (new creator):** Dashed border card + document icon + "Nothing here yet" + "Drafts and published pieces show up here."

**Edge cases:**
- User with no content → show empty state + quiet hero
- User with drafts but no published → show draft filter active
- Alert dismissed → next priority alert shows (or quiet state)
- Pull-to-refresh → reload alerts + stats + content

---

### T4 · Studio providers (Mobile)
**Files:** `apps/mobile/lib/features/studio/providers/studio_provider.dart`

- `studioAlertProvider` — FutureProvider.autoDispose, GET /api/v1/studio/alerts
- `studioStatsProvider` — FutureProvider.autoDispose, GET /api/v1/studio/stats
- `studioContentProvider` — FutureProvider.autoDispose.family (with status filter), GET /api/v1/studio/content

**Models:**
- `StudioAlert` — alertType, priority, title (from payload), body, ctaTarget, id
- `StudioStats` — views, saves, bookings, followers
- `StudioContentItem` — id, title, type, status, coverUrl, price, likeCount, commentCount, updatedAt

---

### T5 · Wire into router + remove placeholder (Mobile)
**Files:** Update `router.dart`, delete `studio_placeholder_screen.dart`

- Replace Studio branch body from `StudioPlaceholderScreen` to `StudioTabScreen`.
- Add route: `/studio/content/:contentId` → navigate to appropriate detail screen.

---

### T6 · Tests
**Files:** `studio.service.test.ts`, `studio.test.ts` (handlers)

- Alert: get top, dismiss, no alerts returns quiet, expired alert excluded, priority ordering
- Stats: returns counts, user with no content
- Content list: filter by status, filter by type, pagination, empty result
- **Total: ~22 new API tests**

---

## Dependency Order

```
T1 (service) → T2 (handlers/routes) → T6 (tests) ─── API phase
T3 (screen) + T4 (providers) → T5 (router wiring) ── Mobile phase
```

API and Mobile phases can run in parallel after shared understanding of data models.

---

## UI/UX Specifications

### Alert Hero — Quiet State (New Creator)
```
┌────────────────────────────────────┐
│ [bg: #F2EEE8]                      │
│ ✏ GET STARTED                      │
│                                    │
│ Start your first piece             │
│ Post a short write-up or put       │
│ together your first itinerary.     │
│                                    │
│ [Create (coral)]  [See examples]   │
└────────────────────────────────────┘
```

### Alert Hero — Action Required
```
┌────────────────────────────────────┐
│ [bg: #FFF5F1, border: #F8C2B0]    │
│ [→coral] NEEDS YOUR ATTENTION     │
│                                    │
│ 2 new bookings today              │
│ Rohit and Priya booked Spiti...   │
│                                    │
│ ┌[avatar][avatar] Spiti · May 15 Open→┐│
│ └────────────────────────────────┘│
└────────────────────────────────────┘
```

### Stats Grid
```
┌────────┬────────┬────────┬────────┐
│ 2.3k   │  187   │  12    │  432   │
│ Views  │ Saves  │ Books  │ Follow │
└────────┴────────┴────────┴────────┘
```

### Content Row
```
┌───────────────────────────────────┐
│ [thumb] Spiti in seven days      │
│         Scheduled · 3 dates ₹24,999│
└───────────────────────────────────┘
```

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Views count not tracked yet (no analytics) | Show "—" for views in M1, wire when PostHog is integrated |
| Earnings card needs E2.3 (Payments) | Show info card placeholder in M1 |
| Alert insertion logic (when to create alerts) | Seed basic alerts on user actions; full event-driven system in V1 |

---

## Definition of Done

- [ ] Studio API: alerts, stats, content list endpoints working
- [ ] ~22 API tests passing
- [ ] Studio tab renders with alert hero (quiet + action states)
- [ ] Stats grid showing followers (other stats TBD until analytics)
- [ ] Content list with filter pills (Published/Drafts/Archived)
- [ ] Content tap → navigate to detail or wizard
- [ ] Earnings info card (placeholder)
- [ ] Empty state for new creator
- [ ] Placeholder screen removed
- [ ] `flutter analyze` 0 issues
- [ ] `tsc --noEmit` 0 errors
