// ===========================================================================
// sessionLog.dto — output shaping for SessionLog rows. The Decimal
// `durationHours` column is normalised to a plain JS number (like invoice.dto).
// ===========================================================================

function toNum(value) {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

// Student summary embedded in a session-log payload.
export const sessionLogStudentSelect = {
  id: true,
  name: true,
  nickname: true,
};

// Teacher (admin) summary embedded in a session-log payload.
export const sessionLogTeacherSelect = {
  id: true,
  name: true,
};

// Author summary embedded in a session-log payload.
export const sessionLogCreatedBySelect = {
  id: true,
  name: true,
};

// Projection for list views.
export const sessionLogListSelect = {
  id: true,
  studentId: true,
  teacherId: true,
  subjectsJson: true,
  durationHours: true,
  rating: true,
  report: true,
  attendance: true,
  sessionDate: true,
  createdAt: true,
  student: { select: sessionLogStudentSelect },
  teacher: { select: sessionLogTeacherSelect },
};

// Full projection for detail views (adds the author).
export const sessionLogSelect = {
  ...sessionLogListSelect,
  createdById: true,
  updatedAt: true,
  createdBy: { select: sessionLogCreatedBySelect },
};

// Normalise Decimal → number before the row leaves the server.
export function toSessionLog(row) {
  if (!row) return row;
  return { ...row, durationHours: toNum(row.durationHours) };
}
