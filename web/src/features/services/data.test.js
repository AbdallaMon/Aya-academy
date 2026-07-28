import test from 'node:test';
import assert from 'node:assert/strict';
import { getService, serviceText } from './data.js';

const expandedProgramSlugs = [
  'quran-memorization',
  'tajweed-courses',
  'arabic-reading',
  'arabic-speaking',
  'quranic-arabic',
  'islamic-studies',
];

for (const slug of expandedProgramSlugs) {
  for (const language of ['ar', 'en']) {
    test(`${slug} has useful ${language} program details`, () => {
      const copy = serviceText(getService(slug), language);

      assert.ok(copy.description.length >= 80);
      assert.ok(copy.audience.length >= 40);
      assert.ok(copy.format.length >= 40);
      assert.ok(copy.duration.length >= 20);
      assert.ok(copy.audienceItems.length >= 3);
      assert.ok(copy.focusItems.length >= 3);
      assert.ok(copy.lessonSteps.length >= 4);
      assert.ok(copy.faqs.length >= 3);
      assert.ok(copy.faqs.every((item) => item.q && item.a));
    });
  }
}

test('expanded program copy avoids unsupported result promises', () => {
  const unsupportedClaims = [
    /guaranteed/i,
    /master (?:the )?(?:quran|arabic|tajweed)/i,
    /fluent in \d+/i,
    /in 30 days/i,
    /مضمون/,
    /إتقان مضمون/,
    /خلال 30 يوم/,
    /شهادة معتمدة/,
  ];

  for (const slug of expandedProgramSlugs) {
    const service = getService(slug);
    const copy = JSON.stringify({ ar: service.ar, en: service.en });

    for (const claim of unsupportedClaims) {
      assert.doesNotMatch(copy, claim);
    }
  }
});
