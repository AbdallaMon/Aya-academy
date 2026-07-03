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

  // ── password reset ─────────────────────────────────────────────────────────

  createPasswordReset({ userId, tokenHash, expiresAt, client } = {}) {
    return (client ?? prisma).passwordResetToken.create({
      data: { userId, tokenHash, expiresAt },
    });
  }

  /** Newest unused, unexpired reset row for a token hash (with the owning user). */
  findValidPasswordReset({ tokenHash, client } = {}) {
    return (client ?? prisma).passwordResetToken.findFirst({
      where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
      include: {
        user: {
          select: { id: true, email: true, name: true, locale: true, isActive: true },
        },
      },
    });
  }

  markPasswordResetUsed({ id, client } = {}) {
    return (client ?? prisma).passwordResetToken.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }

  /** Drop all reset tokens for a user (called before issuing a new one + after use). */
  deleteUserPasswordResets({ userId, client } = {}) {
    return (client ?? prisma).passwordResetToken.deleteMany({ where: { userId } });
  }

  /** Set a new password and bump sessionVersion to invalidate existing sessions. */
  updatePasswordAndBumpSession({ id, passwordHash, client } = {}) {
    return (client ?? prisma).user.update({
      where: { id },
      data: { passwordHash, sessionVersion: { increment: 1 } },
    });
  }
}

export const authRepo = new AuthRepo();
export { AuthRepo };
