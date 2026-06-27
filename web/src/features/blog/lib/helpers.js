// Shared, pure helpers for the blog feature. Safe on server and client.

// Pick the locale variant from a bilingual { ar, en } field (or pass through a
// plain string). Arabic is the default fallback.
export function pick(field, lng) {
  if (field == null) return '';
  if (typeof field === 'string') return field;
  return field[lng] || field.ar || field.en || '';
}

// Format an ISO date (YYYY-MM-DD) into a localized, human label. Uses the
// Gregorian calendar with Arabic/English month names per locale.
export function formatDate(iso, lng) {
  if (!iso) return '';
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  const locale = lng === 'en' ? 'en-US' : 'ar-EG';
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
}

// Localized "x min read" label.
export function readingLabel(minutes, lng) {
  if (lng === 'en') return `${minutes} min read`;
  return `${minutes} دقائق قراءة`;
}
