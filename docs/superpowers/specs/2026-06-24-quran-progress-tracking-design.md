# Quran Progress Tracking + Lesson Next-Plan — Design

**Date:** 2026-06-24
**Status:** Approved (design), pending implementation plan

## Goal

Track each student's memorization progress through the Quran (30 juz', 114 surahs)
and let the teacher (ADMIN) plan what each student works on next, attached to a
lesson (`LessonSession` = الحصة).

Two surfaces:
1. **Progress** — the teacher opens a juz', checks the surah-portions the student
   completed; the dashboard shows only touched juz', the current surah/ayah, and
   per-juz' + overall percentages.
2. **Next-plan** — when creating/editing a lesson, the teacher sets what's due next
   time: memorization (حفظ) surahs/ayahs, review (مراجعة) surahs/ayahs, and/or a
   free-text homework note. All optional, but at least one required.

## Key modeling decision

Surahs do **not** align to juz' boundaries — one surah can span multiple juz'
(Al-Baqarah → juz 1, 2, 3) and one juz' contains portions of several surahs.
We use **accurate segmentation**: the unit of completion is a *segment* (the
portion of one surah inside one juz', as an ayah range).

Progress per juz' = completed segments ÷ total segments in that juz'.

## Data model (Prisma — `packages/db/prisma/schema.prisma`)

### Reference data (seeded once, read-only at runtime)

```
model QuranSurah {
  id              Int            @id @default(autoincrement())
  number          Int            @unique        // 1..114, also display order
  nameAr          String
  nameEn          String
  ayahCount       Int
  revelationPlace RevelationPlace
  segments        QuranJuzSegment[]
  assignments     LessonAssignment[]
}

model QuranJuz {
  id       Int               @id @default(autoincrement())
  number   Int               @unique            // 1..30
  nameAr   String
  nameEn   String
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
  order    Int        @default(0)               // position of this segment within the juz'
  progress StudentSegmentProgress[]

  @@unique([juzId, surahId])                     // a surah appears once per juz'
  @@index([juzId])
  @@index([surahId])
}
```

~140 segment rows total (114 surahs + the times a surah crosses a juz' boundary).

### Student progress

```
model StudentSegmentProgress {
  id          Int             @id @default(autoincrement())
  studentId   Int
  student     User            @relation("StudentQuranProgress", fields: [studentId], references: [id], onDelete: Cascade)
  segmentId   Int
  segment     QuranJuzSegment @relation(fields: [segmentId], references: [id], onDelete: Cascade)
  status      SegmentStatus                       // IN_PROGRESS | COMPLETED ; no row = NOT_STARTED
  currentAyah Int?                                // optional ayah-level position within an in-progress segment
  completedAt DateTime?
  updatedById Int?
  updatedBy   User?           @relation("SegmentProgressUpdatedBy", fields: [updatedById], references: [id])

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([studentId, segmentId])
  @@index([studentId])
}
```

- **No row = NOT_STARTED.** A row exists only once the teacher touches the segment.
- **Current surah/ayah** (the optional ayah-level detail) = the `IN_PROGRESS` segment
  + its `currentAyah`.
- **Dashboard rule:** only juz' with ≥1 touched segment are shown; surahs ordered by
  `segment.order`.

### Lesson next-plan

Extend existing `LessonSession`:
```
  homework    String?           @db.Text     // free-text "what's due next time"
  assignments LessonAssignment[]
```

```
model LessonAssignment {
  id        Int                  @id @default(autoincrement())
  lessonId  Int
  lesson    LessonSession        @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  kind      LessonAssignmentKind                  // MEMORIZE | REVIEW
  surahId   Int
  surah     QuranSurah           @relation(fields: [surahId], references: [id])
  fromAyah  Int?                                  // null + null toAyah = whole surah
  toAyah    Int?
  order     Int                  @default(0)
  createdAt DateTime             @default(now())

  @@index([lessonId])
}
```

- The plan is **decoupled** from progress (teacher updates progress separately).
- Validation: when setting a lesson's plan, at least one of `{assignments, homework}`
  must be present.

### New enums (mirror in `packages/shared/constants/enums.js`)

```
enum RevelationPlace     { MAKKI  MADANI }
enum SegmentStatus       { IN_PROGRESS  COMPLETED }
enum LessonAssignmentKind { MEMORIZE  REVIEW }
```

## Backend (`Server/src/modules`)

### New module `quran` (route → controller → usecase → repo → validation → dto → messages)

- `GET /quran/surahs` — all surahs (number, names, ayahCount, revelationPlace). Any authenticated user.
- `GET /quran/juz` — all juz' with their segments (surah + ayah range, ordered). Any authenticated user.
- `GET /quran/progress/:studentId` — the student's full juz/segment tree with per-segment
  status, current position, and per-juz' + overall percentages. **Scoped:** admin=all,
  parent=linked children, student=self (reuse `userRepo.isStudentOfParent` / self-check).
- `PUT /quran/progress/:studentId/juz/:juzId` — **admin-only** (`PROGRESS_MANAGE`).
  Bulk upsert of the juz's segments for the student: each item `{ segmentId, status, currentAyah? }`;
  omitted segments left untouched, or an explicit clear flag to reset to NOT_STARTED.
  This is the "open a juz', check the boxes" action. Sets `completedAt`/`updatedById`.
  Audit-logged (`UPDATE`, entity `StudentSegmentProgress`).

### Extend `sessions` module

- `PUT /sessions/:id/plan` — **admin-only**. Replaces the lesson's `assignments[]` and
  sets `homework`. Validates ≥1 of {assignments, homework}; validates ayah ranges
  (`1 <= fromAyah <= toAyah <= surah.ayahCount`). Multi-write transaction
  (delete old assignments + create new + update homework). Audit-logged.
- Session `GET` (`getById`) includes `assignments` (with surah) + `homework`.

### Permissions (`packages/shared/constants/permissions.js`)

```
QURAN_PERMISSIONS = {
  READ:            "quran.read",            // reference data
  PROGRESS_VIEW:   "quran.progress_view",   // read a student's progress (scoped)
  PROGRESS_MANAGE: "quran.progress_manage", // admin marks segments
}
```
- ADMIN: all (via `getAllPermissions()`).
- PARENT & STUDENT: `READ` + `PROGRESS_VIEW`.
- The lesson plan uses the existing admin `session.edit` permission.

### Message codes

- New `packages/shared/messages-codes/quran.js` (`quranMessagesCodes`) + register in
  the messages-codes index and `messages-names.js`. Codes e.g.
  `STUDENT_NOT_FOUND`, `JUZ_NOT_FOUND`, `SEGMENT_NOT_IN_JUZ`, `INVALID_AYAH_RANGE`,
  `CANNOT_ACCESS_PROGRESS`.
- Sessions: add `PLAN_REQUIRED` (≥1 item), `INVALID_AYAH_RANGE`, `SURAH_NOT_FOUND` to
  `session.messages.js` / `packages/shared/messages-codes/session.js`.
- Every code gets ar + en localization on the web side (per repo convention).

## Frontend (`web`)

Follow the config-driven feature shape (`features/<x>` + `config/`, DataTable/useRequest,
AppForm + RHF, `usePermission` gating, i18n).

- **Admin → student detail**: a "تقدم القرآن" section. A button opens a juz' picker;
  selecting a juz' renders its surah-segments ordered, each with a completed / in-progress
  checkbox + optional current-ayah input. Save → `PUT /quran/progress/:studentId/juz/:juzId`.
- **Session create/edit modal**: a "خطة المرة الجاية" section — multi-select surahs for
  حفظ (MEMORIZE), multi-select surahs for مراجعة (REVIEW) each with whole-surah or ayah-range,
  and a homework textarea. Client + server enforce ≥1. Submits to `PUT /sessions/:id/plan`.
- **Dashboard (student/parent + admin overview)**: show only touched juz', ordered surahs,
  current surah/ayah, % per juz' + overall, and the upcoming lesson's plan.

## Seed (`packages/db/prisma/seed.js`)

Add a `seedQuran()` step:
1. Upsert 114 `QuranSurah` rows (number, nameAr, nameEn, ayahCount, revelationPlace) —
   canonical fixed data.
2. Upsert 30 `QuranJuz` rows (number, nameAr, nameEn).
3. Upsert `QuranJuzSegment` rows from a verified juz'-boundary table (juz' number →
   ordered list of {surah number, fromAyah, toAyah}).

Idempotent upserts keyed on the unique fields so re-seeding is safe.

## Decisions / defaults

- The "teacher" who marks progress and sets plans = **ADMIN** (no separate teacher role).
- Completion granularity = **segment** (a surah's portion within a juz').
- Lesson plan references **whole surahs + ayah ranges**, independent of juz' segmentation.
- Plan and progress are decoupled (no auto-feedback from one to the other this round).

## Out of scope (this round)

- Auto-advancing progress from completed lesson plans.
- Points/badges awarded on juz' completion.
- Editing Quran reference data at runtime (seed-only).
