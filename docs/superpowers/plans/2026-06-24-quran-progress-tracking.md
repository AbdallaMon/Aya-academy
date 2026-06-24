# Quran Progress Tracking + Lesson Next-Plan — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Track each student's Quran memorization progress (30 juz' / 114 surahs, segment-accurate) and let the ADMIN set a "next-time" plan (memorize / review / homework) on each lesson.

**Architecture:** Layered Express + Prisma backend (route → controller → usecase → repo → validation → dto + messages). New `quran` module for reference reads + per-student progress; the existing `sessions` module is extended with a `/plan` action. Reference data (surahs, juz', juz-segments) is seeded once and read-only at runtime. Frontend follows the config-driven `features/<x>` shape (DataTable/useRequest, AppForm + RHF, `usePermission` gating, i18n).

**Tech Stack:** Node ESM, Express 5, Prisma 7 (MySQL/MariaDB adapter), Zod 4, `@aya/shared` (constants + message codes), Next.js App Router + MUI + react-hook-form.

## Global Constraints

- **No TypeScript in app source** — backend and seed are `.js` ESM; web app code is `.jsx`/`.js` (never `.tsx` for app components — stale `.tsx` shadows are a known bug; see memory).
- **Prisma only in repos** — no `prisma` import outside `*.repo.js` / `seed.js`. No business logic in routes/controllers.
- **Authorize on permission codes, never role names.** Every mutating endpoint also enforces object-scope (admin=all, parent=linked children, student=self).
- **Language-neutral message CODES only** — never raw user-facing strings in errors. Every new code defined in `@aya/shared` and given **ar + en** localization on the web side.
- **Enums mirrored in three places** must stay in sync: `packages/db/prisma/schema.prisma`, `packages/shared/constants/enums.js`.
- **No test runner exists** in this repo. "Verify" steps use: `prisma validate`, `prisma migrate dev`, `npm run db:seed`, a one-off node assertion script, `npm run build -w web`, and manual endpoint smoke checks via `curl`. Do **not** add a test framework.
- **No audit logging** for these endpoints — the sibling `sessions` module does not audit; follow that precedent.
- ID convention: `Int @id @default(autoincrement())`; operational models carry `createdAt`/`updatedAt`; long text uses `@db.Text`.

---

## File Structure

**Schema / data:**
- Modify `packages/db/prisma/schema.prisma` — 3 reference models, 1 progress model, 1 lesson-assignment model, 2 `LessonSession` fields, 3 enums, `User` back-relations.
- Create `packages/db/prisma/data/quran.data.js` — exported `SURAHS`, `JUZ`, `SEGMENTS` arrays (canonical data).
- Modify `packages/db/prisma/seed.js` — add `seedQuran()` and call it from `main()`.
- Create `packages/db/prisma/verify-quran.js` — standalone invariant check (not wired to runtime).

**Shared:**
- Modify `packages/shared/constants/enums.js` — `REVELATION_PLACES`, `SEGMENT_STATUSES`, `LESSON_ASSIGNMENT_KINDS`.
- Modify `packages/shared/constants/permissions.js` — `QURAN_PERMISSIONS` + register in `PERMISSIONS` + parent/student profiles.
- Create `packages/shared/messages-codes/quran.js` — `quranMessagesCodes`.
- Modify `packages/shared/messages-codes/session.js` — 3 new codes.
- Modify `packages/shared/messages-codes/index.js` — export quran codes.
- Modify `packages/shared/messages-names.js` — add `quranMessages`.

**Backend (`Server/src/modules/quran/`):** `quran.route.js`, `quran.controller.js`, `quran.usecase.js`, `quran.repo.js`, `quran.validation.js`, `quran.dto.js`, `quran.messages.js`.
- Modify `Server/src/routes.js` — mount `/quran`.
- Modify `Server/src/modules/sessions/`: `session.route.js`, `session.controller.js`, `session.usecase.js`, `session.repo.js`, `session.validation.js`, `session.dto.js`, `session.messages.js` — add the `/plan` action + include plan in `getById`.

**Frontend (`web/src/`):** a `quran` feature (API hooks + reference cache), a progress editor mounted in the student-detail screen, a "next plan" section in the session create/edit form, and dashboard progress widgets. Exact files determined against existing feature examples during the frontend tasks.

---

## PHASE A — Data layer

### Task A1: Schema — enums, reference models, progress + lesson-assignment models

**Files:**
- Modify: `packages/db/prisma/schema.prisma`
- Modify: `packages/shared/constants/enums.js`

**Interfaces:**
- Produces (Prisma models): `QuranSurah`, `QuranJuz`, `QuranJuzSegment`, `StudentSegmentProgress`, `LessonAssignment`; enums `RevelationPlace`, `SegmentStatus`, `LessonAssignmentKind`; new `LessonSession.homework` + `LessonSession.assignments`.
- Produces (JS enum constants): `REVELATION_PLACES`, `SEGMENT_STATUSES`, `LESSON_ASSIGNMENT_KINDS`.

- [ ] **Step 1: Add the three enums** to `schema.prisma` in the ENUMS section.

```prisma
enum RevelationPlace {
  MAKKI
  MADANI
}

enum SegmentStatus {
  IN_PROGRESS
  COMPLETED
}

enum LessonAssignmentKind {
  MEMORIZE
  REVIEW
}
```

- [ ] **Step 2: Add the reference + progress + assignment models** (place after the `LessonSession` model).

```prisma
// ============================================================
// QURAN REFERENCE (seeded, read-only at runtime) + PROGRESS
// ============================================================

model QuranSurah {
  id              Int             @id @default(autoincrement())
  number          Int             @unique // 1..114, also display order
  nameAr          String
  nameEn          String
  ayahCount       Int
  revelationPlace RevelationPlace

  segments    QuranJuzSegment[]
  assignments LessonAssignment[]
}

model QuranJuz {
  id     Int    @id @default(autoincrement())
  number Int    @unique // 1..30
  nameAr String
  nameEn String

  segments QuranJuzSegment[]
}

model QuranJuzSegment {
  id       Int        @id @default(autoincrement())
  juzId    Int
  juz      QuranJuz   @relation(fields: [juzId], references: [id], onDelete: Cascade)
  surahId  Int
  surah    QuranSurah @relation(fields: [surahId], references: [id], onDelete: Cascade)
  fromAyah Int
  toAyah   Int
  order    Int        @default(0) // position of this segment within the juz'

  progress StudentSegmentProgress[]

  @@unique([juzId, surahId])
  @@index([juzId])
  @@index([surahId])
}

model StudentSegmentProgress {
  id          Int             @id @default(autoincrement())
  studentId   Int
  student     User            @relation("StudentQuranProgress", fields: [studentId], references: [id], onDelete: Cascade)
  segmentId   Int
  segment     QuranJuzSegment @relation(fields: [segmentId], references: [id], onDelete: Cascade)
  status      SegmentStatus
  currentAyah Int?
  completedAt DateTime?
  updatedById Int?
  updatedBy   User?           @relation("SegmentProgressUpdatedBy", fields: [updatedById], references: [id])

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([studentId, segmentId])
  @@index([studentId])
}

model LessonAssignment {
  id       Int                  @id @default(autoincrement())
  lessonId Int
  lesson   LessonSession        @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  kind     LessonAssignmentKind
  surahId  Int
  surah    QuranSurah           @relation(fields: [surahId], references: [id])
  fromAyah Int? // null + null toAyah = whole surah
  toAyah   Int?
  order    Int                  @default(0)

  createdAt DateTime @default(now())

  @@index([lessonId])
}
```

- [ ] **Step 3: Extend `LessonSession`** — add the two relations/fields after `notes`.

```prisma
  notes          String?       @db.Text
  homework       String?       @db.Text
  assignments    LessonAssignment[]
```

- [ ] **Step 4: Add `User` back-relations** — inside `model User`, near the existing `lessons`/`createdLessons` lines.

```prisma
  segmentProgress        StudentSegmentProgress[] @relation("StudentQuranProgress")
  segmentProgressUpdates StudentSegmentProgress[] @relation("SegmentProgressUpdatedBy")
```

- [ ] **Step 5: Mirror the enums** in `packages/shared/constants/enums.js` (append near the other enum consts).

```js
export const REVELATION_PLACES = {
  MAKKI: "MAKKI",
  MADANI: "MADANI",
};

export const SEGMENT_STATUSES = {
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
};

export const LESSON_ASSIGNMENT_KINDS = {
  MEMORIZE: "MEMORIZE",
  REVIEW: "REVIEW",
};
```

- [ ] **Step 6: Validate the schema**

Run: `npx prisma validate --schema packages/db/prisma/schema.prisma`
Expected: `The schema at ... is valid 🚀`

- [ ] **Step 7: Commit**

```bash
git add packages/db/prisma/schema.prisma packages/shared/constants/enums.js
git commit -m "feat(schema): Quran reference + progress + lesson-assignment models"
```

### Task A2: Migration + client generation

**Files:** generated under `packages/db/prisma/migrations/`.

**Interfaces:** Consumes Task A1 models. Produces a migrated DB + regenerated Prisma client.

- [ ] **Step 1: Create the migration**

Run: `npm run db:migrate -- --name quran_progress` (from repo root; this runs `prisma migrate dev` in `@aya/db`).
Expected: a new folder `packages/db/prisma/migrations/<ts>_quran_progress/migration.sql` and "Your database is now in sync with your schema."

- [ ] **Step 2: Regenerate the client (if not auto-run)**

Run: `npm run db:generate`
Expected: "Generated Prisma Client".

- [ ] **Step 3: Commit**

```bash
git add packages/db/prisma/migrations packages/db/generated
git commit -m "feat(db): migration for Quran progress models"
```

---

## PHASE B — Quran reference data + seed

### Task B1: Canonical Quran data module

**Files:**
- Create: `packages/db/prisma/data/quran.data.js`

**Interfaces:**
- Produces: `export const SURAHS` — 114 objects `{ number, nameAr, nameEn, ayahCount, revelationPlace }`.
- Produces: `export const JUZ` — 30 objects `{ number, nameAr, nameEn }`.
- Produces: `export const SEGMENTS` — objects `{ juz, surah, fromAyah, toAyah }` (`juz`, `surah` are the 1-based numbers); one per (juz, surah) portion, ordered by juz then by the surah's appearance.

**Data source rule (authoritative, fixed):** Standard Madani Mushaf. Per-surah ayah counts and the Hafs juz' boundaries are canonical constants. The implementer MUST transcribe the full set and the verify script (Task B2) MUST pass before this task is considered done.

- [ ] **Step 1: Create the file with the exact shape.** Populate ALL 114 surahs, ALL 30 juz', and ALL segments. The excerpt below fixes the format — fill in the remainder identically.

```js
// Canonical Quran reference data (Hafs / standard Madani Mushaf).
// Fixed constants — verified by verify-quran.js. Do not edit at runtime.

export const SURAHS = [
  { number: 1, nameAr: "الفاتحة", nameEn: "Al-Fatihah", ayahCount: 7, revelationPlace: "MAKKI" },
  { number: 2, nameAr: "البقرة", nameEn: "Al-Baqarah", ayahCount: 286, revelationPlace: "MADANI" },
  { number: 3, nameAr: "آل عمران", nameEn: "Ali 'Imran", ayahCount: 200, revelationPlace: "MADANI" },
  // … through …
  { number: 113, nameAr: "الفلق", nameEn: "Al-Falaq", ayahCount: 5, revelationPlace: "MAKKI" },
  { number: 114, nameAr: "الناس", nameEn: "An-Nas", ayahCount: 6, revelationPlace: "MAKKI" },
];

export const JUZ = [
  { number: 1, nameAr: "الجزء الأول", nameEn: "Juz 1" },
  { number: 2, nameAr: "الجزء الثاني", nameEn: "Juz 2" },
  // … through 29 …
  { number: 30, nameAr: "جزء عمّ", nameEn: "Juz 30 (Amma)" },
];

// Each entry: the portion of `surah` that falls inside `juz`.
// A surah crossing a boundary appears in multiple juz' (e.g. Al-Baqarah: 2,3).
export const SEGMENTS = [
  { juz: 1, surah: 1, fromAyah: 1, toAyah: 7 },     // Al-Fatihah (whole)
  { juz: 1, surah: 2, fromAyah: 1, toAyah: 141 },   // Al-Baqarah part 1
  { juz: 2, surah: 2, fromAyah: 142, toAyah: 252 }, // Al-Baqarah part 2
  { juz: 3, surah: 2, fromAyah: 253, toAyah: 286 }, // Al-Baqarah part 3
  { juz: 3, surah: 3, fromAyah: 1, toAyah: 92 },    // Ali 'Imran part 1
  // … continue for all 30 juz' …
  { juz: 30, surah: 78, fromAyah: 1, toAyah: 40 },  // An-Naba (whole)
  // … through …
  { juz: 30, surah: 114, fromAyah: 1, toAyah: 6 },  // An-Nas (whole)
];
```

- [ ] **Step 2: Commit** (data is verified in the next task).

```bash
git add packages/db/prisma/data/quran.data.js
git commit -m "feat(db): canonical Quran reference data module"
```

### Task B2: Data verification script (correctness gate)

**Files:**
- Create: `packages/db/prisma/verify-quran.js`

**Interfaces:** Consumes `quran.data.js` exports. Produces a process exit 0 (valid) / 1 (invalid) with a printed reason.

- [ ] **Step 1: Write the verifier with the invariants.**

```js
// Standalone invariant check for quran.data.js. Run: node packages/db/prisma/verify-quran.js
import { SURAHS, JUZ, SEGMENTS } from "./data/quran.data.js";

const fail = (msg) => {
  console.error("INVALID:", msg);
  process.exit(1);
};

// 1. counts
if (SURAHS.length !== 114) fail(`expected 114 surahs, got ${SURAHS.length}`);
if (JUZ.length !== 30) fail(`expected 30 juz, got ${JUZ.length}`);

// 2. surah numbers 1..114 unique & ordered; total ayahs = 6236
const totalAyahs = SURAHS.reduce((s, x) => s + x.ayahCount, 0);
if (totalAyahs !== 6236) fail(`expected 6236 total ayahs, got ${totalAyahs}`);
SURAHS.forEach((s, i) => {
  if (s.number !== i + 1) fail(`surah at index ${i} has number ${s.number}`);
  if (!["MAKKI", "MADANI"].includes(s.revelationPlace))
    fail(`surah ${s.number} bad revelationPlace`);
});

// 3. juz numbers 1..30
JUZ.forEach((j, i) => {
  if (j.number !== i + 1) fail(`juz at index ${i} has number ${j.number}`);
});

// 4. every segment references a real surah/juz, ayah range within surah, from<=to
const ayahCountOf = new Map(SURAHS.map((s) => [s.number, s.ayahCount]));
for (const seg of SEGMENTS) {
  const max = ayahCountOf.get(seg.surah);
  if (!max) fail(`segment references unknown surah ${seg.surah}`);
  if (seg.juz < 1 || seg.juz > 30) fail(`segment bad juz ${seg.juz}`);
  if (seg.fromAyah < 1 || seg.toAyah > max || seg.fromAyah > seg.toAyah)
    fail(`segment surah ${seg.surah} bad range ${seg.fromAyah}-${seg.toAyah} (max ${max})`);
}

// 5. per surah, the union of its segments covers exactly 1..ayahCount with no gap/overlap
const bySurah = new Map();
for (const seg of SEGMENTS) {
  if (!bySurah.has(seg.surah)) bySurah.set(seg.surah, []);
  bySurah.get(seg.surah).push(seg);
}
for (const [surah, segs] of bySurah) {
  const sorted = [...segs].sort((a, b) => a.fromAyah - b.fromAyah);
  let expected = 1;
  for (const seg of sorted) {
    if (seg.fromAyah !== expected)
      fail(`surah ${surah} gap/overlap at ayah ${seg.fromAyah} (expected ${expected})`);
    expected = seg.toAyah + 1;
  }
  if (expected - 1 !== ayahCountOf.get(surah))
    fail(`surah ${surah} not fully covered (ends ${expected - 1}/${ayahCountOf.get(surah)})`);
}

// 6. all 114 surahs appear in at least one segment
if (bySurah.size !== 114) fail(`only ${bySurah.size}/114 surahs appear in segments`);

console.log(`OK: 114 surahs, 30 juz, ${SEGMENTS.length} segments, ${totalAyahs} ayahs.`);
```

- [ ] **Step 2: Run the verifier**

Run: `node packages/db/prisma/verify-quran.js`
Expected: `OK: 114 surahs, 30 juz, <N> segments, 6236 ayahs.` — if it fails, fix `quran.data.js` until it passes.

- [ ] **Step 3: Commit**

```bash
git add packages/db/prisma/verify-quran.js
git commit -m "test(db): Quran data invariant verifier"
```

### Task B3: Seed step

**Files:**
- Modify: `packages/db/prisma/seed.js`

**Interfaces:** Consumes `quran.data.js`. Produces upserted reference rows. Idempotent.

- [ ] **Step 1: Import the data** at the top of `seed.js` (after existing imports).

```js
import { SURAHS, JUZ, SEGMENTS } from "./data/quran.data.js";
```

- [ ] **Step 2: Add `seedQuran()`** (place near the other seed functions).

```js
// ─────────────────────────────────────────────────────────────────────────────
// QURAN REFERENCE (surahs, juz, segments) — idempotent
// ─────────────────────────────────────────────────────────────────────────────
async function seedQuran() {
  for (const s of SURAHS) {
    await prisma.quranSurah.upsert({
      where: { number: s.number },
      update: { nameAr: s.nameAr, nameEn: s.nameEn, ayahCount: s.ayahCount, revelationPlace: s.revelationPlace },
      create: s,
    });
  }
  for (const j of JUZ) {
    await prisma.quranJuz.upsert({
      where: { number: j.number },
      update: { nameAr: j.nameAr, nameEn: j.nameEn },
      create: j,
    });
  }

  const surahByNumber = new Map(
    (await prisma.quranSurah.findMany({ select: { id: true, number: true } })).map((s) => [s.number, s.id]),
  );
  const juzByNumber = new Map(
    (await prisma.quranJuz.findMany({ select: { id: true, number: true } })).map((j) => [j.number, j.id]),
  );

  // order = appearance index within each juz'
  const orderByJuz = new Map();
  for (const seg of SEGMENTS) {
    const juzId = juzByNumber.get(seg.juz);
    const surahId = surahByNumber.get(seg.surah);
    const order = orderByJuz.get(seg.juz) ?? 0;
    orderByJuz.set(seg.juz, order + 1);
    await prisma.quranJuzSegment.upsert({
      where: { juzId_surahId: { juzId, surahId } },
      update: { fromAyah: seg.fromAyah, toAyah: seg.toAyah, order },
      create: { juzId, surahId, fromAyah: seg.fromAyah, toAyah: seg.toAyah, order },
    });
  }
  console.log(`[seed] quran — ${SURAHS.length} surahs, ${JUZ.length} juz, ${SEGMENTS.length} segments`);
}
```

- [ ] **Step 3: Call it from `main()`** — add `await seedQuran();` alongside the other seed calls.

- [ ] **Step 4: Run the seed**

Run: `npm run db:seed`
Expected: log line `[seed] quran — 114 surahs, 30 juz, <N> segments` and no error.

- [ ] **Step 5: Verify in DB**

Run: `node -e "import('@aya/db/prisma.client.js').then(async({prisma})=>{console.log(await prisma.quranSurah.count(), await prisma.quranJuz.count(), await prisma.quranJuzSegment.count()); process.exit(0)})"`
Expected: `114 30 <N>`

- [ ] **Step 6: Commit**

```bash
git add packages/db/prisma/seed.js
git commit -m "feat(db): seed Quran reference data"
```

---

## PHASE C — Shared constants

### Task C1: Permissions, message codes, names

**Files:**
- Modify: `packages/shared/constants/permissions.js`
- Create: `packages/shared/messages-codes/quran.js`
- Modify: `packages/shared/messages-codes/session.js`
- Modify: `packages/shared/messages-codes/index.js`
- Modify: `packages/shared/messages-names.js`

**Interfaces:**
- Produces: `QURAN_PERMISSIONS = { READ, PROGRESS_VIEW, PROGRESS_MANAGE }`; `quranMessagesCodes`; `messagesNames.quranMessages = "quran-messages"`; session codes `PLAN_REQUIRED`, `INVALID_AYAH_RANGE`, `SURAH_NOT_FOUND`.

- [ ] **Step 1: Add `QURAN_PERMISSIONS`** in `permissions.js` (after `SESSION_PERMISSIONS`).

```js
export const QURAN_PERMISSIONS = {
  READ: "quran.read", // reference data (surahs/juz/segments)
  PROGRESS_VIEW: "quran.progress_view", // read a student's progress (scoped)
  PROGRESS_MANAGE: "quran.progress_manage", // admin marks segments
};
```

- [ ] **Step 2: Register in `PERMISSIONS`** map.

```js
  SESSION: SESSION_PERMISSIONS,
  QURAN: QURAN_PERMISSIONS,
```

- [ ] **Step 3: Grant to parent & student** — add to both `ROLE_PERMISSIONS[PARENT]` and `ROLE_PERMISSIONS[STUDENT]` arrays:

```js
    QURAN_PERMISSIONS.READ,
    QURAN_PERMISSIONS.PROGRESS_VIEW,
```

(ADMIN gets `PROGRESS_MANAGE` automatically via `getAllPermissions()`.)

- [ ] **Step 4: Create `messages-codes/quran.js`**

```js
// Language-neutral message codes for the quran module.
// Surfaced to the frontend via translationKey `messagesNames.quranMessages`.
export const quranMessagesCodes = {
  STUDENT_NOT_FOUND: "STUDENT_NOT_FOUND",
  JUZ_NOT_FOUND: "JUZ_NOT_FOUND",
  SEGMENT_NOT_IN_JUZ: "SEGMENT_NOT_IN_JUZ",
  INVALID_AYAH_RANGE: "INVALID_AYAH_RANGE",
  CANNOT_ACCESS_PROGRESS: "CANNOT_ACCESS_PROGRESS",
};
```

- [ ] **Step 5: Export it** — add `export * from "./quran.js";` to `messages-codes/index.js`.

- [ ] **Step 6: Add session codes** to `messages-codes/session.js`.

```js
export const sessionMessagesCodes = {
  SESSION_NOT_FOUND: "SESSION_NOT_FOUND",
  STUDENT_REQUIRED: "STUDENT_REQUIRED",
  INVALID_TIME_RANGE: "INVALID_TIME_RANGE",
  CANNOT_ACCESS_SESSION: "CANNOT_ACCESS_SESSION",
  PLAN_REQUIRED: "PLAN_REQUIRED",
  INVALID_AYAH_RANGE: "INVALID_AYAH_RANGE",
  SURAH_NOT_FOUND: "SURAH_NOT_FOUND",
};
```

- [ ] **Step 7: Add `quranMessages`** to `messages-names.js`.

```js
  sessionMessages: "session-messages",
  quranMessages: "quran-messages",
```

- [ ] **Step 8: Smoke-check the barrel exports**

Run: `node -e "import('@aya/shared').then(m=>{console.log(m.QURAN_PERMISSIONS, m.quranMessagesCodes.JUZ_NOT_FOUND, m.messagesNames.quranMessages); process.exit(0)})"`
Expected: prints the object, `JUZ_NOT_FOUND`, `quran-messages`.

- [ ] **Step 9: Commit**

```bash
git add packages/shared
git commit -m "feat(shared): quran permissions + message codes"
```

---

## PHASE D — Backend `quran` module (reference reads)

### Task D1: DTO, repo, messages for reference reads

**Files:**
- Create: `Server/src/modules/quran/quran.dto.js`
- Create: `Server/src/modules/quran/quran.repo.js`
- Create: `Server/src/modules/quran/quran.messages.js`

**Interfaces:**
- Produces: `quranRepo.listSurahs()`, `quranRepo.listJuzWithSegments()`; `surahSelect`, `juzWithSegmentsSelect`; re-exported `quranMessagesCodes`.

- [ ] **Step 1: Create `quran.messages.js`** (re-export from shared, mirroring `session.messages.js` style).

```js
export { quranMessagesCodes } from "@aya/shared";
```

- [ ] **Step 2: Create `quran.dto.js`**

```js
export const surahSelect = {
  id: true,
  number: true,
  nameAr: true,
  nameEn: true,
  ayahCount: true,
  revelationPlace: true,
};

export const segmentSelect = {
  id: true,
  surahId: true,
  fromAyah: true,
  toAyah: true,
  order: true,
  surah: { select: { id: true, number: true, nameAr: true, nameEn: true, ayahCount: true } },
};

export const juzWithSegmentsSelect = {
  id: true,
  number: true,
  nameAr: true,
  nameEn: true,
  segments: { select: segmentSelect, orderBy: { order: "asc" } },
};
```

- [ ] **Step 3: Create `quran.repo.js`**

```js
import { prisma } from "@aya/db/prisma.client.js";
import { surahSelect, juzWithSegmentsSelect } from "./quran.dto.js";

class QuranRepo {
  listSurahs() {
    return prisma.quranSurah.findMany({ orderBy: { number: "asc" }, select: surahSelect });
  }

  listJuzWithSegments() {
    return prisma.quranJuz.findMany({ orderBy: { number: "asc" }, select: juzWithSegmentsSelect });
  }
}

export const quranRepo = new QuranRepo();
```

- [ ] **Step 4: Commit**

```bash
git add Server/src/modules/quran/quran.dto.js Server/src/modules/quran/quran.repo.js Server/src/modules/quran/quran.messages.js
git commit -m "feat(quran): dto + repo + messages for reference reads"
```

### Task D2: Usecase, controller, route for reference reads + mount

**Files:**
- Create: `Server/src/modules/quran/quran.usecase.js`
- Create: `Server/src/modules/quran/quran.controller.js`
- Create: `Server/src/modules/quran/quran.route.js`
- Modify: `Server/src/routes.js`

**Interfaces:**
- Consumes: `quranRepo` (D1).
- Produces: `quranUsecase.listSurahs()`, `quranUsecase.listJuz()`; `quranController.listSurahs/listJuz`; mounted `GET /quran/surahs`, `GET /quran/juz`.

- [ ] **Step 1: Create `quran.usecase.js`** (reference reads need no scoping beyond auth).

```js
import { quranRepo } from "./quran.repo.js";

class QuranUsecase {
  listSurahs() {
    return quranRepo.listSurahs();
  }

  listJuz() {
    return quranRepo.listJuzWithSegments();
  }
}

export const quranUsecase = new QuranUsecase();
```

- [ ] **Step 2: Create `quran.controller.js`**

```js
import { ok } from "../../shared/http/response.js";
import { quranUsecase } from "./quran.usecase.js";

class QuranController {
  listSurahs = async (_req, res) => {
    return ok(res, await quranUsecase.listSurahs());
  };

  listJuz = async (_req, res) => {
    return ok(res, await quranUsecase.listJuz());
  };
}

export const quranController = new QuranController();
```

- [ ] **Step 3: Create `quran.route.js`**

```js
import { Router } from "express";
import { QURAN_PERMISSIONS } from "@aya/shared";
import { quranController } from "./quran.controller.js";
import { asyncHandler } from "../../shared/middlewares/async-handler.js";
import { authMiddleware } from "../../shared/middlewares/auth.middleware.js";

const quranRoutes = Router();

quranRoutes.use(authMiddleware.requireAuth);

quranRoutes.get(
  "/surahs",
  authMiddleware.requirePermissions([QURAN_PERMISSIONS.READ]),
  asyncHandler(quranController.listSurahs),
);

quranRoutes.get(
  "/juz",
  authMiddleware.requirePermissions([QURAN_PERMISSIONS.READ]),
  asyncHandler(quranController.listJuz),
);

export default quranRoutes;
```

- [ ] **Step 4: Mount in `routes.js`** — import and register (after the sessions mount).

```js
import quranRoutes from "./modules/quran/quran.route.js";
// …
routes.use("/quran", quranRoutes);
```

- [ ] **Step 5: Smoke-check** — start the server (`npm run dev:server`), log in to get a token, then:

Run: `curl -s -H "Authorization: Bearer <TOKEN>" localhost:<PORT>/quran/surahs | head -c 300`
Expected: JSON envelope `{"success":true,...,"data":[{"id":...,"number":1,"nameAr":"الفاتحة",...}]}`. Also hit `/quran/juz` and confirm each juz' has an ordered `segments` array.

- [ ] **Step 6: Commit**

```bash
git add Server/src/modules/quran/quran.usecase.js Server/src/modules/quran/quran.controller.js Server/src/modules/quran/quran.route.js Server/src/routes.js
git commit -m "feat(quran): reference read endpoints (surahs, juz)"
```

---

## PHASE E — Backend Quran progress (read + manage)

### Task E1: Progress repo + DTO

**Files:**
- Modify: `Server/src/modules/quran/quran.repo.js`
- Modify: `Server/src/modules/quran/quran.dto.js`

**Interfaces:**
- Produces: `progressSelect`; `quranRepo.listProgressForStudent(studentId)`, `quranRepo.getJuzWithSegments(juzId)`, `quranRepo.upsertSegmentProgress(studentId, items, updatedById)`, `quranRepo.deleteSegmentProgress(studentId, segmentIds)`.
- `items`: `Array<{ segmentId:number, status:"IN_PROGRESS"|"COMPLETED", currentAyah:number|null }>`.

- [ ] **Step 1: Add `progressSelect` to `quran.dto.js`**

```js
export const progressSelect = {
  id: true,
  segmentId: true,
  status: true,
  currentAyah: true,
  completedAt: true,
  updatedAt: true,
};
```

- [ ] **Step 2: Add repo methods to `quran.repo.js`** (extend the class; import `progressSelect`).

```js
import { surahSelect, juzWithSegmentsSelect, progressSelect } from "./quran.dto.js";
import { SEGMENT_STATUSES } from "@aya/shared";
```

```js
  listProgressForStudent(studentId) {
    return prisma.studentSegmentProgress.findMany({
      where: { studentId },
      select: progressSelect,
    });
  }

  getJuzWithSegments(juzId) {
    return prisma.quranJuz.findUnique({
      where: { id: juzId },
      select: { id: true, segments: { select: { id: true } } },
    });
  }

  // Upsert each item; rows with status omitted are handled by the usecase (delete).
  async upsertSegmentProgress(studentId, items, updatedById) {
    return prisma.$transaction(
      items.map((it) =>
        prisma.studentSegmentProgress.upsert({
          where: { studentId_segmentId: { studentId, segmentId: it.segmentId } },
          update: {
            status: it.status,
            currentAyah: it.currentAyah,
            completedAt: it.status === SEGMENT_STATUSES.COMPLETED ? new Date() : null,
            updatedById,
          },
          create: {
            studentId,
            segmentId: it.segmentId,
            status: it.status,
            currentAyah: it.currentAyah,
            completedAt: it.status === SEGMENT_STATUSES.COMPLETED ? new Date() : null,
            updatedById,
          },
        }),
      ),
    );
  }

  deleteSegmentProgress(studentId, segmentIds) {
    if (!segmentIds.length) return Promise.resolve({ count: 0 });
    return prisma.studentSegmentProgress.deleteMany({
      where: { studentId, segmentId: { in: segmentIds } },
    });
  }
```

- [ ] **Step 3: Commit**

```bash
git add Server/src/modules/quran/quran.repo.js Server/src/modules/quran/quran.dto.js
git commit -m "feat(quran): progress repo methods + projection"
```

### Task E2: Progress usecase (scope + percentages + bulk set)

**Files:**
- Modify: `Server/src/modules/quran/quran.usecase.js`

**Interfaces:**
- Consumes: `quranRepo`, `userRepo` (`isStudentOfParent`, `getStudentIdsForParent`), `USER_ROLES`, `SEGMENT_STATUSES`, `quranMessagesCodes`, `messagesNames`, AppError helpers.
- Produces: `quranUsecase.getProgress(authUser, studentId)` → `{ juz: [...], overall: {...} }`; `quranUsecase.setJuzProgress(authUser, studentId, juzId, items)`.

- [ ] **Step 1: Replace `quran.usecase.js`** with the full version.

```js
import { USER_ROLES, SEGMENT_STATUSES, messagesNames } from "@aya/shared";
import { badRequest, forbidden, notFound } from "../../shared/errors/AppError.js";
import { userRepo } from "../users/user.repo.js";
import { quranRepo } from "./quran.repo.js";
import { quranMessagesCodes } from "./quran.messages.js";

class QuranUsecase {
  listSurahs() {
    return quranRepo.listSurahs();
  }

  listJuz() {
    return quranRepo.listJuzWithSegments();
  }

  /** Throws unless `authUser` may read this student's progress. */
  async assertCanView(authUser, studentId) {
    if (authUser.role === USER_ROLES.ADMIN) return;
    if (authUser.role === USER_ROLES.STUDENT) {
      if (authUser.id === studentId) return;
    } else if (authUser.role === USER_ROLES.PARENT) {
      if (await userRepo.isStudentOfParent(authUser.id, studentId)) return;
    }
    throw forbidden(quranMessagesCodes.CANNOT_ACCESS_PROGRESS);
  }

  async getProgress(authUser, studentId) {
    await this.assertCanView(authUser, studentId);

    const [juzList, progressRows] = await Promise.all([
      quranRepo.listJuzWithSegments(),
      quranRepo.listProgressForStudent(studentId),
    ]);
    const progressBySegment = new Map(progressRows.map((p) => [p.segmentId, p]));

    let overallTotal = 0;
    let overallDone = 0;
    const juz = juzList.map((j) => {
      const segments = j.segments.map((seg) => {
        const p = progressBySegment.get(seg.id) ?? null;
        return {
          ...seg,
          status: p?.status ?? null, // null = NOT_STARTED
          currentAyah: p?.currentAyah ?? null,
          completedAt: p?.completedAt ?? null,
        };
      });
      const total = segments.length;
      const completed = segments.filter((s) => s.status === SEGMENT_STATUSES.COMPLETED).length;
      const touched = segments.filter((s) => s.status !== null).length;
      const current = segments.find((s) => s.status === SEGMENT_STATUSES.IN_PROGRESS) ?? null;
      overallTotal += total;
      overallDone += completed;
      return {
        id: j.id,
        number: j.number,
        nameAr: j.nameAr,
        nameEn: j.nameEn,
        total,
        completed,
        touched, // dashboard shows juz' only when touched > 0
        percent: total ? Math.round((completed / total) * 100) : 0,
        current: current
          ? { surah: current.surah, currentAyah: current.currentAyah, fromAyah: current.fromAyah, toAyah: current.toAyah }
          : null,
        segments,
      };
    });

    return {
      juz,
      overall: {
        total: overallTotal,
        completed: overallDone,
        percent: overallTotal ? Math.round((overallDone / overallTotal) * 100) : 0,
      },
    };
  }

  /**
   * Admin bulk-set of one juz's segments for a student.
   * items: [{ segmentId, status: "IN_PROGRESS"|"COMPLETED"|null, currentAyah? }]
   * status === null  → reset that segment to NOT_STARTED (delete row).
   */
  async setJuzProgress(authUser, studentId, juzId, items) {
    const student = await userRepo.findById(studentId);
    if (!student || student.role !== USER_ROLES.STUDENT) {
      throw notFound(quranMessagesCodes.STUDENT_NOT_FOUND);
    }

    const juz = await quranRepo.getJuzWithSegments(juzId);
    if (!juz) throw notFound(quranMessagesCodes.JUZ_NOT_FOUND);
    const validSegmentIds = new Set(juz.segments.map((s) => s.id));

    for (const it of items) {
      if (!validSegmentIds.has(it.segmentId)) {
        throw badRequest(quranMessagesCodes.SEGMENT_NOT_IN_JUZ, messagesNames.quranMessages);
      }
    }

    const toDelete = items.filter((it) => it.status === null).map((it) => it.segmentId);
    const toUpsert = items
      .filter((it) => it.status !== null)
      .map((it) => ({
        segmentId: it.segmentId,
        status: it.status,
        currentAyah: it.status === SEGMENT_STATUSES.IN_PROGRESS ? (it.currentAyah ?? null) : null,
      }));

    await quranRepo.deleteSegmentProgress(studentId, toDelete);
    if (toUpsert.length) await quranRepo.upsertSegmentProgress(studentId, toUpsert, authUser.id);

    return this.getProgress(authUser, studentId);
  }
}

export const quranUsecase = new QuranUsecase();
```

- [ ] **Step 2: Confirm `userRepo.findById` exists** (used above).

Run: `grep -n "findById" Server/src/modules/users/user.repo.js`
Expected: a `findById` method. If the method has a different name (e.g. `getById`), use that name instead in Step 1.

- [ ] **Step 3: Commit**

```bash
git add Server/src/modules/quran/quran.usecase.js
git commit -m "feat(quran): progress usecase (scope, percentages, bulk set)"
```

### Task E3: Progress validation, controller, routes

**Files:**
- Create: `Server/src/modules/quran/quran.validation.js`
- Modify: `Server/src/modules/quran/quran.controller.js`
- Modify: `Server/src/modules/quran/quran.route.js`

**Interfaces:**
- Produces: `QuranValidation.setJuzProgressSchema`; `quranController.getProgress/setJuzProgress`; routes `GET /quran/progress/:studentId`, `PUT /quran/progress/:studentId/juz/:juzId`.

- [ ] **Step 1: Create `quran.validation.js`**

```js
import { z } from "zod";
import { SEGMENT_STATUSES } from "@aya/shared";

export class QuranValidation {
  static setJuzProgressSchema = z.object({
    items: z
      .array(
        z.object({
          segmentId: z.number().int().positive(),
          // null clears the segment (NOT_STARTED)
          status: z.enum([SEGMENT_STATUSES.IN_PROGRESS, SEGMENT_STATUSES.COMPLETED]).nullable(),
          currentAyah: z.number().int().positive().nullable().optional(),
        }),
      )
      .min(1),
  });
}
```

- [ ] **Step 2: Extend `quran.controller.js`** — add the two handlers + an `idParam` helper (mirror `session.controller.js`).

```js
import { ok } from "../../shared/http/response.js";
import { generalMessagesCodes } from "@aya/shared";
import { badRequest } from "../../shared/errors/AppError.js";
import { quranUsecase } from "./quran.usecase.js";

function authUser(req) {
  return req.auth;
}

function idParam(value) {
  const raw = Array.isArray(value) ? value[0] : value;
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) throw badRequest();
  return n;
}

class QuranController {
  listSurahs = async (_req, res) => {
    return ok(res, await quranUsecase.listSurahs());
  };

  listJuz = async (_req, res) => {
    return ok(res, await quranUsecase.listJuz());
  };

  getProgress = async (req, res) => {
    const data = await quranUsecase.getProgress(authUser(req), idParam(req.params.studentId));
    return ok(res, data);
  };

  setJuzProgress = async (req, res) => {
    const data = await quranUsecase.setJuzProgress(
      authUser(req),
      idParam(req.params.studentId),
      idParam(req.params.juzId),
      req.body.items,
    );
    return ok(res, data, generalMessagesCodes.UPDATED);
  };
}

export const quranController = new QuranController();
```

- [ ] **Step 3: Add the routes to `quran.route.js`** (add imports for `validate`, `QuranValidation`; append routes).

```js
import { validate } from "../../shared/middlewares/validate.middleware.js";
import { QuranValidation } from "./quran.validation.js";
```

```js
quranRoutes.get(
  "/progress/:studentId",
  authMiddleware.requirePermissions([QURAN_PERMISSIONS.PROGRESS_VIEW]),
  asyncHandler(quranController.getProgress),
);

quranRoutes.put(
  "/progress/:studentId/juz/:juzId",
  authMiddleware.requirePermissions([QURAN_PERMISSIONS.PROGRESS_MANAGE]),
  validate(QuranValidation.setJuzProgressSchema),
  asyncHandler(quranController.setJuzProgress),
);
```

- [ ] **Step 4: Smoke-check** (server running, admin token, a real `studentId` + `juzId=1`, and two `segmentId`s from `/quran/juz`):

Run:
```bash
curl -s -X PUT -H "Authorization: Bearer <ADMIN_TOKEN>" -H "Content-Type: application/json" \
  -d '{"items":[{"segmentId":<S1>,"status":"COMPLETED"},{"segmentId":<S2>,"status":"IN_PROGRESS","currentAyah":10}]}' \
  localhost:<PORT>/quran/progress/<STUDENT_ID>/juz/1 | head -c 400
```
Expected: returns the recomputed progress; juz 1 shows `completed:1`, a `current` with `currentAyah:10`, `touched:2`.
Then `GET /quran/progress/<STUDENT_ID>` as the student's parent → succeeds; as an unrelated parent → 403 `CANNOT_ACCESS_PROGRESS`.

- [ ] **Step 5: Commit**

```bash
git add Server/src/modules/quran/quran.validation.js Server/src/modules/quran/quran.controller.js Server/src/modules/quran/quran.route.js
git commit -m "feat(quran): student progress read + admin bulk-set endpoints"
```

---

## PHASE F — Sessions: next-plan action

### Task F1: Session plan — dto, repo, validation, messages

**Files:**
- Modify: `Server/src/modules/sessions/session.dto.js`
- Modify: `Server/src/modules/sessions/session.repo.js`
- Modify: `Server/src/modules/sessions/session.validation.js`

**Interfaces:**
- Produces: `sessionSelect` includes `homework` + `assignments`; `sessionRepo.setPlan(lessonId, homework, assignments)`; `sessionRepo.getSurahsByIds(ids)`; `SessionValidation.setPlanSchema`.
- `assignments` item: `{ kind:"MEMORIZE"|"REVIEW", surahId, fromAyah:number|null, toAyah:number|null, order }`.

- [ ] **Step 1: Extend `session.dto.js`** — add the plan fields to `sessionSelect`.

```js
export const lessonAssignmentSelect = {
  id: true,
  kind: true,
  surahId: true,
  fromAyah: true,
  toAyah: true,
  order: true,
  surah: { select: { id: true, number: true, nameAr: true, nameEn: true, ayahCount: true } },
};
```
Add to `sessionSelect` (after `notes: true,`):
```js
  notes: true,
  homework: true,
  assignments: { select: lessonAssignmentSelect, orderBy: { order: "asc" } },
```

- [ ] **Step 2: Add repo methods to `session.repo.js`**

```js
  getSurahsByIds(ids) {
    return prisma.quranSurah.findMany({
      where: { id: { in: ids } },
      select: { id: true, ayahCount: true },
    });
  }

  // Replace the whole plan atomically: clear old assignments, set homework, create new.
  setPlan(lessonId, homework, assignments) {
    return prisma.$transaction(async (tx) => {
      await tx.lessonAssignment.deleteMany({ where: { lessonId } });
      await tx.lessonSession.update({ where: { id: lessonId }, data: { homework } });
      if (assignments.length) {
        await tx.lessonAssignment.createMany({
          data: assignments.map((a, i) => ({
            lessonId,
            kind: a.kind,
            surahId: a.surahId,
            fromAyah: a.fromAyah,
            toAyah: a.toAyah,
            order: a.order ?? i,
          })),
        });
      }
      return tx.lessonSession.findUnique({ where: { id: lessonId }, select: sessionSelect });
    });
  }
```

- [ ] **Step 3: Add `setPlanSchema` to `session.validation.js`** (import `LESSON_ASSIGNMENT_KINDS`).

```js
import { LESSON_STATUSES, LESSON_ASSIGNMENT_KINDS } from "@aya/shared";
```

```js
  static setPlanSchema = z.object({
    homework: z.string().trim().optional(),
    assignments: z
      .array(
        z.object({
          kind: z.enum([LESSON_ASSIGNMENT_KINDS.MEMORIZE, LESSON_ASSIGNMENT_KINDS.REVIEW]),
          surahId: z.number().int().positive(),
          fromAyah: z.number().int().positive().nullable().optional(),
          toAyah: z.number().int().positive().nullable().optional(),
          order: z.number().int().nonnegative().optional(),
        }),
      )
      .optional()
      .default([]),
  });
```

- [ ] **Step 4: Commit**

```bash
git add Server/src/modules/sessions/session.dto.js Server/src/modules/sessions/session.repo.js Server/src/modules/sessions/session.validation.js
git commit -m "feat(sessions): plan dto/repo/validation (assignments + homework)"
```

### Task F2: Session plan — usecase + controller + route

**Files:**
- Modify: `Server/src/modules/sessions/session.usecase.js`
- Modify: `Server/src/modules/sessions/session.controller.js`
- Modify: `Server/src/modules/sessions/session.route.js`

**Interfaces:**
- Consumes: `sessionRepo.setPlan/getSurahsByIds` (F1), `sessionMessagesCodes`, `messagesNames`, `badRequest`/`notFound`.
- Produces: `sessionUsecase.setPlan(authUser, id, input)`; `sessionController.setPlan`; route `PUT /sessions/:id/plan`.

- [ ] **Step 1: Add `setPlan` to `session.usecase.js`** (import `badRequest`; `notFound`, `messagesNames` already used).

```js
  async setPlan(authUser, id, input) {
    const existing = await sessionRepo.getById(id);
    if (!existing) throw notFound(sessionMessagesCodes.SESSION_NOT_FOUND);

    const assignments = input.assignments ?? [];
    const homework = input.homework?.trim() || null;

    // at least one of {assignments, homework}
    if (!assignments.length && !homework) {
      throw badRequest(sessionMessagesCodes.PLAN_REQUIRED, messagesNames.sessionMessages);
    }

    if (assignments.length) {
      const surahIds = [...new Set(assignments.map((a) => a.surahId))];
      const surahs = await sessionRepo.getSurahsByIds(surahIds);
      const ayahCountById = new Map(surahs.map((s) => [s.id, s.ayahCount]));

      for (const a of assignments) {
        const max = ayahCountById.get(a.surahId);
        if (!max) throw badRequest(sessionMessagesCodes.SURAH_NOT_FOUND, messagesNames.sessionMessages);
        const from = a.fromAyah ?? null;
        const to = a.toAyah ?? null;
        // both null = whole surah (valid). Otherwise both must be set & in range.
        if (from !== null || to !== null) {
          if (from === null || to === null || from < 1 || to > max || from > to) {
            throw badRequest(sessionMessagesCodes.INVALID_AYAH_RANGE, messagesNames.sessionMessages);
          }
        }
      }
    }

    const normalized = assignments.map((a, i) => ({
      kind: a.kind,
      surahId: a.surahId,
      fromAyah: a.fromAyah ?? null,
      toAyah: a.toAyah ?? null,
      order: a.order ?? i,
    }));

    return sessionRepo.setPlan(id, homework, normalized);
  }
```

- [ ] **Step 2: Add `setPlan` to `session.controller.js`**

```js
  setPlan = async (req, res) => {
    const session = await sessionUsecase.setPlan(
      authUser(req),
      idParam(req.params.id),
      req.body,
    );
    return ok(res, session, generalMessagesCodes.UPDATED);
  };
```

- [ ] **Step 3: Add the route to `session.route.js`** (admin uses `SESSION_PERMISSIONS.EDIT`).

```js
sessionRoutes.put(
  "/:id/plan",
  authMiddleware.requirePermissions([SESSION_PERMISSIONS.EDIT]),
  validate(SessionValidation.setPlanSchema),
  asyncHandler(sessionController.setPlan),
);
```

- [ ] **Step 4: Smoke-check**

Run:
```bash
curl -s -X PUT -H "Authorization: Bearer <ADMIN_TOKEN>" -H "Content-Type: application/json" \
  -d '{"homework":"راجع الفاتحة","assignments":[{"kind":"MEMORIZE","surahId":<SURAH_ID>,"fromAyah":1,"toAyah":3}]}' \
  localhost:<PORT>/sessions/<SESSION_ID>/plan | head -c 400
```
Expected: returns the session with `homework` set and one `assignments` entry. Then send `{"assignments":[]}` with no homework → 400 `PLAN_REQUIRED`. Send `fromAyah:5,toAyah:1` → 400 `INVALID_AYAH_RANGE`.

- [ ] **Step 5: Commit**

```bash
git add Server/src/modules/sessions/session.usecase.js Server/src/modules/sessions/session.controller.js Server/src/modules/sessions/session.route.js
git commit -m "feat(sessions): PUT /:id/plan (memorize/review/homework, >=1 required)"
```

---

## PHASE G — Frontend: API hooks + Quran reference

> Frontend follows the existing config-driven feature shape. Before each task, open one existing feature as the reference example (e.g. `web/src/features/sessions` or `web/src/features/badges`) and mirror its file layout, `useRequest` usage, `AppForm`/RHF wiring, `usePermission` gating, and i18n key registration. The steps below specify behavior + the data contract; match the local idioms for the MUI/RHF boilerplate.

### Task G1: Quran API hooks + i18n message namespaces

**Files:**
- Create: a `web/src/features/quran/` folder with an API hook module (e.g. `hooks/useQuran.js` or `api/quran.js`) exposing `fetchSurahs()`, `fetchJuz()`, `fetchStudentProgress(studentId)`, `setJuzProgress(studentId, juzId, items)`, `setSessionPlan(sessionId, body)`.
- Create/modify: the web i18n resource files — add a `quran-messages` namespace (ar + en) covering every code in `quranMessagesCodes`, and add the 3 new session codes (`PLAN_REQUIRED`, `INVALID_AYAH_RANGE`, `SURAH_NOT_FOUND`) to the existing `session-messages` ar + en files.

**Interfaces:**
- Produces: the API functions above (resolve to the response `data`); registered translation keys.

- [ ] **Step 1: Locate the i18n + request conventions.**

Run: `ls web/src/features/sessions && grep -rn "useRequest" web/src/features/sessions | head` and find where message namespaces live: `grep -rln "session-messages" web/src | head`.
Expected: identifies the request helper and the i18n resource location used by sibling features.

- [ ] **Step 2: Add the `quran-messages` ar + en entries** for: `STUDENT_NOT_FOUND`, `JUZ_NOT_FOUND`, `SEGMENT_NOT_IN_JUZ`, `INVALID_AYAH_RANGE`, `CANNOT_ACCESS_PROGRESS`. Use natural Arabic (e.g. `INVALID_AYAH_RANGE` → "نطاق الآيات غير صحيح") and English equivalents. Add the 3 session codes to `session-messages` (ar: e.g. `PLAN_REQUIRED` → "لازم تختار حاجة واحدة على الأقل").

- [ ] **Step 3: Create the API hook module** mirroring the sibling feature's request pattern. Each function calls the matching endpoint from Phases D–F and returns `res.data`.

- [ ] **Step 4: Verify the web build compiles**

Run: `npm run build:web` (or `npm run lint -w web` if faster)
Expected: builds without errors referencing the new files.

- [ ] **Step 5: Commit**

```bash
git add web/src
git commit -m "feat(web/quran): api hooks + i18n message namespaces"
```

---

## PHASE H — Frontend: student progress editor (admin)

### Task H1: Juz' picker + segment checklist editor

**Files:**
- Create: components under `web/src/features/quran/` (e.g. `components/QuranProgressEditor.jsx`, `components/JuzSegmentList.jsx`).
- Modify: the admin student-detail screen to mount a "تقدم القرآن" section/tab and a button that opens the editor.

**Interfaces:**
- Consumes: `fetchJuz()`, `fetchStudentProgress(studentId)`, `setJuzProgress(studentId, juzId, items)` (G1).
- Behavior: gated by `usePermission(QURAN_PERMISSIONS.PROGRESS_MANAGE)`.

- [ ] **Step 1: Find the admin student-detail screen** and how sibling detail sections/tabs are mounted.

Run: `ls web/src/app/[lng]/dashboard/students && grep -rln "studentId\|StudentDetails\|usePermission" web/src/features | head`
Expected: the student detail page/feature and the `usePermission` hook location.

- [ ] **Step 2: Build the editor** — a button "تحديث تقدم القرآن" opens a dialog: a juz' selector (1–30, from `fetchJuz()`), and on selection a list of that juz's segments ordered by `order`, each labeled "<surahNameAr> (آية <fromAyah>–<toAyah>)" with a tri-state control: not-started / in-progress / completed (e.g. a select or segmented control), plus a "الآية الحالية" number input enabled only when in-progress. Initialize from `fetchStudentProgress(studentId)`. On save, build `items` (`status:null` for any segment reset to not-started) and call `setJuzProgress`. Show success/error toast via the existing toast + message-code translation.

- [ ] **Step 3: Gate it** — only render the button when `usePermission(QURAN_PERMISSIONS.PROGRESS_MANAGE)` is true.

- [ ] **Step 4: Manual verify** — run web + server, open an admin student detail, mark a couple of segments in juz 1, save, reopen → state persisted; the recomputed percent matches.

- [ ] **Step 5: Commit**

```bash
git add web/src
git commit -m "feat(web/quran): admin student progress editor (juz' segment checklist)"
```

---

## PHASE I — Frontend: lesson next-plan section

### Task I1: "خطة المرة الجاية" in the session create/edit form

**Files:**
- Create: `web/src/features/quran/components/LessonPlanFields.jsx` (or co-locate in the sessions feature).
- Modify: the session create/edit form to include the plan section and submit it via `setSessionPlan` after save.

**Interfaces:**
- Consumes: `fetchSurahs()`, `setSessionPlan(sessionId, { homework, assignments })`.
- Behavior: client enforces ≥1 of {assignments, homework} (server also enforces `PLAN_REQUIRED`).

- [ ] **Step 1: Find the session form** and how it uses `AppForm`/RHF + how it gets the session id post-create.

Run: `grep -rln "createSessionSchema\|AppForm\|sessions" web/src/features | head` and open the session form component.

- [ ] **Step 2: Build the plan section** with three optional groups bound to RHF:
  - **حفظ (MEMORIZE):** multi-add rows, each a surah autocomplete (from `fetchSurahs()`) + "كل السورة" toggle OR a `fromAyah`/`toAyah` pair (bounded by the surah's `ayahCount`).
  - **مراجعة (REVIEW):** same control shape, `kind: "REVIEW"`.
  - **واجب (homework):** a textarea.
  Each assignment row → `{ kind, surahId, fromAyah|null, toAyah|null }` (both null = whole surah).

- [ ] **Step 3: Submit** — on session create, first create the session (existing flow) then call `setSessionPlan(newId, body)`; on edit, call `setSessionPlan(id, body)`. Block submit (client validation message) when assignments empty AND homework blank. Surface server `INVALID_AYAH_RANGE`/`PLAN_REQUIRED` via toast.

- [ ] **Step 4: Manual verify** — create a lesson with one MEMORIZE surah + ayah range + homework; reopen the session → plan persists; clear both → blocked.

- [ ] **Step 5: Commit**

```bash
git add web/src
git commit -m "feat(web/sessions): next-plan section (memorize/review/homework)"
```

---

## PHASE J — Frontend: dashboard progress display

### Task J1: Progress widgets (student/parent + admin overview)

**Files:**
- Create: `web/src/features/quran/components/QuranProgressView.jsx` (read-only) + any small juz'/surah row components.
- Modify: the relevant dashboard screens to mount it (student dashboard, parent child view, admin student detail).

**Interfaces:**
- Consumes: `fetchStudentProgress(studentId)`; for the upcoming plan, the session `getById`/list already returns `assignments` + `homework`.
- Behavior: read-only; gated by `usePermission(QURAN_PERMISSIONS.PROGRESS_VIEW)`.

- [ ] **Step 1: Find the dashboard screens** for student and parent.

Run: `ls "web/src/app/[lng]/dashboard" && grep -rln "VIEW_STUDENT\|VIEW_PARENT\|dashboard" web/src/features | head`

- [ ] **Step 2: Build the read-only view** — show overall percent, then **only juz' with `touched > 0`** (per the dashboard rule), each with its percent bar and ordered surah list; highlight the `current` surah + `currentAyah` ("الحالية: <surah> آية <n>"). Below it, show the upcoming lesson's plan (memorize/review surah+ayah chips + homework text) from the next scheduled session.

- [ ] **Step 3: Mount** it in student dashboard, parent's child view, and the admin student detail (read-only summary next to the editor).

- [ ] **Step 4: Manual verify** — as the student and as the parent, the dashboard shows only touched juz', the current surah/ayah, and the next lesson's plan; an unrelated parent cannot load another child's progress (403 handled gracefully).

- [ ] **Step 5: Commit**

```bash
git add web/src
git commit -m "feat(web/dashboard): Quran progress + upcoming plan widgets"
```

---

## Self-Review (done)

- **Spec coverage:** reference models + accurate segmentation (A1, B1–B3); per-segment progress with NOT_STARTED-as-absent + current ayah (E1–E3); dashboard "touched-only" rule (J1); lesson plan memorize/review/homework with ≥1 rule + ayah-range validation (F1–F2, I1); permissions/scope (C1, E2); seed (B3); ar+en codes (C1, G1). All covered.
- **Placeholders:** the only deferred content is the bulk canonical Quran dataset (B1), which is gated by an executable invariant verifier (B2) — correctness is checkable, not vague. Frontend MUI/RHF boilerplate is intentionally specified by behavior + data contract and mirrored from named sibling features, per repo convention.
- **Type consistency:** `items` shape `{segmentId,status,currentAyah}` consistent across E1/E2/E3; assignment shape `{kind,surahId,fromAyah,toAyah,order}` consistent across F1/F2/I1; `setJuzProgress`/`setPlan` names consistent across layers.
