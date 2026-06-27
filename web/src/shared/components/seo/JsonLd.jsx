// JsonLd — renders one or more schema.org objects as a <script type="application/ld+json">.
// Server-safe (no client hooks): include it from a server component (layout/page).
// Accepts a single object or an array; each is emitted as its own script tag.

// Escape `<` so a stray "</script>" inside any string can never break out of the
// tag. The data is already our own trusted server constants — this is defense in
// depth, the standard hardening for inline JSON-LD.
function safeJson(obj) {
  return JSON.stringify(obj).replace(/</g, "\\u003c");
}

export default function JsonLd({ data }) {
  const items = Array.isArray(data) ? data : [data];
  return (
    <>
      {items.filter(Boolean).map((obj, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJson(obj) }}
        />
      ))}
    </>
  );
}
