import { rateLimit } from "express-rate-limit";
import { authMessagesCodes, gameMessagesCodes, messagesNames } from "@aya/shared";
import { tooManyRequests } from "../errors/AppError.js";

// Per-IP rate limit for the public free-trial game. After FREE_GAME_MAX loads
// inside the window, the player is asked to wait. The 429 is funnelled through
// the normal AppError pipeline so the response carries our standard envelope
// (code + translationKey + details.retryAfterMinutes), letting the frontend show
// a friendly "come back in ~N minutes" screen.
const FREE_GAME_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const FREE_GAME_MAX = 10; // tries per window

export const freeGameRateLimiter = rateLimit({
  windowMs: FREE_GAME_WINDOW_MS,
  limit: FREE_GAME_MAX,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: (req, _res, next) => {
    const resetMs =
      req.rateLimit?.resetTime instanceof Date
        ? req.rateLimit.resetTime.getTime() - Date.now()
        : FREE_GAME_WINDOW_MS;
    const retryAfterSeconds = Math.max(1, Math.ceil(resetMs / 1000));
    return next(
      tooManyRequests(
        gameMessagesCodes.FREE_GAME_RATE_LIMITED,
        messagesNames.gameMessages,
        {
          retryAfterSeconds,
          retryAfterMinutes: Math.max(1, Math.ceil(retryAfterSeconds / 60)),
          limit: FREE_GAME_MAX,
          windowMinutes: Math.round(FREE_GAME_WINDOW_MS / 60000),
        },
      ),
    );
  },
});

// Per-IP throttle for the public forgot-password endpoint. Caps how often reset
// e-mails can be requested from one address, blunting enumeration + inbox-spam
// abuse. Funnelled through AppError so the response carries our standard envelope.
const PASSWORD_RESET_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const PASSWORD_RESET_MAX = 5; // requests per window

export const passwordResetRateLimiter = rateLimit({
  windowMs: PASSWORD_RESET_WINDOW_MS,
  limit: PASSWORD_RESET_MAX,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: (req, _res, next) => {
    const resetMs =
      req.rateLimit?.resetTime instanceof Date
        ? req.rateLimit.resetTime.getTime() - Date.now()
        : PASSWORD_RESET_WINDOW_MS;
    const retryAfterSeconds = Math.max(1, Math.ceil(resetMs / 1000));
    return next(
      tooManyRequests(
        authMessagesCodes.RESET_RATE_LIMITED,
        messagesNames.authMessages,
        {
          retryAfterSeconds,
          retryAfterMinutes: Math.max(1, Math.ceil(retryAfterSeconds / 60)),
          limit: PASSWORD_RESET_MAX,
          windowMinutes: Math.round(PASSWORD_RESET_WINDOW_MS / 60000),
        },
      ),
    );
  },
});

// Per-IP failed-login limit. Successful responses are removed from the count,
// so normal sign-ins do not consume the allowance.
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX = 10;

export const loginRateLimiter = rateLimit({
  windowMs: LOGIN_WINDOW_MS,
  limit: LOGIN_MAX,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (req, _res, next) => {
    const resetMs =
      req.rateLimit?.resetTime instanceof Date
        ? req.rateLimit.resetTime.getTime() - Date.now()
        : LOGIN_WINDOW_MS;
    const retryAfterSeconds = Math.max(1, Math.ceil(resetMs / 1000));
    return next(
      tooManyRequests(
        authMessagesCodes.LOGIN_RATE_LIMITED,
        messagesNames.authMessages,
        {
          retryAfterSeconds,
          retryAfterMinutes: Math.max(1, Math.ceil(retryAfterSeconds / 60)),
          limit: LOGIN_MAX,
          windowMinutes: Math.round(LOGIN_WINDOW_MS / 60000),
        },
      ),
    );
  },
});

// Public account creation is deliberately stricter than login. It protects both
// the simple parent registration and the heavier family-enrollment endpoint.
const REGISTRATION_WINDOW_MS = 60 * 60 * 1000;
const REGISTRATION_MAX = 5;

export const registrationRateLimiter = rateLimit({
  windowMs: REGISTRATION_WINDOW_MS,
  limit: REGISTRATION_MAX,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: (req, _res, next) => {
    const resetMs =
      req.rateLimit?.resetTime instanceof Date
        ? req.rateLimit.resetTime.getTime() - Date.now()
        : REGISTRATION_WINDOW_MS;
    const retryAfterSeconds = Math.max(1, Math.ceil(resetMs / 1000));
    return next(
      tooManyRequests(
        authMessagesCodes.REGISTRATION_RATE_LIMITED,
        messagesNames.authMessages,
        {
          retryAfterSeconds,
          retryAfterMinutes: Math.max(1, Math.ceil(retryAfterSeconds / 60)),
          limit: REGISTRATION_MAX,
          windowMinutes: Math.round(REGISTRATION_WINDOW_MS / 60000),
        },
      ),
    );
  },
});
