// Reusable Prisma select for safely exposing a user (never the password hash).
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
  createdAt: true,
};
