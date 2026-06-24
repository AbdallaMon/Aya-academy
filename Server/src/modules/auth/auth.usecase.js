import {
  USER_ROLES,
  authMessagesCodes,
  messagesNames,
} from "@aya/shared";
import { AppError } from "../../shared/errors/AppError.js";
import { comparePassword, hashPassword } from "../../infra/security/hash.js";
import { authRepo } from "./auth.repo.js";

class AuthUsecase {
  /** Public self-registration — always creates a PARENT account. */
  async register({ name, email, password, phone, locale }) {
    const existing = await authRepo.findByEmail(email);
    if (existing) {
      throw new AppError({
        statusCode: 409,
        code: authMessagesCodes.EMAIL_ALREADY_EXISTS,
        message: authMessagesCodes.EMAIL_ALREADY_EXISTS,
        translationKey: messagesNames.authMessages,
      });
    }
    const passwordHash = await hashPassword(password);
    return authRepo.createUser({
      name,
      email,
      passwordHash,
      phone,
      locale: locale ?? "ar",
      role: USER_ROLES.PARENT,
    });
  }

  async login({ email, password }) {
    const user = await authRepo.findByEmail(email);
    if (!user) {
      throw new AppError({
        statusCode: 401,
        code: authMessagesCodes.INVALID_CREDENTIALS,
        message: authMessagesCodes.INVALID_CREDENTIALS,
        translationKey: messagesNames.authMessages,
      });
    }
    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      throw new AppError({
        statusCode: 401,
        code: authMessagesCodes.INVALID_CREDENTIALS,
        message: authMessagesCodes.INVALID_CREDENTIALS,
        translationKey: messagesNames.authMessages,
      });
    }
    if (!user.isActive) {
      throw new AppError({
        statusCode: 403,
        code: authMessagesCodes.ACCOUNT_INACTIVE,
        message: authMessagesCodes.ACCOUNT_INACTIVE,
        translationKey: messagesNames.authMessages,
        redirectTo: "/login",
        redirectText: authMessagesCodes.BACK_TO_LOGIN,
      });
    }
    await authRepo.updateLastLogin(user.id);
    return user;
  }

  getById(id) {
    return authRepo.findPublicById(id);
  }
}

export const authUsecase = new AuthUsecase();
