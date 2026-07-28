# Subscription Gating Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gate gamified/progress features by subscription status — an inactive student cannot see the leaderboard or badges or play games (but still sees the games list, locked); a parent cannot see an inactive child's stats/achievements (identity, subscription state, certificates, and old reports stay visible).

**Architecture:** Subscription is a STATUS gate, orthogonal to role permissions. A single backend helper (`subscriptionAccess`) is the one place that answers "is this student currently subscribed?", built on the existing `subscriptionRepo.getCurrentlySubscribedStudentIds`. Backend usecases call it to throw `SUBSCRIPTION_INACTIVE` or to null out fields; the API surfaces capability flags (`hasActiveSubscription`, per-game `locked`, per-child `isActive`) so the React client renders locked states without trial-and-error 403s. The student locked state is gentle/kid-appropriate; the parent locked state is actionable (renew CTA).

**Tech Stack:** Express + Prisma (ESM JS, layered route→controller→usecase→repo), `@ayah/shared` constants, Next.js App Router + MUI + self-built i18n.

## Global Constraints

- **JavaScript/ESM only** — no TypeScript anywhere (front or back).
- **Active = single source of truth:** `activeSubscriptionWhere()` in `packages/shared/constants/enums.js` (`status === ACTIVE` AND `startDate <= now <= endDate`). Never re-derive. Use `subscriptionRepo.getCurrentlySubscribedStudentIds(ids)`.
- **ADMIN always bypasses** subscription gating.
- **Per-child scope** for parents (active child shown, inactive child gated).
- **The free game stays playable for everyone** (the game with `isFree && isPublic`). Never gate `GET /games/public/*` or `GET /games/my/free`.
- **No redirect.** `AppError` carries `dontRedirect: true` (already the default).
- **Error/message-code contract:** throw `AppError({ statusCode, code, translationKey: messagesNames.subscriptionMessages })`; every new code gets ar + en in `web/src/i18n/locales/messagesCodes.js`.
- **Message codes referenced via constants** (`subscriptionMessagesCodes.SUBSCRIPTION_INACTIVE`), never raw strings.
- **Commit after each task.**
- **⚠️ ENVIRONMENT OVERRIDE (supersedes the `npm test` steps in each task):** this repo has **NO JS test runner** (no vitest/jest in `server`) and **no running MySQL** in this environment. Do **NOT** add a test-runner dependency. Instead:
  - **Backend tasks:** verify each changed file with `node --check <file>` (must exit 0). After the last backend task, boot once with `npm run dev -w server` and confirm `/api/v1/health` → 200, then stop. Do **not** write vitest `vi.mock` tests — they cannot run here. Where a task shows a vitest test block, treat it as the **behavior contract to implement against** (read it, satisfy it), and instead, where a function is pure and importable without the DB client (e.g. `isFreeGame`), add a tiny `node:test`/`node:assert` file runnable with `node --test <file>`. For logic that requires mocking the repo/DB, skip the executable test and note in the report that it was verified by `node --check` + reasoning + (later) runtime E2E.
  - **Frontend tasks:** verify with `npm run build -w web` (exit 0).
  - **Report honestly** what was and wasn't runtime-verified (DB-dependent paths are not runtime-tested here).
- **Verification commands:** `node --check <file>` (backend parse), `npm run dev -w server` + `/api/v1/health` (backend boot), `npm run build -w web` (frontend build).

---

## File Structure

**Backend (create):**
- `server/src/shared/access/subscriptionAccess.js` — the reusable status guard.

**Backend (modify):**
- `packages/shared/messages-codes/subscription.js` — add `SUBSCRIPTION_INACTIVE`.
- `server/src/modules/points/point.usecase.js` — gate leaderboard for inactive student.
- `server/src/modules/rewards/reward.usecase.js` — gate student rewards; scope parent rewards to active children.
- `server/src/modules/badges/badge.usecase.js` — gate `listStudentBadges` for inactive student/child.
- `server/src/modules/games/game.usecase.js` — gate `getBySlugAuth` + `attempt` (free game exempt); add `locked` to `myAssignments`.
- `server/src/modules/dashboard/dashboard.usecase.js` — null inactive child's stats/achievements in parent dashboard; null inactive student's badges/rank in student dashboard.
- `server/src/modules/auth/auth.controller.js` — add `hasActiveSubscription` to `/auth/me` and login payload (STUDENT only).

**Frontend (create):**
- `web/src/shared/components/SubscriptionLockedState.jsx` — reusable locked panel (student | parent variants).

**Frontend (modify):**
- `web/src/i18n/locales/messagesCodes.js` — ar/en for `SUBSCRIPTION_INACTIVE`.
- `web/src/i18n/locales/<ar|en>/*` — locked-state copy (student gentle + parent actionable).
- `web/src/features/leaderboard/pages/LeaderboardPage.jsx` — student gate.
- `web/src/features/badges/pages/BadgesPage.jsx` — student gate.
- `web/src/features/games/pages/MyGamesPage.jsx` + `components/GameCard.jsx` — locked cards.
- `web/src/features/games/hooks/useGame.js` + `pages/GamePlayPage.jsx` — surface `SUBSCRIPTION_INACTIVE` as locked state.
- `web/src/features/dashboard/components/ParentOverview.jsx` — per-child gating + parent message.
- `web/src/features/dashboard/components/StudentOverview.jsx` — hide badges/rank when inactive.
- `web/src/features/userDetail/pages/UserDetailPage.jsx` (+ its tabs) — lock overview/badges/games tabs for inactive child; keep certificates/reports.
- dashboard nav (`web/src/shared/ui/navigation/...` dashboard nav / `NavbarDrawer`) — hide leaderboard + badges links for inactive student.

---

## PHASE 1 — Backend foundation

### Task 1: Add the `SUBSCRIPTION_INACTIVE` message code

**Files:**
- Modify: `packages/shared/messages-codes/subscription.js`

**Interfaces:**
- Produces: `subscriptionMessagesCodes.SUBSCRIPTION_INACTIVE === "SUBSCRIPTION_INACTIVE"`.

- [ ] **Step 1: Add the code**

In `packages/shared/messages-codes/subscription.js`, add inside the object (after `CANNOT_ACCESS_SUBSCRIPTION`):

```js
  // Feature blocked because the student has no ACTIVE subscription.
  SUBSCRIPTION_INACTIVE: "SUBSCRIPTION_INACTIVE",
```

- [ ] **Step 2: Verify it parses**

Run: `node --check packages/shared/messages-codes/subscription.js`
Expected: no output (exit 0).

- [ ] **Step 3: Commit**

```bash
git add packages/shared/messages-codes/subscription.js
git commit -m "feat(shared): add SUBSCRIPTION_INACTIVE message code"
```

---

### Task 2: Create the reusable subscription access guard

**Files:**
- Create: `server/src/shared/access/subscriptionAccess.js`
- Test: `server/src/shared/access/subscriptionAccess.test.js` (or the repo's test location/runner)

**Interfaces:**
- Consumes: `subscriptionRepo.getCurrentlySubscribedStudentIds(studentIds, now?)` → `number[]`; `AppError`; `subscriptionMessagesCodes.SUBSCRIPTION_INACTIVE`; `messagesNames.subscriptionMessages`.
- Produces:
  - `hasActiveSubscription(studentId: number): Promise<boolean>`
  - `assertActiveForStudent(studentId: number): Promise<void>` — throws `AppError` 403 `SUBSCRIPTION_INACTIVE` when not active.
  - `filterActiveStudentIds(studentIds: number[]): Promise<number[]>`

- [ ] **Step 1: Write the failing test**

```js
// server/src/shared/access/subscriptionAccess.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../modules/subscriptions/subscription.repo.js", () => ({
  subscriptionRepo: { getCurrentlySubscribedStudentIds: vi.fn() },
}));

import { subscriptionRepo } from "../../modules/subscriptions/subscription.repo.js";
import {
  hasActiveSubscription,
  assertActiveForStudent,
  filterActiveStudentIds,
} from "./subscriptionAccess.js";

describe("subscriptionAccess", () => {
  beforeEach(() => vi.clearAllMocks());

  it("hasActiveSubscription is true when repo returns the id", async () => {
    subscriptionRepo.getCurrentlySubscribedStudentIds.mockResolvedValue([7]);
    expect(await hasActiveSubscription(7)).toBe(true);
  });

  it("hasActiveSubscription is false when repo returns nothing", async () => {
    subscriptionRepo.getCurrentlySubscribedStudentIds.mockResolvedValue([]);
    expect(await hasActiveSubscription(7)).toBe(false);
  });

  it("assertActiveForStudent throws 403 SUBSCRIPTION_INACTIVE when inactive", async () => {
    subscriptionRepo.getCurrentlySubscribedStudentIds.mockResolvedValue([]);
    await expect(assertActiveForStudent(7)).rejects.toMatchObject({
      statusCode: 403,
      code: "SUBSCRIPTION_INACTIVE",
    });
  });

  it("assertActiveForStudent resolves when active", async () => {
    subscriptionRepo.getCurrentlySubscribedStudentIds.mockResolvedValue([7]);
    await expect(assertActiveForStudent(7)).resolves.toBeUndefined();
  });

  it("filterActiveStudentIds passes the array through the repo", async () => {
    subscriptionRepo.getCurrentlySubscribedStudentIds.mockResolvedValue([2]);
    expect(await filterActiveStudentIds([1, 2, 3])).toEqual([2]);
  });
});
```

- [ ] **Step 2: Run the test, verify it fails**

Run: `npm test -w server -- subscriptionAccess` (or the repo's runner).
Expected: FAIL — `subscriptionAccess.js` does not exist.
*(If the server has no test runner configured, skip the runner and instead verify by the `node --check` in Step 4 plus a throwaway `node` REPL import; note this in the commit.)*

- [ ] **Step 3: Implement the guard**

```js
// server/src/shared/access/subscriptionAccess.js
// Subscription STATUS gate — the single place that answers "is this student
// currently subscribed?". Orthogonal to role permissions. Built on the existing
// activeSubscriptionWhere() (via subscriptionRepo) so "active" has one definition.
import { messagesNames, subscriptionMessagesCodes } from "@ayah/shared";
import { AppError } from "../errors/AppError.js";
import { subscriptionRepo } from "../../modules/subscriptions/subscription.repo.js";

/** True when the student has a currently-ACTIVE subscription. */
export async function hasActiveSubscription(studentId) {
  if (!studentId) return false;
  const ids = await subscriptionRepo.getCurrentlySubscribedStudentIds([studentId]);
  return ids.includes(studentId);
}

/** Throws 403 SUBSCRIPTION_INACTIVE unless the student is currently subscribed. */
export async function assertActiveForStudent(studentId) {
  if (await hasActiveSubscription(studentId)) return;
  throw new AppError({
    statusCode: 403,
    code: subscriptionMessagesCodes.SUBSCRIPTION_INACTIVE,
    message: subscriptionMessagesCodes.SUBSCRIPTION_INACTIVE,
    translationKey: messagesNames.subscriptionMessages,
    dontRedirect: true,
  });
}

/** Subset of `studentIds` that are currently subscribed. */
export async function filterActiveStudentIds(studentIds) {
  if (!studentIds?.length) return [];
  return subscriptionRepo.getCurrentlySubscribedStudentIds(studentIds);
}
```

> **Confirmed:** `@ayah/shared` exports both `subscriptionMessagesCodes` and `messagesNames` (the subscriptions module re-exports the codes from there). Use the single `@ayah/shared` import shown above.
>
> **Confirmed — `forbidden()` signature:** `forbidden(message)` in `AppError.js` takes ONE arg and always sets `translationKey` to the auth namespace. It CANNOT carry the subscription translationKey. Therefore, every other gate in this plan must **reuse `assertActiveForStudent(studentId)`** (which throws the correct `AppError` with `translationKey: messagesNames.subscriptionMessages` and `dontRedirect: true`) rather than calling `forbidden(SUBSCRIPTION_INACTIVE, ...)`. Where a task below shows `forbidden(subscriptionMessagesCodes.SUBSCRIPTION_INACTIVE, ...)`, replace it with `await assertActiveForStudent(studentId)`.

- [ ] **Step 4: Run the test + parse check**

Run: `node --check server/src/shared/access/subscriptionAccess.js` → exit 0.
Run: `npm test -w server -- subscriptionAccess` → PASS (or REPL import if no runner).

- [ ] **Step 5: Commit**

```bash
git add server/src/shared/access/subscriptionAccess.js server/src/shared/access/subscriptionAccess.test.js
git commit -m "feat(server): subscriptionAccess status guard (hasActive/assertActive/filterActive)"
```

---

## PHASE 2 — Backend enforcement

### Task 3: Gate the leaderboard for inactive students

**Files:**
- Modify: `server/src/modules/points/point.usecase.js:38` (the `leaderboard` method)

**Interfaces:**
- Consumes: `assertActiveForStudent` (Task 2); `USER_ROLES`.

- [ ] **Step 1: Write the failing test**

```js
// add to server/src/modules/points/point.usecase.test.js (or create it)
it("leaderboard throws SUBSCRIPTION_INACTIVE for an inactive student", async () => {
  // arrange: mock subscriptionAccess.hasActiveSubscription -> false
  // act/assert:
  await expect(
    pointUsecase.leaderboard({ id: 5, role: "STUDENT" }, { range: "all" }),
  ).rejects.toMatchObject({ code: "SUBSCRIPTION_INACTIVE" });
});
it("leaderboard returns rows for an active student", async () => {
  // mock hasActiveSubscription -> true and repo top lists -> []
  await expect(
    pointUsecase.leaderboard({ id: 5, role: "STUDENT" }, { range: "all" }),
  ).resolves.toEqual([]);
});
it("leaderboard does not gate ADMIN / PARENT", async () => {
  await expect(
    pointUsecase.leaderboard({ id: 1, role: "ADMIN" }, { range: "all" }),
  ).resolves.toBeDefined();
});
```

- [ ] **Step 2: Run, verify it fails**

Run: `npm test -w server -- point.usecase`
Expected: FAIL (no gating yet → inactive student does not throw).

- [ ] **Step 3: Implement the gate**

In `point.usecase.js`, add the import at top:

```js
import { assertActiveForStudent } from "../../shared/access/subscriptionAccess.js";
```

Change the `leaderboard` signature to use the auth user and gate students. Replace:

```js
  async leaderboard(_authUser, { range }) {
    const since = new Date(Date.now() - WEEK_MS);
```

with:

```js
  async leaderboard(authUser, { range }) {
    // Students must have an ACTIVE subscription to view the leaderboard.
    // Admins/parents are unaffected.
    if (authUser?.role === USER_ROLES.STUDENT) {
      await assertActiveForStudent(authUser.id);
    }
    const since = new Date(Date.now() - WEEK_MS);
```

(The controller already passes `authUser(req)` as the first arg — no controller change needed.)

- [ ] **Step 4: Run, verify PASS**

Run: `npm test -w server -- point.usecase` → PASS.
Run: `node --check server/src/modules/points/point.usecase.js` → exit 0.

- [ ] **Step 5: Commit**

```bash
git add server/src/modules/points/point.usecase.js server/src/modules/points/point.usecase.test.js
git commit -m "feat(points): gate leaderboard behind active subscription for students"
```

---

### Task 4: Gate student rewards/badges; scope parent rewards to active children

**Files:**
- Modify: `server/src/modules/rewards/reward.usecase.js` (`assertCanAccess`, `buildListWhere`)
- Modify: `server/src/modules/badges/badge.usecase.js` (`assertCanAccess`)

**Interfaces:**
- Consumes: `hasActiveSubscription`, `filterActiveStudentIds` (Task 2); `USER_ROLES`; `userRepo.isStudentOfParent`.

Rationale: badges/rewards are the "achievements" category. A student sees their own only when active; a parent sees rewards only for their **active** children.

- [ ] **Step 1: Write failing tests**

```js
// reward.usecase.test.js
it("student cannot list own rewards when inactive", async () => {
  // mock hasActiveSubscription(student.id) -> false
  await expect(
    rewardUsecase.assertCanAccess({ id: 5, role: "STUDENT" }, 5),
  ).rejects.toMatchObject({ code: "SUBSCRIPTION_INACTIVE" });
});
it("parent reward scope excludes inactive children", async () => {
  // userRepo.getStudentIdsForParent -> [10, 11]; filterActiveStudentIds -> [10]
  const where = await rewardUsecase.buildListWhere({ id: 2, role: "PARENT" }, {});
  expect(where.userId).toEqual({ in: [10, 2] }); // active child + self
});
```

```js
// badge.usecase.test.js
it("listStudentBadges throws for an inactive student/child", async () => {
  // hasActiveSubscription -> false
  await expect(
    badgeUsecase.assertCanAccess({ id: 5, role: "STUDENT" }, 5),
  ).rejects.toMatchObject({ code: "SUBSCRIPTION_INACTIVE" });
});
```

- [ ] **Step 2: Run, verify they fail**

Run: `npm test -w server -- reward.usecase badge.usecase`
Expected: FAIL.

- [ ] **Step 3: Implement — rewards**

In `reward.usecase.js` add import:

```js
import {
  assertActiveForStudent,
  filterActiveStudentIds,
} from "../../shared/access/subscriptionAccess.js";
```

Extend `assertCanAccess` — after the existing role checks pass for a student/linked child, require active subscription on the *target* student via `assertActiveForStudent` (it throws the correct 403 SUBSCRIPTION_INACTIVE):

```js
  async assertCanAccess(authUser, userId) {
    if (authUser.role === USER_ROLES.ADMIN) return;
    const isSelfStudent = userId === authUser.id && authUser.role === USER_ROLES.STUDENT;
    const isLinkedChild =
      authUser.role === USER_ROLES.PARENT &&
      userId &&
      (await userRepo.isStudentOfParent(authUser.id, userId));
    if (isSelfStudent || isLinkedChild) {
      // Achievements are hidden when the student's subscription is not active.
      await assertActiveForStudent(userId);
      return;
    }
    if (userId === authUser.id) return; // parent's own (non-student) rewards, if any
    throw forbidden(rewardMessagesCodes.CANNOT_ACCESS_REWARD);
  }
```

Scope the parent list to active children in `buildListWhere`:

```js
    } else if (authUser.role === USER_ROLES.PARENT) {
      const ids = await userRepo.getStudentIdsForParent(authUser.id);
      const activeIds = await filterActiveStudentIds(ids);
      const scope = [...activeIds, authUser.id];
      where.userId =
        userId && scope.includes(userId) ? userId : { in: scope };
    } else {
```

- [ ] **Step 4: Implement — badges**

In `badge.usecase.js` add the import and gate the student/child branch of `assertCanAccess` via `assertActiveForStudent`:

```js
import { assertActiveForStudent } from "../../shared/access/subscriptionAccess.js";
```

```js
  async assertCanAccess(authUser, studentId) {
    if (authUser.role === USER_ROLES.ADMIN) return;
    let allowed = false;
    if (authUser.role === USER_ROLES.STUDENT) {
      allowed = authUser.id === studentId;
    } else if (authUser.role === USER_ROLES.PARENT) {
      allowed = await userRepo.isStudentOfParent(authUser.id, studentId);
    }
    if (!allowed) throw forbidden(badgeMessagesCodes.CANNOT_ACCESS_BADGE);
    // Achievements hidden when the student's subscription is not active.
    await assertActiveForStudent(studentId);
  }
```

- [ ] **Step 5: Run tests, parse checks, PASS**

Run: `npm test -w server -- reward.usecase badge.usecase` → PASS.
Run: `node --check server/src/modules/rewards/reward.usecase.js server/src/modules/badges/badge.usecase.js` → exit 0.

- [ ] **Step 6: Commit**

```bash
git add server/src/modules/rewards/reward.usecase.js server/src/modules/badges/badge.usecase.js server/src/modules/rewards/reward.usecase.test.js server/src/modules/badges/badge.usecase.test.js
git commit -m "feat(rewards,badges): gate achievements behind active subscription (per-child for parents)"
```

---

### Task 5: Gate game play + attempt (free game exempt); add `locked` to assignments

**Files:**
- Modify: `server/src/modules/games/game.usecase.js` (`getBySlugAuth`, `attempt`, `myAssignments`)

**Interfaces:**
- Consumes: `hasActiveSubscription` (Task 2); `subscriptionMessagesCodes`.
- Produces: each item from `myAssignments` gains `locked: boolean`.
- Note: a game is "free/exempt" when `game.isFree && game.isPublic`. Confirm `gameFullSelect`/`gameListSelect` include `isFree` and `isPublic`; if `isFree` is missing from a select, add it (it already exists on the model and is used by `getPublicFree`).

- [ ] **Step 1: Write failing tests**

```js
// game.usecase.test.js
it("getBySlugAuth blocks an inactive student for a non-free game", async () => {
  // gameRepo.getBySlug -> { isActive: true, isFree: false, isPublic: false, questions: [] }
  // hasActiveSubscription -> false
  await expect(
    gameUsecase.getBySlugAuth({ id: 5, role: "STUDENT" }, "wudu-steps"),
  ).rejects.toMatchObject({ code: "SUBSCRIPTION_INACTIVE" });
});
it("getBySlugAuth allows the free game for an inactive student", async () => {
  // gameRepo.getBySlug -> { isActive: true, isFree: true, isPublic: true, questions: [] }
  await expect(
    gameUsecase.getBySlugAuth({ id: 5, role: "STUDENT" }, "phone-manners"),
  ).resolves.toBeDefined();
});
it("attempt blocks an inactive student on a non-free game", async () => {
  await expect(
    gameUsecase.attempt({ id: 5, role: "STUDENT", name: "x" }, 9, {
      correctCount: 1, totalQuestions: 1,
    }),
  ).rejects.toMatchObject({ code: "SUBSCRIPTION_INACTIVE" });
});
it("myAssignments marks non-free games locked when student inactive", async () => {
  // listAssignmentsForStudent -> [{ game: { isFree:false, isPublic:false } }]
  // hasActiveSubscription -> false
  const out = await gameUsecase.myAssignments({ id: 5, role: "STUDENT" });
  expect(out[0].locked).toBe(true);
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npm test -w server -- game.usecase` → FAIL.

- [ ] **Step 3: Implement**

Add import to `game.usecase.js`:

```js
import {
  hasActiveSubscription,
  assertActiveForStudent,
} from "../../shared/access/subscriptionAccess.js";
```

Add a small private helper inside the class:

```js
  // A game is exempt from subscription gating when it is the public free game.
  isFreeGame(game) {
    return Boolean(game?.isFree && game?.isPublic);
  }
```

In `getBySlugAuth`, after the not-found/active checks and before returning, gate students:

```js
  async getBySlugAuth(authUser, slug) {
    const game = await gameRepo.getBySlug(slug);
    if (!game) throw notFound(gameMessagesCodes.GAME_NOT_FOUND);

    if (authUser.role === USER_ROLES.ADMIN) return game;
    if (!game.isActive) throw notFound(gameMessagesCodes.GAME_NOT_FOUND);

    // Students need an ACTIVE subscription to play — except the free game.
    if (authUser.role === USER_ROLES.STUDENT && !this.isFreeGame(game)) {
      await assertActiveForStudent(authUser.id);
    }
    return this.stripAnswers(game);
  }
```

In `attempt`, after the existing `GAME_NOT_ACTIVE` check, add:

```js
    if (!game.isActive) throw badRequest(gameMessagesCodes.GAME_NOT_ACTIVE);

    // Submitting a result requires an active subscription — except the free game.
    if (!this.isFreeGame(game)) {
      await assertActiveForStudent(authUser.id);
    }
```

In `myAssignments`, compute `locked` per item:

```js
  /** The signed-in student's own game assignments (empty for non-students). */
  async myAssignments(authUser) {
    if (authUser.role !== USER_ROLES.STUDENT) return [];
    const assignments = await gameRepo.listAssignmentsForStudent(authUser.id);
    const active = await hasActiveSubscription(authUser.id);
    return assignments.map((a) => ({
      ...a,
      // Cards stay visible but are locked when the student is inactive,
      // unless the game itself is the public free game.
      locked: !active && !this.isFreeGame(a.game),
    }));
  }
```

(No `messagesNames` import is needed here — `assertActiveForStudent` carries the translationKey itself.)

- [ ] **Step 4: Run, PASS + parse**

Run: `npm test -w server -- game.usecase` → PASS.
Run: `node --check server/src/modules/games/game.usecase.js` → exit 0.

- [ ] **Step 5: Commit**

```bash
git add server/src/modules/games/game.usecase.js server/src/modules/games/game.usecase.test.js
git commit -m "feat(games): gate play+attempt behind active subscription (free game exempt); mark locked assignments"
```

---

### Task 6: Parent + student dashboards — null inactive stats/achievements

**Files:**
- Modify: `server/src/modules/dashboard/dashboard.usecase.js` (`getParentDashboard`, `getStudentDashboard`)

**Interfaces:**
- Consumes: `hasActiveSubscription`, `filterActiveStudentIds` (Task 2).
- Produces: parent children gain `isActive: boolean`; when `false`, `points/level/rank/badgeCount` are `null` (identity + `activeSubscription` kept). Student dashboard: when inactive, `badges: []`, `rank: null` (profile + `activeSubscription` kept).

- [ ] **Step 1: Write failing tests**

```js
// dashboard.usecase.test.js
it("parent dashboard nulls stats for an inactive child but keeps identity", async () => {
  // getStudentIdsForParent -> [10]; filterActiveStudentIds -> []
  const out = await dashboardUsecase.getParentDashboard({ id: 2, role: "PARENT" });
  const child = out.children[0];
  expect(child.isActive).toBe(false);
  expect(child.points).toBeNull();
  expect(child.badgeCount).toBeNull();
  expect(child.name).toBeTruthy();
});
it("student dashboard hides badges/rank when inactive", async () => {
  // hasActiveSubscription -> false
  const out = await dashboardUsecase.getStudentDashboard({ id: 5, role: "STUDENT" });
  expect(out.badges).toEqual([]);
  expect(out.rank).toBeNull();
  expect(out.profile).toBeTruthy();
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npm test -w server -- dashboard.usecase` → FAIL.

- [ ] **Step 3: Implement — parent**

Add import:

```js
import {
  hasActiveSubscription,
  filterActiveStudentIds,
} from "../../shared/access/subscriptionAccess.js";
```

In `getParentDashboard`, compute the active set once and gate per child. Replace the `childrenWithSubscription` map body:

```js
    const activeIds = new Set(await filterActiveStudentIds(studentIds));

    const childrenWithSubscription = await Promise.all(
      children.map(async (child) => {
        const isActive = activeIds.has(child.id);
        const [sub, rank] = await Promise.all([
          dashboardRepo.activeSubscriptionForStudent(child.id),
          isActive ? dashboardRepo.studentRank(child.points ?? 0) : Promise.resolve(null),
        ]);
        return {
          id: child.id,
          name: child.name,
          nickname: child.nickname,
          isActive,
          // Stats/achievements hidden for an inactive child; identity +
          // subscription state remain so the parent can renew.
          points: isActive ? child.points : null,
          level: isActive ? child.level : null,
          rank,
          badgeCount: isActive ? child._count?.studentBadges ?? 0 : null,
          activeSubscription: sub
            ? {
                id: sub.id,
                planId: sub.planId,
                endDate: sub.endDate,
                remainingHours: sub.remainingHours,
              }
            : null,
        };
      }),
    );
```

- [ ] **Step 4: Implement — student**

In `getStudentDashboard`, after fetching, gate badges/rank:

```js
    const active = await hasActiveSubscription(studentId);
```

Then in the returned object, replace `rank` and `badges`:

```js
      rank: active ? rank : null,
      ...
      badges: active
        ? badges.map((b) => ({
            id: b.badge.id,
            code: b.badge.code,
            nameAr: b.badge.nameAr,
            nameEn: b.badge.nameEn,
            icon: b.badge.icon,
            awardedAt: b.awardedAt,
          }))
        : [],
```

(Leave `assignedGames` returned as-is; the games list stays visible. `activeSubscription` stays so the UI knows the state.)

- [ ] **Step 5: Run, PASS + parse**

Run: `npm test -w server -- dashboard.usecase` → PASS.
Run: `node --check server/src/modules/dashboard/dashboard.usecase.js` → exit 0.

- [ ] **Step 6: Commit**

```bash
git add server/src/modules/dashboard/dashboard.usecase.js server/src/modules/dashboard/dashboard.usecase.test.js
git commit -m "feat(dashboard): null inactive child/student stats+achievements; surface isActive"
```

---

### Task 7: Surface `hasActiveSubscription` on `/auth/me` and login (students)

**Files:**
- Modify: `server/src/modules/auth/auth.controller.js` (`me`, `login`)

**Interfaces:**
- Consumes: `hasActiveSubscription` (Task 2); `USER_ROLES`.
- Produces: `/auth/me` and `/auth/login` `user` payload includes `hasActiveSubscription: boolean` (always `true` for non-students so they are never gated client-side).

- [ ] **Step 1: Write the failing test**

```js
// auth.controller.test.js (or an integration test that hits /auth/me)
it("/auth/me includes hasActiveSubscription=false for an inactive student", async () => {
  // req.auth = { id: 5, role: "STUDENT", ... }; hasActiveSubscription -> false
  // expect response.data.user.hasActiveSubscription === false
});
it("/auth/me sets hasActiveSubscription=true for non-students", async () => {
  // req.auth = { id: 1, role: "ADMIN" }
  // expect true without calling the subscription repo
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npm test -w server -- auth.controller` → FAIL.

- [ ] **Step 3: Implement**

Add imports:

```js
import { USER_ROLES } from "@ayah/shared";
import { hasActiveSubscription } from "../../shared/access/subscriptionAccess.js";
```

Add a helper and use it in `me` and `login`:

```js
  // Students are gated by subscription; everyone else is always "active".
  async withSubscriptionFlag(user) {
    const hasActive =
      user.role === USER_ROLES.STUDENT
        ? await hasActiveSubscription(user.id)
        : true;
    return { ...user, hasActiveSubscription: hasActive };
  }
```

`me`:

```js
  me = async (req, res) => {
    const user = await this.withSubscriptionFlag(req.auth);
    return ok(res, { user });
  };
```

`login` — wrap the existing payload:

```js
    const { passwordHash: _drop, ...safe } = user;
    const payload = await this.withSubscriptionFlag({
      ...safe,
      permissions: getPermissionsForRole(user.role),
    });
    return ok(res, { user: payload }, authMessagesCodes.LOGIN_SUCCESS, messagesNames.authMessages);
```

- [ ] **Step 4: Run, PASS + parse + boot**

Run: `npm test -w server -- auth.controller` → PASS.
Run: `node --check server/src/modules/auth/auth.controller.js` → exit 0.
Run: boot `npm run dev -w server`, hit `/api/v1/health` → 200. Stop.

- [ ] **Step 5: Commit**

```bash
git add server/src/modules/auth/auth.controller.js server/src/modules/auth/auth.controller.test.js
git commit -m "feat(auth): expose hasActiveSubscription on /auth/me and login (students)"
```

---

## PHASE 3 — Frontend

### Task 8: Reusable `SubscriptionLockedState` component + i18n

**Files:**
- Create: `web/src/shared/components/SubscriptionLockedState.jsx`
- Modify: `web/src/shared/components/index.js` (barrel export, if one exists)
- Modify: `web/src/i18n/locales/messagesCodes.js` (ar/en for `SUBSCRIPTION_INACTIVE`)
- Modify: `web/src/i18n/locales/ar/*` and `web/src/i18n/locales/en/*` (locked-state copy)

**Interfaces:**
- Produces: `<SubscriptionLockedState variant="student" | "parent" childName? renewHref? />`.
  - `student`: gentle, kid copy, no billing/CTA.
  - `parent`: clear copy + renew button linking `renewHref` (default `/dashboard/children`).

- [ ] **Step 1: Add i18n strings**

In `web/src/i18n/locales/messagesCodes.js`, add under `messagesNames.subscriptionMessages` in both `ar` and `en`:

```js
// ar
[subscriptionMessagesCodes.SUBSCRIPTION_INACTIVE]: "انتهى الاشتراك أو غير مفعّل",
// en
[subscriptionMessagesCodes.SUBSCRIPTION_INACTIVE]: "Subscription expired or inactive",
```

(Import `subscriptionMessagesCodes` at the top of that file if not already imported — match how other code namespaces are imported there.)

Add a `subscriptionLock` block to the locale dictionaries used by `useTranslation`. In `web/src/i18n/locales/ar/<common-or-dashboard>.json` (match where other shared UI copy lives) add:

```json
"subscriptionLock": {
  "studentTitle": "القسم ده مقفول دلوقتي 🔒",
  "studentBody": "كلّم بابا أو ماما عشان تكمل اللعب والمغامرات 😊",
  "parentTitle": "اشتراك {name} منتهي",
  "parentBody": "جدّد الاشتراك عشان يرجع يشوف نقاطه وأوسمته ويلعب الألعاب.",
  "renewCta": "تجديد الاشتراك"
}
```

English equivalent in `web/src/i18n/locales/en/...`:

```json
"subscriptionLock": {
  "studentTitle": "This section is locked right now 🔒",
  "studentBody": "Ask your mom or dad so you can keep playing 😊",
  "parentTitle": "{name}'s subscription has expired",
  "parentBody": "Renew the subscription so they can see their points and badges and play games again.",
  "renewCta": "Renew subscription"
}
```

- [ ] **Step 2: Create the component**

```jsx
// web/src/shared/components/SubscriptionLockedState.jsx
"use client";

import Link from "next/link";
import { Box, Button, Stack, Typography } from "@mui/material";
import { MdLock } from "react-icons/md";
import { useTranslation } from "../../i18n/client.js";
import { localePath } from "../../i18n/routing.js";

// Shown in place (no redirect) when a feature is blocked by subscription status.
// variant="student" → gentle, kid-appropriate, NO billing/CTA.
// variant="parent"  → clear + actionable, with a renew CTA.
export default function SubscriptionLockedState({
  variant = "student",
  childName = "",
  renewHref = "/dashboard/children",
}) {
  const { t, lng } = useTranslation();
  const c = t("subscriptionLock", { returnObjects: true }) || {};
  const isParent = variant === "parent";

  const title = isParent
    ? (c.parentTitle || "").replace("{name}", childName || "")
    : c.studentTitle;
  const body = isParent ? c.parentBody : c.studentBody;

  return (
    <Box
      sx={{
        display: "grid",
        placeItems: "center",
        textAlign: "center",
        py: { xs: 6, md: 8 },
        px: 2,
      }}
    >
      <Stack spacing={2} alignItems="center" sx={{ maxWidth: 460 }}>
        <Box
          sx={{
            width: 84,
            height: 84,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            bgcolor: "action.hover",
          }}
        >
          <MdLock size={40} color="#94A3B8" />
        </Box>
        <Typography variant="h5" fontWeight={900}>
          {title}
        </Typography>
        <Typography color="text.secondary">{body}</Typography>
        {isParent && (
          <Button
            component={Link}
            href={localePath(lng, renewHref)}
            variant="contained"
            size="large"
            sx={{ borderRadius: 999, px: 4, fontWeight: 800, mt: 1 }}
          >
            {c.renewCta}
          </Button>
        )}
      </Stack>
    </Box>
  );
}
```

If `web/src/shared/components/index.js` exists, add:

```js
export { default as SubscriptionLockedState } from "./SubscriptionLockedState.jsx";
```

- [ ] **Step 3: Verify build**

Run: `npm run build -w web`
Expected: exit 0 (component compiles, unused for now).

- [ ] **Step 4: Commit**

```bash
git add web/src/shared/components/SubscriptionLockedState.jsx web/src/shared/components/index.js web/src/i18n/locales
git commit -m "feat(web): SubscriptionLockedState component + locked-state i18n (student/parent)"
```

---

### Task 9: Student gates — Leaderboard, Badges, dashboard nav

**Files:**
- Modify: `web/src/features/leaderboard/pages/LeaderboardPage.jsx`
- Modify: `web/src/features/badges/pages/BadgesPage.jsx`
- Modify: the dashboard nav file that lists leaderboard + badges links (find it: `grep -r "dashboard/leaderboard" web/src/shared/ui/navigation web/src/features/dashboard`)

**Interfaces:**
- Consumes: `useAuth().user.hasActiveSubscription`; `user.role`; `SubscriptionLockedState`.

- [ ] **Step 1: Gate LeaderboardPage**

Add near the top of the component (after `usePermission`):

```jsx
import { useAuth } from "../../../hooks/useAuth.js";
import { USER_ROLES } from "@ayah/shared";
import { SubscriptionLockedState } from "../../../shared/components/index.js";
```

```jsx
  const { user } = useAuth();
  const blocked =
    user?.role === USER_ROLES.STUDENT && user?.hasActiveSubscription === false;
```

Change the fetch `autoFetch` to also require `!blocked`:

```jsx
    autoFetch: canView && !blocked,
```

And before the main return, after `if (!canView) return null;`:

```jsx
  if (blocked) return <SubscriptionLockedState variant="student" />;
```

- [ ] **Step 2: Gate BadgesPage**

Same imports. Add:

```jsx
  const { user } = useAuth();
  const blocked =
    user?.role === USER_ROLES.STUDENT && user?.hasActiveSubscription === false;
```

```jsx
    autoFetch: canList && !blocked,
```

After `if (!canList) return null;`:

```jsx
  if (blocked) return <SubscriptionLockedState variant="student" />;
```

- [ ] **Step 3: Hide nav links for inactive students**

In the dashboard nav config/component, where the leaderboard + badges nav items are built, filter them out when `user.role === STUDENT && user.hasActiveSubscription === false`. Read the file first; apply the same `blocked` guard to the items whose hrefs are `/dashboard/leaderboard` and `/dashboard/badges`. Keep them for admin/parent.

- [ ] **Step 4: Verify build**

Run: `npm run build -w web` → exit 0.

- [ ] **Step 5: Commit**

```bash
git add web/src/features/leaderboard web/src/features/badges web/src/shared/ui/navigation
git commit -m "feat(web): student subscription gate on leaderboard + badges (page + nav)"
```

---

### Task 10: Locked game cards + locked play page

**Files:**
- Modify: `web/src/features/games/components/GameCard.jsx`
- Modify: `web/src/features/games/pages/MyGamesPage.jsx`
- Modify: `web/src/features/games/hooks/useGame.js`
- Modify: `web/src/features/games/pages/GamePlayPage.jsx`

**Interfaces:**
- Consumes: `assignment.locked` (Task 5) on cards; backend `SUBSCRIPTION_INACTIVE` 403 on play.
- Produces: `useGame` returns `locked: boolean`.

- [ ] **Step 1: Pass `locked` into GameCard**

In `MyGamesPage.jsx`, include `locked` when building cards (the free card is never locked):

```jsx
    const list = assignments.map((a) => ({
      key: `a-${a.id}`,
      game: a.game,
      assignment: a,
      locked: Boolean(a.locked),
    }));
```

```jsx
        list.unshift({ key: `free-${freeGame.id}`, game: freeGame, assignment: null, locked: false });
```

Pass it to the card:

```jsx
            <GameCard
              key={c.key}
              game={c.game}
              basePath="/dashboard/games"
              assignment={c.assignment}
              locked={c.locked}
            />
```

- [ ] **Step 2: Render the lock on GameCard**

In `GameCard.jsx`, accept `locked` and, when true, render a non-link locked card (gentle, no navigation). Add prop `locked = false`. Wrap: when `locked`, render the same `Box` (no `<Link>`), dim it, overlay a lock chip, and replace the "playNow" footer with a locked label; clicking shows the student message via a small inline state or a toast. Minimal approach — when `locked`, do not wrap in `<Link>` and add:

```jsx
  if (locked) {
    return (
      <Box sx={{ position: "relative", opacity: 0.65, pointerEvents: "none" }}>
        {/* same visual card body as below, but the footer reads gd.locked */}
        {/* ...card markup... */}
        <Box sx={{ position: "absolute", top: 12, insetInlineEnd: 12, fontSize: 24 }}>🔒</Box>
      </Box>
    );
  }
```

> Implementer: factor the inner card `Box` into a local `CardBody` so locked + unlocked share markup (DRY). Add `gd.locked` copy (ar: "مقفول 🔒", en: "Locked 🔒") to the gamesData dictionary. Tapping a locked card should not navigate; the clear "renew" message lives with the parent, so the card itself just shows the lock (kid-appropriate).

- [ ] **Step 3: Surface `SUBSCRIPTION_INACTIVE` in useGame**

In `useGame.js`, add a `locked` state and set it in `onError`:

```jsx
  const [locked, setLocked] = useState(false);
```

In `onError`, before the fallback handling:

```jsx
      // ApiFetch attaches the full response body to err.data (incl. `code`).
      if (err?.status === 403 && err?.data?.code === "SUBSCRIPTION_INACTIVE") {
        setLocked(true);
        return;
      }
```

Return it:

```jsx
  return {
    game: rateLimited || locked ? null : game,
    isLoading: isLoading && !game && !rateLimited && !locked,
    error: isFallback || rateLimited || locked ? null : error,
    isFallback,
    rateLimited,
    locked,
    refetch: triggerRefetch,
  };
```

> **Confirmed:** `web/src/lib/api/ApiFetch.js` throws an `Error` with `.status`, `.data` (the full parsed body, including `code`), and `.translationKey`. Match on `err?.data?.code`.

- [ ] **Step 4: Render locked state on GamePlayPage (dashboard)**

In `GamePlayPage.jsx`, destructure `locked` and render the student locked state for the dashboard variant:

```jsx
import { SubscriptionLockedState } from "../../../shared/components/index.js";
```

```jsx
  const { game, isLoading, error, rateLimited, locked } = useGame({ slug, auth: isDashboard, free });
```

In the render branch (before the `isLoading` check, inside the content area):

```jsx
      {locked ? (
        <SubscriptionLockedState variant="student" />
      ) : rateLimited ? (
        /* existing rateLimited block */
```

(Keep the existing chain; just add the `locked` branch first.)

- [ ] **Step 5: Verify build**

Run: `npm run build -w web` → exit 0.

- [ ] **Step 6: Commit**

```bash
git add web/src/features/games
git commit -m "feat(web): lock game cards + play page for inactive students (free game stays playable)"
```

---

### Task 11: Parent views — dashboard child cards + child detail tabs

**Files:**
- Modify: `web/src/features/dashboard/components/ParentOverview.jsx`
- Modify: `web/src/features/dashboard/components/StudentOverview.jsx`
- Modify: `web/src/features/userDetail/pages/UserDetailPage.jsx` (+ overview/badges/games tab components)

**Interfaces:**
- Consumes: per-child `isActive` (Task 6); `SubscriptionLockedState variant="parent"`.

- [ ] **Step 1: ParentOverview per-child gating**

Read the file. For each child card, when `child.isActive === false`:
- keep name/nickname + subscription status chip + a **renew** action,
- replace the points/level/rank/badges block with a compact parent message (use `SubscriptionLockedState variant="parent" childName={child.nickname || child.name}` inside the card, or a slimmer inline variant if the card is small).
When `child.points`/`badgeCount` are `null`, render the locked treatment (do not show `0`).

- [ ] **Step 2: StudentOverview (the student's own dashboard home)**

Read the file. When the logged-in student is inactive (`user.hasActiveSubscription === false` or the dashboard payload's `badges` is empty + `rank` null), hide the badges widget and leaderboard-rank widget; keep the subscription/renew prompt area. The assigned-games widget stays (cards locked as in Task 10).

- [ ] **Step 3: UserDetailPage tabs (parent viewing a child)**

Read the file. Determine the child's active state (from the overview payload — ensure the overview endpoint returns the child's `isActive`/active subscription; if not present, derive from the subscriptions tab data or add `isActive` to the overview DTO in a tiny follow-up). For an inactive child:
- `overview` (stats), `badges`, `games` tabs → render `SubscriptionLockedState variant="parent" childName={...}`,
- `certificates` and `reports/evaluations` tabs → render normally.

> If the child-detail overview endpoint does not yet expose `isActive`, add it the same way Task 6 added it to the parent dashboard (compute via `hasActiveSubscription` in the user-overview usecase) and surface it in the overview DTO. Keep this within this task.

- [ ] **Step 4: Verify build**

Run: `npm run build -w web` → exit 0.

- [ ] **Step 5: Commit**

```bash
git add web/src/features/dashboard web/src/features/userDetail server/src/modules/users
git commit -m "feat(web): parent sees inactive child identity+renew, not stats/achievements; certificates/reports remain"
```

---

## PHASE 4 — Verification

### Task 12: End-to-end verification + cleanup

**Files:** none (verification only).

- [ ] **Step 1: Backend boots + module imports**

Run: `npm run dev -w server`, GET `/api/v1/health` → 200. Stop the server.

- [ ] **Step 2: Backend tests green**

Run: `npm test -w server` → all PASS (or the targeted suites added: subscriptionAccess, point/reward/badge/game/dashboard/auth usecases).

- [ ] **Step 3: Frontend build**

Run: `npm run build -w web` → exit 0.

- [ ] **Step 4: Manual smoke (if a seeded DB is available)**

Per the testing skill, verify by behavior:
- Inactive student: `/dashboard/leaderboard` and `/dashboard/badges` show the gentle student lock (no redirect); game cards show locks; the free game still plays; opening a locked game shows the student lock.
- Active student: everything works as before.
- Parent with one active + one inactive child: active child shows full stats; inactive child shows identity + subscription status + renew CTA, no stats/achievements; certificates + old reports still visible; child-detail overview/badges/games tabs locked, certificates/reports open.
- Admin: unaffected everywhere.

- [ ] **Step 5: Final commit / branch wrap**

```bash
git add -A
git commit -m "chore: subscription gating verification notes" --allow-empty
```

Then use `superpowers:finishing-a-development-branch` to open a PR / merge.

---

## Self-Review (completed by plan author)

- **Spec coverage:** leaderboard (Task 3), badges/awards (Task 4, 9), play blocked + list visible (Task 5, 10), free game exempt (Task 5, 10), parent hides stats/achievements only, keeps certificates/reports (Task 6, 11), no-redirect reason (Task 8 `dontRedirect` + locked states), student gentle vs parent actionable (Task 8), admin bypass (every backend gate is role-guarded), per-child scope (Task 4, 6, 11), capability surfacing (Task 5, 6, 7). All covered.
- **Placeholders:** the few "read the file first" frontend edits (Tasks 9 step 3, 11) are unavoidable for files not quoted here; each gives the exact gate condition, the capability field to read, and the component to render — not "implement later".
- **Type/name consistency:** `hasActiveSubscription` / `assertActiveForStudent` / `filterActiveStudentIds` used identically across tasks; `locked` (games) and `isActive` (children) consistent backend→frontend; `SUBSCRIPTION_INACTIVE` consistent.
