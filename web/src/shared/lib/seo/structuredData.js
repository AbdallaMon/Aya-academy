// JSON-LD structured data builders. Pure + isomorphic (no React) so they can be
// called from server components (layout/page) and serialized into a
// <script type="application/ld+json"> tag via the <JsonLd> component.
//
// We emit ONLY data that is true and visible on the page:
//   - EducationalOrganization : who Aya Academy is (site-wide)
//   - WebSite                 : the site itself + its languages (site-wide)
//   - FAQPage                 : mirrors the visible FAQ accordion on the homepage
// We deliberately do NOT emit Review/AggregateRating — the on-page reviews are
// illustrative marketing copy, and fabricated review markup violates Google's
// guidelines. Add it later only when backed by real, verifiable reviews.

import { localePath } from "@/i18n/routing.js";
import { languages } from "@/i18n/settings.js";
import { SITE_URL, brand } from "./config.js";

const DESCRIPTION = {
  ar: "أكاديمية آية — تعلّم القرآن الكريم وتحفيظه، والتجويد، واللغة العربية، والعلوم الشرعية أونلاين، للكبار والأطفال من ٥ سنوات فأكثر، عبر حصص مباشرة تفاعلية مع معلّمين مؤهّلين ومتابعة مستمرة.",
  en: "Aya Academy — learn and memorize the Quran, Tajweed, Arabic and Islamic studies online, for adults and children ages 5 and up, through live interactive sessions with qualified teachers and ongoing progress tracking.",
};

// A stable @id for the organization so other nodes can reference it.
const ORG_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;
const COURSE_ID = `${SITE_URL}/#course`;

const CONTACT_EMAIL = "info@ayah.academy";
// The same WhatsApp line the site exposes (see WhatsAppButton) — a verifiable
// contact number strengthens the entity in Google's Knowledge Graph.
const CONTACT_PHONE = "+966582509655";

// Topics the academy is authoritative about — reinforces the site's subject to
// search engines (semantic keywords, not stuffing). Bilingual so each locale's
// graph reads naturally.
const KNOWS_ABOUT = {
  ar: [
    "تحفيظ القرآن الكريم",
    "تعليم القرآن",
    "التجويد وأحكام التلاوة",
    "العلوم الشرعية",
    "الدراسات الإسلامية",
    "اللغة العربية",
    "العقيدة والفقه",
    "السيرة النبوية",
    "الأخلاق والآداب الإسلامية",
    "الأدعية والأذكار",
  ],
  en: [
    "Quran memorization",
    "Quran education",
    "Tajweed and recitation rules",
    "Islamic sciences",
    "Islamic studies",
    "Arabic language",
    "Aqeedah and Fiqh",
    "Prophetic biography (Seerah)",
    "Islamic manners",
    "Duas and dhikr",
  ],
};

export function organizationSchema(lng) {
  const isEn = lng === "en";
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "@id": ORG_ID,
    name: brand(lng),
    alternateName: isEn ? "أكاديمية آية" : "Aya Academy",
    url: `${SITE_URL}${localePath(lng, "/")}`,
    logo: `${SITE_URL}/logos/logo.png`,
    image: `${SITE_URL}/og.png`,
    description: DESCRIPTION[isEn ? "en" : "ar"],
    email: CONTACT_EMAIL,
    telephone: CONTACT_PHONE,
    inLanguage: languages,
    // Online academy — serves Arabic/English-speaking families anywhere.
    areaServed: "Worldwide",
    knowsAbout: KNOWS_ABOUT[isEn ? "en" : "ar"],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: CONTACT_EMAIL,
      telephone: CONTACT_PHONE,
      availableLanguage: ["Arabic", "English"],
    },
  };
}

export function websiteSchema(lng) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: brand(lng),
    url: `${SITE_URL}${localePath(lng, "/")}`,
    inLanguage: languages,
    publisher: { "@id": ORG_ID },
  };
}

// Build a FAQPage node from the SAME { items: [{ q, a }] } the visible FAQ renders.
export function faqSchema(items = []) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.q,
      acceptedAnswer: { "@type": "Answer", text: it.a },
    })),
  };
}

const COURSE = {
  ar: {
    name: "برنامج تعليم وتحفيظ القرآن والعلوم الشرعية أونلاين",
    teaches: [
      "حفظ القرآن الكريم",
      "التلاوة والتجويد",
      "اللغة العربية",
      "العلوم الشرعية والدراسات الإسلامية",
      "الأخلاق والآداب الإسلامية",
      "الأدعية والأذكار",
    ],
    audience: "المتعلّمون من ٥ سنوات فأكثر — كبارًا وصغارًا",
  },
  en: {
    name: "Online Quran & Islamic Studies Program",
    teaches: [
      "Quran memorization",
      "Recitation & Tajweed",
      "Arabic language",
      "Islamic sciences & studies",
      "Islamic manners & etiquette",
      "Duas & dhikr",
    ],
    audience: "Learners aged 5 and up — adults and children",
  },
};

// Course node — describes the academy's core offering (a real, on-page program:
// interactive Quran + manners classes for kids). Reinforces topical relevance and
// makes the site eligible for Course understanding. We deliberately omit priced
// `offers` (plan prices are dynamic) — the free trial is signalled instead.
export function courseSchema(lng) {
  const c = COURSE[lng === "en" ? "en" : "ar"];
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    "@id": COURSE_ID,
    name: c.name,
    description: DESCRIPTION[lng === "en" ? "en" : "ar"],
    url: `${SITE_URL}${localePath(lng, "/")}`,
    inLanguage: languages,
    provider: { "@id": ORG_ID },
    teaches: c.teaches,
    educationalLevel: "Beginner to advanced",
    audience: {
      "@type": "EducationalAudience",
      educationalRole: "student",
      audienceType: c.audience,
    },
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      // One-hour live sessions (matches the FAQ answer).
      courseWorkload: "PT1H",
      inLanguage: languages,
    },
  };
}

// BreadcrumbList from an ordered [{ name, url }]. `url` should be absolute.
export function breadcrumbSchema(items = []) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      ...(it.url ? { item: it.url } : {}),
    })),
  };
}

// BlogPosting for a single article. Authored + published by the academy itself
// (the blog has no per-author byline). `url` must be the absolute canonical URL;
// `image` the absolute cover/share image.
export function articleSchema({
  lng,
  url,
  title,
  description,
  datePublished,
  dateModified,
  image,
  keywords,
} = {}) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    headline: title,
    description,
    inLanguage: lng === "en" ? "en" : "ar",
    ...(datePublished ? { datePublished } : {}),
    dateModified: dateModified || datePublished,
    image: image ? [image] : [`${SITE_URL}/og.png`],
    ...(keywords && keywords.length ? { keywords: keywords.join(", ") } : {}),
    author: { "@type": "Organization", "@id": ORG_ID, name: brand(lng) },
    publisher: { "@id": ORG_ID },
    isPartOf: { "@id": WEBSITE_ID },
  };
}
