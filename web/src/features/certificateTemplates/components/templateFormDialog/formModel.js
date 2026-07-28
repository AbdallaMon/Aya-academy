// Pure form-model helpers for the certificate-template dialog: build the default
// form values (fresh / from an existing template) and serialize the theme back
// into the stored themeJson shape.

import { CERTIFICATE_TEMPLATE_TYPES } from "@ayah/shared";
import { DEFAULT_TEMPLATE_THEME } from "../../config/constant.js";

// Brand-new template: theme defaults + the fixed texts PRE-FILLED with the same
// copy the card would otherwise fall back to, so the inputs always match the
// live preview (no "empty input but preview shows شهادة تقدير" surprise).
export function emptyValues(txt = {}) {
  return {
    key: "",
    type: CERTIFICATE_TEMPLATE_TYPES.GENERAL,
    nameAr: "",
    nameEn: "",
    headingAr: txt.defaultHeadingAr ?? "",
    headingEn: txt.defaultHeadingEn ?? "",
    introAr: txt.defaultIntroAr ?? "",
    introEn: txt.defaultIntroEn ?? "",
    bodyAr: txt.defaultBodyAr ?? "",
    bodyEn: txt.defaultBodyEn ?? "",
    congratsAr: txt.defaultCongratsAr ?? "",
    congratsEn: txt.defaultCongratsEn ?? "",
    thanksAr: txt.defaultThanksAr ?? "",
    thanksEn: txt.defaultThanksEn ?? "",
    signatureName: txt.defaultSignatureName ?? "",
    signatureTitleAr: txt.defaultSignatureTitleAr ?? "",
    signatureTitleEn: txt.defaultSignatureTitleEn ?? "",
    // theme
    orientation: DEFAULT_TEMPLATE_THEME.orientation,
    borderStyle: DEFAULT_TEMPLATE_THEME.borderStyle,
    decoration: DEFAULT_TEMPLATE_THEME.decoration,
    fontStyle: DEFAULT_TEMPLATE_THEME.fontStyle,
    accent: DEFAULT_TEMPLATE_THEME.accent,
    secondary: DEFAULT_TEMPLATE_THEME.secondary,
    background: DEFAULT_TEMPLATE_THEME.background,
    nameColor: DEFAULT_TEMPLATE_THEME.nameColor,
    logoSize: DEFAULT_TEMPLATE_THEME.logoSize,
    sealText: DEFAULT_TEMPLATE_THEME.sealText,
    nameScale: DEFAULT_TEMPLATE_THEME.nameScale,
    headingScale: DEFAULT_TEMPLATE_THEME.headingScale,
    contentSpacing: DEFAULT_TEMPLATE_THEME.contentSpacing,
    watermarkOpacity: DEFAULT_TEMPLATE_THEME.watermarkOpacity,
    showPhoto: DEFAULT_TEMPLATE_THEME.showPhoto,
    showBismillah: DEFAULT_TEMPLATE_THEME.showBismillah,
    showSeal: DEFAULT_TEMPLATE_THEME.showSeal,
    showWatermark: DEFAULT_TEMPLATE_THEME.showWatermark,
    showTagline: DEFAULT_TEMPLATE_THEME.showTagline,
    showDate: DEFAULT_TEMPLATE_THEME.showDate,
    isActive: true,
    isDefault: false,
  };
}

export function fromTemplate(tpl, txt = {}) {
  const theme = (() => {
    if (!tpl?.themeJson) return {};
    if (typeof tpl.themeJson === "object") return tpl.themeJson;
    try {
      return JSON.parse(tpl.themeJson) || {};
    } catch {
      return {};
    }
  })();
  const base = emptyValues(txt);
  // Editing keeps the stored copy verbatim (empty stays empty); only theme
  // values fall back to the defaults.
  return {
    ...base,
    key: tpl.key ?? "",
    type: tpl.type ?? base.type,
    nameAr: tpl.nameAr ?? "",
    nameEn: tpl.nameEn ?? "",
    headingAr: tpl.headingAr ?? "",
    headingEn: tpl.headingEn ?? "",
    introAr: tpl.introAr ?? "",
    introEn: tpl.introEn ?? "",
    bodyAr: tpl.bodyAr ?? "",
    bodyEn: tpl.bodyEn ?? "",
    congratsAr: tpl.congratsAr ?? "",
    congratsEn: tpl.congratsEn ?? "",
    thanksAr: tpl.thanksAr ?? "",
    thanksEn: tpl.thanksEn ?? "",
    signatureName: tpl.signatureName ?? "",
    signatureTitleAr: tpl.signatureTitleAr ?? "",
    signatureTitleEn: tpl.signatureTitleEn ?? "",
    orientation: theme.orientation ?? base.orientation,
    borderStyle: theme.borderStyle ?? base.borderStyle,
    decoration: theme.decoration ?? base.decoration,
    fontStyle: theme.fontStyle ?? base.fontStyle,
    accent: theme.accent ?? base.accent,
    secondary: theme.secondary ?? base.secondary,
    background: theme.background ?? base.background,
    nameColor: theme.nameColor ?? base.nameColor,
    logoSize: theme.logoSize ?? base.logoSize,
    sealText: theme.sealText ?? base.sealText,
    nameScale: theme.nameScale ?? base.nameScale,
    headingScale: theme.headingScale ?? base.headingScale,
    contentSpacing: theme.contentSpacing ?? base.contentSpacing,
    watermarkOpacity: theme.watermarkOpacity ?? base.watermarkOpacity,
    showPhoto: theme.showPhoto ?? base.showPhoto,
    showBismillah: theme.showBismillah ?? base.showBismillah,
    showSeal: theme.showSeal ?? base.showSeal,
    showWatermark: theme.showWatermark ?? base.showWatermark,
    showTagline: theme.showTagline ?? base.showTagline,
    showDate: theme.showDate ?? base.showDate,
    isActive: tpl.isActive ?? true,
    isDefault: tpl.isDefault ?? false,
  };
}

export function buildThemeJson(v) {
  return {
    orientation: v.orientation,
    borderStyle: v.borderStyle,
    decoration: v.decoration,
    fontStyle: v.fontStyle,
    accent: v.accent,
    secondary: v.secondary,
    background: v.background,
    nameColor: v.nameColor,
    logoSize: v.logoSize,
    sealText: v.sealText?.trim() || undefined,
    nameScale: Number(v.nameScale),
    headingScale: Number(v.headingScale),
    contentSpacing: Number(v.contentSpacing),
    watermarkOpacity: Number(v.watermarkOpacity),
    showPhoto: Boolean(v.showPhoto),
    showBismillah: Boolean(v.showBismillah),
    showSeal: Boolean(v.showSeal),
    showWatermark: Boolean(v.showWatermark),
    showTagline: Boolean(v.showTagline),
    showDate: Boolean(v.showDate),
  };
}
