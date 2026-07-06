import { ENV } from "./env.js";

export const corsOptions = {
  origin(origin, cb) {
    // allow server-to-server / same-origin (no Origin header)
    if (!origin) return cb(null, true);
    if (ENV.cors.origins.length === 0 || ENV.cors.origins.includes(origin)) {
      return cb(null, true);
    }
    return cb(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Whiteboard-Token"],
};
