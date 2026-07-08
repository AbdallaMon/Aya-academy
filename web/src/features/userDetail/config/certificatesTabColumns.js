"use client";

// Column factory for the student-detail Certificates tab. It renders the SAME
// table as the certificates page (so the two stay in sync), so it delegates to
// the certificates feature's own column factory. Kept here in userDetail/config
// (the contract) so the tab component stays thin and mirrors the reference
// `<feature>Columns.js` convention.

import { buildCertificateColumns } from "../../certificates/config/certificatesColumns.js";

/**
 * @param {object} params
 * @param {object} params.txt     certificatesText hook result
 * @param {string} params.lng     active locale
 * @param {Function} params.onView  row preview handler
 */
export function buildCertificatesTabColumns({ txt, lng, onView }) {
  return buildCertificateColumns({ txt, lng, onView });
}
