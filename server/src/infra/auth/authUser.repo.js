import { prisma } from "@ayah/db/prisma.client.js";

/** Minimal user load for request authentication. */
export function getAuthUserById(id) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      phone: true,
      nickname: true,
      role: true,
      locale: true,
      isActive: true,
      sessionVersion: true,
      inAppNotificationsEnabled: true,
      emailNotificationsEnabled: true,
      avatarId: true,
      avatar: { select: { id: true, url: true } },
    },
  });
}
