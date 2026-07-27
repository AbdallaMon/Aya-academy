"use client";

// applyApiErrorsToForm — binds backend field-validation errors (422) to
// react-hook-form fields and shows one concise toast naming the failed field(s).
//
// Expected error shape (passed by useRequest into onError):
//   { message, status, translationKey, details: [{ path, message, code }] }
// where `path` is the field name (e.g. "nameAr" / "categoryId") that RHF setError
// understands. Generic and reusable across any form — it knows no specific fields.

// Generic Arabic text used when no field-specific message is available.
const GENERIC_FIELD_AR = "هذا الحقل غير صحيح.";

/**
 * @param {object}   error            error object from useRequest.onError.
 * @param {Function} setError         react-hook-form setError.
 * @param {object}   [opts]
 * @param {Record<string,string>} [opts.labelMap]  field name → displayed (localized) label.
 * @param {Record<string,string>} [opts.messageMap] backend message code → localized field message.
 * @param {Function} [opts.showToast]            toast fn (from useToast); optional.
 * @param {string}   [opts.fallbackMessage]      fallback when there are no field details.
 * @param {string}   [opts.fieldsToastTemplate]  fields-toast template; {fields} is replaced.
 * @param {boolean}  [opts.suppressFallbackToast] don't show the fallback toast when no details.
 * @returns {boolean} true if field details were applied, else false.
 */
export function applyApiErrorsToForm(
  error,
  setError,
  {
    labelMap = {},
    messageMap = {},
    showToast,
    fallbackMessage,
    fieldsToastTemplate,
    suppressFallbackToast = false,
  } = {},
) {
  const details = Array.isArray(error?.details) ? error.details : [];

  // No field details ⇒ a single fallback toast (backend message or fallbackMessage),
  // unless useRequest already auto-toasted (suppressFallbackToast).
  if (details.length === 0) {
    if (showToast && !suppressFallbackToast) {
      showToast({
        message: fallbackMessage || error?.message || GENERIC_FIELD_AR,
        severity: "error",
        translationKey: error?.translationKey,
      });
    }
    return false;
  }

  const failedLabels = [];

  details.forEach((detail) => {
    const path =
      typeof detail?.path === "string"
        ? detail.path
        : typeof detail?.field === "string"
          ? detail.field
          : "";
    if (!path) return;
    const label = labelMap[path];
    const detailCode =
      typeof detail?.message === "string"
        ? detail.message
        : typeof detail?.code === "string"
          ? detail.code
          : "";
    const localizedMessage = messageMap[detailCode];
    setError(path, {
      type: "server",
      message:
        localizedMessage ||
        (label ? `${label}: ${GENERIC_FIELD_AR}` : GENERIC_FIELD_AR),
    });
    failedLabels.push(label || path);
  });

  // One concise toast listing the failed fields (deduplicated).
  if (showToast && failedLabels.length > 0) {
    const uniqueLabels = [...new Set(failedLabels)];
    const fieldsText = uniqueLabels.join("، ");
    const template = fieldsToastTemplate || "تحقّق من الحقول التالية: {fields}";
    showToast({
      message: template.replace("{fields}", fieldsText),
      severity: "error",
    });
  }

  return true;
}

export default applyApiErrorsToForm;
