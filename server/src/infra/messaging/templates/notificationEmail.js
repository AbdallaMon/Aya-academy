// Bilingual, HTML-safe e-mail representation of an in-app notification.

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function localizedValue(notification, locale, field) {
  const primary = locale === "ar" ? `${field}Ar` : `${field}En`;
  const fallback = locale === "ar" ? `${field}En` : `${field}Ar`;
  return notification?.[primary] ?? notification?.[fallback] ?? "";
}

export function buildNotificationUrl({ link, locale, appUrl }) {
  if (!link) return null;

  try {
    const absolute = new URL(link);
    return ["http:", "https:"].includes(absolute.protocol)
      ? absolute.toString()
      : null;
  } catch {
    // Relative links are expected for dashboard notifications.
  }

  if (!String(link).startsWith("/") || String(link).startsWith("//")) {
    return null;
  }
  const normalizedLocale = locale === "ar" ? "ar" : "en";
  const alreadyLocalized = new RegExp("^/(ar|en)(/|$)").test(link);
  const path = alreadyLocalized ? link : `/${normalizedLocale}${link}`;

  try {
    return new URL(path, `${String(appUrl).replace(/\/$/, "")}/`).toString();
  } catch {
    return null;
  }
}

/**
 * @param {{
 *   recipient: { name?: string, locale?: string },
 *   notification: object,
 *   appUrl: string,
 * }} opts
 */
export function buildNotificationEmail({ recipient, notification, appUrl }) {
  const locale = recipient?.locale === "ar" ? "ar" : "en";
  const isArabic = locale === "ar";
  const rawTitle =
    localizedValue(notification, locale, "title") ||
    (isArabic
      ? "إشعار جديد من أكاديمية آية"
      : "A new notification from Ayah Academy");
  const title = String(rawTitle).replace(/[\r\n]+/g, " ").trim();
  const body = localizedValue(notification, locale, "body");
  const actionUrl = buildNotificationUrl({
    link: notification?.link,
    locale,
    appUrl,
  });
  const copy = isArabic
    ? {
        dir: "rtl",
        align: "right",
        greeting: recipient?.name ? `مرحبًا ${recipient.name}،` : "مرحبًا،",
        action: "عرض التفاصيل",
        footer: "هذه رسالة تلقائية من أكاديمية آية، يرجى عدم الرد عليها.",
      }
    : {
        dir: "ltr",
        align: "left",
        greeting: recipient?.name ? `Hi ${recipient.name},` : "Hi there,",
        action: "View details",
        footer:
          "This is an automated message from Ayah Academy. Please do not reply.",
      };

  const safeTitle = escapeHtml(title);
  const safeBody = escapeHtml(body);
  const safeGreeting = escapeHtml(copy.greeting);
  const safeActionUrl = actionUrl ? escapeHtml(actionUrl) : null;

  const html = `<!doctype html>
<html lang="${locale}" dir="${copy.dir}">
  <head><meta charset="utf-8" /><meta name="viewport" content="width=device-width" /></head>
  <body style="margin:0;padding:0;background:#f4f6f8;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:24px 0;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="${copy.dir}"
               style="max-width:520px;background:#fff;border-radius:16px;overflow:hidden;font-family:'Segoe UI',Tahoma,Arial,sans-serif;">
          <tr><td style="background:#0f766e;padding:24px 32px;color:#fff;text-align:center;font-size:20px;font-weight:800;">Ayah Academy</td></tr>
          <tr><td style="padding:32px;text-align:${copy.align};color:#111827;">
            <p style="margin:0 0 14px;font-size:15px;color:#374151;">${safeGreeting}</p>
            <h1 style="margin:0 0 14px;font-size:22px;line-height:1.5;">${safeTitle}</h1>
            ${safeBody ? `<p style="margin:0 0 24px;font-size:15px;line-height:1.8;color:#374151;">${safeBody}</p>` : ""}
            ${
              safeActionUrl
                ? `<a href="${safeActionUrl}" style="display:inline-block;padding:12px 26px;border-radius:999px;background:#0f766e;color:#fff;text-decoration:none;font-weight:700;">${copy.action}</a>`
                : ""
            }
          </td></tr>
          <tr><td style="padding:18px 32px;background:#f9fafb;text-align:center;font-size:12px;color:#6b7280;">${copy.footer}</td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

  const text = [copy.greeting, title, body, actionUrl]
    .filter(Boolean)
    .join("\n\n");

  return { subject: title, html, text };
}
