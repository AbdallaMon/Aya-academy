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
 * Student projection used to hydrate leaderboard rows. PII-safe: exposes only
 * the fields the public board needs (name/nickname/points/level/avatar) — never
 * email, phone or birthDate.
 */
export const leaderboardStudentSelect = {
  id: true,
  name: true,
  nickname: true,
  points: true,
  level: true,
  studentLevel: true,
  avatar: { select: { id: true, url: true } },
};

/**
 * Shape a leaderboard row. Deliberately exposes ONLY non-PII fields:
 * name/nickname/points/level/studentLevel and the avatar image.
 */
export function toLeaderboardItem(
  { studentId, name, nickname, points, weeklyPoints, badgeCount, level, studentLevel, avatar },
  rank,
) {
  return {
    studentId,
    name,
    nickname: nickname ?? null,
    points: points ?? 0,
    weeklyPoints: weeklyPoints ?? 0,
    badgeCount: badgeCount ?? 0,
    level: level ?? 1,
    studentLevel: studentLevel ?? null,
    avatar: avatar ? { id: avatar.id, url: avatar.url } : null,
    rank,
  };
}
