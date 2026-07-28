import {
  hoursFromMinutes,
  resolveStoredMinutes,
} from "../../../shared/utility/duration.js";

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
// `hours` is surfaced so the usage-billing zero-session fallback can read the
// subscription's OWN linked plan hours (v3 locked model §4).
export const subscriptionPlanSelect = {
  id: true,
  titleAr: true,
  titleEn: true,
  hours: true,
};

// Coupon (discount) projection embedded in a subscription payload — lets the
// frontend and invoice surface the applied discount.
export const subscriptionCouponSelect = {
  id: true,
  code: true,
  type: true,
  value: true,
  billingPeriod: true,
};

// Public subscription projection (includes the related student + plan summary).
export const subscriptionSelect = {
  id: true,
  studentId: true,
  planId: true,
  billingPeriod: true,
  status: true,
  origin: true,
  startDate: true,
  endDate: true,
  subsMinutes: true,
  remainingMinutes: true,
  subsHours: true,
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
  coupon: { select: subscriptionCouponSelect },
  // 1:1 demand invoice — surfaced so the subscriptions list can show whether
  // it's paid. Null until the invoice is generated. `sentAt` lets the usecase
  // hide an unsent invoice from non-admins (the teacher must request payment
  // before a parent/student sees it).
  invoice: {
    select: {
      id: true,
      status: true,
      subtotal: true,
      configJson: true,
      dueDate: true,
      sentAt: true,
    },
  },
};

/**
 * Flatten the student's `studentLinks` into `student.parents[]` so the frontend
 * can surface parent phone/email without re-querying. Mirrors user.dto's
 * `toUserListItem` link-flattening. Safe to call on a single row or null.
 */
export function toSubscription(row) {
  if (!row) return row;
  const subsMinutes = resolveStoredMinutes(row.subsMinutes, row.subsHours);
  const remainingMinutes = resolveStoredMinutes(
    row.remainingMinutes,
    row.remainingHours,
  );
  const normalized = {
    ...row,
    subsMinutes,
    remainingMinutes,
    // Read-only compatibility aliases. All new writes use minute fields.
    subsHours: hoursFromMinutes(subsMinutes),
    remainingHours: hoursFromMinutes(remainingMinutes),
  };
  const { student, ...rest } = normalized;
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
