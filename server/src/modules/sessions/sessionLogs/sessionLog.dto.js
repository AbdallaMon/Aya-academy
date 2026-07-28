// ===========================================================================
// sessionLog.dto — output shaping for SessionLog rows. `durationMinutes` is the
// canonical duration; a computed `durationHours` alias keeps older readers alive
// while historical rows are migrated by the standalone script.
// ===========================================================================

import {
  hoursFromMinutes,
  resolveStoredMinutes,
} from "../../../shared/utility/duration.js";

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
  billedSubscriptionId: true,
  subjectsJson: true,
  durationMinutes: true,
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

export function toSessionLog(row) {
  if (!row) return row;
  const durationMinutes = resolveStoredMinutes(
    row.durationMinutes,
    row.durationHours,
  );
  return {
    ...row,
    durationMinutes,
    durationHours: hoursFromMinutes(durationMinutes),
  };
}
