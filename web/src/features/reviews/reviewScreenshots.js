// ──────────────────────────────────────────────────────────────────────────
// Real parent reviews — screenshots of actual WhatsApp messages from parents.
// These live in /public/reviews and are shown UNEDITED as social proof.
//
// To add a review: drop the image in /public/reviews and add a line below.
//   src : path under /public
//   alt : short bilingual description (accessibility / SEO) — NOT shown on screen
// The on-screen order is the array order; the first ones show before "show all".
// ──────────────────────────────────────────────────────────────────────────

const REVIEW_DIMENSIONS = {
  1: { width: 1080, height: 834 },
  2: { width: 1068, height: 860 },
  3: { width: 1080, height: 394 },
  4: { width: 1080, height: 1050 },
  5: { width: 1080, height: 699 },
  6: { width: 1080, height: 927 },
  7: { width: 1080, height: 1077 },
  8: { width: 1079, height: 934 },
  9: { width: 1072, height: 580 },
};

const review = (n) => ({
  src: `/reviews/review-${n}.jpeg`,
  ...REVIEW_DIMENSIONS[n],
  alt: {
    ar: 'رسالة شكر حقيقية من ولي أمر لأكاديمية آية',
    en: 'A real thank-you message from a parent to Ayah Academy',
  },
});

export const reviewScreenshots = [
  1, 2, 3, 4, 5, 6, 7, 8, 9,
].map(review);

// How many to show before the "show all" toggle.
export const REVIEWS_PREVIEW_COUNT = 6;
