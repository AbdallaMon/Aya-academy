export const QURAN_SURAHS_URL = "quran/surahs";
export const QURAN_JUZ_URL = "quran/juz";
export const QURAN_PROGRESS_URL = "quran/progress";

// Components derive per-student / per-juz paths from QURAN_PROGRESS_URL:
//   GET  `${QURAN_PROGRESS_URL}/${studentId}`               — fetch a student's progress
//   PUT  `${QURAN_PROGRESS_URL}/${studentId}/juz/${juzId}`  — set one juz's progress (admin)
