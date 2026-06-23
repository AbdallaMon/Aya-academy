// Admin certificate-templates feature constants.

export const CERTIFICATE_TEMPLATES_URL = "certificate-templates";

// Style enums offered by the template form (mirror the CertificateCard themeJson
// vocabulary). Orientation + border styles match the renderer's switches.
export const TEMPLATE_ORIENTATIONS = ["portrait", "landscape"];
export const TEMPLATE_BORDER_STYLES = ["ornate", "foil", "double", "simple"];

// Sensible default themeJson for a brand-new template (matches the ornate
// Arabic certificate look described in the spec).
export const DEFAULT_TEMPLATE_THEME = {
  orientation: "portrait",
  borderStyle: "ornate",
  accent: "#1E6F5C",
  secondary: "#C9A227",
  background: "#FBF7EC",
  showPhoto: true,
  showBismillah: true,
};
