import { rateLimit } from "express-rate-limit";
import { gameMessagesCodes, messagesNames } from "@aya/shared";
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
