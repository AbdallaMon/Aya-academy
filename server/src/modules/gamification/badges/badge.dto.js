// Public badge-definition projection.
export const badgeSelect = {
  id: true,
  code: true,
  nameAr: true,
  nameEn: true,
  descriptionAr: true,
  descriptionEn: true,
  icon: true,
  emoji: true,
  bgColor: true,
  textColor: true,
  score: true,
  isActive: true,
  createdAt: true,
};

// Awarded-badge projection (StudentBadge joined with its badge definition).
export const studentBadgeSelect = {
  id: true,
  studentId: true,
  badgeId: true,
  certificateId: true,
  awardedById: true,
  awardedAt: true,
  badge: { select: badgeSelect },
};

/** Flatten a StudentBadge row into the badge definition + award metadata. */
export function toAwardedBadgeItem(row) {
  return {
    ...row.badge,
    studentBadgeId: row.id,
    certificateId: row.certificateId ?? null,
    awardedById: row.awardedById,
    awardedAt: row.awardedAt,
  };
}
