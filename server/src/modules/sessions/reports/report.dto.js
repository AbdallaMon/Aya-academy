// Student projection embedded in a report payload.
export const reportStudentSelect = {
  id: true,
  name: true,
  nickname: true,
};

// Linked-student row projection (includes the related student summary).
export const reportStudentLinkSelect = {
  id: true,
  reportId: true,
  studentId: true,
  student: { select: reportStudentSelect },
};

// Linked-attachment row projection.
export const reportAttachmentLinkSelect = {
  id: true,
  reportId: true,
  attachmentId: true,
};

// Public report projection for list views (includes linked students).
export const reportListSelect = {
  id: true,
  title: true,
  body: true,
  reportDate: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
  students: { select: reportStudentLinkSelect },
};

// Full report projection for detail views (students + attachments).
export const reportSelect = {
  ...reportListSelect,
  attachments: { select: reportAttachmentLinkSelect },
};
