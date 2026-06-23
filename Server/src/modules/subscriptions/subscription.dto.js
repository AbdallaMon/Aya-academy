// Student projection embedded in a subscription payload.
// Includes the student's email + parents (so the frontend can show parent
// phone/email). `studentLinks` is flattened into `parents` by `toSubscription`.
export const subscriptionStudentSelect = {
  id: true,
  name: true,
  nickname: true,
  email: true,
  studentLinks: {
    select: {
      relation: true,
      parent: { select: { id: true, name: true, phone: true, email: true } },
    },
  },
};

// Plan projection embedded in a subscription payload.
export const subscriptionPlanSelect = {
  id: true,
  titleAr: true,
  titleEn: true,
  billingPeriod: true,
};

// Public subscription projection (includes the related student + plan summary).
export const subscriptionSelect = {
  id: true,
  studentId: true,
  planId: true,
  status: true,
  startDate: true,
  endDate: true,
  totalHours: true,
  remainingHours: true,
  currency: true,
  priceCharged: true,
  couponId: true,
  notes: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
  student: { select: subscriptionStudentSelect },
  plan: { select: subscriptionPlanSelect },
};

/**
 * Flatten the student's `studentLinks` into `student.parents[]` so the frontend
 * can surface parent phone/email without re-querying. Mirrors user.dto's
 * `toUserListItem` link-flattening. Safe to call on a single row or null.
 */
export function toSubscription(row) {
  if (!row) return row;
  const { student, ...rest } = row;
  if (!student) return { ...rest, student };
  const { studentLinks, ...studentRest } = student;
  return {
    ...rest,
    student: {
      ...studentRest,
      parents: (studentLinks ?? []).map((link) => ({
        id: link.parent.id,
        name: link.parent.name,
        phone: link.parent.phone,
        email: link.parent.email,
        relation: link.relation,
      })),
    },
  };
}
