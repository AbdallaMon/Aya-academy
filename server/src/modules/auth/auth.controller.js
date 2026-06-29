import {
  authMessagesCodes,
  getPermissionsForRole,
  messagesNames,
  USER_ROLES,
} from "@aya/shared";
import { hasActiveSubscription } from "../../shared/access/subscriptionAccess.js";
import { created, ok } from "../../shared/http/response.js";
import {
  ACCESS_MAX_AGE,
  AUTH_COOKIE,
  JwtService,
  REFRESH_COOKIE,
  REFRESH_MAX_AGE,
} from "../../infra/security/jwt.js";
import { unauthorized } from "../../shared/errors/AppError.js";
import { authUsecase } from "./auth.usecase.js";

function setAuthCookies(res, payload) {
  res.cookie(
    AUTH_COOKIE,
    JwtService.signAccess(payload),
    JwtService.cookieOptions(ACCESS_MAX_AGE),
  );
  res.cookie(
    REFRESH_COOKIE,
    JwtService.signRefresh(payload),
    JwtService.cookieOptions(REFRESH_MAX_AGE),
  );
}

// Students are gated by subscription; everyone else is always "active".
async function withSubscriptionFlag(user) {
  const hasActive =
    user.role === USER_ROLES.STUDENT
      ? await hasActiveSubscription(user.id)
      : true;
  return { ...user, hasActiveSubscription: hasActive };
}

class AuthController {
  async register(req, res) {
    const user = await authUsecase.register(req.body);
    return created(
      res,
      { user },
      authMessagesCodes.REGISTERED_SUCCESS,
      messagesNames.authMessages,
    );
  }

  async enroll(req, res) {
    const result = await authUsecase.enrollFamily(req.body);
    return created(
      res,
      result,
      authMessagesCodes.ENROLLED_SUCCESS,
      messagesNames.authMessages,
    );
  }

  async login(req, res) {
    const user = await authUsecase.login(req.body);
    setAuthCookies(res, {
      id: user.id,
      role: user.role,
      sessionVersion: user.sessionVersion,
    });
    const { passwordHash: _drop, ...safe } = user;
    const payload = await withSubscriptionFlag({
      ...safe,
      permissions: getPermissionsForRole(user.role),
    });
    return ok(res, { user: payload }, authMessagesCodes.LOGIN_SUCCESS, messagesNames.authMessages);
  }

  async logout(_req, res) {
    res.clearCookie(AUTH_COOKIE, JwtService.clearCookieOptions());
    res.clearCookie(REFRESH_COOKIE, JwtService.clearCookieOptions());
    return ok(
      res,
      { success: true },
      authMessagesCodes.LOGOUT_SUCCESS,
      messagesNames.authMessages,
    );
  }

  async me(req, res) {
    const user = await withSubscriptionFlag(req.auth);
    return ok(res, { user });
  }

  async refresh(req, res) {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (!token) throw unauthorized();
    let payload;
    try {
      payload = JwtService.verifyRefresh(token);
    } catch {
      throw unauthorized();
    }
    setAuthCookies(res, {
      id: payload.id,
      role: payload.role,
      sessionVersion: payload.sessionVersion,
    });
    return ok(
      res,
      { refreshed: true },
      authMessagesCodes.TOKEN_REFRESHED,
      messagesNames.authMessages,
    );
  }
}

export const authController = new AuthController();
export { AuthController };
