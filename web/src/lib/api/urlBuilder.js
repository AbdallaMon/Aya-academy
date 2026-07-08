// URL + query-string building for ApiFetch (pure functions, no `this`).
//
// Extracted verbatim from ApiFetch so the request path stays readable. These
// helpers are called from within the client methods — they are NOT part of the
// public API surface.

// Join the base URL with a request path, tolerating a leading slash on `path`.
export function buildUrl(baseUrl, path) {
  return `${baseUrl}/${String(path).replace(/^\//, '')}`;
}

// Build a query string for paginated GET requests. Scalars are encoded
// directly; arrays repeat the key; plain objects (e.g. a dateRange) are
// JSON-serialized so the backend can parse them.
export function buildPaginatedPath(
  url,
  { page, limit, search = '', sort = '', others, ...filters }
) {
  let queryPrefix = '?';
  if (url.endsWith('&')) queryPrefix = '';
  else if (url.includes('?')) queryPrefix = '&';

  const parts = [
    `page=${page}`,
    `limit=${limit}`,
    `search=${encodeURIComponent(search ?? '')}`,
    `sort=${encodeURIComponent(JSON.stringify(sort ?? ''))}`,
  ];

  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value)) {
      value.forEach((val) => {
        parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(val)}`);
      });
      return;
    }
    if (typeof value === 'object') {
      const serialized = JSON.stringify(value);
      if (serialized === '{}' || serialized === 'null') return;
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(serialized)}`);
      return;
    }
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
  });

  if (others) parts.push(others);
  return `${url}${queryPrefix}${parts.join('&')}`;
}
