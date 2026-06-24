// i18n settings. Arabic is the default (and RTL); English is the secondary LTR
// locale. Locale is persisted in a cookie so the server layout can read it.

export const fallbackLng = "ar";
export const languages = [fallbackLng, "en"];
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
