import { prisma } from "@aya/db/prisma.client.js";
import { publicUserSelect } from "./auth.dto.js";

class AuthRepo {
  findByEmail({ email, client } = {}) {
    return (client ?? prisma).user.findUnique({ where: { email } });
  }

  findPublicById({ id, client } = {}) {
    return (client ?? prisma).user.findUnique({
      where: { id },
      select: publicUserSelect,
    });
  }

  createUser({ data, client } = {}) {
    return (client ?? prisma).user.create({ data, select: publicUserSelect });
  }

  updateLastLogin({ id, client } = {}) {
    return (client ?? prisma).user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }
}

export const authRepo = new AuthRepo();
export { AuthRepo };
