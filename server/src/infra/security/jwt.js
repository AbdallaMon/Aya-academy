import jwt from "jsonwebtoken";
import { ENV } from "../../config/env.js";

export const AUTH_COOKIE = "ayah_access";
export const REFRESH_COOKIE = "ayah_refresh";

export const ACCESS_MAX_AGE = 15 * 60 * 1000; // 15m
export const REFRESH_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30d

export const JwtService = {
  signAccess(payload) {
    return jwt.sign(payload, ENV.auth.accessSecret, {
      expiresIn: ENV.auth.accessExpires,
    });
  },
  signRefresh(payload) {
    return jwt.sign(payload, ENV.auth.refreshSecret, {
      expiresIn: ENV.auth.refreshExpires,
    });
  },
  verifyAccess(token) {
    return jwt.verify(token, ENV.auth.accessSecret);
  },
  verifyRefresh(token) {
    return jwt.verify(token, ENV.auth.refreshSecret);
  },
  cookieOptions(maxAge) {
    return {
      httpOnly: true,
      secure: ENV.IS_PROD,
      sameSite: "lax",
      path: "/",
      maxAge,
      ...(ENV.auth.cookieDomain ? { domain: ENV.auth.cookieDomain } : {}),
    };
  },
  clearCookieOptions() {
    return {
      httpOnly: true,
      secure: ENV.IS_PROD,
      sameSite: "lax",
      path: "/",
      ...(ENV.auth.cookieDomain ? { domain: ENV.auth.cookieDomain } : {}),
    };
  },
};
