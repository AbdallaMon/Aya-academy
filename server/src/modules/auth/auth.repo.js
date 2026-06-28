import { prisma } from "@aya/db/prisma.client.js";
import { publicUserSelect } from "./auth.dto.js";

class AuthRepo {
  findByEmail(email) {
    return prisma.user.findUnique({ where: { email } });
  }

  findPublicById(id) {
    return prisma.user.findUnique({ where: { id }, select: publicUserSelect });
  }

  createUser(data) {
    return prisma.user.create({ data, select: publicUserSelect });
  }

  updateLastLogin(id) {
    return prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }
}

export const authRepo = new AuthRepo();
