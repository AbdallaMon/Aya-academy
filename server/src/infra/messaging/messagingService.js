// ===========================================================================
// messagingService.js — outbound messaging facade.
//
// notifyInvoiceSent: sends an in-app notification (always, best-effort) and
// a WhatsApp template message (only when ENV.whatsapp.enabled is true and the
// provider is fully configured). All side-channels are swallowed per-parent so
// they never fail the caller.
// ===========================================================================

import { NOTIFICATION_TYPES } from "@ayah/shared";
import { notificationUsecase } from "../../modules/notifications/notification.usecase.js";
import { ENV, isWhatsAppConfigured } from "../../config/env.js";
import { whatsappProvider } from "./providers/whatsapp.js";

class MessagingService {
  /**
   * Fire-and-forget outbound notifications for an invoice that was just sent.
   *
   * @param {{
   *   parents: Array<{ id: number, phone?: string }>,
   *   student: { name?: string } | null | undefined,
   *   invoice: { id: number, total: number|string, currency: string },
   *   subscriptionId: number,
   *   link?: string,
   * }} opts
   * @returns {Promise<number>} count of in-app notifications successfully created
   */
  async notifyInvoiceSent({ parents = [], student, invoice, subscriptionId, link }) {
    const studentName = student?.name ?? "";
    const whatsAppEnabled = ENV.whatsapp.enabled && isWhatsAppConfigured();

    // Count only the in-app notifications that were actually created, so the
    // caller can tell whether anything was delivered (WhatsApp stays best-effort
    // and is not counted).
    let delivered = 0;

    await Promise.all(
      parents.map(async (parent) => {
        // ── In-app notification (always, swallowed per parent) ──────────────
        try {
          await notificationUsecase.createNotification({
            userId: parent.id,
            type: NOTIFICATION_TYPES.INVOICE_SENT,
            titleAr: "صدرت فاتورة اشتراك — برجاء السداد",
            titleEn: "A subscription invoice is ready — please pay",
            bodyAr: `فاتورة اشتراك ${studentName} بإجمالي ${invoice.total} ${invoice.currency}. اضغط لعرض الفاتورة.`,
            bodyEn: `Invoice for ${studentName}, total ${invoice.total} ${invoice.currency}. Tap to view the invoice.`,
            dataJson: { invoiceId: invoice.id, subscriptionId },
            link,
          });
          delivered += 1;
        } catch (_err) {
          // Best-effort: swallow notification failure, never surface to caller.
        }

        // ── WhatsApp (conditional, swallowed per parent) ────────────────────
        if (whatsAppEnabled && parent.phone) {
          try {
            await whatsappProvider.sendTemplate(parent.phone, {
              templateName: ENV.whatsapp.templateName,
              languageCode: "ar",
              components: [
                {
                  type: "body",
                  parameters: [
                    { type: "text", text: studentName },
                    { type: "text", text: `${invoice.total} ${invoice.currency}` },
                  ],
                },
              ],
            });
          } catch (_err) {
            // Best-effort: swallow WhatsApp failure, never surface to caller.
          }
        }
      }),
    );

    return delivered;
  }
}

export const messagingService = new MessagingService();
