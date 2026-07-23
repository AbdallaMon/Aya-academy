// i18n settings. English is the default; Arabic remains available as RTL.
// Locale is an interface preference persisted independently of the user account.

export const fallbackLng = "en";
export const languages = [fallbackLng, "ar"];
export const defaultNS = "translation";
export const cookieName = "i18lng";

export function getOptions(lng = fallbackLng, ns = defaultNS) {
  return {
    supportedLngs: languages,
    fallbackLng,
    lng,
    fallbackNS: defaultNS,
    defaultNS,
    ns,
  };
}

export function getDirection(lng) {
  return lng === "ar" ? "rtl" : "ltr";
}
