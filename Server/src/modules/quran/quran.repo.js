import { prisma } from "@aya/db/prisma.client.js";
import { surahSelect, juzWithSegmentsSelect, progressSelect } from "./quran.dto.js";
import { SEGMENT_STATUSES } from "@aya/shared";

class QuranRepo {
  listSurahs() {
    return prisma.quranSurah.findMany({ orderBy: { number: "asc" }, select: surahSelect });
  }

  listJuzWithSegments() {
    return prisma.quranJuz.findMany({ orderBy: { number: "asc" }, select: juzWithSegmentsSelect });
  }

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
}

export const quranRepo = new QuranRepo();
