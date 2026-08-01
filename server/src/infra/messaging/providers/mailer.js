// ===========================================================================
// mailer.js — SMTP e-mail provider (singleton), backed by nodemailer.
//
// Provider-agnostic: the transport is built entirely from env (see ENV.smtp) —
// either a full SMTP_URL, or discrete host/port/secure/user/pass. Nothing here
// assumes a particular provider. Default OFF until configured (isSmtpConfigured).
// The transporter is created lazily on first send so boot never depends on SMTP
// being reachable. Callers guard with `mailer.isReady()`; delivery is best-effort.
// ===========================================================================

import nodemailer from "nodemailer";
import { ENV, isSmtpConfigured } from "../../../config/env.js";

let transporter = null;

function transportTimeouts() {
  return {
    connectionTimeout: ENV.smtp.connectionTimeoutMs,
    greetingTimeout: ENV.smtp.greetingTimeoutMs,
    socketTimeout: ENV.smtp.socketTimeoutMs,
  };
}

function smtpUrlWithTimeouts(value) {
  const url = new URL(value);
  const options = transportTimeouts();
  for (const [key, optionValue] of Object.entries(options)) {
    if (!url.searchParams.has(key)) {
      url.searchParams.set(key, String(optionValue));
    }
  }
  return url.toString();
}

function getTransporter() {
  if (transporter) return transporter;
  // A full connection string wins when provided; otherwise assemble from parts.
  if (ENV.smtp.url) {
    transporter = nodemailer.createTransport(smtpUrlWithTimeouts(ENV.smtp.url));
  } else {
    transporter = nodemailer.createTransport({
      host: ENV.smtp.host,
      port: ENV.smtp.port, // from env
      secure: ENV.smtp.secure, // from env: true → implicit TLS; false → STARTTLS
      auth: { user: ENV.smtp.user, pass: ENV.smtp.pass },
      tls: { rejectUnauthorized: ENV.smtp.rejectUnauthorized },
      ...transportTimeouts(),
    });
  }
  return transporter;
}

class Mailer {
  /** True when SMTP is fully configured and a send will actually be attempted. */
  isReady() {
    return isSmtpConfigured();
  }

  /**
   * Send one e-mail. Throws when SMTP is not configured — callers guard with
   * isReady() first and swallow/log transport errors (delivery is best-effort).
   *
   * @param {{ to: string, subject: string, html: string, text?: string }} opts
   * @returns {Promise<object>} nodemailer send info
   */
  async sendMail({ to, subject, html, text }) {
    if (!isSmtpConfigured()) {
      throw new Error("SMTP is not configured");
    }
    const from = `"${ENV.smtp.fromName}" <${ENV.smtp.from}>`;
    return getTransporter().sendMail({ from, to, subject, html, text });
  }

  /** Abort an in-flight smoke test and lazily rebuild the transport next time. */
  reset() {
    transporter?.close?.();
    transporter = null;
  }
}

export const mailer = new Mailer();
export { Mailer };
