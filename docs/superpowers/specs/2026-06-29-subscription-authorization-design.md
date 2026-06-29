# Subscription-Based Authorization — Design Spec

**Date:** 2026-06-29
**Status:** Approved (design); pending implementation plan
**Branch:** `feat/subscription-renewal-invoice` (or a dedicated `feat/subscription-gating`)

## 1. Problem

Students and parents currently reach gamified / progress features regardless of
subscription state. We need access to follow the subscription:

- A **student** whose subscription is **not active** (expired / pending / upcoming /
  cancelled) must **not**:
  - see the **leaderboard**,
  - see **badges / awards (الأوسمة)**,
  - **play any game**.
  - They **may still see the games list** (cards), but the cards are **locked**.
- A **parent** must **not see most of an inactive child's information** — specifically
  the child's **stats and achievements** are hidden, while the child's **identity,
  subscription status, certificates, and old reports remain visible** so renewal stays
  possible.
- **No redirect.** The reason is shown in place. For the **student** the lock is gentle
  and kid-appropriate (no billing/renew nag); the **clear, actionable "subscription
  expired — renew" message goes to the parent.**

## 2. Principles

1. **Subscription is a STATUS gate, orthogonal to role permissions.** This project
   derives permissions purely from role (`getPermissionsForRole`). Subscription gating is
   the 4th part of the authorization rule (auth + permission + scope + **status**), not a
   new permission code.
2. **Single source of truth for "active":** `activeSubscriptionWhere()` in
   `packages/shared/constants/enums.js` — `status === ACTIVE` **and**
   `startDate <= now <= endDate`. Everything else (PENDING / UPCOMING / EXPIRED /
   CANCELLED) is **not active**.
3. **ADMIN always bypasses** subscription gating (the teacher sees everything).
4. **Per-child scope:** a parent with an active child and an inactive child sees the
   active child normally and the inactive child locked.
5. **The free trial game stays playable for everyone**, including users with no active
   subscription (it is the marketing hook and already has a public, no-auth route).
6. **Defense in depth:** the backend enforces; the frontend surfaces capabilities so the
   UI locks without trial-and-error 403s, but never relies on UI hiding alone.

## 3. Backend Design

### 3.1 Reusable access guard

New module: `server/src/shared/access/subscriptionAccess.js`, built on the existing
`subscriptionRepo.getCurrentlySubscribedStudentIds(studentIds)` (single source, no new
query logic):

- `hasActiveSubscription(studentId): Promise<boolean>`
- `assertActiveForStudent(studentId): Promise<void>` — throws
  `AppError({ statusCode: 403, code: SUBSCRIPTION_INACTIVE, translationKey: messagesNames.subscriptionMessages, dontRedirect: true })`
  when not active.
- `filterActiveStudentIds(studentIds): Promise<number[]>` — for parent multi-child
  views.

`dontRedirect` is already the `AppError` default; it is set explicitly here for clarity.

### 3.2 Message code

Add to `packages/shared/messages-codes/subscription.js`:

```js
SUBSCRIPTION_INACTIVE: "SUBSCRIPTION_INACTIVE",
```

Add Arabic + English strings under `messagesNames.subscriptionMessages` in
`web/src/i18n/locales/messagesCodes.js`. The localized string is the **parent-facing**
wording (clear + actionable). The student never renders this raw message — the student
locked state is a dedicated kid component (see 4.1).

### 3.3 Enforcement points

| Feature | Endpoint | Rule |
|---|---|---|
| **Leaderboard** | `GET /points/leaderboard` | If `req.auth.role === STUDENT` and not active → 403 `SUBSCRIPTION_INACTIVE`. ADMIN/PARENT viewing the board unaffected. |
| **Student badges/rewards** | `GET /rewards`, `GET /badges/student/:studentId` (self) | Student not active → blocked. Parent viewing a child → governed by 3.4 (achievements hidden for inactive child). |
| **Games list** | `GET /games/my/assignments` | **Not blocked.** Each item gains `locked: boolean` (true when the requesting student is inactive and the game is not the free game). |
| **Free game** | `GET /games/my/free`, `GET /games/public/:slug` | Always accessible. |
| **Play (fetch)** | `GET /games/by-slug/:slug` | Student not active **and** game is not the free game → 403 `SUBSCRIPTION_INACTIVE`. |
| **Play (submit)** | `POST /games/:id/attempt` | Same rule as play-fetch. |
| **Parent dashboard** | `GET /dashboard/parent` | See 3.4. |
| **Child detail tabs** | `GET /users/:userId/overview` (+ badges/games tabs) | See 3.4. |

### 3.4 Parent / child-detail gating ("hide stats & achievements only")

For an **inactive child**, the parent-facing responses:

- **Hidden (nulled / 403):** points, level, rank, badgeCount, the **badges** list, the
  **games** tab/progress, the **overview stats** block.
- **Kept visible:** child identity (id, name, nickname), `activeSubscription` (null) +
  an explicit `isActive: false`, **certificates**, and **old reports/evaluations**.

Implementation:

- `dashboard.usecase.parent()`: for each child compute `isActive`; when false, null out
  the stat/achievement fields but keep identity + subscription state. Recent
  certificates / reports aggregates remain.
- The child-detail scope checkers (`badge.usecase.assertCanAccess`, the games tab
  usecase, the overview-stats usecase) gain a status check: a parent (or the student)
  may not read the **achievement/stats** category for an inactive child → throw
  `SUBSCRIPTION_INACTIVE`. The **certificates** and **reports** read paths are NOT
  status-gated.

### 3.5 Capabilities surfaced to the client

- `GET /auth/me` (`req.auth`): add `hasActiveSubscription: boolean` **for STUDENT**
  accounts.
- Game list items: `locked: boolean`.
- Parent dashboard children: explicit `isActive: boolean` per child (stats nulled when
  false).

## 4. Frontend Design

### 4.1 Reusable component

`<SubscriptionLockedState variant="student" | "parent" feature=... onRenew? />`:

- **student** variant: gentle, kid-appropriate lock (🔒 + e.g. «القسم ده مقفول دلوقتي —
  كلّم بابا أو ماما»). **No billing details, no renew CTA.**
- **parent** variant: clear, actionable — «اشتراك {اسم الطفل} منتهي — جدّد للوصول» + a
  **renew CTA** linking into the existing renew/change-plan flow.

### 4.2 Application

- **Student, inactive:**
  - Hide leaderboard + badges links from the dashboard nav (`NavbarDrawer` / dashboard
    nav). If navigated directly, the page renders the **student locked state** (no
    redirect).
  - `LeaderboardPage`, `BadgesPage`: gate on `hasActiveSubscription`; render student
    locked state instead of fetching.
  - `MyGamesPage`: still render the list; show a **lock overlay** on locked `GameCard`s;
    tapping a locked card → student locked state (no navigation). The **free game card is
    not locked**.
  - `GamePlayPage`: if the game is locked (and not free) → student locked state instead
    of `GamePlayer`.
- **Parent, per inactive child:**
  - `ParentOverview` child card: identity + subscription status + **renew CTA** + clear
    parent message; the child's points/level/rank/badges are hidden.
  - `UserDetailPage` (parent viewing child): `overview` / `badges` / `games` tabs render
    the **parent locked state**; `certificates` and `reports/evaluations` tabs stay
    accessible.
  - `ChildrenPage`: renew / change-plan actions stay available.

### 4.3 i18n

Add ar/en for `SUBSCRIPTION_INACTIVE` and the locked-state copy (student gentle + parent
clear) in `web/src/i18n/locales/`.

## 5. Out of Scope

- Changing how subscriptions are created/renewed/approved (already implemented).
- New permission codes or role-profile changes (gating is status-based, not
  permission-based).
- Admin experience (admin bypasses all gating).
- Session lessons (حصص) gating — not requested here.

## 6. Affected Areas (reference)

**Backend:** `packages/shared/messages-codes/subscription.js`,
`server/src/shared/access/subscriptionAccess.js` (new),
`server/src/modules/points/*`, `server/src/modules/badges/*`,
`server/src/modules/rewards/*`, `server/src/modules/games/*`,
`server/src/modules/dashboard/*`, `server/src/modules/auth/auth.controller.js`
(`/auth/me`).

**Frontend:** `web/src/i18n/locales/messagesCodes.js`,
a new `SubscriptionLockedState` component,
`web/src/features/leaderboard/*`, `web/src/features/badges/*`,
`web/src/features/games/*` (`MyGamesPage`, `GameCard`, `GamePlayPage`),
`web/src/features/dashboard/components/ParentOverview.jsx`,
`web/src/features/children/*`, `web/src/features/userDetail/*`,
dashboard nav (`NavbarDrawer` / dashboard nav).

## 7. Testing

- Usecase tests for `subscriptionAccess` (active vs each inactive status, boundary
  dates).
- Authorization tests: inactive student blocked on leaderboard / badges / play / submit;
  free game still playable; ADMIN bypass; parent sees active child but not inactive
  child's stats/achievements while certificates/reports remain.
- Frontend: locked states render for the right role/variant without redirect; free game
  card remains unlocked.
