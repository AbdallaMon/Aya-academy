import { prisma } from "@aya/db/prisma.client.js";

/** Minimal user load for request authentication. */
export function getAuthUserById(id) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      locale: true,
      isActive: true,
      sessionVersion: true,
    },
  });
}
