import { ENV } from "../../config/env.js";
import { mailer } from "./providers/mailer.js";

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildBootstrapEmail({ env, startedAt }) {
  const timestamp = startedAt.toISOString();
  const subject = `Ayah Academy API started (${env.NODE_ENV})`;
  const details = {
    environment: env.NODE_ENV,
    port: env.PORT,
    startedAt: timestamp,
  };

  const html = `<!doctype html>
<html lang="en" dir="ltr">
  <head><meta charset="utf-8" /><meta name="viewport" content="width=device-width" /></head>
  <body style="margin:0;padding:24px;background:#f4f6f8;font-family:'Segoe UI',Tahoma,Arial,sans-serif;color:#111827;">
    <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;">
      <div style="padding:24px 32px;background:#0f766e;color:#fff;text-align:center;">
        <div style="font-size:22px;font-weight:800;">Ayah Academy</div>
        <div style="margin-top:6px;font-size:14px;">SMTP bootstrap test</div>
      </div>
      <div style="padding:32px;">
        <h1 style="margin:0 0 16px;font-size:22px;">✅ Server started successfully</h1>
        <p style="margin:0 0 20px;line-height:1.7;color:#374151;">
          This message confirms that the API bootstrap reached the SMTP provider successfully.
        </p>
        <table role="presentation" cellpadding="6" cellspacing="0" style="width:100%;font-size:14px;">
          <tr><td style="font-weight:700;">Environment</td><td>${escapeHtml(details.environment)}</td></tr>
          <tr><td style="font-weight:700;">Port</td><td>${escapeHtml(details.port)}</td></tr>
          <tr><td style="font-weight:700;">Started at</td><td>${escapeHtml(details.startedAt)}</td></tr>
        </table>
      </div>
    </div>
  </body>
</html>`;

  const text = [
    "Ayah Academy API started successfully.",
    "This message confirms that the SMTP bootstrap test succeeded.",
    `Environment: ${details.environment}`,
    `Port: ${details.port}`,
    `Started at: ${details.startedAt}`,
  ].join("\n");

  return { subject, html, text };
}

async function withTimeout(promise, timeoutMs) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      const error = new Error(`SMTP bootstrap test timed out after ${timeoutMs}ms`);
      error.code = "BOOTSTRAP_EMAIL_TIMEOUT";
      reject(error);
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Best-effort SMTP smoke test for server startup. It never throws, so a mail
 * configuration or transport problem cannot interrupt the API bootstrap.
 */
export async function sendBootstrapEmail({
  env = ENV,
  emailProvider = mailer,
  logger = console,
  startedAt = new Date(),
} = {}) {
  if (!env.devEmail) {
    logger.info("[bootstrap-email] skipped: DEV_EMAIL is not configured");
    return { sent: false, reason: "DEV_EMAIL_NOT_CONFIGURED" };
  }

  try {
    if (!emailProvider.isReady()) {
      logger.warn("[bootstrap-email] skipped: SMTP is not configured");
      return { sent: false, reason: "SMTP_NOT_CONFIGURED" };
    }

    await withTimeout(
      emailProvider.sendMail({
        to: env.devEmail,
        ...buildBootstrapEmail({ env, startedAt }),
      }),
      env.smtp?.bootstrapTimeoutMs ?? 15000,
    );
    logger.info("[bootstrap-email] test message sent to DEV_EMAIL");
    return { sent: true };
  } catch (error) {
    if (error?.code === "BOOTSTRAP_EMAIL_TIMEOUT") {
      emailProvider.reset?.();
    }
    logger.error(
      "[bootstrap-email] failed; server will continue:",
      error?.message ?? error,
    );
    return { sent: false, reason: "DELIVERY_FAILED" };
  }
}
