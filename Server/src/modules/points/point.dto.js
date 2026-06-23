// Student projection embedded in a point ledger row.
export const pointStudentSelect = {
  id: true,
  name: true,
  nickname: true,
};

// Awarder projection embedded in a point ledger row.
export const pointAwardedBySelect = {
  id: true,
  name: true,
};

// Public point (ledger) projection.
export const pointSelect = {
  id: true,
  studentId: true,
  amount: true,
  source: true,
  sourceId: true,
  badgeId: true,
  reason: true,
  awardedById: true,
  createdAt: true,
  awardedBy: { select: pointAwardedBySelect },
};

/**
 * Shape a leaderboard row. Deliberately exposes ONLY name/nickname/points —
 * never email or other PII.
 */
export function toLeaderboardItem({ studentId, name, nickname, points, weeklyPoints, badgeCount }, rank) {
  return {
    studentId,
    name,
    nickname: nickname ?? null,
    points: points ?? 0,
    weeklyPoints: weeklyPoints ?? 0,
    badgeCount: badgeCount ?? 0,
    rank,
  };
}
