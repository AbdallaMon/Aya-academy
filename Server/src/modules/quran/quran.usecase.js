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
