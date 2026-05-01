# E5.8 — Tasks

> 5 tasks. Decisions: 4-icon share fallback, chrome polish, Web Push + OG-image deferred to M2.

| ID | Task | Files touched (new in **bold**) |
|----|------|--------------------------------|
| T1 | Audit (done in plan §1) | — |
| T2 | `<ShareButton>` v3 fallback — replace single-button popup with 4-icon row (WhatsApp / Twitter/X / Facebook / Copy). Native `navigator.share` still preferred when present. | [apps/web/src/components/social/share-button.tsx](apps/web/src/components/social/share-button.tsx) |
| T3 | v3 chrome polish on `/quests`, `/notifications`, `/saved` — coral kicker (var(--primary), 0.22em letter-spacing) + display H1 with italic accent. Pattern matches E5.6/E5.7. | [apps/web/src/app/quests/page.tsx](apps/web/src/app/quests/page.tsx), [apps/web/src/app/notifications/page.tsx](apps/web/src/app/notifications/page.tsx), [apps/web/src/app/saved/page.tsx](apps/web/src/app/saved/page.tsx) |
| T4 | 4-step review gate | [docs/epics/E5.8-gam-notif-saved-social-v3/tracking.md](docs/epics/E5.8-gam-notif-saved-social-v3/tracking.md) |
| T5 | Pre-commit + commit + push to `dev` | — |
