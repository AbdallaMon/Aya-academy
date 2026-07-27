// i18n settings. English is both the default and translation fallback.
// Arabic remains available as an explicit RTL choice.
// Locale is an interface preference persisted independently of the user account.

export const defaultLng = "en";
export const fallbackLng = "en";
export const languages = [defaultLng, "ar"];
export const defaultNS = "translation";
export const cookieName = "i18lng";

export function getOptions(lng = defaultLng, ns = defaultNS) {
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
