import { prisma } from "@aya/db/prisma.client.js";
import { sessionSelect } from "./session.dto.js";

class SessionRepo {
  async listSessions(where, skip, take) {
    const [items, total] = await Promise.all([
      prisma.lessonSession.findMany({
        where,
        skip,
        take,
        orderBy: { startsAt: "asc" },
        select: sessionSelect,
      }),
      prisma.lessonSession.count({ where }),
    ]);
    return { items, total };
  }

  getById(id) {
    return prisma.lessonSession.findUnique({
      where: { id },
      select: sessionSelect,
    });
  }

  createSession(data) {
    return prisma.lessonSession.create({ data, select: sessionSelect });
  }

  updateSession(id, data) {
    return prisma.lessonSession.update({
      where: { id },
      data,
      select: sessionSelect,
    });
  }

  deleteSession(id) {
    return prisma.lessonSession.delete({
      where: { id },
      select: sessionSelect,
    });
  }

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
}

export const sessionRepo = new SessionRepo();
