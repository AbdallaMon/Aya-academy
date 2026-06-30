import app from "./app.js";
import { ENV } from "./config/env.js";
import { initRealtime } from "./infra/realtime/socket.js";

const server = app.listen(ENV.PORT, () => {
  console.log(`Aya Academy API running on http://localhost:${ENV.PORT}/api/v1`);
});

// Attach the realtime (socket.io) server to the same HTTP server so notification
// pushes share the API's port + auth. Best-effort: a failure must not crash boot.
try {
  initRealtime(server);
} catch (err) {
  console.error("[realtime] failed to start:", err?.message || err);
}

// Auto-backup scheduler (node-cron) — only when enabled, and guarded so a failure
// never crashes boot. Dynamic import keeps the backup infra lazy when disabled.
if (ENV.backup.enabled) {
  import("./infra/backup/scheduler.js")
    .then(({ startScheduler }) => startScheduler())
    .catch((err) => {
      console.error("[scheduler] failed to start:", err?.message || err);
    });
}

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

function shutdown(signal) {
  console.log(`${signal} received — shutting down`);
  server.close(() => process.exit(0));
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
