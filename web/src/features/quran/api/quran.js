// Thin async helpers for the Quran progress endpoints.
// These are plain async functions (not hooks) — use them from server actions,
// route handlers, or non-React contexts. Inside React components, pass the
// returned URLs directly to useRequest / useMultiRequest instead.
//
// All functions return response.data (the unwrapped payload from the shared
// { success, message, data, translationKey } envelope).

import apiFetch from "../../../lib/api/ApiFetch.js";
import {
  QURAN_SURAHS_URL,
  QURAN_JUZ_URL,
  QURAN_PROGRESS_URL,
  SESSIONS_URL,
} from "../config/constant.js";

/**
 * GET /quran/surahs
 * Returns array of { id, number, nameAr, nameEn, ayahCount, revelationPlace }
 */
export async function fetchSurahs() {
  const res = await apiFetch.get(QURAN_SURAHS_URL);
  return res.data;
}

/**
 * GET /quran/juz
 * Returns array of { id, number, nameAr, nameEn, segments:[...] }
 */
export async function fetchJuz() {
  const res = await apiFetch.get(QURAN_JUZ_URL);
  return res.data;
}

/**
 * GET /quran/progress/:studentId
 * Returns { juz:[...], overall:{ total, completed, percent } }
 * @param {number|string} studentId
 */
export async function fetchStudentProgress(studentId) {
  const res = await apiFetch.get(`${QURAN_PROGRESS_URL}/${studentId}`);
  return res.data;
}

/**
 * PUT /quran/progress/:studentId/juz/:juzId
 * Admin-only. Updates progress for one juz.
 * @param {number|string} studentId
 * @param {number|string} juzId
 * @param {Array<{ segmentId: number, status: "IN_PROGRESS"|"COMPLETED"|null, currentAyah?: number|null }>} items
 */
export async function setJuzProgress(studentId, juzId, items) {
  const res = await apiFetch.put(
    `${QURAN_PROGRESS_URL}/${studentId}/juz/${juzId}`,
    { items },
  );
  return res.data;
}

/**
 * PUT /sessions/:id/plan
 * Admin-only. Sets homework and/or memorization assignments on a session.
 * @param {number|string} sessionId
 * @param {{ homework?: string, assignments?: Array<{ kind: "MEMORIZE"|"REVIEW", surahId: number, fromAyah?: number|null, toAyah?: number|null, order?: number }> }} body
 */
export async function setSessionPlan(sessionId, body) {
  const res = await apiFetch.put(`${SESSIONS_URL}/${sessionId}/plan`, body);
  return res.data;
}
