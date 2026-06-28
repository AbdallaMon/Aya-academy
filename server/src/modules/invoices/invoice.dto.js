// Invoice projection. Decimal columns are normalised to plain numbers and the
// embedded subscription/student/plan are summarised so the frontend can render
// the printable document without extra round-trips.

function toNum(value) {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

const invoiceStudentSelect = {
  id: true,
  name: true,
  nickname: true,
  email: true,
  phone: true,
  studentLinks: {
    select: {
      relation: true,
      parent: { select: { id: true, name: true, phone: true, email: true } },
    },
  },
};

const invoicePlanSelect = {
  id: true,
  titleAr: true,
  titleEn: true,
};

const invoiceCouponSelect = {
  id: true,
  code: true,
  type: true,
  value: true,
  billingPeriod: true,
};

const invoiceSubscriptionSelect = {
  id: true,
  studentId: true,
  planId: true,
  billingPeriod: true,
  status: true,
  startDate: true,
  endDate: true,
  totalHours: true,
  remainingHours: true,
  currency: true,
  priceCharged: true,
  student: { select: invoiceStudentSelect },
  plan: { select: invoicePlanSelect },
  coupon: { select: invoiceCouponSelect },
};

export const invoiceSelect = {
  id: true,
  subscriptionId: true,
  invoiceNumber: true,
  status: true,
  currency: true,
  hours: true,
  hourlyRate: true,
  subtotal: true,
  transferFee: true,
  total: true,
  previousCredit: true,
  previousDebt: true,
  configJson: true,
  issueDate: true,
  billingPeriodLabel: true,
  dueDate: true,
  notes: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
  subscription: { select: invoiceSubscriptionSelect },
};

export function toInvoice(row) {
  if (!row) return row;
  const { subscription, ...rest } = row;

  const normalized = {
    ...rest,
    hours: toNum(rest.hours),
    hourlyRate: toNum(rest.hourlyRate),
    subtotal: toNum(rest.subtotal),
    transferFee: toNum(rest.transferFee),
    total: toNum(rest.total),
    previousCredit: toNum(rest.previousCredit),
    previousDebt: toNum(rest.previousDebt),
  };

  if (!subscription) return { ...normalized, subscription };

  const { student, plan, ...subRest } = subscription;
  const subStudent = student
    ? (() => {
        const { studentLinks, ...studentRest } = student;
        return {
          ...studentRest,
          parents: (studentLinks ?? []).map((link) => ({
            id: link.parent.id,
            name: link.parent.name,
            phone: link.parent.phone,
            email: link.parent.email,
            relation: link.relation,
          })),
        };
      })()
    : student;

  return {
    ...normalized,
    subscription: {
      ...subRest,
      priceCharged: toNum(subRest.priceCharged),
      student: subStudent,
      plan,
    },
  };
}
