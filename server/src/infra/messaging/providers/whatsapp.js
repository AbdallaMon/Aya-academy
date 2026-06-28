// ===========================================================================
// whatsapp.js — Meta WhatsApp Cloud API provider (singleton).
//
// Default OFF: all sends are no-ops until WHATSAPP_ENABLED=true and both
// WHATSAPP_TOKEN + WHATSAPP_PHONE_ID are set. Never breaks boot when absent.
// ===========================================================================

import { AppError } from "../../../shared/errors/AppError.js";
import { ENV, isWhatsAppConfigured } from "../../../config/env.js";
import { invoiceMessagesCodes, messagesNames } from "@aya/shared";

const TK = messagesNames.invoiceMessages;

class WhatsAppProvider {
  /**
   * Normalise a raw phone number to digits-only E.164 body (no "+").
   * Returns null when the result is not 8–15 digits.
   */
  normalizePhone(raw) {
    if (!raw) return null;
    let digits = String(raw)
      .trim()
      .replace(/[\s\-()]/g, "")
      .replace(/^\+/, "")
      .replace(/^00/, "");
    return /^\d{8,15}$/.test(digits) ? digits : null;
  }

  /**
   * Internal POST to the Meta Graph API.
   * Throws AppError(WHATSAPP_NOT_CONFIGURED) when credentials are absent,
   * AppError(INVOICE_SEND_FAILED) on a non-OK HTTP response.
   */
  async _post(body) {
    if (!isWhatsAppConfigured()) {
      throw new AppError({
        statusCode: 503,
        code: invoiceMessagesCodes.WHATSAPP_NOT_CONFIGURED,
        translationKey: TK,
      });
    }

    const { token, phoneId, apiVersion, apiUrl } = ENV.whatsapp;
    const url =
      apiUrl ||
      `https://graph.facebook.com/${apiVersion}/${phoneId}/messages`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      // Read the upstream body for server-side diagnostics ONLY — it can carry
      // Meta/Graph metadata, so it must never reach AppError.details (a future
      // caller might propagate details to the client). Log it, then throw with
      // no sensitive payload (only the non-sensitive HTTP status).
      const text = await res.text().catch(() => "");
      console.error(`[whatsapp] send failed (HTTP ${res.status}):`, text);
      throw new AppError({
        statusCode: 502,
        code: invoiceMessagesCodes.INVOICE_SEND_FAILED,
        translationKey: TK,
        details: { httpStatus: res.status },
      });
    }

    return res.json();
  }

  /**
   * Send a pre-approved WhatsApp template message.
   * @param {string} toPhone  - raw phone number (will be normalised)
   * @param {{ templateName: string, languageCode?: string, components?: any[] }} opts
   * @returns {Promise<object|null>} API response, or null if phone invalid
   */
  async sendTemplate(toPhone, { templateName, languageCode = "ar", components = [] }) {
    const to = this.normalizePhone(toPhone);
    if (!to) return null;

    return this._post({
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: templateName,
        language: { code: languageCode },
        components,
      },
    });
  }

  /**
   * Send a plain text WhatsApp message.
   * @param {string} toPhone - raw phone number (will be normalised)
   * @param {string} text
   * @returns {Promise<object|null>} API response, or null if phone invalid
   */
  async sendText(toPhone, text) {
    const to = this.normalizePhone(toPhone);
    if (!to) return null;

    return this._post({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text },
    });
  }
}

export const whatsappProvider = new WhatsAppProvider();
export { WhatsAppProvider };
