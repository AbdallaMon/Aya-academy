// buildFileUrl — turn an attachment (or its url) into a browser-loadable URL.
//
// Uploaded files are NOT served publicly. They are streamed only to logged-in
// users by the API at `GET {NEXT_PUBLIC_API_URL}/attachments/:id/raw` (behind
// requireAuth). The auth cookie is sent automatically on same-site <img>
// subresource requests, so a plain <img src> works for authenticated users.
//
// Accepts:
//   - an attachment object `{ id, url }` (preferred — uses the auth route)
//   - a string url ("https://cdn/..." absolute, or a legacy "/uploads/x.png")
// Returns:
//   - the authenticated raw-file URL when an id is available
//   - an absolute http(s) url unchanged
//   - null for empty / missing input

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

// "http://localhost:4000/api/v1" -> "http://localhost:4000"
function apiOrigin() {
  return API_URL.replace(/\/api\/v\d+$/i, "");
}

export function buildFileUrl(urlOrAttachment) {
  if (!urlOrAttachment) return null;

  // Preferred: an attachment object with an id → authenticated raw route.
  if (typeof urlOrAttachment === "object" && urlOrAttachment.id != null) {
    return `${API_URL}/attachments/${urlOrAttachment.id}/raw`;
  }

  const url =
    typeof urlOrAttachment === "string" ? urlOrAttachment : urlOrAttachment.url;
  if (!url) return null;

  // Already absolute (http/https or protocol-relative) → use as-is.
  if (/^([a-z]+:)?\/\//i.test(url)) return url;

  // Legacy root-relative path fallback (e.g. "/uploads/x.png").
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${apiOrigin()}${path}`;
}
