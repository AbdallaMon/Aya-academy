// buildMetadata — the single source for Next.js Metadata across the app.
//
// Given the active locale, a logical page key and the locale-agnostic path, it
// produces a fully-formed Metadata object: title (+ brand template), canonical,
// hreflang alternates (ar / en / x-default), OpenGraph, Twitter card and robots.
//
// Usage in a page/layout:
//   export async function generateMetadata({ params }) {
//     const { lng } = await params;
//     return buildMetadata({ lng, page: 'login', path: '/login' });
//   }

import { localePath } from "@/i18n/routing.js";
import { defaultLng, languages } from "@/i18n/settings.js";
import {
  SITE_URL,
  SITE_NAME,
  ogImages,
  brand,
  ogLocale,
} from "./config.js";
import { getSeo } from "./content.js";

function absoluteUrl(path = "/") {
  return new URL(path, `${SITE_URL}/`).toString();
}

// Build the { ar, en, x-default } hreflang map for a locale-agnostic path.
function buildLanguageAlternates(path) {
  const map = {};
  for (const lng of languages) {
    map[lng] = absoluteUrl(localePath(lng, path));
  }
  // English is the configured fallback and the primary acquisition locale.
  map["x-default"] = absoluteUrl(localePath(defaultLng, path));
  return map;
}

export function buildMetadata({
  lng = defaultLng,
  page = "site",
  path = "/",
  index = true,
  image,
  // Per-item overrides — used by dynamic pages (e.g. a blog article) where the
  // title and description come from the content itself, not seoContent.
  title: titleOverride,
  description: descriptionOverride,
} = {}) {
  const base = getSeo(page, lng);
  const seo = {
    ...base,
    ...(titleOverride != null ? { title: titleOverride } : {}),
    ...(descriptionOverride != null ? { description: descriptionOverride } : {}),
  };
  const brandName = brand(lng);
  const canonical = absoluteUrl(localePath(lng, path));
  const socialTitle = [SITE_NAME, brandName].some((name) =>
    seo.title.toLocaleLowerCase().includes(name.toLocaleLowerCase()),
  )
    ? seo.title
    : `${seo.title} | ${brandName}`;

  // Per-item override (e.g. a blog article cover) → that one image; otherwise the
  // brand card for THIS locale (Arabic vs English), in both PNG (crisp) and JPEG
  // (small fallback) variants.
  const ogImageList = (image
    ? [{ url: image, type: undefined }]
    : ogImages(lng)
  ).map(({ url, type }) => ({
    url: absoluteUrl(url),
    ...(type ? { type } : {}),
    width: 1200,
    height: 630,
    // Describe what the share card shows, not just the brand name.
    alt: socialTitle,
  }));

  // The homepage title already carries the brand; everything else gets the
  // "<page> | <brand>" suffix via the template defined in the root layout.
  // An explicit dynamic title must not inherit `titleAbsolute` from a fallback
  // page record (for example, a service using the site defaults).
  const title = titleOverride == null && seo.titleAbsolute
    ? { absolute: seo.title }
    : seo.title;

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description: seo.description,
    alternates: {
      canonical,
      languages: buildLanguageAlternates(path),
    },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: socialTitle,
      description: seo.description,
      url: canonical,
      locale: ogLocale(lng),
      alternateLocale: languages.filter((l) => l !== lng).map(ogLocale),
      images: ogImageList,
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description: seo.description,
      images: ogImageList.map((i) => i.url),
    },
    robots: index
      ? {
          index: true,
          follow: true,
          googleBot: { index: true, follow: true, "max-image-preview": "large" },
        }
      : { index: false, follow: false },
  };
}
