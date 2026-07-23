// ──────────────────────────────────────────────────────────────────────────
// Real parent reviews — screenshots of actual WhatsApp messages from parents.
// These live in /public/reviews and are shown UNEDITED as social proof.
//
// To add a review: drop the image in /public/reviews and add a line below.
//   src : path under /public
//   alt : short bilingual description (accessibility / SEO) — NOT shown on screen
// The on-screen order is the array order; the first ones show before "show all".
// ──────────────────────────────────────────────────────────────────────────

const review = (n) => ({
  src: `/reviews/review-${n}.jpeg`,
  alt: {
    ar: 'رسالة شكر حقيقية من ولي أمر لأكاديمية آية',
    en: 'A real thank-you message from a parent to Aya Academy',
  },
});

export const reviewScreenshots = [
  1, 2, 3, 4, 5, 6, 7, 8, 9,
].map(review);

// How many to show before the "show all" toggle.
export const REVIEWS_PREVIEW_COUNT = 6;
