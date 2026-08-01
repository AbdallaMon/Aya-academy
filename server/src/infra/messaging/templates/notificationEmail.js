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
  const isFamilyEnrollment =
    notification?.dataJson?.enrollmentType === "FAMILY";
  const enrollmentStudents = isFamilyEnrollment &&
    Array.isArray(notification?.dataJson?.students)
    ? notification.dataJson.students
        .map((student) => ({
          name: student?.name,
          url: buildNotificationUrl({
            link: student?.link,
            locale,
            appUrl,
          }),
        }))
        .filter((student) => student.name && student.url)
    : [];
  const rawTitle =
    (isFamilyEnrollment
      ? isArabic
        ? "طلب تسجيل جديد"
        : "New enrollment"
      : localizedValue(notification, locale, "title")) ||
    (isArabic
      ? "إشعار جديد من أكاديمية آية"
      : "A new notification from Ayah Academy");
  const title = String(rawTitle).replace(/[\r\n]+/g, " ").trim();
  const body = isFamilyEnrollment
    ? isArabic
      ? "تم تسجيل الطلاب التاليين. اضغط على زر التفاصيل لفتح ملف الطالب."
      : "The following students were enrolled. Open each student's details below."
    : localizedValue(notification, locale, "body");
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
        student: "الطالب",
        details: "التفاصيل",
        viewStudent: "عرض الطالب",
        viewParent: "عرض ولي الأمر",
        parentText: "ولي الأمر",
        footer: "هذه رسالة تلقائية من أكاديمية آية، يرجى عدم الرد عليها.",
      }
    : {
        dir: "ltr",
        align: "left",
        greeting: recipient?.name ? `Hi ${recipient.name},` : "Hi there,",
        action: "View details",
        student: "Student",
        details: "Details",
        viewStudent: "View student",
        viewParent: "View parent",
        parentText: "Parent",
        footer:
          "This is an automated message from Ayah Academy. Please do not reply.",
      };

  const safeTitle = escapeHtml(title);
  const safeBody = escapeHtml(body);
  const safeGreeting = escapeHtml(copy.greeting);
  const safeActionUrl = actionUrl ? escapeHtml(actionUrl) : null;
  const actionLabel = isFamilyEnrollment ? copy.viewParent : copy.action;
  const enrollmentRowsHtml = enrollmentStudents
    .map(
      (student) => `<tr>
        <td style="padding:12px;border-top:1px solid #e5e7eb;font-weight:700;">${escapeHtml(student.name)}</td>
        <td style="padding:12px;border-top:1px solid #e5e7eb;text-align:${copy.align};">
          <a href="${escapeHtml(student.url)}" style="display:inline-block;padding:9px 18px;border-radius:999px;background:#0f766e;color:#fff;text-decoration:none;font-weight:700;">${copy.viewStudent}</a>
        </td>
      </tr>`,
    )
    .join("");
  const enrollmentTableHtml = isFamilyEnrollment
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border:1px solid #e5e7eb;border-radius:12px;border-collapse:separate;border-spacing:0;overflow:hidden;">
        <tr style="background:#f9fafb;">
          <th style="padding:10px 12px;text-align:${copy.align};">${copy.student}</th>
          <th style="padding:10px 12px;text-align:${copy.align};">${copy.details}</th>
        </tr>
        ${enrollmentRowsHtml}
      </table>`
    : "";

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
            ${enrollmentTableHtml}
            ${
              safeActionUrl
                ? `<a href="${safeActionUrl}" style="display:inline-block;padding:12px 26px;border-radius:999px;background:#0f766e;color:#fff;text-decoration:none;font-weight:700;">${actionLabel}</a>`
                : ""
            }
          </td></tr>
          <tr><td style="padding:18px 32px;background:#f9fafb;text-align:center;font-size:12px;color:#6b7280;">${copy.footer}</td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

  const enrollmentText = enrollmentStudents
    .map((student) => `${student.name}: ${student.url}`)
    .join("\n");
  const text = [
    copy.greeting,
    title,
    body,
    isFamilyEnrollment
      ? [enrollmentText, actionUrl ? `${copy.parentText}: ${actionUrl}` : null]
          .filter(Boolean)
          .join("\n")
      : actionUrl,
  ]
    .filter(Boolean)
    .join("\n\n");

  return { subject: title, html, text };
}
