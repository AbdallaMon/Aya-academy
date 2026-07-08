// Output projections for the whiteboard-sessions module.

const attendeeSelect = {
  id: true,
  studentId: true,
  createdAt: true,
  student: { select: { id: true, name: true, nickname: true } },
};

// List rows: meta + a count of attached students (no full student list).
export const sessionListSelect = {
  id: true,
  title: true,
  status: true,
  visibility: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { students: true } },
};

// Detail: meta + the attached students (identity only).
export const sessionDetailSelect = {
  id: true,
  title: true,
  status: true,
  visibility: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
  students: { orderBy: { createdAt: "asc" }, select: attendeeSelect },
};

// Public payload (token link): expose only what a viewer needs — title, status,
// and student display names. Never leak internal join-row ids or ciphertext.
export function toPublicSession(session) {
  if (!session) return null;
  return {
    id: session.id,
    title: session.title,
    status: session.status,
    students: (session.students ?? []).map((s) => ({
      id: s.student.id,
      name: s.student.nickname || s.student.name,
    })),
  };
}
