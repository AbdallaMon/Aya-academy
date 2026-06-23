# Admin Dashboard: Family/User Detail, Student Levels, Badges & Points — Design

Date: 2026-06-23
Status: Approved

## Goal

Extend the admin dashboard so an admin can manage everything about a single
student or parent from one place, introduce a pedagogical **student level**
system, a fully admin-managed **badge** system that feeds a unified **points**
ledger and leaderboard, split the user list into Users / Parents / Students,
enrich the subscriptions page, add account banning and subscription cancelling,
and fix the drawer active-item text contrast.

## Decisions (locked)

1. **One unified, role-adaptive detail page** at `/dashboard/users/[id]` — not a
   separate family page. Parent view shows the family; student view shows the
   student profile. All per-user actions live on this page.
2. **Student levels are a fixed enum of 4** (`BEGINNER`, `EXPLORER`, `BUILDER`,
   `CONFIDENT_READER`), bilingual labels in `@aya/shared`. Extendable later by
   adding enum values.
3. **Unified score via a new `Point` ledger model.** Awarding a badge writes a
   `Point` row and bumps the cached `User.points` total in the same transaction.
   Leaderboard sorts by `User.points`; "top this week" sums `Point.amount` over
   the last 7 days. Games/quizzes can feed the same ledger later.

## What already exists (reuse, don't rebuild)

- `Badge` + `StudentBadge` models, `User.level`/`User.points`, `Subscription`
  with `CANCELLED`, `ParentStudent` links, `User.isActive`, `Certificate`,
  `GameAttempt`/`QuizAttempt`, `Notification`, `Report`, `QuizInvite`.
- Layered backend (route → controller → usecase → repo → dto → validation),
  `requirePermissions` guards, `AppError` + language-neutral message codes,
  `notificationUsecase.createNotification/createManyForUsers`.
- Config-driven `DataTable` + `useRequest` lists; `AppForm` + RHF modals;
  role-gated `navModel`; `DashboardNav` active styling.

## Schema changes (additive, single migration)

```prisma
enum StudentLevel { BEGINNER  EXPLORER  BUILDER  CONFIDENT_READER }
enum PointSource  { BADGE  GAME  QUIZ  MANUAL  ADJUSTMENT }

model User {
  // + studentLevel StudentLevel?
  // + banReason    String?
  // + bannedAt     DateTime?
  // + points relation already exists; add: pointsLedger Point[]
}

model Badge {
  // + bgColor   String?   // hex
  // + textColor String?   // hex
  // + emoji     String?
  // + score     Int     @default(0)
  // + isActive  Boolean @default(true)
}

model StudentBadge {
  // + awardedById Int?
  // + score snapshot is captured via the Point row, not duplicated here
}

model Point {
  id          Int        @id @default(autoincrement())
  studentId   Int
  student     User       @relation(fields: [studentId], references: [id], onDelete: Cascade)
  amount      Int
  source      PointSource
  sourceId    Int?
  badgeId     Int?
  reason      String?
  awardedById Int?
  createdAt   DateTime   @default(now())
  @@index([studentId])
  @@index([createdAt])
}
```

Migration strategy: additive only (new enums/fields/model). No backfill needed
(`studentLevel` nullable, badge fields nullable/defaulted). Keep enum constants
synced with `@aya/shared`.

## Backend

New permission codes (wired into `ROLE_PERMISSIONS`, admin-only unless noted):
- `BADGE.{CREATE,LIST,VIEW,EDIT,DELETE,AWARD,REVOKE}`
- `POINT.{LIST,AWARD,VIEW_LEADERBOARD}` (LEADERBOARD also readable by student/parent for own scope)
- `USER.SET_LEVEL`, `USER.BAN`
- `SUBSCRIPTION.CANCEL`

Modules (each follows the standard layering + bilingual message codes):

- **`badges`** — CRUD on badge definitions; `POST /badges/:id/award` and
  `/badges/:id/revoke` for a student. Award creates a `StudentBadge` + a `Point`
  row + bumps `User.points`, all in one transaction; sends a `GIFT_RECEIVED`
  notification (best-effort).
- **`points`** — `GET /points?studentId=` (ledger, scoped), `GET /points/leaderboard`
  (all-time + `?range=week`), `POST /points` (manual MANUAL/ADJUSTMENT grant).
- **`users` (extend)** — `GET /users/:id/overview` returns a role-adaptive
  aggregate: for STUDENT → profile, level, points total, badges, certificates,
  game/quiz attempts, subscriptions, linked parents (with contact); for PARENT →
  profile/contact, children each with summary (level, points, active sub,
  certificate count). `PATCH /users/:id/level` (set `studentLevel`).
  `POST /users/:id/ban` (`isActive=false` + `banReason`/`bannedAt`) and
  `POST /users/:id/unban`.
- **`subscriptions` (extend)** — `POST /subscriptions/:id/cancel` → `CANCELLED`
  (allowed from PENDING/UPCOMING/ACTIVE). Enrich list/detail DTO with student
  email and each student's parents' phone + email.

All getters keep existing `assertCanAccess` scope checks. Important state-change
actions write audit logs.

## Frontend

- **Subscriptions page** — student name links to `/dashboard/users/[studentId]`;
  parent name links to the parent's detail page; new columns for student email,
  parent phone, parent email; **Cancel** action (confirm dialog) for
  PENDING/UPCOMING/ACTIVE.
- **List split** — keep `/dashboard/users` (all roles) and add `/dashboard/parents`
  (role=PARENT) and `/dashboard/students` (role=STUDENT) as filtered list views.
  Update `navModel` + section titles + i18n. Parent rows expose "view children"
  → table with a details button per child linking to the child's detail page.
- **Unified detail page** `/dashboard/users/[id]` — URL-driven tabs, role-adaptive:
  - Parent: Overview/contact · Children (table + per-child quick actions:
    add/cancel subscription, send invite, send report) · Subscriptions · Reports ·
    Actions (send report, send invite, ban/unban).
  - Student: Overview (level selector, points total, parents/contact) · Badges
    (awarded list + award-badge action) · Certificates · Evaluations (attempts) ·
    Subscriptions (add/cancel) · Actions (invite parent to a test, send report,
    ban/unban, award badge, set level).
  Reuses existing dialogs/forms where they exist (subscription create, report
  create, quiz invite).
- **Badges admin page** `/dashboard/badges` (admin) — CRUD with bg/text color
  pickers, emoji, score. Student keeps a read-only view of own badges
  (role-adaptive route or existing badges view).
- **Leaderboard** — "top performers this week" widget on the overview + a
  leaderboard list (rank, name, weekly points, total points, badge count).
- **Drawer fix** — in `DashboardNav.jsx`, guarantee the active item's text/icon
  color has clear contrast against the gradient in both light and dark themes.

## Phasing (implementation order)

- **Phase 0** — Drawer active-text contrast fix (isolated, quick).
- **Phase 1** — Schema + `@aya/shared` enums/constants + permissions + message
  codes + migration + db generate.
- **Phase 2** — Backend: `badges`, `points`, `users` overview/level/ban,
  subscription cancel + DTO contact enrichment.
- **Phase 3** — Frontend lists: split Users/Parents/Students, nav/i18n,
  subscriptions page enrichment.
- **Phase 4** — Unified role-adaptive detail page with all actions.
- **Phase 5** — Badges admin page + leaderboard widget + overview reorg.

## Out of scope (for now)

- Wiring games/quizzes into the `Point` ledger automatically (ledger supports it;
  not enabled this round).
- Admin-creatable level definitions (fixed enum chosen).
- Real-time leaderboard; periodic fetch is sufficient.

## Testing

- Usecase tests for: badge award (creates Point + bumps points, idempotent on
  unique constraint), revoke, leaderboard weekly window, set-level, ban/unban,
  subscription cancel state guards.
- Authorization/scope (IDOR) tests for `/users/:id/overview`, points ledger,
  badge award (admin-only), cancel.
- Frontend: role-adaptive detail page renders correct tabs per role; permission
  gating on actions.
