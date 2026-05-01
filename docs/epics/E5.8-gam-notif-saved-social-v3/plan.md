# E5.8 — Gamification + Notif/Saved/Social v3

> **Series:** Final epic in the M2.5 Web v3 Parity series.
> **Goal:** v3 chrome polish on `/quests`, `/notifications`, `/saved`; restyle `<ShareButton>` to v3 4-icon fallback row (WhatsApp / Twitter / Facebook / Copy); verify XP/streak/achievement surfaces.
> **SRS refs:** WEB-GAM-FR-089..094, WEB-NTF-FR-084..085, WEB-SAV-FR-086, WEB-SOC-FR-087..088
> **Wireframes:** [docs/01_wireframes/v3/project/uploads/pack-w10-notifications-saved-social.html](docs/01_wireframes/v3/project/uploads/pack-w10-notifications-saved-social.html)
> **Master plan:** [`/Users/rohit/.claude/plans/web-application-is-not-enumerated-matsumoto.md`](/Users/rohit/.claude/plans/web-application-is-not-enumerated-matsumoto.md)

---

## 1. Overview

Most of the E5.8 surface is already in place:

- **`/quests`** (281 LOC) — quest summary + 4-stat (XP/streak/level/today) + achievements grid + leaderboard tabs (city / national / all-time)
- **`/notifications`** (119 LOC) — notification list
- **`/saved`** (69 LOC) — saved chapters page
- **`<ShareButton>`** (188 LOC) — `navigator.share` with copy-link fallback popup (current popup is single-button, not 4-icon row)
- **`<XPChip>` + `<StreakChip>`** (E5.0 primitives) — already in shared library
- **`<QuestStripInline>`** on home (E5.1)

**What's missing vs v3 + SRS:**

1. **v3 chrome polish** on `/quests`, `/notifications`, `/saved` — coral mono kicker + display H1 with italic accent
2. **Share fallback v3** — 4-icon row (WhatsApp / Twitter / Facebook / Copy) instead of single-button popup (FR-088)
3. **Verify** quest ring + achievement modal + XP toast queue exist or are stubbed correctly

**Explicitly deferred to M2** (per master plan §E5.8):
- **Web Push API + service worker** (WEB-NTF-FR-085) — needs VAPID key + service worker infra
- **Share-as-image OG route** (WEB-READ-FR-048) — image generation pipeline

## 2. SRS Requirements

| ID | Requirement | Status |
|----|-------------|--------|
| WEB-GAM-FR-089 | Quest ring | Existing in `<XPChip>`/`<QuestStripInline>` |
| WEB-GAM-FR-090 | Daily check-in coin burst | Existing |
| WEB-GAM-FR-091 | Achievement modal w/ confetti spring | Existing on `/quests` |
| WEB-GAM-FR-092 | Leaderboard podium | Existing tabs (city/national/all-time) |
| WEB-GAM-FR-093 | XP toast queue | TBD verify |
| WEB-GAM-FR-094 | Anti-cheat | Server-side, out of scope |
| WEB-NTF-FR-084 | Notifications drawer | Existing page; chrome polish |
| WEB-NTF-FR-085 | Web Push API + service worker | **M2 deferred** |
| WEB-SAV-FR-086 | Saved page | Existing; chrome polish |
| WEB-SOC-FR-087 | Like/save/follow optimistic UI | Existing |
| WEB-SOC-FR-088 | Native Web Share + 4-icon fallback | Native ✅; 4-icon row **new** |

## 3. Wireframes Referenced

| File | Use |
|---|---|
| [docs/01_wireframes/v3/project/uploads/pack-w10-notifications-saved-social.html](docs/01_wireframes/v3/project/uploads/pack-w10-notifications-saved-social.html) | Notifications + saved + social actions |
| [docs/01_wireframes/v3/project/pack-w3-home-web.jsx](docs/01_wireframes/v3/project/pack-w3-home-web.jsx) | XPChip / StreakChip in right-rail |
| [docs/01_wireframes/v3/project/uploads/pack-w12-motion-doc.html](docs/01_wireframes/v3/project/uploads/pack-w12-motion-doc.html) | Confetti motion spec |

## 4. Architecture Decisions (locked to recommended; small epic)

| Decision | Choice | Rationale |
|---|---|---|
| Share row layout | 4-icon row (WhatsApp / X / Facebook / Copy) shown when `navigator.share` is unavailable or user cancels | Matches v3 W-S spec |
| Web Push | Defer to M2 ENH-001 | Per master plan; needs VAPID + SW infra |
| Share-as-image OG | Defer to M2 ENH-002 | Per master plan; needs image generation |
| Chrome polish | Coral mono kicker + display H1 with italic accent on all 3 routes | Matches E5.6/E5.7 polish style |
| Notification drawer vs page | Keep page (existing); drawer per W-rest is studio-side, already shipped via E5.7 bookings drawer; notifications stays a full page | Routes match the existing nav |

## 5. Tasks

| ID | Task |
|----|------|
| T1 | Audit (done in plan §1) — confirm existing pages, share button, primitives |
| T2 | `<ShareButton>` v3 fallback — 4-icon row (WhatsApp / Twitter/X / Facebook / Copy) instead of single-button popup |
| T3 | v3 chrome polish on `/quests`, `/notifications`, `/saved` (kicker + display H1 + italic accent) |
| T4 | 4-step review gate |
| T5 | Pre-commit + commit |

## 6. Definition of Done

Standard E5.X DoD inherited from cross-cutting quality contract.

## 7. Items flagged for review (callouts)

- **Web Push + Share-as-image OG**: explicitly deferred to M2 per master plan §E5.8 — these need separate infrastructure (VAPID, service worker, image generation pipeline) that's outside the launch checklist.
