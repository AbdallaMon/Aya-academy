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

function getTransporter() {
  if (transporter) return transporter;
  // A full connection string wins when provided; otherwise assemble from parts.
  if (ENV.smtp.url) {
    transporter = nodemailer.createTransport(ENV.smtp.url);
  } else {
    transporter = nodemailer.createTransport({
      host: ENV.smtp.host,
      port: ENV.smtp.port, // from env
      secure: ENV.smtp.secure, // from env: true → implicit TLS; false → STARTTLS
      auth: { user: ENV.smtp.user, pass: ENV.smtp.pass },
      tls: { rejectUnauthorized: ENV.smtp.rejectUnauthorized },
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
}

export const mailer = new Mailer();
export { Mailer };
