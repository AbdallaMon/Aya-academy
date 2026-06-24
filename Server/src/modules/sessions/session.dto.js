// Student projection embedded in a session payload.
export const sessionStudentSelect = {
  id: true,
  name: true,
  nickname: true,
};

export const lessonAssignmentSelect = {
  id: true,
  kind: true,
  surahId: true,
  fromAyah: true,
  toAyah: true,
  order: true,
  surah: { select: { id: true, number: true, nameAr: true, nameEn: true, ayahCount: true } },
};

// Public session projection (includes the related student summary).
export const sessionSelect = {
  id: true,
  studentId: true,
  subscriptionId: true,
  title: true,
  startsAt: true,
  endsAt: true,
  status: true,
  meetingLink: true,
  notes: true,
  homework: true,
  assignments: { select: lessonAssignmentSelect, orderBy: { order: "asc" } },
  createdById: true,
  createdAt: true,
  updatedAt: true,
  student: { select: sessionStudentSelect },
};
