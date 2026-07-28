# Interactive Whiteboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Admin-only interactive full-screen whiteboard — create a session, attach real student accounts, open a professional drawing board (Excalidraw) with playful kid reactions (balloons/stars/"شاطر"/claps/fireworks + sounds), shareable by private or public token link; only the session lifecycle is persisted server-side, drawings live in `localStorage`.

**Architecture:** New layered backend module `whiteboardSessions` (route → controller → usecase → repo → validation → dto, Prisma only in repo) persisting session + attached-student rows. Frontend feature `whiteboard` with a config-driven list page, a session detail page, and a full-screen board (dynamically-imported Excalidraw + a custom reaction overlay) mounted OUTSIDE the dashboard shell. A thin `boardChannel` seam writes drawings/reactions locally today and is the future socket swap point.

**Tech Stack:** Express + Prisma (MySQL) backend, `@ayah/shared` constants/message-codes; Next.js 16 App Router + MUI + react-hook-form frontend; `@excalidraw/excalidraw` for the board; existing `socket.io` infra reserved for later.

## Global Constraints

- **No auto-migrations.** Edit `packages/db/prisma/schema.prisma` freely, but NEVER run `prisma migrate`/`db push`. After the schema task, output the exact command for Abdalla to run.
- **No TypeScript in app source.** All new files are `.js`/`.jsx`.
- **Prisma only in repos.** Usecases call repos; controllers stay thin; no business logic in routes/controllers.
- **Language-neutral message CODES only** (SCREAMING_SNAKE) in backend responses/errors — never human text. Every new code must be localized ar+en on the web side (`web/src/i18n/locales/messagesCodes.js`).
- **Enums live in two synced places:** `packages/db/prisma/schema.prisma` AND `packages/shared/constants/enums.js`. Consume the JS constant, never a raw string literal.
- **Authorize on permission codes, never role names.** New code: `whiteboard.manage`, granted to `ADMIN` only (it flows in automatically via `getAllPermissions()`).
- **Arabic is the default locale and RTL.** Build hrefs with `localePath(lng, path)`.
- **No test framework exists in this repo.** Verify by running the server (curl) and the app (browser), matching current practice. Do not add a test runner.
- **Frequent commits** — one per task. Commit messages in English, imperative mood.

---

## File Structure

**Shared (`packages/`)**
- Modify `packages/db/prisma/schema.prisma` — 2 enums, 2 models, back-relations on `User`.
- Modify `packages/shared/constants/enums.js` — mirror the 2 enums.
- Modify `packages/shared/constants/permissions.js` — `WHITEBOARD_PERMISSIONS` + register in `PERMISSIONS`.
- Create `packages/shared/messages-codes/whiteboard.js` — `whiteboardMessagesCodes`.
- Modify `packages/shared/messages-names.js` — add `whiteboardMessages`.
- Modify `packages/shared/index.js` (or the barrel that exports the above) — export the new code map.

**Backend (`server/src/modules/whiteboardSessions/`)**
- `whiteboardSession.dto.js` — output projections/select maps.
- `whiteboardSession.repo.js` — Prisma I/O.
- `whiteboardSession.usecase.js` — business logic, token gen/hash, scope.
- `whiteboardSession.validation.js` — Zod schemas.
- `whiteboardSession.controller.js` — thin controller.
- `whiteboardSession.route.js` — router (public token route first, then guarded).
- `whiteboardSession.messages.js` — re-export shared codes.
- Modify `server/src/routes.js` — mount `/whiteboard-sessions`.

**Frontend (`web/src/`)**
- `features/whiteboard/config/constant.js`, `whiteboardText.js`, `whiteboardColumns.js`
- `features/whiteboard/pages/WhiteboardListPage.jsx`, `WhiteboardSessionDetailPage.jsx`
- `features/whiteboard/components/CreateWhiteboardDialog.jsx`, `SessionStudentsPanel.jsx`
- `features/whiteboard/board/WhiteboardBoard.jsx`, `ReactionBar.jsx`, `ReactionOverlay.jsx`
- `features/whiteboard/board/config/reactions.js`
- `features/whiteboard/board/lib/boardChannel.js`, `useBoardPersistence.js`, `boardSounds.js`
- `app/[lng]/dashboard/whiteboard/page.jsx`, `app/[lng]/dashboard/whiteboard/[id]/page.jsx`
- `app/[lng]/board/[id]/page.jsx`, `app/[lng]/w/[token]/page.jsx`
- Modify `web/src/features/dashboard/config/navModel.js` — admin nav item.
- Modify `web/src/utils/constant.js` — add `/board` to `PROTECTED_PREFIXES`.
- Modify `web/src/i18n/locales/messagesCodes.js` — localize new codes.

---

## Task 1: Shared constants, permission, message codes

**Files:**
- Modify: `packages/shared/constants/enums.js`
- Modify: `packages/shared/constants/permissions.js`
- Create: `packages/shared/messages-codes/whiteboard.js`
- Modify: `packages/shared/messages-names.js`
- Modify: `packages/shared/index.js` (verify export barrel)

**Interfaces:**
- Produces: `WHITEBOARD_SESSION_STATUSES = { DRAFT, ACTIVE, ENDED }`, `WHITEBOARD_VISIBILITIES = { PRIVATE, PUBLIC }`; `PERMISSIONS.WHITEBOARD = { MANAGE: "whiteboard.manage" }`; `whiteboardMessagesCodes`; `messagesNames.whiteboardMessages = "whiteboard-messages"`.

- [ ] **Step 1: Add the enums to `packages/shared/constants/enums.js`** (append near the other enums)

```js
// Interactive whiteboard sessions (admin-run live board). Keep in sync with
// packages/db/prisma/schema.prisma.
export const WHITEBOARD_SESSION_STATUSES = {
  DRAFT: "DRAFT",
  ACTIVE: "ACTIVE",
  ENDED: "ENDED",
};

export const WHITEBOARD_VISIBILITIES = {
  PRIVATE: "PRIVATE",
  PUBLIC: "PUBLIC",
};
```

- [ ] **Step 2: Add the permission group in `packages/shared/constants/permissions.js`** (before the `export const PERMISSIONS = {` aggregation)

```js
// Interactive whiteboard sessions — admin-only management (create/attach
// students/activate/share). ADMIN gets it automatically via getAllPermissions().
export const WHITEBOARD_PERMISSIONS = {
  MANAGE: "whiteboard.manage",
};
```

- [ ] **Step 3: Register it in the `PERMISSIONS` aggregate** (same file) — add the line inside the object:

```js
  WHITEBOARD: WHITEBOARD_PERMISSIONS,
```

(No change needed to `ROLE_PERMISSIONS` — `ADMIN` already gets every code via `getAllPermissions()`, and PARENT/STUDENT must NOT get it.)

- [ ] **Step 4: Create `packages/shared/messages-codes/whiteboard.js`**

```js
// Language-neutral message codes for the interactive whiteboard module.
// Surfaced to the frontend via translationKey `messagesNames.whiteboardMessages`.
export const whiteboardMessagesCodes = {
  SESSION_NOT_FOUND: "SESSION_NOT_FOUND",
  SESSION_CREATED: "SESSION_CREATED",
  SESSION_DELETED: "SESSION_DELETED",
  SESSION_ACTIVATED: "SESSION_ACTIVATED",
  SESSION_ENDED: "SESSION_ENDED",
  SESSION_MADE_PUBLIC: "SESSION_MADE_PUBLIC",
  SESSION_MADE_PRIVATE: "SESSION_MADE_PRIVATE",
  STUDENT_ADDED: "STUDENT_ADDED",
  STUDENT_REMOVED: "STUDENT_REMOVED",
  STUDENT_ALREADY_ADDED: "STUDENT_ALREADY_ADDED",
  STUDENT_NOT_IN_SESSION: "STUDENT_NOT_IN_SESSION",
  NOT_A_STUDENT: "NOT_A_STUDENT",
  TITLE_REQUIRED: "TITLE_REQUIRED",
  STUDENT_ID_INVALID: "STUDENT_ID_INVALID",
};
```

- [ ] **Step 5: Register the namespace in `packages/shared/messages-names.js`** — add inside `messagesNames`:

```js
  whiteboardMessages: "whiteboard-messages",
```

- [ ] **Step 6: Export the new code map from the shared barrel.** Open `packages/shared/index.js`, find where the other `*MessagesCodes` are re-exported (e.g. `export { gameMessagesCodes } from "./messages-codes/game.js";`) and add:

```js
export { whiteboardMessagesCodes } from "./messages-codes/whiteboard.js";
```

Also confirm `WHITEBOARD_SESSION_STATUSES`, `WHITEBOARD_VISIBILITIES`, and `WHITEBOARD_PERMISSIONS` are reachable through the barrel (they are if `index.js` does `export * from "./constants/enums.js"` / `permissions.js`; if it re-exports named symbols explicitly, add these three names).

- [ ] **Step 7: Verify the barrel resolves**

Run: `node -e "const s=require('@ayah/shared'); console.log(s.PERMISSIONS.WHITEBOARD, s.WHITEBOARD_SESSION_STATUSES, s.whiteboardMessagesCodes.SESSION_CREATED, s.messagesNames.whiteboardMessages)"`
(from the repo root; if the package is ESM-only, use `node --input-type=module -e "import('@ayah/shared').then(s=>console.log(s.PERMISSIONS.WHITEBOARD, s.messagesNames.whiteboardMessages))"`).
Expected: prints the permission object, the statuses object, `SESSION_CREATED`, and `whiteboard-messages` with no import error.

- [ ] **Step 8: Commit**

```bash
git add packages/shared
git commit -m "feat(shared): add whiteboard enums, permission, and message codes"
```

---

## Task 2: Prisma schema — whiteboard session models

**Files:**
- Modify: `packages/db/prisma/schema.prisma`

**Interfaces:**
- Produces: models `WhiteboardSession`, `WhiteboardSessionStudent`; enums `WhiteboardSessionStatus`, `WhiteboardVisibility`; `User.whiteboardSessionsCreated` and `User.whiteboardAttendances` back-relations.

- [ ] **Step 1: Add the two enums** near the other enum blocks at the top of `schema.prisma`

```prisma
enum WhiteboardSessionStatus {
  DRAFT
  ACTIVE
  ENDED
}

enum WhiteboardVisibility {
  PRIVATE
  PUBLIC
}
```

- [ ] **Step 2: Add the two models** (place after the other feature models, e.g. near GameAssignment)

```prisma
model WhiteboardSession {
  id              Int                      @id @default(autoincrement())
  title           String
  status          WhiteboardSessionStatus  @default(DRAFT)
  visibility      WhiteboardVisibility     @default(PRIVATE)
  // SHA-256 hash of the raw share token; null while PRIVATE.
  publicTokenHash String?                  @unique
  createdById     Int
  createdBy       User                     @relation("WhiteboardCreatedBy", fields: [createdById], references: [id])
  students        WhiteboardSessionStudent[]
  createdAt       DateTime                 @default(now())
  updatedAt       DateTime                 @updatedAt

  @@index([createdById])
  @@index([status])
}

model WhiteboardSessionStudent {
  id        Int               @id @default(autoincrement())
  sessionId Int
  studentId Int
  session   WhiteboardSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  student   User              @relation("WhiteboardStudent", fields: [studentId], references: [id])
  createdAt DateTime          @default(now())

  @@unique([sessionId, studentId])
  @@index([studentId])
}
```

- [ ] **Step 3: Add back-relations on the `User` model.** Find `model User {` and add these two lines with the other relation fields:

```prisma
  whiteboardSessionsCreated WhiteboardSession[]        @relation("WhiteboardCreatedBy")
  whiteboardAttendances     WhiteboardSessionStudent[] @relation("WhiteboardStudent")
```

- [ ] **Step 4: Validate the schema (no DB write)**

Run: `npx prisma validate --schema packages/db/prisma/schema.prisma`
Expected: `The schema at ... is valid 🚀`

- [ ] **Step 5: Regenerate the Prisma client** (safe — no migration)

Run: `npx prisma generate --schema packages/db/prisma/schema.prisma`
Expected: `Generated Prisma Client` success.

- [ ] **Step 6: Commit**

```bash
git add packages/db/prisma/schema.prisma
git commit -m "feat(db): add WhiteboardSession + WhiteboardSessionStudent models"
```

- [ ] **Step 7: Hand the migration command to Abdalla (do NOT run it).** Output exactly:

> Schema updated. Run this yourself to create the migration + apply it:
> `npx prisma migrate dev --schema packages/db/prisma/schema.prisma --name whiteboard_sessions`

---

## Task 3: Backend DTO + repo

**Files:**
- Create: `server/src/modules/whiteboardSessions/whiteboardSession.dto.js`
- Create: `server/src/modules/whiteboardSessions/whiteboardSession.repo.js`
- Create: `server/src/modules/whiteboardSessions/whiteboardSession.messages.js`

**Interfaces:**
- Consumes: Prisma client `@ayah/db/prisma.client.js`, `paginate` from `../../shared/utility/pagination.js`.
- Produces: `whiteboardSessionRepo` with methods: `list({ where, page, limit })`, `getById({ id })`, `getByIdWithStudents({ id })`, `getByTokenHash({ tokenHash })`, `create({ title, createdById })`, `updateStatus({ id, status })`, `setPublic({ id, tokenHash })`, `setPrivate({ id })`, `remove({ id })`, `addStudent({ sessionId, studentId })`, `removeStudent({ sessionId, studentId })`, `findStudentLink({ sessionId, studentId })`. Plus selects `sessionListSelect`, `sessionDetailSelect`, `sessionPublicSelect`.

- [ ] **Step 1: Create `whiteboardSession.messages.js`**

```js
// Re-exported from @ayah/shared so the codes are a single source of truth
// shared with the frontend (localized in web/src/i18n/locales/messagesCodes.js).
export { whiteboardMessagesCodes } from "@ayah/shared";
```

- [ ] **Step 2: Create `whiteboardSession.dto.js`**

```js
// Output projections for the whiteboard-sessions module.

const attendeeSelect = {
  id: true,
  studentId: true,
  createdAt: true,
  student: { select: { id: true, name: true, nickname: true } },
};

// List rows: meta + a count of attached students (no full student list).
export const sessionListSelect = {
  id: true,
  title: true,
  status: true,
  visibility: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { students: true } },
};

// Detail: meta + the attached students (identity only).
export const sessionDetailSelect = {
  id: true,
  title: true,
  status: true,
  visibility: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
  students: { orderBy: { createdAt: "asc" }, select: attendeeSelect },
};

// Public payload (token link): NEVER expose ids of internal rows beyond what a
// viewer needs — title, status, and student display names only.
export function toPublicSession(session) {
  if (!session) return null;
  return {
    id: session.id,
    title: session.title,
    status: session.status,
    students: (session.students ?? []).map((s) => ({
      id: s.student.id,
      name: s.student.nickname || s.student.name,
    })),
  };
}
```

- [ ] **Step 3: Create `whiteboardSession.repo.js`**

```js
// ===========================================================================
// whiteboardSession.repo — Prisma I/O only on WhiteboardSession /
// WhiteboardSessionStudent. Single object args with an optional `client`.
// ===========================================================================

import { prisma } from "@ayah/db/prisma.client.js";
import { paginate } from "../../shared/utility/pagination.js";
import { sessionDetailSelect, sessionListSelect } from "./whiteboardSession.dto.js";

class WhiteboardSessionRepo {
  async list({ where, page, limit, client } = {}) {
    const db = client ?? prisma;
    const { skip, take, page: currentPage } = paginate({ page, limit });
    const [items, total] = await Promise.all([
      db.whiteboardSession.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        select: sessionListSelect,
      }),
      db.whiteboardSession.count({ where }),
    ]);
    return { items, total, page: currentPage, pageSize: take };
  }

  getById({ id, client } = {}) {
    return (client ?? prisma).whiteboardSession.findUnique({ where: { id } });
  }

  getByIdWithStudents({ id, client } = {}) {
    return (client ?? prisma).whiteboardSession.findUnique({
      where: { id },
      select: sessionDetailSelect,
    });
  }

  getByTokenHash({ tokenHash, client } = {}) {
    return (client ?? prisma).whiteboardSession.findUnique({
      where: { publicTokenHash: tokenHash },
      select: sessionDetailSelect,
    });
  }

  create({ title, createdById, client } = {}) {
    return (client ?? prisma).whiteboardSession.create({
      data: { title, createdById },
      select: sessionDetailSelect,
    });
  }

  updateStatus({ id, status, client } = {}) {
    return (client ?? prisma).whiteboardSession.update({
      where: { id },
      data: { status },
      select: sessionDetailSelect,
    });
  }

  setPublic({ id, tokenHash, client } = {}) {
    return (client ?? prisma).whiteboardSession.update({
      where: { id },
      data: { visibility: "PUBLIC", publicTokenHash: tokenHash },
      select: sessionDetailSelect,
    });
  }

  setPrivate({ id, client } = {}) {
    return (client ?? prisma).whiteboardSession.update({
      where: { id },
      data: { visibility: "PRIVATE", publicTokenHash: null },
      select: sessionDetailSelect,
    });
  }

  remove({ id, client } = {}) {
    return (client ?? prisma).whiteboardSession.delete({ where: { id } });
  }

  findStudentLink({ sessionId, studentId, client } = {}) {
    return (client ?? prisma).whiteboardSessionStudent.findUnique({
      where: { sessionId_studentId: { sessionId, studentId } },
    });
  }

  addStudent({ sessionId, studentId, client } = {}) {
    return (client ?? prisma).whiteboardSessionStudent.create({
      data: { sessionId, studentId },
    });
  }

  removeStudent({ sessionId, studentId, client } = {}) {
    return (client ?? prisma).whiteboardSessionStudent.deleteMany({
      where: { sessionId, studentId },
    });
  }
}

export const whiteboardSessionRepo = new WhiteboardSessionRepo();
export { WhiteboardSessionRepo };
```

- [ ] **Step 4: Sanity-check the imports resolve** (the app boots without this module yet; just lint the file)

Run: `cd web && npx eslint ../server/src/modules/whiteboardSessions/whiteboardSession.repo.js || true` — if eslint isn't wired for server, skip. Otherwise verify `paginate` path exists: `ls server/src/shared/utility/pagination.js`
Expected: the file exists (import path valid).

- [ ] **Step 5: Commit**

```bash
git add server/src/modules/whiteboardSessions/whiteboardSession.dto.js server/src/modules/whiteboardSessions/whiteboardSession.repo.js server/src/modules/whiteboardSessions/whiteboardSession.messages.js
git commit -m "feat(whiteboard): add whiteboard-sessions dto + repo"
```

---

## Task 4: Backend usecase (business logic + token)

**Files:**
- Create: `server/src/modules/whiteboardSessions/whiteboardSession.usecase.js`

**Interfaces:**
- Consumes: `whiteboardSessionRepo` (Task 3); `userRepo.getById`/equivalent from `../users/user.repo.js` to verify a target is a STUDENT; `AppError` factories; `USER_ROLES`, `WHITEBOARD_SESSION_STATUSES`, `WHITEBOARD_VISIBILITIES` from `@ayah/shared`; `crypto` (node builtin); `ENV.appUrl` (config).
- Produces: `whiteboardSessionUsecase` with: `list({ page, limit, filters, authUser })`, `getById({ id, authUser })`, `create({ title, authUser })`, `activate({ id, authUser })`, `end({ id, authUser })`, `makePublic({ id, authUser, locale })` → `{ session, token, url }`, `makePrivate({ id, authUser })`, `remove({ id, authUser })`, `addStudent({ id, studentId, authUser })`, `removeStudent({ id, studentId, authUser })`, `getPublicByToken({ token })` → public dto or throws notFound.

- [ ] **Step 1: Confirm the student-lookup helper.** Open `server/src/modules/users/user.repo.js` and note the method that fetches a user by id with their `role` (used to reject non-students). If it's `getById({ id })` returning `{ id, role, ... }`, use that. If the exact name differs, use the actual one — record it here before writing the usecase.

- [ ] **Step 2: Confirm the app URL source.** Grep for how the reset-password link builds its base: `grep -rn "appUrl" server/src/config server/src/modules/auth`. Use the same `ENV.appUrl` (e.g. `import { ENV } from "../../config/env.js"` — match the real path).

- [ ] **Step 3: Create `whiteboardSession.usecase.js`**

```js
import crypto from "node:crypto";
import { prisma } from "@ayah/db/prisma.client.js";
import {
  USER_ROLES,
  WHITEBOARD_SESSION_STATUSES,
  WHITEBOARD_VISIBILITIES,
} from "@ayah/shared";
import { badRequest, conflict, notFound } from "../../shared/errors/AppError.js";
import { buildSearchQuery } from "../../shared/utility/helper.js";
import { ENV } from "../../config/env.js"; // adjust to the real config path (Step 2)
import { userRepo } from "../users/user.repo.js";
import { whiteboardSessionRepo } from "./whiteboardSession.repo.js";
import { toPublicSession } from "./whiteboardSession.dto.js";
import { whiteboardMessagesCodes } from "./whiteboardSession.messages.js";

// Raw token shown once to the admin; only its SHA-256 hash is stored.
function generateShareToken() {
  return crypto.randomBytes(24).toString("hex"); // 48 hex chars, unguessable
}
function hashShareToken(raw) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

class WhiteboardSessionUsecase {
  buildListWhere(authUser, { search } = {}) {
    const where = {};
    // ADMIN scope: for now admins manage every session. (Scope hook kept here
    // so a future "own sessions only" rule slots in cleanly.)
    const or = buildSearchQuery({
      search: typeof search === "string" ? search : undefined,
      keys: ["title"],
    });
    if (or) where.OR = or;
    return where;
  }

  async list({ page, limit, filters = {}, authUser }) {
    const where = this.buildListWhere(authUser, filters);
    return whiteboardSessionRepo.list({ where, page, limit });
  }

  async getById({ id, authUser }) {
    const session = await whiteboardSessionRepo.getByIdWithStudents({ id });
    if (!session) throw notFound(whiteboardMessagesCodes.SESSION_NOT_FOUND);
    return session;
  }

  async create({ title, authUser }) {
    const clean = typeof title === "string" ? title.trim() : "";
    if (!clean) throw badRequest(whiteboardMessagesCodes.TITLE_REQUIRED);
    return whiteboardSessionRepo.create({ title: clean, createdById: authUser.id });
  }

  async activate({ id, authUser }) {
    await this.#assertExists(id);
    return whiteboardSessionRepo.updateStatus({
      id,
      status: WHITEBOARD_SESSION_STATUSES.ACTIVE,
    });
  }

  async end({ id, authUser }) {
    await this.#assertExists(id);
    return whiteboardSessionRepo.updateStatus({
      id,
      status: WHITEBOARD_SESSION_STATUSES.ENDED,
    });
  }

  async makePublic({ id, authUser, locale = "ar" }) {
    await this.#assertExists(id);
    const token = generateShareToken();
    const session = await whiteboardSessionRepo.setPublic({
      id,
      tokenHash: hashShareToken(token),
    });
    const url = `${ENV.appUrl}/${locale}/w/${token}`;
    return { session, token, url };
  }

  async makePrivate({ id, authUser }) {
    await this.#assertExists(id);
    return whiteboardSessionRepo.setPrivate({ id });
  }

  async remove({ id, authUser }) {
    await this.#assertExists(id);
    await whiteboardSessionRepo.remove({ id });
    return { id };
  }

  async addStudent({ id, studentId, authUser }) {
    await this.#assertExists(id);
    const student = await userRepo.getById({ id: studentId });
    if (!student || student.role !== USER_ROLES.STUDENT) {
      throw badRequest(whiteboardMessagesCodes.NOT_A_STUDENT);
    }
    const existing = await whiteboardSessionRepo.findStudentLink({
      sessionId: id,
      studentId,
    });
    if (existing) throw conflict(whiteboardMessagesCodes.STUDENT_ALREADY_ADDED);
    await whiteboardSessionRepo.addStudent({ sessionId: id, studentId });
    return whiteboardSessionRepo.getByIdWithStudents({ id });
  }

  async removeStudent({ id, studentId, authUser }) {
    await this.#assertExists(id);
    const result = await whiteboardSessionRepo.removeStudent({
      sessionId: id,
      studentId,
    });
    if (!result || result.count === 0) {
      throw notFound(whiteboardMessagesCodes.STUDENT_NOT_IN_SESSION);
    }
    return whiteboardSessionRepo.getByIdWithStudents({ id });
  }

  // Public token viewer — returns a minimal payload ONLY for PUBLIC sessions.
  async getPublicByToken({ token }) {
    if (!token || typeof token !== "string") {
      throw notFound(whiteboardMessagesCodes.SESSION_NOT_FOUND);
    }
    const session = await whiteboardSessionRepo.getByTokenHash({
      tokenHash: hashShareToken(token),
    });
    if (!session || session.visibility !== WHITEBOARD_VISIBILITIES.PUBLIC) {
      throw notFound(whiteboardMessagesCodes.SESSION_NOT_FOUND);
    }
    return toPublicSession(session);
  }

  async #assertExists(id) {
    const session = await whiteboardSessionRepo.getById({ id });
    if (!session) throw notFound(whiteboardMessagesCodes.SESSION_NOT_FOUND);
    return session;
  }
}

export const whiteboardSessionUsecase = new WhiteboardSessionUsecase();
export { WhiteboardSessionUsecase };
```

- [ ] **Step 4: Verify `conflict` exists in `AppError.js`.** Run: `grep -n "export function conflict" server/src/shared/errors/AppError.js`. If it's absent but `badRequest`/`notFound` exist, either add a `conflict` factory (409) mirroring the others, or fall back to `badRequest`. Prefer adding `conflict` for the 409 semantics.
Expected: a `conflict` factory is available.

- [ ] **Step 5: Verify `sessionDetailSelect` supports `_count` on list but not detail** — the usecase uses `getByIdWithStudents` for detail (has `students`), `list` uses `sessionListSelect` (has `_count`). No `_count` on detail. Confirm `buildSearchQuery` exists: `grep -n "buildSearchQuery" server/src/shared/utility/helper.js`.
Expected: helper exists (matches the games usecase import).

- [ ] **Step 6: Commit**

```bash
git add server/src/modules/whiteboardSessions/whiteboardSession.usecase.js server/src/shared/errors/AppError.js
git commit -m "feat(whiteboard): add whiteboard-sessions usecase with share-token logic"
```

---

## Task 5: Validation, controller, route, registration

**Files:**
- Create: `server/src/modules/whiteboardSessions/whiteboardSession.validation.js`
- Create: `server/src/modules/whiteboardSessions/whiteboardSession.controller.js`
- Create: `server/src/modules/whiteboardSessions/whiteboardSession.route.js`
- Modify: `server/src/routes.js`

**Interfaces:**
- Consumes: `whiteboardSessionUsecase` (Task 4); `ok`/`created`/`deleted` from `../../shared/http/response.js`; `idParam` from `../../shared/http/params.js`; `messagesNames`, `whiteboardMessagesCodes`, `PERMISSIONS` from `@ayah/shared`; `validate`, `asyncHandler`, `authMiddleware`.
- Produces: mounted router at `/whiteboard-sessions` (public token route first, then guarded routes).

- [ ] **Step 1: Create `whiteboardSession.validation.js`**

```js
import { z } from "zod";
import { whiteboardMessagesCodes } from "./whiteboardSession.messages.js";

export class WhiteboardSessionValidation {
  static createSchema = z.object({
    title: z.string().trim().min(1, whiteboardMessagesCodes.TITLE_REQUIRED).max(120),
  });

  static addStudentSchema = z.object({
    studentId: z
      .number()
      .int()
      .positive(whiteboardMessagesCodes.STUDENT_ID_INVALID),
  });
}
```

- [ ] **Step 2: Create `whiteboardSession.controller.js`**

```js
import { messagesNames, whiteboardMessagesCodes } from "@ayah/shared";
import { created, deleted, ok } from "../../shared/http/response.js";
import { idParam } from "../../shared/http/params.js";
import { whiteboardSessionUsecase } from "./whiteboardSession.usecase.js";

const TK = messagesNames.whiteboardMessages;

class WhiteboardSessionController {
  // ── public (no auth) ────────────────────────────────────
  async getPublic(req, res) {
    const session = await whiteboardSessionUsecase.getPublicByToken({
      token: req.params.token,
    });
    return ok(res, session);
  }

  // ── authenticated (admin) ───────────────────────────────
  async list(req, res) {
    const { page, limit, ...filters } = req.query;
    const result = await whiteboardSessionUsecase.list({
      page,
      limit,
      filters,
      authUser: req.auth,
    });
    return ok(res, result);
  }

  async getOne(req, res) {
    const session = await whiteboardSessionUsecase.getById({
      id: idParam(req.params.id),
      authUser: req.auth,
    });
    return ok(res, session);
  }

  async create(req, res) {
    const session = await whiteboardSessionUsecase.create({
      title: req.body.title,
      authUser: req.auth,
    });
    return created(res, session, whiteboardMessagesCodes.SESSION_CREATED, TK);
  }

  async activate(req, res) {
    const session = await whiteboardSessionUsecase.activate({
      id: idParam(req.params.id),
      authUser: req.auth,
    });
    return ok(res, session, whiteboardMessagesCodes.SESSION_ACTIVATED, TK);
  }

  async end(req, res) {
    const session = await whiteboardSessionUsecase.end({
      id: idParam(req.params.id),
      authUser: req.auth,
    });
    return ok(res, session, whiteboardMessagesCodes.SESSION_ENDED, TK);
  }

  async makePublic(req, res) {
    const result = await whiteboardSessionUsecase.makePublic({
      id: idParam(req.params.id),
      authUser: req.auth,
      locale: req.auth.locale || "ar",
    });
    return ok(res, result, whiteboardMessagesCodes.SESSION_MADE_PUBLIC, TK);
  }

  async makePrivate(req, res) {
    const session = await whiteboardSessionUsecase.makePrivate({
      id: idParam(req.params.id),
      authUser: req.auth,
    });
    return ok(res, session, whiteboardMessagesCodes.SESSION_MADE_PRIVATE, TK);
  }

  async remove(req, res) {
    await whiteboardSessionUsecase.remove({
      id: idParam(req.params.id),
      authUser: req.auth,
    });
    return deleted(res, whiteboardMessagesCodes.SESSION_DELETED, TK);
  }

  async addStudent(req, res) {
    const session = await whiteboardSessionUsecase.addStudent({
      id: idParam(req.params.id),
      studentId: req.body.studentId,
      authUser: req.auth,
    });
    return ok(res, session, whiteboardMessagesCodes.STUDENT_ADDED, TK);
  }

  async removeStudent(req, res) {
    const session = await whiteboardSessionUsecase.removeStudent({
      id: idParam(req.params.id),
      studentId: idParam(req.params.studentId),
      authUser: req.auth,
    });
    return ok(res, session, whiteboardMessagesCodes.STUDENT_REMOVED, TK);
  }
}

export const whiteboardSessionController = new WhiteboardSessionController();
export { WhiteboardSessionController };
```

- [ ] **Step 3: Create `whiteboardSession.route.js`** (public token route declared BEFORE the guarded `/:id` routes, mirroring the games module)

```js
import { Router } from "express";
import { PERMISSIONS } from "@ayah/shared";
import { whiteboardSessionController } from "./whiteboardSession.controller.js";
import { WhiteboardSessionValidation } from "./whiteboardSession.validation.js";
import { validate } from "../../shared/middlewares/validate.middleware.js";
import { asyncHandler } from "../../shared/middlewares/async-handler.js";
import { authMiddleware } from "../../shared/middlewares/auth.middleware.js";

const whiteboardSessionRoutes = Router();

// PUBLIC — token viewer. Declared before authenticated routes; "/public/:token"
// can never collide with "/:id" because "public" is a fixed segment.
whiteboardSessionRoutes.get(
  "/public/:token",
  asyncHandler(whiteboardSessionController.getPublic),
);

const requireManage = [
  authMiddleware.requireAuth,
  authMiddleware.requirePermissions([PERMISSIONS.WHITEBOARD.MANAGE]),
];

whiteboardSessionRoutes.get("/", ...requireManage, asyncHandler(whiteboardSessionController.list));
whiteboardSessionRoutes.post(
  "/",
  ...requireManage,
  validate(WhiteboardSessionValidation.createSchema),
  asyncHandler(whiteboardSessionController.create),
);
whiteboardSessionRoutes.get("/:id", ...requireManage, asyncHandler(whiteboardSessionController.getOne));
whiteboardSessionRoutes.delete("/:id", ...requireManage, asyncHandler(whiteboardSessionController.remove));

whiteboardSessionRoutes.post("/:id/actions/activate", ...requireManage, asyncHandler(whiteboardSessionController.activate));
whiteboardSessionRoutes.post("/:id/actions/end", ...requireManage, asyncHandler(whiteboardSessionController.end));
whiteboardSessionRoutes.post("/:id/actions/make-public", ...requireManage, asyncHandler(whiteboardSessionController.makePublic));
whiteboardSessionRoutes.post("/:id/actions/make-private", ...requireManage, asyncHandler(whiteboardSessionController.makePrivate));

whiteboardSessionRoutes.post(
  "/:id/students",
  ...requireManage,
  validate(WhiteboardSessionValidation.addStudentSchema),
  asyncHandler(whiteboardSessionController.addStudent),
);
whiteboardSessionRoutes.delete(
  "/:id/students/:studentId",
  ...requireManage,
  asyncHandler(whiteboardSessionController.removeStudent),
);

export default whiteboardSessionRoutes;
```

- [ ] **Step 4: Register the router in `server/src/routes.js`.** Add the import with the others:

```js
import whiteboardSessionRoutes from "./modules/whiteboardSessions/whiteboardSession.route.js";
```

and the mount line with the others:

```js
routes.use("/whiteboard-sessions", whiteboardSessionRoutes);
```

- [ ] **Step 5: Boot the server and verify the routes are wired**

Run: `cd server && npm run dev` (leave running in one terminal). In another terminal:
`curl -s -i http://localhost:4000/api/v1/whiteboard-sessions/public/deadbeef`
Expected: `HTTP/1.1 404` with a JSON envelope `{"success":false,"message":"SESSION_NOT_FOUND",...}` (route resolves, token invalid → 404 — NOT a 404 "route not found" from Express; confirm `message` is `SESSION_NOT_FOUND`).
`curl -s -i http://localhost:4000/api/v1/whiteboard-sessions`
Expected: `HTTP/1.1 401` (guarded — no auth cookie).

- [ ] **Step 6: End-to-end smoke with an admin cookie.** Log in as admin via the app or `curl` the login endpoint to capture the `ayah_access` cookie into a jar, then:
```bash
# create
curl -s -b cookies.txt -X POST http://localhost:4000/api/v1/whiteboard-sessions \
  -H 'Content-Type: application/json' -d '{"title":"حصة تجريبية"}'
# expect 201 + { data: { id, title, status:"DRAFT", visibility:"PRIVATE", students:[] } }
# activate (use the returned id)
curl -s -b cookies.txt -X POST http://localhost:4000/api/v1/whiteboard-sessions/1/actions/activate
# make public → returns { data: { session, token, url } }
curl -s -b cookies.txt -X POST http://localhost:4000/api/v1/whiteboard-sessions/1/actions/make-public
# view via public token (paste the token from previous response)
curl -s http://localhost:4000/api/v1/whiteboard-sessions/public/<token>
# expect 200 + { data: { id, title, status, students:[...] } }
```
Expected: each call returns the envelope described. `make-private` then re-viewing the token → 404.

- [ ] **Step 7: Commit**

```bash
git add server/src/modules/whiteboardSessions server/src/routes.js
git commit -m "feat(whiteboard): add whiteboard-sessions controller, validation, routes"
```

---

## Task 6: Frontend wiring — i18n codes, nav item, protected prefix, feature config

**Files:**
- Modify: `web/src/i18n/locales/messagesCodes.js`
- Modify: `web/src/features/dashboard/config/navModel.js`
- Modify: `web/src/utils/constant.js`
- Create: `web/src/features/whiteboard/config/constant.js`
- Create: `web/src/features/whiteboard/config/whiteboardText.js`

**Interfaces:**
- Produces: localized `whiteboard-messages` namespace (ar+en); admin nav item `whiteboard`; `/board` added to `PROTECTED_PREFIXES`; `WHITEBOARD_URL`, `STUDENTS_PICKER_URL`, `STUDENTS_PICKER_PARAMS`, `buildPrivateBoardPath`, `buildPublicBoardPath`, `WHITEBOARD_STATUS`, `WHITEBOARD_VISIBILITY`; `useWhiteboardText()`.

- [ ] **Step 1: Localize the message codes.** Open `web/src/i18n/locales/messagesCodes.js`, find how a namespace like `game-messages` is structured (per project rule every code is `{ ar, en }` or a nested `{ "game-messages": { CODE: { ar, en } } }` — match the exact shape used). Add a `whiteboard-messages` block with all codes from Task 1 Step 4:

```js
"whiteboard-messages": {
  SESSION_NOT_FOUND: { ar: "الجلسة غير موجودة", en: "Session not found" },
  SESSION_CREATED: { ar: "تم إنشاء الجلسة", en: "Session created" },
  SESSION_DELETED: { ar: "تم حذف الجلسة", en: "Session deleted" },
  SESSION_ACTIVATED: { ar: "تم فتح الجلسة", en: "Session opened" },
  SESSION_ENDED: { ar: "تم إنهاء الجلسة", en: "Session ended" },
  SESSION_MADE_PUBLIC: { ar: "الجلسة أصبحت عامة", en: "Session is now public" },
  SESSION_MADE_PRIVATE: { ar: "الجلسة أصبحت خاصة", en: "Session is now private" },
  STUDENT_ADDED: { ar: "تمت إضافة الطالب", en: "Student added" },
  STUDENT_REMOVED: { ar: "تمت إزالة الطالب", en: "Student removed" },
  STUDENT_ALREADY_ADDED: { ar: "الطالب مضاف بالفعل", en: "Student already added" },
  STUDENT_NOT_IN_SESSION: { ar: "الطالب غير موجود في الجلسة", en: "Student is not in the session" },
  NOT_A_STUDENT: { ar: "الحساب المختار ليس طالبًا", en: "Selected account is not a student" },
  TITLE_REQUIRED: { ar: "عنوان الجلسة مطلوب", en: "Session title is required" },
  STUDENT_ID_INVALID: { ar: "معرّف الطالب غير صالح", en: "Invalid student id" },
},
```

(Match the exact nesting/quote style of the existing file — this block is the content, not the format.)

- [ ] **Step 2: Add the nav item.** In `web/src/features/dashboard/config/navModel.js`: add an icon import (e.g. `MdDraw` from `react-icons/md`) to the icon import list and `whiteboard: MdDraw` to the `ICONS` map. Then find the ADMIN role's groups (the array built for `USER_ROLES.ADMIN`) and add an item to a suitable group (e.g. the teaching/content group that holds `games`/`sessionLog`):

```js
{
  key: 'whiteboard',
  labelKey: 'whiteboard',
  href: '/dashboard/whiteboard',
  icon: ICONS.whiteboard,
  permission: PERMISSIONS.WHITEBOARD.MANAGE,
},
```

- [ ] **Step 3: Add the nav label.** The nav renders `labelKey` via the dashboard translations. Find the file that holds nav labels (grep for an existing `sessionLog:` or `games:` label: `grep -rn "sessionLog" web/src/i18n web/src/features/dashboard`). Add `whiteboard` label ar+en (e.g. ar: "السبورة التفاعلية", en: "Whiteboard") in the SAME file/namespace as the other nav labels.

- [ ] **Step 4: Protect the `/board` prefix.** In `web/src/utils/constant.js`, change `PROTECTED_PREFIXES` from `['/dashboard']` to:

```js
export const PROTECTED_PREFIXES = ['/dashboard', '/board'];
```

(Leave `/w/` public — the public token board must open without auth. Verify `isPublicPath`/`isProtectedPath` logic still treats `/w/...` as non-protected; if `isPublicPath` is an allowlist, no change needed since anything not protected is allowed.)

- [ ] **Step 5: Create `web/src/features/whiteboard/config/constant.js`**

```js
import { WHITEBOARD_SESSION_STATUSES, WHITEBOARD_VISIBILITIES } from "@ayah/shared";
import { localePath } from "../../../i18n/routing.js";

export const WHITEBOARD_URL = "whiteboard-sessions";

// Admin student picker (reuse the users endpoint filtered to STUDENT).
export const STUDENTS_PICKER_URL = "users";
export const STUDENTS_PICKER_PARAMS = { role: "STUDENT", limit: 100 };

export const WHITEBOARD_STATUS = WHITEBOARD_SESSION_STATUSES;
export const WHITEBOARD_VISIBILITY = WHITEBOARD_VISIBILITIES;

// Full-screen board routes (outside the dashboard shell).
export const buildPrivateBoardPath = (lng, id) => localePath(lng, `/board/${id}`);
export const buildPublicBoardPath = (lng, token) => localePath(lng, `/w/${token}`);
```

- [ ] **Step 6: Create `web/src/features/whiteboard/config/whiteboardText.js`** (mirror an existing `useXText` hook, e.g. `certificatesText.js`)

```js
import { useTranslation } from "../../../i18n/client.js";

// Centralized localized strings for the whiteboard feature.
export function useWhiteboardText() {
  const { lng } = useTranslation();
  const ar = lng === "ar";
  return {
    pageTitle: ar ? "السبورة التفاعلية" : "Interactive Whiteboard",
    createBtn: ar ? "جلسة جديدة" : "New session",
    titleLabel: ar ? "عنوان الجلسة" : "Session title",
    status: ar ? "الحالة" : "Status",
    visibility: ar ? "الظهور" : "Visibility",
    studentsCount: ar ? "الطلاب" : "Students",
    openBoard: ar ? "افتح السبورة (ملء الشاشة)" : "Open board (full screen)",
    activate: ar ? "فتح الجلسة" : "Open session",
    end: ar ? "إنهاء الجلسة" : "End session",
    delete: ar ? "حذف" : "Delete",
    makePublic: ar ? "جعلها عامة" : "Make public",
    makePrivate: ar ? "جعلها خاصة" : "Make private",
    copyLink: ar ? "نسخ الرابط العام" : "Copy public link",
    linkCopied: ar ? "تم نسخ الرابط" : "Link copied",
    addStudent: ar ? "إضافة طالب" : "Add student",
    removeStudent: ar ? "إزالة" : "Remove",
    noStudents: ar ? "لا يوجد طلاب بعد" : "No students yet",
    unavailable: ar ? "الجلسة غير متاحة" : "Session unavailable",
    statusLabels: {
      DRAFT: ar ? "مسودة" : "Draft",
      ACTIVE: ar ? "مفتوحة" : "Open",
      ENDED: ar ? "منتهية" : "Ended",
    },
    visibilityLabels: {
      PRIVATE: ar ? "خاصة" : "Private",
      PUBLIC: ar ? "عامة" : "Public",
    },
  };
}
```

- [ ] **Step 7: Verify nav + i18n load without runtime error**

Run: `cd web && npm run dev` then open `http://localhost:3008/ar/dashboard/whiteboard` while logged in as admin. Expected: the "السبورة التفاعلية" nav item appears; the route 404s for now (page not built until Task 7) but the nav label renders (no missing-key warning in console).

- [ ] **Step 8: Commit**

```bash
git add web/src/i18n web/src/features/dashboard/config/navModel.js web/src/utils/constant.js web/src/features/whiteboard/config
git commit -m "feat(web): whiteboard i18n codes, nav item, protected prefix, feature config"
```

---

## Task 7: List page + create dialog + route

**Files:**
- Create: `web/src/features/whiteboard/config/whiteboardColumns.js`
- Create: `web/src/features/whiteboard/components/CreateWhiteboardDialog.jsx`
- Create: `web/src/features/whiteboard/pages/WhiteboardListPage.jsx`
- Create: `web/src/app/[lng]/dashboard/whiteboard/page.jsx`

**Interfaces:**
- Consumes: `useRequest` (`{ url, method, isPaginated, autoFetch }` → `{ data, total, page, setPage, pageSize, setPageSize, isLoading, triggerRefetch }`), `DataTable`/`PageHeader` from `shared/components`, `usePermission`, `useOpen`, `useWhiteboardText`, `WHITEBOARD_URL`.
- Produces: `WhiteboardListPage` default export; `buildWhiteboardColumns(txt)`; `CreateWhiteboardDialog`.

- [ ] **Step 1: Create `whiteboardColumns.js`** (mirror `certificatesColumns.js` column-builder shape — confirm the DataTable column API by reading that file first)

```js
// Column builder for the whiteboard sessions list. `txt` is useWhiteboardText().
export function buildWhiteboardColumns(txt) {
  return [
    { field: "title", headerName: txt.titleLabel, flex: 1 },
    {
      field: "status",
      headerName: txt.status,
      renderCell: (row) => txt.statusLabels[row.status] ?? row.status,
    },
    {
      field: "visibility",
      headerName: txt.visibility,
      renderCell: (row) => txt.visibilityLabels[row.visibility] ?? row.visibility,
    },
    {
      field: "students",
      headerName: txt.studentsCount,
      renderCell: (row) => row?._count?.students ?? 0,
    },
  ];
}
```

(Adjust `renderCell(row)` vs `renderCell(params)` to match the real DataTable contract in `certificatesColumns.js`.)

- [ ] **Step 2: Create `CreateWhiteboardDialog.jsx`** (copy the structure of `CreateCertificateDialog.jsx` — same `AppForm`/RHF + `useRequest` mutation pattern; read it first for the exact form components)

```jsx
"use client";

import { useForm } from "react-hook-form";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField } from "@mui/material";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { WHITEBOARD_URL } from "../config/constant.js";
import { useWhiteboardText } from "../config/whiteboardText.js";

export default function CreateWhiteboardDialog({ open, onClose, onCreated }) {
  const txt = useWhiteboardText();
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ defaultValues: { title: "" } });
  const { fetchData, isLoading } = useRequest({ url: WHITEBOARD_URL, method: "post", autoFetch: false });

  const submit = handleSubmit(async (values) => {
    const res = await fetchData({ body: values }); // match useRequest's mutation call signature
    if (res?.success) {
      reset();
      onClose?.();
      onCreated?.(res.data);
    }
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{txt.createBtn}</DialogTitle>
      <form onSubmit={submit}>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label={txt.titleLabel}
              autoFocus
              fullWidth
              error={Boolean(errors.title)}
              {...register("title", { required: true })}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>{txt.delete === "حذف" ? "إلغاء" : "Cancel"}</Button>
          <Button type="submit" variant="contained" disabled={isLoading}>{txt.createBtn}</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
```

(IMPORTANT: read `useRequest.js` to confirm the mutation trigger — whether it's `fetchData({ body })`, `fetchData(values)`, or a returned `mutate`. Use the real signature.)

- [ ] **Step 3: Create `WhiteboardListPage.jsx`** (mirror `CertificatesPage.jsx`)

```jsx
"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@mui/material";
import { MdAdd } from "react-icons/md";
import { PERMISSIONS } from "@ayah/shared";
import { usePermission } from "../../../hooks/usePermission.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useOpen } from "../../../hooks/useOpen.js";
import { useTranslation } from "../../../i18n/client.js";
import { localePath } from "../../../i18n/routing.js";
import { DataTable, PageHeader } from "../../../shared/components/index.js";
import { WHITEBOARD_URL } from "../config/constant.js";
import { buildWhiteboardColumns } from "../config/whiteboardColumns.js";
import { useWhiteboardText } from "../config/whiteboardText.js";
import CreateWhiteboardDialog from "../components/CreateWhiteboardDialog.jsx";

export default function WhiteboardListPage() {
  const txt = useWhiteboardText();
  const { lng } = useTranslation();
  const router = useRouter();
  const { hasPermission } = usePermission();
  const canManage = hasPermission(PERMISSIONS.WHITEBOARD.MANAGE);
  const createDialog = useOpen();

  const { data, total, page, setPage, pageSize, setPageSize, isLoading, triggerRefetch } =
    useRequest({ url: WHITEBOARD_URL, method: "get", isPaginated: true, autoFetch: canManage });

  const columns = useMemo(() => buildWhiteboardColumns(txt), [txt]);

  if (!canManage) return null;

  return (
    <>
      <PageHeader
        title={txt.pageTitle}
        action={
          <Button variant="contained" startIcon={<MdAdd />} onClick={createDialog.open}>
            {txt.createBtn}
          </Button>
        }
      />
      <DataTable
        rows={data ?? []}
        columns={columns}
        loading={isLoading}
        total={total}
        page={page}
        onPageChange={setPage}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        onRowClick={(row) => router.push(localePath(lng, `/dashboard/whiteboard/${row.id}`))}
      />
      <CreateWhiteboardDialog
        open={createDialog.isOpen}
        onClose={createDialog.close}
        onCreated={() => triggerRefetch()}
      />
    </>
  );
}
```

(Align `DataTable` props — `rows`/`data`, `onRowClick`, pagination prop names — with the real `DataTable` API in `certificates`/another list page. Adjust to match.)

- [ ] **Step 4: Create the route `web/src/app/[lng]/dashboard/whiteboard/page.jsx`** (mirror `certificates/page.jsx`'s thin Suspense wrapper)

```jsx
import { Suspense } from "react";
import WhiteboardListPage from "../../../../../features/whiteboard/pages/WhiteboardListPage.jsx";

export default function Page() {
  return (
    <Suspense>
      <WhiteboardListPage />
    </Suspense>
  );
}
```

(Fix the relative depth to match the repo's other dashboard route files — copy an existing one and swap the import.)

- [ ] **Step 5: Verify the list page works end-to-end**

Run: with `server` and `web` dev servers up, open `http://localhost:3008/ar/dashboard/whiteboard` as admin.
Expected: page renders with header + empty table; "جلسة جديدة" opens the dialog; submitting a title shows a success toast, closes the dialog, and the new row appears (status "مسودة", 0 students); clicking a row navigates to `/ar/dashboard/whiteboard/<id>` (404 until Task 8).

- [ ] **Step 6: Commit**

```bash
git add web/src/features/whiteboard web/src/app/[lng]/dashboard/whiteboard/page.jsx
git commit -m "feat(web): whiteboard sessions list page + create dialog"
```

---

## Task 8: Session detail page (students, link, activate) + route

**Files:**
- Create: `web/src/features/whiteboard/components/SessionStudentsPanel.jsx`
- Create: `web/src/features/whiteboard/pages/WhiteboardSessionDetailPage.jsx`
- Create: `web/src/app/[lng]/dashboard/whiteboard/[id]/page.jsx`

**Interfaces:**
- Consumes: `useRequest` for `GET /whiteboard-sessions/:id` and the action endpoints; the STUDENT picker (`STUDENTS_PICKER_URL`/`PARAMS`); `buildPrivateBoardPath`, `buildPublicBoardPath`.
- Produces: `WhiteboardSessionDetailPage({ sessionId })` default export; `SessionStudentsPanel({ session, onChanged })`.

- [ ] **Step 1: Create `SessionStudentsPanel.jsx`** — lists `session.students`, an autocomplete/select of STUDENT users to add, and a remove button per row.

```jsx
"use client";

import { useState } from "react";
import { Autocomplete, Box, Button, Chip, Stack, TextField, Typography } from "@mui/material";
import { MdClose } from "react-icons/md";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { WHITEBOARD_URL, STUDENTS_PICKER_URL, STUDENTS_PICKER_PARAMS } from "../config/constant.js";
import { useWhiteboardText } from "../config/whiteboardText.js";

export default function SessionStudentsPanel({ session, onChanged }) {
  const txt = useWhiteboardText();
  const [picked, setPicked] = useState(null);

  const { data: studentsData } = useRequest({
    url: STUDENTS_PICKER_URL, method: "get", isPaginated: true,
    autoFetch: true, initialParams: STUDENTS_PICKER_PARAMS,
  });
  const addReq = useRequest({ url: `${WHITEBOARD_URL}/${session.id}/students`, method: "post", autoFetch: false });

  const options = (studentsData ?? []).filter(
    (u) => !session.students.some((s) => s.studentId === u.id),
  );

  const add = async () => {
    if (!picked) return;
    const res = await addReq.fetchData({ body: { studentId: picked.id } });
    if (res?.success) { setPicked(null); onChanged?.(res.data); }
  };

  const remove = async (studentId) => {
    // one-shot delete; match useRequest's delete trigger signature
    const res = await addReq.fetchData({ url: `${WHITEBOARD_URL}/${session.id}/students/${studentId}`, method: "delete" });
    if (res?.success) onChanged?.(res.data);
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 1 }}>{txt.studentsCount}</Typography>
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <Autocomplete
          sx={{ minWidth: 260 }}
          options={options}
          value={picked}
          onChange={(_e, v) => setPicked(v)}
          getOptionLabel={(o) => o?.nickname || o?.name || ""}
          renderInput={(params) => <TextField {...params} label={txt.addStudent} />}
        />
        <Button variant="contained" onClick={add} disabled={!picked}>{txt.addStudent}</Button>
      </Stack>
      {session.students.length === 0 ? (
        <Typography color="text.secondary">{txt.noStudents}</Typography>
      ) : (
        <Stack direction="row" flexWrap="wrap" gap={1}>
          {session.students.map((s) => (
            <Chip
              key={s.id}
              label={s.student?.nickname || s.student?.name}
              onDelete={() => remove(s.studentId)}
              deleteIcon={<MdClose />}
            />
          ))}
        </Stack>
      )}
    </Box>
  );
}
```

(Confirm the STUDENT picker returns `{ id, name, nickname }` rows and the delete trigger signature; adjust `fetchData` calls to the real `useRequest` mutation API.)

- [ ] **Step 2: Create `WhiteboardSessionDetailPage.jsx`** — loads the session, shows meta + status actions + public/private toggle with copy-link + the big "Open board" button + `SessionStudentsPanel`.

```jsx
"use client";

import { useState } from "react";
import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import { MdOpenInFull, MdContentCopy, MdPlayArrow, MdStop, MdPublic, MdLock } from "react-icons/md";
import { PERMISSIONS } from "@ayah/shared";
import { usePermission } from "../../../hooks/usePermission.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useTranslation } from "../../../i18n/client.js";
import { config } from "../../../config/config.js";
import { WHITEBOARD_URL, WHITEBOARD_STATUS, WHITEBOARD_VISIBILITY, buildPrivateBoardPath } from "../config/constant.js";
import { useWhiteboardText } from "../config/whiteboardText.js";
import SessionStudentsPanel from "../components/SessionStudentsPanel.jsx";

export default function WhiteboardSessionDetailPage({ sessionId }) {
  const txt = useWhiteboardText();
  const { lng } = useTranslation();
  const { hasPermission } = usePermission();
  const canManage = hasPermission(PERMISSIONS.WHITEBOARD.MANAGE);
  const [publicUrl, setPublicUrl] = useState(null);

  const { data: session, refetch } = useRequest({
    url: `${WHITEBOARD_URL}/${sessionId}`, method: "get", autoFetch: canManage,
  });
  const action = useRequest({ url: WHITEBOARD_URL, method: "post", autoFetch: false });

  if (!canManage || !session) return null;

  const run = async (path) => {
    const res = await action.fetchData({ url: `${WHITEBOARD_URL}/${sessionId}/actions/${path}`, method: "post" });
    if (res?.success) {
      if (path === "make-public") setPublicUrl(res.data?.url ?? null);
      if (path === "make-private") setPublicUrl(null);
      refetch();
    }
  };

  const copyLink = async () => {
    const url = publicUrl ?? (session.visibility === WHITEBOARD_VISIBILITY.PUBLIC ? null : null);
    if (url) await navigator.clipboard.writeText(url);
  };

  const openBoard = () => {
    // open the full-screen private board in a new tab
    window.open(buildPrivateBoardPath(lng, session.id), "_blank");
  };

  return (
    <Box sx={{ p: 2 }}>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
        <Typography variant="h5">{session.title}</Typography>
        <Chip label={txt.statusLabels[session.status]} color={session.status === WHITEBOARD_STATUS.ACTIVE ? "success" : "default"} />
        <Chip label={txt.visibilityLabels[session.visibility]} variant="outlined" />
      </Stack>

      <Stack direction="row" spacing={1} flexWrap="wrap" gap={1} sx={{ mb: 3 }}>
        <Button variant="contained" size="large" startIcon={<MdOpenInFull />} onClick={openBoard}>
          {txt.openBoard}
        </Button>
        {session.status !== WHITEBOARD_STATUS.ACTIVE ? (
          <Button startIcon={<MdPlayArrow />} onClick={() => run("activate")}>{txt.activate}</Button>
        ) : (
          <Button startIcon={<MdStop />} onClick={() => run("end")}>{txt.end}</Button>
        )}
        {session.visibility === WHITEBOARD_VISIBILITY.PUBLIC ? (
          <Button startIcon={<MdLock />} onClick={() => run("make-private")}>{txt.makePrivate}</Button>
        ) : (
          <Button startIcon={<MdPublic />} onClick={() => run("make-public")}>{txt.makePublic}</Button>
        )}
        {publicUrl && (
          <Button startIcon={<MdContentCopy />} onClick={copyLink}>{txt.copyLink}</Button>
        )}
      </Stack>

      <SessionStudentsPanel session={session} onChanged={() => refetch()} />
    </Box>
  );
}
```

Note: the public URL from `make-public` is shown once (returned by the API). Persisting/re-deriving it across reloads is out of scope — the admin re-generates by toggling. (If a stable copy-link across reloads is wanted later, add `visibility`-aware link retrieval; not now.)

- [ ] **Step 3: Create the route `web/src/app/[lng]/dashboard/whiteboard/[id]/page.jsx`** (Next 16 async params, mirror `certificates/[id]/page.jsx`)

```jsx
import { Suspense } from "react";
import WhiteboardSessionDetailPage from "../../../../../../features/whiteboard/pages/WhiteboardSessionDetailPage.jsx";

export default async function Page({ params }) {
  const { id } = await params;
  return (
    <Suspense>
      <WhiteboardSessionDetailPage sessionId={id} />
    </Suspense>
  );
}
```

(Fix relative depth against a real `[id]/page.jsx`.)

- [ ] **Step 4: Verify the detail page**

Run: as admin, open a session from the list. Expected: meta + chips render; "فتح الجلسة" flips status to "مفتوحة"; "جعلها عامة" returns a URL and reveals "نسخ الرابط العام" (clipboard copy works); adding a student via the autocomplete adds a chip and the count updates; removing a chip removes it. "افتح السبورة" opens `/ar/board/<id>` in a new tab (blank until Task 9–11).

- [ ] **Step 5: Commit**

```bash
git add web/src/features/whiteboard/pages/WhiteboardSessionDetailPage.jsx web/src/features/whiteboard/components/SessionStudentsPanel.jsx "web/src/app/[lng]/dashboard/whiteboard/[id]/page.jsx"
git commit -m "feat(web): whiteboard session detail page (students, link, activate)"
```

---

## Task 9: Board core — Excalidraw wrapper, persistence, fullscreen

**Files:**
- Modify: `web/package.json` (add `@excalidraw/excalidraw`)
- Create: `web/src/features/whiteboard/board/lib/boardChannel.js`
- Create: `web/src/features/whiteboard/board/lib/useBoardPersistence.js`
- Create: `web/src/features/whiteboard/board/WhiteboardBoard.jsx`

**Interfaces:**
- Consumes: `@excalidraw/excalidraw` (`Excalidraw` component, `serializeAsJSON`).
- Produces: `boardChannel` (`saveScene(key, data)`, `loadScene(key)`, `emitReaction(reaction)` — local no-op stub for now); `useBoardPersistence(sessionKey)` → `{ initialData, onChange }`; `WhiteboardBoard({ sessionKey, title, students })` default export (renders Excalidraw + fullscreen + a slot for the reaction layer added in Task 10).

- [ ] **Step 1: Install Excalidraw**

Run: `cd web && npm install @excalidraw/excalidraw`
Expected: installs without peer-dep errors (React 18/19 compatible). Confirm: `ls web/node_modules/@excalidraw/excalidraw/dist`.

- [ ] **Step 2: Create `boardChannel.js`** — the seam. Today: `localStorage` for the scene; reactions are a local event emitter. Later: socket.

```js
// Thin transport seam for the whiteboard. Today it persists the drawing scene to
// localStorage and dispatches reactions on a local event bus. Later, swap the
// bodies to emit/subscribe over socket.io (session:<id> room) without touching
// the board components that call these functions.

const SCENE_PREFIX = "whiteboard:";
const reactionListeners = new Set();

export const boardChannel = {
  saveScene(sessionKey, data) {
    try {
      localStorage.setItem(SCENE_PREFIX + sessionKey, JSON.stringify(data));
    } catch {
      /* storage unavailable — board still works in-memory */
    }
  },
  loadScene(sessionKey) {
    try {
      const raw = localStorage.getItem(SCENE_PREFIX + sessionKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  emitReaction(reaction) {
    // reaction: { key, studentName? , id }
    for (const fn of reactionListeners) fn(reaction);
  },
  onReaction(fn) {
    reactionListeners.add(fn);
    return () => reactionListeners.delete(fn);
  },
};
```

- [ ] **Step 3: Create `useBoardPersistence.js`** — debounced save on Excalidraw change, restore on mount.

```js
import { useCallback, useMemo, useRef } from "react";
import { boardChannel } from "./boardChannel.js";

// Restores the saved scene and returns a debounced onChange that persists
// elements + a light appState subset. Keyed by sessionKey (session id or token).
export function useBoardPersistence(sessionKey) {
  const timer = useRef(null);

  const initialData = useMemo(() => {
    const saved = sessionKey ? boardChannel.loadScene(sessionKey) : null;
    if (!saved) return null;
    return {
      elements: saved.elements ?? [],
      appState: { ...(saved.appState ?? {}), collaborators: undefined },
      scrollToContent: true,
    };
  }, [sessionKey]);

  const onChange = useCallback(
    (elements, appState) => {
      if (!sessionKey) return;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        boardChannel.saveScene(sessionKey, {
          elements,
          // Persist only stable view/theme bits, not transient UI/pointer state.
          appState: {
            viewBackgroundColor: appState?.viewBackgroundColor,
            theme: appState?.theme,
            zoom: appState?.zoom,
            scrollX: appState?.scrollX,
            scrollY: appState?.scrollY,
          },
        });
      }, 500);
    },
    [sessionKey],
  );

  return { initialData, onChange };
}
```

- [ ] **Step 4: Create `WhiteboardBoard.jsx`** — dynamically import Excalidraw (SSR-unsafe), full-viewport, fullscreen toggle. Leave a placeholder `<div>` where the reaction layer mounts in Task 10.

```jsx
"use client";

import { useRef } from "react";
import dynamic from "next/dynamic";
import { Box, IconButton, Tooltip } from "@mui/material";
import { MdFullscreen } from "react-icons/md";
import "@excalidraw/excalidraw/index.css";
import { useBoardPersistence } from "./lib/useBoardPersistence.js";

// Excalidraw touches window/document — never SSR it.
const Excalidraw = dynamic(
  async () => (await import("@excalidraw/excalidraw")).Excalidraw,
  { ssr: false },
);

export default function WhiteboardBoard({ sessionKey, title, students = [] }) {
  const rootRef = useRef(null);
  const { initialData, onChange } = useBoardPersistence(sessionKey);

  const goFullscreen = () => {
    const el = rootRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen?.();
    else el.requestFullscreen?.();
  };

  return (
    <Box ref={rootRef} sx={{ position: "fixed", inset: 0, bgcolor: "#fff" }}>
      <Box sx={{ position: "absolute", inset: 0 }}>
        <Excalidraw
          initialData={initialData}
          onChange={onChange}
          langCode="ar"
          UIOptions={{ canvasActions: { loadScene: false, saveToActiveFile: false } }}
        />
      </Box>

      {/* Fullscreen toggle (top-inline-start, above the canvas) */}
      <Box sx={{ position: "absolute", top: 12, insetInlineEnd: 12, zIndex: 5 }}>
        <Tooltip title={title || ""}>
          <IconButton onClick={goFullscreen} sx={{ bgcolor: "background.paper", boxShadow: 2 }}>
            <MdFullscreen />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Reaction layer mounts here in Task 10 */}
      <div id="whiteboard-reaction-slot" />
    </Box>
  );
}
```

(Confirm the Excalidraw CSS import path for the installed version — recent versions use `@excalidraw/excalidraw/index.css`; older use `.../dist/excalidraw.min.css`. Use whichever exists under `node_modules`.)

- [ ] **Step 5: Temporary harness to verify the board in isolation.** Create `web/src/app/[lng]/board/[id]/page.jsx` as a minimal wrapper for now (Task 11 finalizes data-loading):

```jsx
"use client";
import { use } from "react";
import WhiteboardBoard from "../../../../features/whiteboard/board/WhiteboardBoard.jsx";
export default function Page({ params }) {
  const { id } = use(params);
  return <WhiteboardBoard sessionKey={`s-${id}`} title="Board" students={[]} />;
}
```

- [ ] **Step 6: Verify the board renders + persists**

Run: open `http://localhost:3008/ar/board/1` as admin. Expected: Excalidraw fills the screen; you can draw with the pen, type Arabic text, erase; the fullscreen button expands to true full-screen; after drawing, refresh the page → the drawing is restored from `localStorage` (key `whiteboard:s-1`).

- [ ] **Step 7: Commit**

```bash
git add web/package.json web/package-lock.json web/src/features/whiteboard/board "web/src/app/[lng]/board/[id]/page.jsx"
git commit -m "feat(web): whiteboard board core (Excalidraw + localStorage persistence + fullscreen)"
```

---

## Task 10: Reactions — config, bar, overlay, sounds

**Files:**
- Create: `web/src/features/whiteboard/board/lib/boardSounds.js`
- Create: `web/src/features/whiteboard/board/config/reactions.js`
- Create: `web/src/features/whiteboard/board/ReactionOverlay.jsx`
- Create: `web/src/features/whiteboard/board/ReactionBar.jsx`
- Modify: `web/src/features/whiteboard/board/WhiteboardBoard.jsx` (wire the bar + overlay)

**Interfaces:**
- Consumes: `boardChannel.emitReaction`/`onReaction`; the session `students` (`[{ id, name }]`).
- Produces: `playReactionSound(kind)`; `REACTIONS` array (`{ key, emoji, labelAr, labelEn, sound, praiseAr }`); `ReactionOverlay({ students })`; `ReactionBar({ students, onFire })`.

- [ ] **Step 1: Create `boardSounds.js`** — self-contained Web Audio playful tones (no asset files; works offline). If the games engine exposes a reusable sound util, prefer importing it; otherwise use this.

```js
// Playful, asset-free sounds via Web Audio. One AudioContext, lazily created and
// resumed on first user gesture (the reaction click itself is a gesture).
let ctx = null;
function ac() {
  if (typeof window === "undefined") return null;
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}
function tone(freq, start, dur, type = "sine", gain = 0.15) {
  const a = ac();
  if (!a) return;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, a.currentTime + start);
  g.gain.linearRampToValueAtTime(gain, a.currentTime + start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + start + dur);
  osc.connect(g).connect(a.destination);
  osc.start(a.currentTime + start);
  osc.stop(a.currentTime + start + dur);
}

// Distinct little motifs per reaction kind.
const MOTIFS = {
  cheer: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, i * 0.09, 0.25, "triangle")),
  pop: () => tone(880, 0, 0.12, "square", 0.2),
  clap: () => [300, 260, 320].forEach((f, i) => tone(f, i * 0.06, 0.08, "sawtooth", 0.12)),
  sparkle: () => [1200, 1600, 2000].forEach((f, i) => tone(f, i * 0.05, 0.18, "sine", 0.1)),
  firework: () => { tone(120, 0, 0.2, "sine", 0.2); [800, 1000, 1300].forEach((f, i) => tone(f, 0.18 + i * 0.04, 0.2, "triangle", 0.1)); },
};

export function playReactionSound(kind) {
  (MOTIFS[kind] || MOTIFS.cheer)();
}
```

- [ ] **Step 2: Create `config/reactions.js`**

```js
// The playful reaction palette. Each fires a burst animation + a sound; some
// carry an optional praise phrase that can be personalised with a student name.
export const REACTIONS = [
  { key: "balloons", emoji: "🎈", labelAr: "بالونات", labelEn: "Balloons", sound: "pop", praiseAr: null },
  { key: "star", emoji: "⭐", labelAr: "شاطر", labelEn: "Great", sound: "cheer", praiseAr: "شاطر" },
  { key: "clap", emoji: "👏", labelAr: "تصفيق", labelEn: "Clap", sound: "clap", praiseAr: null },
  { key: "heart", emoji: "❤️", labelAr: "قلوب", labelEn: "Hearts", sound: "sparkle", praiseAr: null },
  { key: "firework", emoji: "🎆", labelAr: "ألعاب نارية", labelEn: "Fireworks", sound: "firework", praiseAr: null },
  { key: "mashallah", emoji: "🌟", labelAr: "ما شاء الله", labelEn: "Bravo", sound: "cheer", praiseAr: "ما شاء الله" },
];

// Number of floating emoji particles per burst.
export const BURST_COUNT = 14;
```

- [ ] **Step 3: Create `ReactionOverlay.jsx`** — listens to `boardChannel.onReaction`, renders bursts of floating emoji + optional centered praise text. Uses CSS keyframe animations (RTL-safe, pointer-events:none so it never blocks drawing).

```jsx
"use client";

import { useEffect, useState } from "react";
import { Box, keyframes } from "@mui/material";
import { boardChannel } from "./lib/boardChannel.js";
import { REACTIONS, BURST_COUNT } from "./config/reactions.js";

const floatUp = keyframes`
  0%   { transform: translateY(0) scale(0.6); opacity: 0; }
  15%  { opacity: 1; }
  100% { transform: translateY(-90vh) scale(1.1); opacity: 0; }
`;
const popIn = keyframes`
  0%   { transform: translate(-50%, -50%) scale(0.2); opacity: 0; }
  20%  { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
  80%  { transform: translate(-50%, -50%) scale(1); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(1.4); opacity: 0; }
`;

export default function ReactionOverlay() {
  const [bursts, setBursts] = useState([]); // { id, emoji, praise, particles:[{left,delay,dur,size}] }

  useEffect(() => {
    return boardChannel.onReaction((r) => {
      const def = REACTIONS.find((x) => x.key === r.key);
      if (!def) return;
      const particles = Array.from({ length: BURST_COUNT }).map((_, i) => ({
        left: 5 + ((i * 97) % 90), // spread across width, deterministic (no Math.random needed)
        delay: (i % 7) * 0.12,
        dur: 2.4 + (i % 5) * 0.3,
        size: 26 + (i % 4) * 8,
      }));
      const praise = def.praiseAr
        ? r.studentName ? `${def.praiseAr} يا ${r.studentName}` : def.praiseAr
        : null;
      const burst = { id: r.id, emoji: def.emoji, praise, particles };
      setBursts((b) => [...b, burst]);
      setTimeout(() => setBursts((b) => b.filter((x) => x.id !== burst.id)), 4200);
    });
  }, []);

  return (
    <Box sx={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 4 }}>
      {bursts.map((burst) => (
        <Box key={burst.id}>
          {burst.particles.map((p, i) => (
            <Box
              key={i}
              sx={{
                position: "absolute", bottom: 0, insetInlineStart: `${p.left}%`,
                fontSize: p.size, animation: `${floatUp} ${p.dur}s ease-out ${p.delay}s forwards`,
              }}
            >
              {burst.emoji}
            </Box>
          ))}
          {burst.praise && (
            <Box
              sx={{
                position: "absolute", top: "40%", insetInlineStart: "50%",
                transform: "translate(-50%, -50%)", animation: `${popIn} 3.2s ease-out forwards`,
                fontSize: { xs: 40, md: 72 }, fontWeight: 800, color: "#ff7a00",
                textShadow: "0 3px 0 #fff, 0 6px 18px rgba(0,0,0,.25)", whiteSpace: "nowrap",
              }}
            >
              {burst.praise}
            </Box>
          )}
        </Box>
      ))}
    </Box>
  );
}
```

- [ ] **Step 4: Create `ReactionBar.jsx`** — collapsible bottom bar: an optional student selector (from session students) + a button per reaction. Firing calls `onFire(reactionKey, studentName)`.

```jsx
"use client";

import { useState } from "react";
import { Box, Chip, IconButton, MenuItem, Select, Stack } from "@mui/material";
import { MdEmojiEmotions, MdExpandMore } from "react-icons/md";
import { REACTIONS } from "./config/reactions.js";

export default function ReactionBar({ students = [], onFire }) {
  const [open, setOpen] = useState(true);
  const [studentId, setStudentId] = useState("");

  const nameFor = (id) => students.find((s) => String(s.id) === String(id))?.name || null;

  return (
    <Box sx={{ position: "absolute", insetInline: 0, bottom: 0, zIndex: 6, pointerEvents: "none" }}>
      <Stack alignItems="center" sx={{ pointerEvents: "none" }}>
        <IconButton onClick={() => setOpen((v) => !v)} sx={{ pointerEvents: "auto", bgcolor: "background.paper", boxShadow: 2, mb: 1 }}>
          {open ? <MdExpandMore /> : <MdEmojiEmotions />}
        </IconButton>
        {open && (
          <Stack
            direction="row" spacing={1} alignItems="center"
            sx={{ pointerEvents: "auto", bgcolor: "background.paper", borderRadius: 3, boxShadow: 4, px: 2, py: 1, mb: 2, flexWrap: "wrap", maxWidth: "95vw" }}
          >
            {students.length > 0 && (
              <Select
                size="small" displayEmpty value={studentId}
                onChange={(e) => setStudentId(e.target.value)} sx={{ minWidth: 140 }}
              >
                <MenuItem value=""><em>بدون اسم</em></MenuItem>
                {students.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
              </Select>
            )}
            {REACTIONS.map((r) => (
              <Chip
                key={r.key} clickable label={`${r.emoji} ${r.labelAr}`}
                onClick={() => onFire(r.key, nameFor(studentId))}
                sx={{ fontSize: 18, py: 2.2 }}
              />
            ))}
          </Stack>
        )}
      </Stack>
    </Box>
  );
}
```

- [ ] **Step 5: Wire the bar + overlay into `WhiteboardBoard.jsx`.** Replace the `<div id="whiteboard-reaction-slot" />` placeholder and add the fire handler + imports.

Add imports at the top:
```jsx
import ReactionOverlay from "./ReactionOverlay.jsx";
import ReactionBar from "./ReactionBar.jsx";
import { boardChannel } from "./lib/boardChannel.js";
import { playReactionSound } from "./lib/boardSounds.js";
import { REACTIONS } from "./config/reactions.js";
```

Add a counter ref + handler inside the component (before `return`):
```jsx
const burstId = useRef(0);
const fire = (key, studentName) => {
  const def = REACTIONS.find((r) => r.key === key);
  playReactionSound(def?.sound);
  boardChannel.emitReaction({ id: ++burstId.current, key, studentName });
};
```

Replace the placeholder div with:
```jsx
<ReactionOverlay />
<ReactionBar students={students} onFire={fire} />
```

- [ ] **Step 6: Verify reactions**

Run: open `http://localhost:3008/ar/board/1`. Expected: the bottom reaction bar shows; clicking 🎈/⭐/👏/❤️/🎆/🌟 launches a burst of floating emoji with a distinct sound; "شاطر" and "ما شاء الله" show big centered praise text; picking a student name from the selector makes praise read "شاطر يا {اسم}"; reactions never block drawing (you can draw through them).

- [ ] **Step 7: Commit**

```bash
git add web/src/features/whiteboard/board
git commit -m "feat(web): whiteboard playful reactions (bursts, praise, Web Audio sounds)"
```

---

## Task 11: Finalize board routes — private (auth by id) + public (token)

**Files:**
- Modify: `web/src/app/[lng]/board/[id]/page.jsx` (load the real session)
- Create: `web/src/features/whiteboard/board/BoardLoader.jsx` (shared data-loading wrapper)
- Create: `web/src/app/[lng]/w/[token]/page.jsx` (public token board)

**Interfaces:**
- Consumes: `useRequest` (private: `GET /whiteboard-sessions/:id`; public: `apiFetch.public` via `useRequest({ isPublic: true })` against `whiteboard-sessions/public/:token`), `WhiteboardBoard`.
- Produces: `BoardLoader({ mode: "private"|"public", idOrToken })` — fetches session meta, maps to `{ sessionKey, title, students:[{id,name}] }`, renders `WhiteboardBoard` or the unavailable state.

- [ ] **Step 1: Create `BoardLoader.jsx`** — normalizes both data sources into the `WhiteboardBoard` props and handles the "unavailable" state for a bad/expired public token.

```jsx
"use client";

import { Box, CircularProgress, Typography } from "@mui/material";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { WHITEBOARD_URL } from "../config/constant.js";
import { useWhiteboardText } from "../config/whiteboardText.js";
import WhiteboardBoard from "./WhiteboardBoard.jsx";

// mode: "private" (authed, by id) | "public" (token, no auth)
export default function BoardLoader({ mode, idOrToken }) {
  const txt = useWhiteboardText();
  const isPublic = mode === "public";
  const url = isPublic
    ? `${WHITEBOARD_URL}/public/${idOrToken}`
    : `${WHITEBOARD_URL}/${idOrToken}`;

  const { data, isLoading, error } = useRequest({
    url, method: "get", isPublic, autoFetch: true, shouldAutoToast: false,
  });

  if (isLoading) {
    return <Box sx={{ position: "fixed", inset: 0, display: "grid", placeItems: "center" }}><CircularProgress /></Box>;
  }
  if (error || !data) {
    return (
      <Box sx={{ position: "fixed", inset: 0, display: "grid", placeItems: "center", p: 3, textAlign: "center" }}>
        <Typography variant="h5">{txt.unavailable}</Typography>
      </Box>
    );
  }

  // Private detail returns students:[{ id, studentId, student:{ id, name, nickname }}];
  // public returns students:[{ id, name }]. Normalize to [{ id, name }].
  const students = (data.students ?? []).map((s) =>
    s.student ? { id: s.student.id, name: s.student.nickname || s.student.name } : { id: s.id, name: s.name },
  );

  return (
    <WhiteboardBoard
      sessionKey={isPublic ? `t-${idOrToken}` : `s-${data.id}`}
      title={data.title}
      students={students}
    />
  );
}
```

(Confirm `useRequest` returns an `error` field and accepts `isPublic`/`shouldAutoToast` per the hook's real API; adjust names if different.)

- [ ] **Step 2: Replace `web/src/app/[lng]/board/[id]/page.jsx`** with the real loader

```jsx
import { Suspense } from "react";
import BoardLoader from "../../../../features/whiteboard/board/BoardLoader.jsx";

export default async function Page({ params }) {
  const { id } = await params;
  return (
    <Suspense>
      <BoardLoader mode="private" idOrToken={id} />
    </Suspense>
  );
}
```

(Match the relative depth of other `[lng]/.../page.jsx` files.)

- [ ] **Step 3: Create `web/src/app/[lng]/w/[token]/page.jsx`**

```jsx
import { Suspense } from "react";
import BoardLoader from "../../../../features/whiteboard/board/BoardLoader.jsx";

export default async function Page({ params }) {
  const { token } = await params;
  return (
    <Suspense>
      <BoardLoader mode="public" idOrToken={token} />
    </Suspense>
  );
}
```

- [ ] **Step 4: Full end-to-end verification**

Run: with both dev servers up:
1. As admin: create a session, add 2 students, activate, click "افتح السبورة" → `/ar/board/<id>` loads the board with the 2 students available in the reaction selector; draw + fire reactions; refresh → drawing restored.
2. Click "جعلها عامة", copy the link → open the `/ar/w/<token>` URL in a private/incognito window (NOT logged in) → the board loads (public), student names present, drawing + reactions work; its localStorage key is `whiteboard:t-<token>` (separate from the private board's scene).
3. Back as admin: "جعلها خاصة" → reopen the same public link in incognito → shows "الجلسة غير متاحة".
4. Log out entirely and visit `/ar/board/<id>` → redirected to `/ar/login` (the `/board` protected prefix works).

- [ ] **Step 5: Commit**

```bash
git add "web/src/app/[lng]/board/[id]/page.jsx" "web/src/app/[lng]/w/[token]/page.jsx" web/src/features/whiteboard/board/BoardLoader.jsx
git commit -m "feat(web): finalize whiteboard board routes (private by id, public by token)"
```

---

## Self-Review (completed during authoring)

**Spec coverage:**
- Admin-only session CRUD → Tasks 1–5. ✓
- Real-student attach/detach → Task 4 (`addStudent` rejects non-STUDENT), Task 8 (picker). ✓
- Activate/end lifecycle → Tasks 4–5, 8. ✓
- Public/private token link (hashed, public route before auth) → Tasks 2 (`publicTokenHash @unique`), 4 (`makePublic`/`getPublicByToken`), 5 (route order). ✓
- Full-screen board outside dashboard shell → Tasks 9, 11 (`/board`, `/w` routes; `position:fixed inset:0`). ✓
- Excalidraw professional drawing → Task 9. ✓
- Playful reactions + sounds + optional student name → Task 10. ✓
- localStorage-only drawing persistence → Task 9 (`boardChannel`/`useBoardPersistence`). ✓
- Socket-ready seam (not built) → Task 9 (`boardChannel`). ✓
- Nav item + permission gating + i18n codes → Tasks 1, 6. ✓
- `/board` protected, `/w` public → Task 6 (`PROTECTED_PREFIXES`), verified Task 11 Step 4. ✓

**Type/name consistency:** repo method names (`getByIdWithStudents`, `getByTokenHash`, `setPublic`/`setPrivate`, `findStudentLink`) are used identically across repo (Task 3) and usecase (Task 4); `boardChannel.emitReaction`/`onReaction`, `saveScene`/`loadScene` consistent across Tasks 9–11; `sessionKey` prop consistent (`WhiteboardBoard` ↔ `BoardLoader`); message codes identical between Task 1 (definition), Task 5 (controller use), Task 6 (localization).

**Assumptions the implementer must confirm against real files (flagged inline):** exact `useRequest` mutation trigger signature; `DataTable` prop/column contract; `userRepo.getById` name + returned `role`; `ENV.appUrl` config path; `conflict` AppError factory presence; Excalidraw CSS import path for the installed version; `messagesCodes.js` nesting shape. Each is called out in the step where it matters.
