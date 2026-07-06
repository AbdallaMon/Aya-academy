# Interactive Whiteboard — Design Spec

Date: 2026-07-05
Status: Approved (design), pending implementation plan

## 1. Goal

An interactive, full-screen whiteboard for teachers (admins only, for now) to run a
live-feel lesson: create a session, attach the students who will attend, open the board
full-screen, draw/write/erase, and fire playful kid-friendly reactions (balloons, stars,
"شاطر", claps, fireworks) with sounds — optionally targeted at a named student.

Only the **session lifecycle** is persisted on the backend (so we can reopen a session
after a disconnect and later evolve it into a real-time, multi-participant board over
socket.io). The **drawing content itself is NOT persisted server-side** — it lives in the
browser's `localStorage`, keyed by session.

## 2. Scope (what we build now / what we defer)

In scope now:
- Backend `whiteboardSessions` module: session CRUD + student attach/detach + activate/end
  + public/private link with token. Admin-only.
- Frontend: list page, session detail page (manage students, public/private link, open
  board), and the full-screen board itself (Excalidraw + custom reaction overlay + sounds).
- Public share link (token) that renders the board outside the dashboard, no login.
- Drawing persisted to `localStorage` only.

Deferred (design accommodates, we do NOT build now):
- Real-time multi-participant sync (drawing + reactions) over socket.io. The board talks to
  a thin `boardChannel` abstraction that writes locally today; socket emit/subscribe is a
  later swap.
- Non-admin roles (students/parents) joining a session.

## 3. Key decisions

- **Students = real accounts only.** A "student" is an existing `User` with
  `role = STUDENT`. Attaching a student to a session uses the existing users listing
  endpoint (filtered `role=STUDENT`) — no new picker endpoint. No ad-hoc/guest names.
- **Drawing engine = Excalidraw** (`@excalidraw/excalidraw`), dynamically imported with
  `ssr: false`. Chosen for a professional, battle-tested, kid-friendly hand-drawn board
  with pen/highlighter/eraser/Arabic text/shapes/colors/undo-redo out of the box.
- **Reactions = our own overlay layer** rendered above the Excalidraw canvas, driven by
  React + the existing games sound engine. Reactions are ephemeral animations, never part
  of the Excalidraw scene.
- **Admin-only** gating via a single new permission `WHITEBOARD_SESSION_MANAGE` granted to
  the `ADMIN` role profile.

## 4. Backend

New module: `server/src/modules/whiteboardSessions/` with the standard layering
(route → controller → usecase → repo → validation → dto → messages), Prisma only in the
repo, business logic only in the usecase, `AppError` + message codes, audit on important
actions. Registered in `server/src/routes.js` at `/whiteboard-sessions` (public sub-router
mounted before the guarded router on the same prefix).

### 4.1 Data model (Prisma)

New enums (add to `schema.prisma` AND mirror in `packages/shared/constants/enums.js`):

```
enum WhiteboardSessionStatus { DRAFT ACTIVE ENDED }
enum WhiteboardVisibility    { PRIVATE PUBLIC }
```

New models:

```
model WhiteboardSession {
  id              Int         @id @default(autoincrement())
  title           String
  status          WhiteboardSessionStatus @default(DRAFT)
  visibility      WhiteboardVisibility    @default(PRIVATE)
  publicTokenHash String?     @unique       // SHA-256 of the raw share token; null when private
  createdById     Int
  createdBy       User        @relation("WhiteboardCreatedBy", fields: [createdById], references: [id])
  students        WhiteboardSessionStudent[]
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  @@index([createdById])
  @@index([status])
}

model WhiteboardSessionStudent {
  id        Int   @id @default(autoincrement())
  sessionId Int
  studentId Int
  session   WhiteboardSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  student   User              @relation("WhiteboardStudent", fields: [studentId], references: [id])
  createdAt DateTime @default(now())
  @@unique([sessionId, studentId])
  @@index([studentId])
}
```

Corresponding back-relations added to `User`. Migration is authored but NOT auto-run —
the `prisma migrate` command is handed to Abdalla (per project rule).

### 4.2 Endpoints (all admin-only unless marked public)

Guarded router (`requireAuth` + `requirePermissions([WHITEBOARD_SESSION_MANAGE])`):
- `GET  /whiteboard-sessions` — paginated list (own/all per admin scope).
- `POST /whiteboard-sessions` — create `{ title }` → status `DRAFT`, visibility `PRIVATE`.
- `GET  /whiteboard-sessions/:id` — detail incl. attached students (dto: id, name only).
- `DELETE /whiteboard-sessions/:id` — hard delete (cascades join rows).
- `POST /whiteboard-sessions/:id/students` — `{ studentId }` attach (validates the user is
  role STUDENT; idempotent-safe via unique constraint → conflict code).
- `DELETE /whiteboard-sessions/:id/students/:studentId` — detach.
- `POST /whiteboard-sessions/:id/actions/activate` — `DRAFT|ENDED → ACTIVE`.
- `POST /whiteboard-sessions/:id/actions/end` — `ACTIVE → ENDED`.
- `POST /whiteboard-sessions/:id/actions/make-public` — set `PUBLIC`, generate raw token,
  store only its hash, return `{ token, url }` (`/{lng}/w/{token}`).
- `POST /whiteboard-sessions/:id/actions/make-private` — set `PRIVATE`, clear token hash.

Public router (mounted BEFORE `requireAuth`):
- `GET /whiteboard-sessions/public/:token` — hash the incoming token, look up the session;
  return minimal payload (title + student names) ONLY if `visibility=PUBLIC`. Otherwise
  `notFound`. Does not require it to be `ACTIVE` to render (teacher may open before
  activating); status is returned so the client can show state.

### 4.3 Messages / codes

`packages/shared/messages-codes/whiteboardSession.js` (bilingual ar+en on the web side per
project rule), namespace registered in `packages/shared/messages-names.js`, thin re-export
in `whiteboardSession.messages.js`. Codes: created, deleted, activated, ended, made-public,
made-private, student-added, student-removed, not-found, student-already-added,
not-a-student, forbidden.

### 4.4 Permissions

Add `WHITEBOARD_SESSION_MANAGE` to `packages/shared/constants/permissions.js` and to the
`ADMIN` role profile only. No wildcards.

## 5. Frontend

Feature folder: `web/src/features/whiteboard/`

- `config/constant.js` — endpoint constants (`WHITEBOARD_URL = "whiteboard-sessions"`),
  status/visibility option constants, `buildPublicBoardUrl(lng, token)`,
  `buildPrivateBoardUrl(lng, id)`.
- `config/whiteboardText.js` — `useWhiteboardText()` localized labels.
- `config/whiteboardColumns.js` — DataTable columns (title, status chip, visibility,
  #students, createdAt, actions).
- `pages/WhiteboardListPage.jsx` — `PageHeader` + `DataTable` + `useRequest` (paginated),
  create dialog, row actions (open detail, activate/end, delete, copy public link),
  `usePermission` gate.
- `pages/WhiteboardSessionDetailPage.jsx` — session meta, student management (add via
  existing STUDENT user picker / remove), Public↔Private switch + copy-link, activate/end,
  a prominent **"افتح السبورة (ملء الشاشة)"** button linking to the private board route.
- `components/CreateWhiteboardDialog.jsx` — `AppForm` + RHF (`{ title }`).
- `components/SessionStudentsPanel.jsx` — attached students list + add/remove.
- `board/` — the board itself:
  - `WhiteboardBoard.jsx` — orchestrator: dynamic `Excalidraw` (`ssr:false`) +
    `ReactionOverlay` + `ReactionBar` + Fullscreen toggle. Props: `{ sessionKey, students,
    title }`. Source-agnostic (works for private and public).
  - `ReactionBar.jsx` — bottom, collapsible; buttons per reaction + optional student
    `Select` (from session students; selection optional).
  - `ReactionOverlay.jsx` — absolutely-positioned layer above the canvas; renders active
    reaction animations (balloons rising, star burst, hearts, fireworks, praise text).
  - `config/reactions.js` — reaction registry: `{ key, emoji/visual, labelKey, sound,
    render }`. Reactions: balloons, "شاطر"/stars, clap, hearts, fireworks, "ما شاء الله /
    برافو / أحسنت".
  - `lib/boardChannel.js` — thin abstraction: `saveScene`, `loadScene`, `emitReaction`.
    Today: `localStorage` (key `whiteboard:<sessionKey>`) + local event. Later: socket.
  - `lib/useBoardPersistence.js` — debounced Excalidraw `onChange` → `boardChannel.saveScene`;
    restores via `initialData` on mount.
  - sound: reuse the games engine sound API; if not directly importable, a small
    `lib/boardSounds.js` wrapper.

## 6. Routes

Dashboard (inside `DashboardShell`):
- `app/[lng]/dashboard/whiteboard/page.jsx` → `WhiteboardListPage`.
- `app/[lng]/dashboard/whiteboard/[id]/page.jsx` → `WhiteboardSessionDetailPage` (Next 16
  async `params`).

Full-screen board (OUTSIDE the dashboard shell so it fills the screen with no sidebar):
- Private: `app/[lng]/board/[id]/page.jsx` → `WhiteboardBoard` fed by the authed
  `GET /whiteboard-sessions/:id`. Add `'/board'` to `PROTECTED_PREFIXES` in
  `web/src/utils/constant.js` so an unauthenticated visitor is redirected to login.
- Public: `app/[lng]/w/[token]/page.jsx` → `WhiteboardBoard` fed by the public
  `GET /whiteboard-sessions/public/:token` via `apiFetch.public`.

Nav: add a whiteboard item to the ADMIN group in
`web/src/features/dashboard/config/navModel.js`, gated on `WHITEBOARD_SESSION_MANAGE`.

## 7. Persistence & realtime

- Drawing scene → `localStorage` key `whiteboard:<sessionId | token>`. Restored on refresh /
  reconnect. Never sent to the backend.
- Reactions are ephemeral (fire-and-forget animations); not persisted.
- Realtime is deferred: `boardChannel` is the seam. When we add socket, `emitReaction` and
  scene deltas publish to a `session:<id>` room (infra already exists in
  `server/src/infra/realtime/socket.js`), and the public board becomes a live viewer.

## 8. Error handling

- Backend: `AppError` factories + module message codes; scope check ensures an admin can
  only manage sessions they're allowed to (mirror the users-module scoping pattern —
  ADMIN sees all for now). Adding a non-STUDENT user → `not-a-student` (400). Duplicate
  attach → `student-already-added` (409). Missing session/token → `not-found` (404).
- Frontend: `useRequest` code-based auto-toasts. Public board: on invalid/expired token,
  render a friendly "الجلسة غير متاحة" state. Board: if Excalidraw fails to load, show a
  retry; if `localStorage` unavailable, board still works in-memory (warn once).

## 9. Testing

- Usecase tests: create/activate/end transitions, make-public generates+hashes token and
  make-private clears it, attach rejects non-STUDENT and duplicate, public lookup returns
  only PUBLIC sessions.
- Authorization tests: non-admin (no `WHITEBOARD_SESSION_MANAGE`) is forbidden on all
  guarded routes; public route needs no auth but leaks nothing for PRIVATE sessions.
- Frontend: list renders + create dialog submits; detail add/remove student; nav item
  hidden without permission; board persists to and restores from localStorage.

## 10. Out of scope (explicit)

- Real-time sync, student/parent participation, saving drawings server-side, recording/
  playback, exporting the board to the reports module.
