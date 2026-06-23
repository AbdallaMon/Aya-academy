// Safe user projection (no passwordHash).
export const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  username: true,
  role: true,
  locale: true,
  phone: true,
  isActive: true,
  avatarId: true,
  points: true,
  level: true,
  nickname: true,
  birthDate: true,
  lastLoginAt: true,
  createdAt: true,
};

// List projection: public fields + relationship info for the table.
// - studentLinks → this user's PARENTS (when the user is a STUDENT)
// - _count.parentLinks → number of children (when the user is a PARENT)
export const userListSelect = {
  ...publicUserSelect,
  studentLinks: {
    select: {
      relation: true,
      parent: { select: { id: true, name: true } },
    },
  },
  _count: { select: { parentLinks: true } },
};

// Thin projection of a parent's linked students.
export const childUserSelect = {
  id: true,
  name: true,
  nickname: true,
};

/**
 * Flatten studentLinks/_count into `parents[]` + `childrenCount`.
 * `subscribedStudentIds` (optional Set) flags STUDENT rows that are currently
 * subscribed this month via `isSubscribed`.
 */
export function toUserListItem(user, subscribedStudentIds) {
  const { studentLinks, _count, ...rest } = user;
  const item = {
    ...rest,
    parents: (studentLinks ?? []).map((link) => ({
      id: link.parent.id,
      name: link.parent.name,
      relation: link.relation,
    })),
    childrenCount: _count?.parentLinks ?? 0,
  };
  if (subscribedStudentIds) {
    item.isSubscribed = subscribedStudentIds.has(user.id);
  }
  return item;
}

/** Shape a ParentStudent row (with its student) into a child entry. */
export function toChildItem(link) {
  return {
    id: link.student.id,
    name: link.student.name,
    nickname: link.student.nickname,
    relation: link.relation,
  };
}

// ── overview projections ───────────────────────────────────────
// Core user projection for the overview header (no passwordHash; adds ban + level).
export const overviewUserSelect = {
  id: true,
  name: true,
  nickname: true,
  email: true,
  phone: true,
  role: true,
  isActive: true,
  bannedAt: true,
  banReason: true,
  studentLevel: true,
  points: true,
  level: true,
  createdAt: true,
};

// A student's parents (with contact) via studentLinks.
export const overviewParentSelect = {
  relation: true,
  parent: { select: { id: true, name: true, phone: true, email: true } },
};

// A parent's child (with the fields the overview needs).
export const overviewChildSelect = {
  id: true,
  name: true,
  nickname: true,
  studentLevel: true,
  points: true,
  isActive: true,
};

/** Flatten studentLinks → a parents[] array with contact + relation. */
export function toOverviewParents(studentLinks) {
  return (studentLinks ?? []).map((link) => ({
    id: link.parent.id,
    name: link.parent.name,
    phone: link.parent.phone,
    email: link.parent.email,
    relation: link.relation,
  }));
}
