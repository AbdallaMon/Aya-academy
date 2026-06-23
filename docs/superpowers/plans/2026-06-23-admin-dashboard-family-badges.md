# Admin Dashboard: Family Detail, Levels, Badges & Points — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Give admins a single role-adaptive page to manage everything about one student/parent, add a 4-level student system, an admin-managed badge system feeding a unified points ledger + leaderboard, split user lists, enrich subscriptions, add ban + subscription-cancel, and fix drawer contrast.

**Architecture:** Additive Prisma changes (new `Point` model, `StudentLevel`/`PointSource` enums, fields on `User`/`Badge`/`StudentBadge`). New backend modules `badges` and `points` plus extensions to `users` and `subscriptions`, following the existing layered pattern. Frontend reuses `DataTable`/`useRequest`/`AppForm`; new `/dashboard/users/[id]` detail page, `/parents`, `/students` lists, badges admin page, leaderboard widget.

**Tech Stack:** Prisma + MySQL, Express, `@aya/shared` (permissions, message codes, enums), Next.js App Router, MUI, react-hook-form.

## Global Constraints

- No TypeScript in app source (JS/JSX only).
- Prisma only inside repo layer; no business logic in routes/controllers.
- Every backend message uses a language-neutral CODE localized ar+en (`@aya/shared` → web `messagesCodes.js`).
- Enum constants mirrored in `@aya/shared` constants.
- Authorize on permission code + object scope, never role alone; admin actions audited.
- Additive migration only; nullable/defaulted new fields.

---

### Task 0: Drawer active-item contrast fix

**Files:** Modify `web/src/features/dashboard/components/DashboardNav.jsx` (`&.Mui-selected` block).

- [ ] Inspect current active styles; set `color` and `& .MuiListItemText-primary`/`& .MuiListItemIcon-root` to `t.palette.primary.contrastText` explicitly, and ensure the gradient is dark enough in light mode (use `primary.dark`→`primary.main` if contrast is weak). Verify in both themes.
- [ ] Commit: `fix(dashboard): readable active nav item text in both themes`.

---

### Task 1: Schema + shared constants + permissions + message codes

**Files:**
- Modify `packages/db/prisma/schema.prisma`
- Modify `packages/shared/constants/permissions.js` (+ `ROLE_PERMISSIONS`)
- Modify/Create `packages/shared/constants/*` for `StudentLevel`, `PointSource` enums
- Create `packages/shared/messages-codes/badge.js`, `point.js`; modify `user.js`, `subscription.js`
- Modify `packages/shared/messages-names.js`
- Modify `web/src/i18n/locales/messagesCodes.js` (ar + en for all new codes)

**Interfaces produced:**
- `StudentLevel` enum: `BEGINNER, EXPLORER, BUILDER, CONFIDENT_READER`
- `PointSource` enum: `BADGE, GAME, QUIZ, MANUAL, ADJUSTMENT`
- `Point` model (see spec)
- `Badge` += `bgColor, textColor, emoji, score Int @default(0), isActive Boolean @default(true)`
- `StudentBadge` += `awardedById Int?`
- `User` += `studentLevel StudentLevel?, banReason String?, bannedAt DateTime?, pointsLedger Point[]`
- Permissions: `BADGE.{CREATE,LIST,VIEW,EDIT,DELETE,AWARD,REVOKE}`, `POINT.{LIST,AWARD,VIEW_LEADERBOARD}`, `USER.SET_LEVEL`, `USER.BAN`, `SUBSCRIPTION.CANCEL`
- Message codes (badge/point/level/ban/cancel), each ar+en.

- [ ] Edit schema; add enums/model/fields.
- [ ] Add permission codes + grant to admin in `ROLE_PERMISSIONS` (LEADERBOARD also to parent/student for own scope).
- [ ] Add shared level/source label constants + message codes + names; localize ar+en.
- [ ] Run `npm run db:migrate -- --name dashboard_levels_badges_points` then `npm run db:generate`.
- [ ] Commit: `feat(schema): add Point ledger, StudentLevel, badge fields, ban fields + perms`.

---

### Task 2: Backend `badges` module (CRUD + award/revoke)

**Files:** Create `server/src/modules/badges/{badge.route,controller,usecase,repo,dto,validation,messages}.js`; mount in `server/src/routes.js`.

**Interfaces:**
- Consumes: `notificationUsecase`, `pointUsecase.awardForBadge(tx,...)` (Task 3) — award is transactional.
- Produces: `badgeUsecase.award(authUser, badgeId, studentId)`, `.revoke(...)`, CRUD.

- [ ] Usecase test: award creates `StudentBadge` + `Point(source=BADGE, amount=badge.score)` + bumps `User.points`; second award of same badge to same student → conflict (unique). Revoke removes StudentBadge (points ledger entry retained or reversed — reverse: insert negative Point + decrement). Admin-only guard.
- [ ] Implement layered module; award/revoke in `prisma.$transaction`; best-effort `GIFT_RECEIVED` notification.
- [ ] Run tests; commit.

---

### Task 3: Backend `points` module (ledger + leaderboard)

**Files:** Create `server/src/modules/points/{point.route,controller,usecase,repo,dto,validation,messages}.js`; mount in routes.

**Interfaces produced:**
- `pointUsecase.awardForBadge(tx, { studentId, badgeId, amount, awardedById })`
- `pointUsecase.grantManual(authUser, { studentId, amount, reason })`
- `pointUsecase.listForStudent(authUser, studentId)` (scoped)
- `pointUsecase.leaderboard(authUser, { range })` → `[{ studentId, name, points, weeklyPoints, badgeCount, rank }]`

- [ ] Usecase test: leaderboard weekly window sums only last-7-days Point rows; all-time uses `User.points`; manual grant writes ledger + bumps points; scope check on listForStudent (IDOR).
- [ ] Implement; repo uses Prisma `groupBy`/aggregate for weekly sums.
- [ ] Run tests; commit.

---

### Task 4: Backend `users` extensions (overview + level + ban)

**Files:** Modify `server/src/modules/users/{user.route,controller,usecase,repo,dto,validation}.js`.

**Interfaces produced:**
- `GET /users/:id/overview` → role-adaptive aggregate (student: profile/level/points/badges/certificates/attempts/subscriptions/parents; parent: profile/contact/children-summaries).
- `PATCH /users/:id/level` body `{ studentLevel }` (admin, `USER.SET_LEVEL`).
- `POST /users/:id/ban` `{ reason? }`, `POST /users/:id/unban` (admin, `USER.BAN`; sets `isActive`, `banReason`, `bannedAt`, bumps `sessionVersion` on ban).

- [ ] Usecase tests: overview shape per role + scope; set-level validates enum; ban sets isActive=false + bumps sessionVersion; unban restores.
- [ ] Implement; DTO `userOverviewSelect` (student vs parent branches in usecase).
- [ ] Run tests; commit.

---

### Task 5: Backend `subscriptions` cancel + contact DTO

**Files:** Modify `server/src/modules/subscriptions/{subscription.route,controller,usecase,repo,dto,validation}.js`.

**Interfaces produced:**
- `POST /subscriptions/:id/cancel` (`SUBSCRIPTION.CANCEL`) → `CANCELLED` if status ∈ {PENDING,UPCOMING,ACTIVE}, else conflict.
- List/detail DTO adds `student.email` and `student.parents[]` with `{ name, phone, email, relation }`.

- [ ] Usecase test: cancel from ACTIVE → CANCELLED; cancel from CANCELLED/EXPIRED → conflict; DTO includes parent contact.
- [ ] Implement; best-effort `SUBSCRIPTION_EXPIRED`-style notification on cancel.
- [ ] Run tests; commit.

---

### Task 6: Frontend — subscriptions page enrichment

**Files:** Modify `web/src/features/subscriptions/pages/SubscriptionsPage.jsx`, `web/src/features/subscriptions/config/constant.js`; i18n.

- [ ] Student name cell → `Link` to `/dashboard/users/[studentId]`; add parent name link, columns for student email, parent phone, parent email.
- [ ] Add **Cancel** action button (confirm dialog) for PENDING/UPCOMING/ACTIVE using `useMultiRequest` → `POST /subscriptions/:id/cancel`.
- [ ] Verify in app; commit.

---

### Task 7: Frontend — split Users / Parents / Students lists + nav

**Files:** Create `web/src/app/[lng]/dashboard/parents/page.jsx`, `.../students/page.jsx`; create feature components reusing users list config with a fixed role filter; modify `web/src/features/dashboard/config/navModel.js`, section-title map, i18n. Modify users list to add row→detail links and (parents) per-child detail buttons.

- [ ] Add nav items + titles; parents list "view children" table gets a details button per child → `/dashboard/users/[childId]`.
- [ ] Verify nav + lists; commit.

---

### Task 8: Frontend — unified role-adaptive detail page

**Files:** Create `web/src/app/[lng]/dashboard/users/[id]/page.jsx`; `web/src/features/userDetail/` (page + tab components + config); reuse subscription/report/quiz-invite dialogs.

- [ ] Fetch `/users/:id/overview`; render URL-driven tabs per role (parent vs student set from spec). Permission-gate actions via `usePermission`.
- [ ] Wire actions: add/cancel subscription, send report, send quiz invite, ban/unban, award badge, set level (student). 
- [ ] Verify both roles; commit.

---

### Task 9: Frontend — badges admin page + leaderboard

**Files:** Modify/create `web/src/features/badges/` admin page + `web/src/app/[lng]/dashboard/badges/page.jsx` (role-adaptive: admin manage, student read-only); create leaderboard widget in overview + optional leaderboard list; i18n.

- [ ] Badges CRUD form: name ar/en, description, bg/text color pickers, emoji, score, isActive.
- [ ] Leaderboard widget "top this week" on overview; list view (rank/name/weekly/total/badges).
- [ ] Verify; commit.

---

## Self-Review notes

- Spec coverage: links/contact + cancel (T5,T6), ban (T1,T4,T8), family/detail (T4,T8), levels (T1,T4,T8), badges+score+leaderboard (T1,T2,T3,T9), list split (T7), drawer (T0). All covered.
- Award/revoke point reversal behavior fixed explicitly in T2 (reverse via negative Point + decrement).
- `pointUsecase.awardForBadge(tx,...)` signature consistent between T2 (consumer) and T3 (producer).
