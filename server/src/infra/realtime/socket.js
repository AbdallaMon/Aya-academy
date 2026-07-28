// ===========================================================================
// Realtime (socket.io) — per-user notification push.
//
// A single io server is attached to the HTTP server at boot. Each connection is
// authenticated with the SAME access token the REST API uses (the httpOnly
// `ayah_access` cookie, or a Bearer token in the auth handshake), and joined to a
// private room `user:<id>`. Other modules push to a user via `emitToUser`.
//
// Everything here is best-effort: if realtime is not initialised (e.g. in tests)
// the emit helpers are silent no-ops, so callers never need to guard.
// ===========================================================================

import { Server } from "socket.io";
import { ENV } from "../../config/env.js";
import { AUTH_COOKIE, JwtService } from "../security/jwt.js";
import { getAuthUserById } from "../auth/authUser.repo.js";

let io = null;

const userRoom = (userId) => `user:${userId}`;

/** Read one cookie value out of a raw `Cookie:` header (no extra deps). */
function readCookie(rawCookie, name) {
  if (!rawCookie) return null;
  for (const part of rawCookie.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) {
      return decodeURIComponent(part.slice(eq + 1).trim());
    }
  }
  return null;
}

/** Pull the access token from the socket handshake (cookie first, then auth/Bearer). */
function extractToken(socket) {
  const cookieToken = readCookie(socket.handshake.headers?.cookie, AUTH_COOKIE);
  if (cookieToken) return cookieToken;
  const authToken = socket.handshake.auth?.token;
  if (authToken) {
    return authToken.startsWith("Bearer ") ? authToken.slice(7) : authToken;
  }
  return null;
}

/** Create the io server and wire authenticated, per-user rooms. */
export function initRealtime(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: ENV.cors.origins.length ? ENV.cors.origins : true,
      credentials: true,
    },
  });

  // Authenticate every connection the same way the REST API does. A socket that
  // cannot be tied to an active user is rejected before it joins any room.
  io.use(async (socket, next) => {
    try {
      const token = extractToken(socket);
      if (!token) return next(new Error("unauthorized"));

      let payload;
      try {
        payload = JwtService.verifyAccess(token);
      } catch {
        return next(new Error("unauthorized"));
      }

      const user = await getAuthUserById(payload.id);
      if (!user || !user.isActive) return next(new Error("unauthorized"));
      if ((user.sessionVersion ?? 0) !== (payload.sessionVersion ?? 0)) {
        return next(new Error("unauthorized"));
      }

      socket.data.userId = user.id;
      return next();
    } catch (err) {
      return next(new Error("unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(userRoom(socket.data.userId));
  });

  return io;
}

/** Push an event + payload to a single user's room. Best-effort no-op if down. */
export function emitToUser(userId, event, payload) {
  if (!io || userId == null) return;
  try {
    io.to(userRoom(userId)).emit(event, payload);
  } catch {
    // swallow — realtime delivery is best-effort
  }
}
