import { getPermissionsForRole } from "@aya/shared";
import { AUTH_COOKIE, JwtService } from "../../infra/security/jwt.js";
import { getAuthUserById } from "../../infra/auth/authUser.repo.js";
import { forbidden, unauthorized } from "../errors/AppError.js";

function extractToken(req) {
  const cookieToken = req.cookies?.[AUTH_COOKIE];
  if (cookieToken) return cookieToken;
  const header = req.headers.authorization ?? "";
  return header.startsWith("Bearer ") ? header.slice(7) : null;
}

class AuthMiddleware {
  requireAuth = async (req, _res, next) => {
    try {
      const token = extractToken(req);
      if (!token) return next(unauthorized());

      let payload;
      try {
        payload = JwtService.verifyAccess(token);
      } catch {
        return next(unauthorized());
      }

      const user = await getAuthUserById(payload.id);
      if (!user || !user.isActive) return next(unauthorized());
      if ((user.sessionVersion ?? 0) !== (payload.sessionVersion ?? 0)) {
        return next(unauthorized());
      }

      req.auth = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        locale: user.locale,
        isActive: user.isActive,
        sessionVersion: user.sessionVersion,
        permissions: getPermissionsForRole(user.role),
      };
      return next();
    } catch (error) {
      return next(error);
    }
  };

  /** Require ALL listed permission codes. */
  requirePermissions = (required = []) => {
    return (req, _res, next) => {
      const perms = req.auth?.permissions ?? [];
      if (!required.every((p) => perms.includes(p))) return next(forbidden());
      next();
    };
  };

  /** Require ANY of the listed permission codes. */
  requireAnyPermission = (anyOf = []) => {
    return (req, _res, next) => {
      const perms = req.auth?.permissions ?? [];
      if (!anyOf.some((p) => perms.includes(p))) return next(forbidden());
      next();
    };
  };

  /** Object-level / scope check executed before the handler. */
  requireSpecialChecker = (checker) => {
    return async (req, _res, next) => {
      try {
        await checker(req);
        next();
      } catch (error) {
        next(error);
      }
    };
  };
}

export const authMiddleware = new AuthMiddleware();
