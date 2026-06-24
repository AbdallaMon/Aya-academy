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
