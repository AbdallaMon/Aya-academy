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
    const student = await userRepo.getRoleById(studentId);
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
