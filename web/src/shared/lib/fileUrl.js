// buildFileUrl — turn an attachment url (or attachment object) into a fully
// qualified, browser-loadable URL.
//
// Uploaded attachments are served by the API *server origin* at a ROOT-relative
// path like "/uploads/123.png" — NOT under the "/api/vN" prefix that
// NEXT_PUBLIC_API_URL points at. So we strip a trailing "/api/vN" from the API
// URL to recover the server origin and join the path onto it.
//
// Accepts:
//   - a string url ("/uploads/1.png" or "https://cdn/...")
//   - an object carrying `.url`
// Returns:
//   - an absolute http(s) url, unchanged if already absolute
//   - the origin-joined url for root-relative paths
//   - null for empty / missing input

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

// "http://localhost:4000/api/v1" -> "http://localhost:4000"
function apiOrigin() {
  return API_URL.replace(/\/api\/v\d+\/?$/i, "").replace(/\/+$/, "");
}

export function buildFileUrl(urlOrAttachment) {
  if (!urlOrAttachment) return null;
  const url =
    typeof urlOrAttachment === "string" ? urlOrAttachment : urlOrAttachment.url;
  if (!url) return null;

  // Already absolute (http/https or protocol-relative) → use as-is.
  if (/^([a-z]+:)?\/\//i.test(url)) return url;

  const origin = apiOrigin();
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${origin}${path}`;
}
