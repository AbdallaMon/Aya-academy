"use client";

// Singleton socket.io-client connection for realtime notifications.
//
// One shared connection for the whole app. The server authenticates the socket
// using the SAME httpOnly cookie (ayah_access) as the REST API, so we connect
// with `withCredentials: true` and never touch a token by hand. The socket
// retries silently if the server is down — creating it must never throw.

import { io } from "socket.io-client";
import { config } from "../../../config/config.js";

// Derive the socket origin from the REST base URL by stripping the path
// (e.g. http://localhost:4008/api/v1 → http://localhost:4008). Falls back to an
// explicit NEXT_PUBLIC_SOCKET_URL when one is configured.
function resolveSocketUrl() {
  if (config.api.socketUrl) return config.api.socketUrl;
  const base = config.api.baseUrl;
  if (!base) return undefined;
  try {
    const u = new URL(base);
    return u.origin;
  } catch {
    // Not an absolute URL (e.g. a relative path) → strip a trailing /api/v1.
    return base.replace(/\/api\/v1\/?$/, "").replace(/\/$/, "") || undefined;
  }
}

let socket = null;

// Lazily create (browser-only) the singleton socket. Returns null on the server.
export function getNotificationSocket() {
  if (typeof window === "undefined") return null;
  if (socket) return socket;

  const url = resolveSocketUrl();
  try {
    socket = io(url, {
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
      // default path "/socket.io"; same origin as the REST API
    });
  } catch {
    // Never crash the app if the socket fails to construct.
    socket = null;
  }
  return socket;
}

// Subscribe to the "notification:new" event. Returns an unsubscribe fn.
// The handler must NOT depend on the payload — it is "something new arrived".
export function onNewNotification(handler) {
  const s = getNotificationSocket();
  if (!s) return () => {};
  s.on("notification:new", handler);
  return () => {
    s.off("notification:new", handler);
  };
}
