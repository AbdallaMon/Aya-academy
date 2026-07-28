// ===========================================================================
// passwordResetEmail.js — bilingual (ar/en) HTML e-mail for the "forgot
// password" flow. Returns { subject, html, text } for a given locale.
//
// The markup is deliberately table-based with inline styles so it renders
// consistently across e-mail clients (Gmail, Outlook, Apple Mail). Arabic is
// rendered RTL. Any user-provided value (the name) is HTML-escaped.
// ===========================================================================

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const COPY = {
  ar: {
    dir: "rtl",
    align: "right",
    subject: "إعادة تعيين كلمة المرور — أكاديمية آية",
    preheader: (m) => `رابط إعادة تعيين كلمة المرور صالح لمدة ${m} دقيقة.`,
    brand: "أكاديمية آية",
    heading: "إعادة تعيين كلمة المرور",
    greeting: (name) => (name ? `مرحباً ${name}،` : "مرحباً،"),
    intro:
      "وصلنا طلب لإعادة تعيين كلمة المرور الخاصة بحسابك في أكاديمية آية. اضغط على الزر بالأسفل لاختيار كلمة مرور جديدة.",
    button: "إعادة تعيين كلمة المرور",
    fallback: "لم يعمل الزر؟ انسخ الرابط التالي والصقه في المتصفح:",
    expiry: (m) => `هذا الرابط صالح لمدة ${m} دقيقة فقط، ويُستخدم لمرة واحدة.`,
    security:
      "إذا لم تطلب إعادة التعيين، تجاهل هذه الرسالة بأمان ولن يتغيّر شيء في حسابك.",
    footerBrand: "أكاديمية آية — تعليم القرآن والأخلاق للأطفال",
    footerAuto: "هذه رسالة تلقائية، برجاء عدم الرد عليها.",
  },
  en: {
    dir: "ltr",
    align: "left",
    subject: "Reset your password — Ayah Academy",
    preheader: (m) => `Your password reset link is valid for ${m} minutes.`,
    brand: "Ayah Academy",
    heading: "Reset your password",
    greeting: (name) => (name ? `Hi ${name},` : "Hi there,"),
    intro:
      "We received a request to reset the password for your Ayah Academy account. Tap the button below to choose a new password.",
    button: "Reset password",
    fallback: "Button not working? Copy and paste this link into your browser:",
    expiry: (m) => `This link is valid for ${m} minutes only and can be used once.`,
    security:
      "If you didn't request this, you can safely ignore this email — nothing will change on your account.",
    footerBrand: "Ayah Academy — Quran & manners for kids",
    footerAuto: "This is an automated message, please do not reply.",
  },
};

/**
 * Build the password-reset e-mail.
 * @param {{ name?: string, resetUrl: string, locale?: string, expiresMinutes?: number, logoUrl?: string }} opts
 * @returns {{ subject: string, html: string, text: string }}
 */
export function buildPasswordResetEmail({
  name,
  resetUrl,
  locale = "ar",
  expiresMinutes = 60,
  logoUrl,
}) {
  const t = COPY[locale === "en" ? "en" : "ar"];
  const safeName = escapeHtml(name);
  const teal = "#0f766e";
  const tealDark = "#115e59";

  const logo = logoUrl
    ? `<img src="${logoUrl}" alt="${t.brand}" width="56" height="56" style="display:block;border:0;border-radius:12px;" />`
    : "";

  const html = `<!doctype html>
<html lang="${locale}" dir="${t.dir}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light only" />
    <title>${t.subject}</title>
  </head>
  <body style="margin:0;padding:0;background:#f4f6f8;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${t.preheader(
      expiresMinutes,
    )}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="${t.dir}"
                 style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;
                        font-family:'Segoe UI',Tahoma,Arial,sans-serif;box-shadow:0 1px 3px rgba(16,24,40,0.08);">
            <!-- header -->
            <tr>
              <td style="background:linear-gradient(135deg,${teal} 0%,${tealDark} 100%);padding:28px 32px;text-align:center;">
                ${logo}
                <div style="color:#ffffff;font-size:20px;font-weight:800;margin-top:${logo ? "10px" : "0"};">
                  ${t.brand}
                </div>
              </td>
            </tr>
            <!-- body -->
            <tr>
              <td style="padding:32px;text-align:${t.align};color:#111827;">
                <h1 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#111827;">${t.heading}</h1>
                <p style="margin:0 0 12px;font-size:15px;line-height:1.7;color:#374151;">${t.greeting(
                  safeName,
                )}</p>
                <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#374151;">${t.intro}</p>

                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
                  <tr>
                    <td align="center" style="border-radius:999px;background:${teal};">
                      <a href="${resetUrl}"
                         style="display:inline-block;padding:14px 34px;font-size:16px;font-weight:700;color:#ffffff;
                                text-decoration:none;border-radius:999px;">
                        ${t.button}
                      </a>
                    </td>
                  </tr>
                </table>

                <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#6b7280;">${t.fallback}</p>
                <p style="margin:0 0 24px;font-size:13px;line-height:1.6;word-break:break-all;">
                  <a href="${resetUrl}" style="color:${teal};text-decoration:underline;">${resetUrl}</a>
                </p>

                <div style="border-top:1px solid #eef0f2;padding-top:16px;">
                  <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#6b7280;">${t.expiry(
                    expiresMinutes,
                  )}</p>
                  <p style="margin:0;font-size:13px;line-height:1.6;color:#6b7280;">${t.security}</p>
                </div>
              </td>
            </tr>
            <!-- footer -->
            <tr>
              <td style="padding:20px 32px;background:#f9fafb;text-align:center;">
                <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;">${t.footerBrand}</p>
                <p style="margin:0;font-size:12px;color:#9ca3af;">${t.footerAuto}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [
    t.greeting(name || ""),
    "",
    t.intro,
    "",
    `${t.button}: ${resetUrl}`,
    "",
    t.expiry(expiresMinutes),
    t.security,
    "",
    t.footerBrand,
  ].join("\n");

  return { subject: t.subject, html, text };
}
