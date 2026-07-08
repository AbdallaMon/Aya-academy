// Header + body preparation for ApiFetch (pure functions, no `this`).
//
// Extracted verbatim from ApiFetch. Called from within the client methods —
// NOT part of the public API surface.

// JSON by default; empty (browser-set) for file uploads / multipart; a caller
// override wins outright.
export function buildHeaders(isFileUpload, customHeader, isMultipart) {
  if (customHeader) return { ...customHeader };
  if (isFileUpload || isMultipart) return {};
  return { 'Content-Type': 'application/json' };
}

// Leave FormData / file uploads untouched (the browser sets the boundary);
// otherwise JSON-stringify.
export function serializeBody(body, isFileUpload, isMultipart) {
  if (body === undefined || body === null) return undefined;
  return isFileUpload || isMultipart ? body : JSON.stringify(body);
}
